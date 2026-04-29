import { useState } from 'react';
import axios from 'axios';

export default function SummaryRequestReportsModal({ isOpen, onClose, reportType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Daily state
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  // Weekly state
  const [weeklyStartDate, setWeeklyStartDate] = useState('');
  const [weeklyEndDate, setWeeklyEndDate] = useState('');

  // Monthly state
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  if (!isOpen) return null;

  const handleGenerateDaily = async () => {
    if (!dailyDate) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/reports/daily', {
        params: { date: dailyDate },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daily_Report_${dailyDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWeekly = async () => {
    if (!weeklyStartDate || !weeklyEndDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(weeklyStartDate) > new Date(weeklyEndDate)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/reports/weekly', {
        params: {
          start_date: weeklyStartDate,
          end_date: weeklyEndDate,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Weekly_Report_${weeklyStartDate}_to_${weeklyEndDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/reports/monthly', {
        params: {
          year: monthlyYear,
          month: monthlyMonth,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Monthly_Report_${monthlyYear}-${String(monthlyMonth).padStart(2, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">
            {reportType === 'daily' ? 'Daily Report'
              : reportType === 'weekly' ? 'Weekly Report'
              : 'Monthly Report'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {reportType === 'daily' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={weeklyStartDate}
                  onChange={(e) => setWeeklyStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={weeklyEndDate}
                  onChange={(e) => setWeeklyEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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