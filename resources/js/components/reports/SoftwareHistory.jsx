import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import StatusIndicator from '../ui/StatusIndicator';

const CATEGORY_FILTERS = ['Software'];

const STATUS_BADGE_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Cancelled by User': 'bg-red-100 text-red-800',
  Unserviceable: 'bg-gray-200 text-gray-800',
};

function SoftwareDetailModal({ isOpen, job, onClose }) {
  if (!isOpen || !job) return null;

  const displayValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string' && value.trim() === '') return '—';
    return value;
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const InfoField = ({ label, value, strong = false, className = '' }) => (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${className}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-2 break-words leading-relaxed ${
          strong ? 'text-[15px] font-semibold text-slate-900' : 'text-[15px] text-slate-700'
        }`}
      >
        {displayValue(value)}
      </div>
    </div>
  );

  const Section = ({ title, children, gridClassName = 'grid-cols-1 sm:grid-cols-2' }) => (
    <section className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-blue-500" />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            {title}
          </div>
        </div>
      </div>
      <div className={`grid gap-3 ${gridClassName}`}>{children}</div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-4xl">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <div className="relative border-b border-slate-200 bg-white">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-blue-50/70" />
            <div className="relative flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
                    Software Name Detail
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                  <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                    {displayValue(job?.job_order_no)}
                  </h2>
                  <span className="text-sm font-medium text-slate-500">Job Order Record</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Software Name
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {displayValue(job?.action_report?.software_name)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Requester
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {displayValue(job?.requester?.name)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Department
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {displayValue(job?.department?.name)}
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              <Section title="Summary">
                <InfoField label="Job Order No" value={job?.job_order_no} strong />
                <InfoField label="Software Name" value={job?.action_report?.software_name} strong />
                <InfoField label="Department" value={job?.department?.name} />
                <InfoField label="Requester" value={job?.requester?.name} />
                <InfoField
                  label="Categories"
                  value={job?.categories?.map((c) => c.name).join(', ') || '—'}
                  className="sm:col-span-2"
                />
              </Section>
              <Section title="Timeline" gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Date Created" value={formatDate(job?.created_at)} />
                <InfoField
                  label="Date Started"
                  value={formatDate(job?.action_report?.date_started)}
                />
                <InfoField
                  label="Date Finished"
                  value={formatDate(job?.action_report?.date_finished)}
                />
              </Section>
              <Section title="Work Details">
                <InfoField
                  label="Diagnosis"
                  value={job?.action_report?.diagnosis}
                  className="sm:col-span-2"
                />
                <InfoField label="Action Taken" value={job?.action_report?.action_taken} />
                <InfoField label="Remarks" value={job?.action_report?.remarks} />
              </Section>
              <Section title="Asset / Software Details">
                <InfoField label="Software Name" value={job?.action_report?.software_name} />
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SoftwareHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailModalJob, setDetailModalJob] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage] = useState(10);

  // Track if filters have been applied
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Debounce timer ref
  const searchTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch software name history with all filters
  const fetchSoftwareHistory = useCallback(async (page = 1) => {
    setLoading(true);
    
    try {
      const params = {
        page: page,
        per_page: perPage,
      };

      // Add search filter (only if 3+ characters)
      if (search && search.length >= 3) {
        params.software_name = search;
      }

      // Add date filters
      if (dateFrom) {
        params.date_from = dateFrom;
      }

      if (dateTo) {
        params.date_to = dateTo;
      }

      const res = await axios.get('/api/software-name/search', { params });

      setJobs(res.data.data || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.last_page || 1);
      setCurrentPage(res.data.current_page || 1);
      setFiltersApplied(true);
    } catch (error) {
      console.error('Error fetching software history:', error);
      setJobs([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, perPage]);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set new timer (300ms debounce)
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo]);

  // Fetch data when filters or page changes
  useEffect(() => {
    // Check if any filter is applied
    const hasFilters = search.length >= 3 || dateFrom || dateTo;
    
    if (hasFilters || currentPage === 1) {
      fetchSoftwareHistory(currentPage);
    } else if (search.length > 0 && search.length < 3) {
      // Don't fetch if search is too short
      setJobs([]);
      setTotalCount(0);
      setTotalPages(1);
      setFiltersApplied(false);
    }
  }, [search, dateFrom, dateTo, currentPage, fetchSoftwareHistory]);

  // Clear all filters - FINAL FIX
  const clearFilters = () => {
    // Clear search timer if running
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Check if any filters are actually applied using current state values
    const hasActiveFilters = search.length >= 3 || dateFrom || dateTo;
    
    // Reset the input field value FIRST (before state changes)
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    
    // Reset all filter states
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    
    // ONLY clear jobs if there were actual filters applied
    if (hasActiveFilters) {
      setJobs([]);
      setTotalCount(0);
      setTotalPages(1);
      setFiltersApplied(false);
    }
    // If no filters were applied, do NOTHING - keep the jobs list intact
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Export CSV
  const exportCsv = () => {
    const params = new URLSearchParams();
    
    if (search && search.length >= 3) params.append('software_name', search);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    window.location.href = `/api/software-name/export?${params.toString()}`;
  };

  const getRequestStatus = (job) => {
    if (
      (job.request_status?.name === 'Cancelled' || job.action_report?.status === 'Cancelled') &&
      job.action_report?.cancelled_by &&
      job.requester &&
      ((typeof job.action_report.cancelled_by === 'object'
        ? job.action_report.cancelled_by.id
        : job.action_report.cancelled_by) === job.requester.id)
    ) {
      return 'Cancelled by User';
    }
    if (job.request_status?.name) return job.request_status.name;
    if (typeof job.status === 'string') return job.status;
    if (job.action_report?.status) return job.action_report.status;
    return '—';
  };

  const getStatusBadgeClass = (status) =>
    STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Software Name History</h1>
            <p className="mt-1 text-gray-600">
              Search and filter software names from past job orders
            </p>
            {filtersApplied && (
              <div className="mt-2 text-sm text-gray-500">
                Found {totalCount} record{totalCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Software Name Search */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
              Software Name
            </label>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search software name..."
              defaultValue={search}
              onChange={handleSearchChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && search.length < 3 && (
              <p className="mt-1 text-xs text-yellow-600">Enter at least 3 characters</p>
            )}
          </div>

          {/* Date From */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active filters summary */}
        {(search || dateFrom || dateTo) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <span className="text-xs font-semibold uppercase text-gray-500">Active Filters:</span>
            
            {search && search.length >= 3 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                Software: {search}
              </span>
            )}
            
            {dateFrom && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                From: {new Date(dateFrom).toLocaleDateString()}
              </span>
            )}
            
            {dateTo && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                To: {new Date(dateTo).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Job Order No.
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Software Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Requester
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Date
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-900">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-900">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <span>Loading software history...</span>
                  </div>
                </td>
              </tr>
            ) : !filtersApplied ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="mb-3 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="font-medium">Enter search criteria to find software names</p>
                    <p className="text-sm">Search by software name or date range</p>
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="mb-3 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium">No matching records found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const ar = job.action_report;
                const reqStatus = getRequestStatus(job);
                return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {job.job_order_no}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {ar?.software_name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {job.department?.name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {job.requester?.name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US') : '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            reqStatus
                          )}`}
                        >
                          {reqStatus}
                        </span>
                        {reqStatus === 'Ongoing' && ar && (
                          <div className="mt-1">
                            <StatusIndicator
                              status={ar.status}
                              actionReport={ar}
                              requesterId={job.requester?.id}
                            />
                          </div>
                        )}
                        {(reqStatus === 'Cancelled' || reqStatus === 'Cancelled by User') &&
                          ar?.remarks && (
                            <div className="mt-1 text-xs text-gray-500">Reason: {ar.remarks}</div>
                          )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <button
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => setDetailModalJob(job)}
                      >
                        <svg
                          className="mr-1.5 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
          <div className="text-sm text-gray-500">
            Showing {jobs.length} of {totalCount} records
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <span className="mr-2">&lt;</span> Previous
            </button>

            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next <span className="ml-2">&gt;</span>
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <SoftwareDetailModal
        isOpen={!!detailModalJob}
        job={detailModalJob}
        onClose={() => setDetailModalJob(null)}
      />
    </div>
  );
}