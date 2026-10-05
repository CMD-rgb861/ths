// resources/js/modals/NewJobOrdersModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const PER_PAGE = 5;

export default function NewJobOrdersModal({
  isOpen,
  onClose,
  onViewJob,
  onMarkAllViewed,
  onOpenQueue,           // ← new optional prop for the "View Full Queue" button
}) {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  // Fetch departments once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    axios.get('/departments')
      .then((res) => setDepartments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDepartments([]));
  }, [isOpen]);

  // Fetch list on open, page change, or filter change
  const fetchList = useCallback(async (pageValue = page) => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const params = { per_page: PER_PAGE, page: pageValue };
      if (search.trim()) params.search = search.trim();
      if (departmentId) params.department_id = departmentId;

      const res = await axios.get('/job-orders/pending', { params });
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      const m = res?.data?.meta || {};
      const count = typeof res?.data?.count === 'number' ? res.data.count : data.length;

      setJobs(data);
      setMeta({
        current_page: m.current_page || 1,
        last_page: m.last_page || 1,
        per_page: m.per_page || PER_PAGE,
        total: typeof m.total === 'number' ? m.total : count,
      });

      // If the current page went empty because items were removed on the server,
      // bounce back to page 1 so the user sees fresh content.
      if (data.length === 0 && pageValue > 1) {
        setPage(1);
      }
    } catch (err) {
      console.error('pending list failed:', err);
      setJobs([]);
      setMeta({ current_page: 1, last_page: 1, per_page: PER_PAGE, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [isOpen, search, departmentId, page]);

  // Debounce on search/filter changes; also refetch on page change
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => fetchList(page), 300);
    return () => clearTimeout(t);
  }, [isOpen, search, departmentId, page, fetchList]);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDepartmentId('');
      setPage(1);
      setJobs([]);
      setMeta({ current_page: 1, last_page: 1, per_page: PER_PAGE, total: 0 });
    }
  }, [isOpen]);

  // When the user changes search or department, jump back to page 1
  useEffect(() => {
    setPage(1);
  }, [search, departmentId]);

  const handleViewJob = useCallback(async (job) => {
    try {
      await axios.post('/job-orders/mark-pending-notified', { jobs: [job.id] });
    } catch (err) {
      console.error('mark single viewed failed:', err);
    }
    onViewJob(job);
  }, [onViewJob]);

  const handleMarkAllViewed = useCallback(async () => {
    // Only mark the currently-visible page. Safer and more predictable
    // than marking the entire system, which the admin might not expect.
    if (jobs.length === 0) return;
    setMarking(true);
    try {
      await axios.post('/job-orders/mark-pending-notified', {
        jobs: jobs.map((j) => j.id),
      });
      setJobs([]);
      if (typeof onMarkAllViewed === 'function') onMarkAllViewed();
      // Refetch so the newly promoted rows (if any) appear
      fetchList(1);
      setPage(1);
    } catch (err) {
      console.error('mark all viewed failed:', err);
    } finally {
      setMarking(false);
    }
  }, [jobs, onMarkAllViewed, fetchList]);

  const hasActiveFilters = useMemo(
    () => Boolean(search.trim()) || Boolean(departmentId),
    [search, departmentId]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Pending Job Orders</h2>
              <p className="text-gray-600 mt-1">
                {meta.total} {meta.total === 1 ? 'request' : 'requests'} waiting for review
                {meta.last_page > 1 && (
                  <span className="ml-2 text-xs text-gray-400">
                    (page {meta.current_page} of {meta.last_page})
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {typeof onOpenQueue === 'function' && (
                <button
                  type="button"
                  onClick={onOpenQueue}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                  title="View the full queue"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
                  </svg>
                  View Full Queue
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job order no, requester, department..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-w-[200px]"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading pending job orders...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">
                {hasActiveFilters ? 'No matches for your filters' : 'No new pending job orders'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {hasActiveFilters ? 'Try adjusting or clearing the filters' : 'All requests have been viewed'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-lg font-bold text-blue-600">{job.job_order_no}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleViewJob(job)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requester</p>
                      <p className="text-sm font-medium text-gray-900">{job.requester?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                      <p className="text-sm font-medium text-gray-900">{job.department?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {job.categories?.length > 0 ? (
                        job.categories.map((cat, index) => (
                          <span key={index} className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {cat.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">No categories assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pager + Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-lg flex items-center justify-between gap-3">
          {/* Pager */}
          <div className="flex items-center gap-2">
            {meta.last_page > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1 || loading}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </button>

                <span className="text-xs font-medium text-gray-600">
                  {meta.current_page} / {meta.last_page}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page >= meta.last_page || loading}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {jobs.length > 0 && (
              <button
                onClick={handleMarkAllViewed}
                disabled={marking}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-60"
                title="Mark the requests on this page as viewed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {marking ? 'Marking...' : 'Mark Page as Viewed'}
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}