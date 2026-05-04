import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SummaryRequestReportsModal({ isOpen, onClose, reportType, showNotification }) {
  const [loading, setLoading] = useState(false);

  // Guard: some parent components may forget to pass showNotification
  const notify = (type, title, message) => {
    if (typeof showNotification === 'function') {
      showNotification(type, title, message);
    } else {
      // Fallback so the UI doesn't crash; keeps errors visible in devtools.
      console.warn('SummaryRequestReportsModal: showNotification prop is missing.');
      console[type === 'error' ? 'error' : 'log'](title, message);
    }
  };

  // Daily state
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  // Weekly state
  const [weeklyYear, setWeeklyYear] = useState(new Date().getFullYear());
  const [weeklyMonth, setWeeklyMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weeks, setWeeks] = useState([]);

  // Monthly state
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  if (!isOpen) return null;

  /**
   * Handle API errors with proper notification display
   * Covers: validation errors (422), not found (404), server errors (5xx)
   */
  const handleApiError = (err, defaultMessage = 'Failed to generate report') => {
    const status = err.response?.status;
    const data = err.response?.data;

    // Laravel validation errors (422)
    if (status === 422 && data?.errors) {
      const errorMessages = Object.entries(data.errors)
        .map(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : messages;
          return msg;
        })
        .join('\n');

      notify(
        'error',
        'Validation Error',
        errorMessages || data.message || 'Please check your input and try again'
      );
      return;
    }

    // Not found errors (404)
    if (status === 404) {
      notify(
        'warning',
        'No Data Found',
        data?.message || 'No completed job orders found for the selected date range'
      );
      return;
    }

    // Server errors (5xx)
    if (status >= 500) {
      notify(
        'error',
        'Server Error',
        data?.message || 'A server error occurred. Please try again later'
      );
      return;
    }

    // Network or other errors
    if (err.message === 'Network Error' || !err.response) {
      notify(
        'error',
        'Network Error',
        'Unable to connect to the server. Please check your connection'
      );
      return;
    }

    // Generic error fallback
    notify(
      'error',
      'Request Failed',
      data?.message || defaultMessage
    );
  };

  /**
   * When using axios with responseType: 'blob', Laravel JSON error responses also arrive as a Blob.
   * This helper converts that blob back to JSON so we can show proper Notification toasts.
   */
  const normalizeBlobAxiosError = async (err) => {
    try {
      const { response } = err || {};
      const data = response?.data;

      // Only handle blob responses
      if (!data || !(data instanceof Blob)) return err;

      const contentType = response?.headers?.['content-type'] || data.type;
      if (!contentType || !String(contentType).includes('application/json')) return err;

      const text = await data.text();
      const json = JSON.parse(text);

      return {
        ...err,
        response: {
          ...response,
          data: json,
        },
      };
    } catch {
      return err;
    }
  };

  /**
   * Preview PDF (open in new tab) from blob response
   */
  const previewPDF = (blob, filename) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noopener,noreferrer');

      // If popup blocked, do not force-download; ask user to allow popups.
      if (!w) {
        window.URL.revokeObjectURL(url);
        return;
      }

      // Best-effort: set tab title
      try {
        w.document.title = `${filename}.pdf`;
      } catch {
        // ignore cross-origin/title access restrictions
      }

      // Give the new tab time to load the blob URL then revoke.
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error('Failed to preview PDF:', err);
      notify('error', 'Preview Failed', 'Unable to open the PDF preview.');
    }
  };

  /**
   * Handle Daily Report Generation
   */
  const handleGenerateDaily = async () => {
    // Validation
    if (!dailyDate) {
      notify(
        'warning',
        'Missing Date',
        'Please select a date before generating the report'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/reports/daily', {
        params: { date: dailyDate },
        responseType: 'blob',
      });

      // Check if response is actually a PDF
      const contentType = response.headers?.['content-type'] || response.data?.type;
      if (!contentType || !String(contentType).includes('application/pdf')) {
        throw new Error('Expected PDF but received a different response type');
      }

  previewPDF(response.data, `Daily_Report_${dailyDate}`);

      notify(
        'success',
        'Report Generated',
        'Daily report opened in a new tab'
      );

      onClose();
    } catch (err) {
      const normalized = await normalizeBlobAxiosError(err);
      handleApiError(normalized, 'Failed to generate daily report');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Weekly Report Generation
   */
  const handleGenerateWeekly = async () => {
    // Validation: Check if weeks are available
    if (weeks.length === 0) {
      notify(
        'warning',
        'No Weeks Available',
        `No weeks found for ${new Date(weeklyYear, weeklyMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
      );
      return;
    }

    // Validation: Check if a week is selected
    if (selectedWeek === null || selectedWeek === '') {
      notify(
        'warning',
        'Missing Selection',
        'Please select a week before generating the report'
      );
      return;
    }

    const week = weeks[selectedWeek];

    if (!week) {
      notify(
        'error',
        'Invalid Week',
        'The selected week is no longer valid. Please select another week'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/reports/weekly', {
        params: {
          start_date: week.start,
          end_date: week.end,
        },
        responseType: 'blob',
      });

      // Check if response is actually a PDF
      const contentType = response.headers?.['content-type'] || response.data?.type;
      if (!contentType || !String(contentType).includes('application/pdf')) {
        throw new Error('Expected PDF but received a different response type');
      }

      previewPDF(
        response.data,
        `Weekly_Report_${week.start}_to_${week.end}`
      );

      notify(
        'success',
        'Report Generated',
        'Weekly report opened in a new tab'
      );

      onClose();
    } catch (err) {
      const normalized = await normalizeBlobAxiosError(err);
      handleApiError(normalized, 'Failed to generate weekly report');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Monthly Report Generation
   */
  const handleGenerateMonthly = async () => {
    // Basic validation (backend also validates)
    if (!monthlyYear || !monthlyMonth) {
      notify(
        'warning',
        'Missing Selection',
        'Please select both year and month'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get('/reports/monthly', {
        params: {
          year: monthlyYear,
          month: monthlyMonth,
        },
        responseType: 'blob',
      });

      // Check if response is actually a PDF
      const contentType = response.headers?.['content-type'] || response.data?.type;
      if (!contentType || !String(contentType).includes('application/pdf')) {
        throw new Error('Expected PDF but received a different response type');
      }

      const monthName = new Date(monthlyYear, monthlyMonth - 1).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });

      previewPDF(
        response.data,
        `Monthly_Report_${monthlyYear}-${String(monthlyMonth).padStart(2, '0')}`
      );

      notify(
        'success',
        'Report Generated',
        `Monthly report for ${monthName} opened in a new tab`
      );

      onClose();
    } catch (err) {
      const normalized = await normalizeBlobAxiosError(err);
      handleApiError(normalized, 'Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate weeks for the selected month (Monday-Friday only)
   */
  const generateWeeks = (year, month) => {
    const weeks = [];

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let current = new Date(firstDay);
    let week = [];
    let weekIndex = 1;

    const format = (date) => date.toISOString().split('T')[0];

    while (current <= lastDay) {
      const day = current.getDay(); // 0 Sun - 6 Sat

      // Monday–Friday only
      if (day >= 1 && day <= 5) {
        week.push(new Date(current));
      }

      const isFriday = day === 5;
      const isLastDay = current.getTime() === lastDay.getTime();

      if ((isFriday || isLastDay) && week.length > 0) {
        const start = week[0];
        const end = week[week.length - 1];

        weeks.push({
          label: `Week ${weekIndex} (${format(start)} - ${format(end)})`,
          start: format(start),
          end: format(end),
          days: week.map((d) => ({
            date: format(d),
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          })),
        });

        week = [];
        weekIndex++;
      }

      current.setDate(current.getDate() + 1);
    }

    return weeks;
  };

  // Update weeks when year or month changes
  useEffect(() => {
    const generatedWeeks = generateWeeks(weeklyYear, weeklyMonth);
    setWeeks(generatedWeeks);
    setSelectedWeek(generatedWeeks.length > 0 ? 0 : null);
  }, [weeklyYear, weeklyMonth]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">
            {reportType === 'daily'
              ? 'Daily Report'
              : reportType === 'weekly'
              ? 'Weekly Report'
              : 'Monthly Report'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {reportType === 'daily' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="space-y-4">
              {/* Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={weeklyYear}
                  onChange={(e) => setWeeklyYear(parseInt(e.target.value))}
                  disabled={loading}
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Month */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  value={weeklyMonth}
                  onChange={(e) => setWeeklyMonth(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Week <span className="text-red-500">*</span>
                </label>
                {weeks.length === 0 ? (
                  <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-700">
                    No weeks available for this month
                  </div>
                ) : (
                  <select
                    value={selectedWeek ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedWeek(value === '' ? null : Number(value));
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="">Select a week</option>
                    {weeks.map((week, index) => (
                      <option key={index} value={index}>
                        {week.days.map((d) => d.day).join(', ')} ({week.start} - {week.end})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                  disabled={loading}
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={
              reportType === 'daily'
                ? handleGenerateDaily
                : reportType === 'weekly'
                ? handleGenerateWeekly
                : handleGenerateMonthly
            }
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generate PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}