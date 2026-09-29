// resources/js/modals/UserQueueModal.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaList } from 'react-icons/fa';

const PER_PAGE = 10;

export default function QueueModal({
  isOpen,
  onClose,
  currentJobId,
  user,
  showNotification,
  viewerIsStaff = false,
}) {
  // Staff state
  const [queuedJobs, setQueuedJobs] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  });
  const [page, setPage] = useState(1);

  // User state
  const [userEntries, setUserEntries] = useState([]);
  const [userTotalInQueue, setUserTotalInQueue] = useState(0);
  const [userFirstPosition, setUserFirstPosition] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (viewerIsStaff) {
      fetchStaffQueue(page);
    } else {
      fetchUserWindow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, page, viewerIsStaff]);

  useEffect(() => {
    if (!isOpen) {
      setQueuedJobs([]);
      setUserEntries([]);
      setUserTotalInQueue(0);
      setUserFirstPosition(null);
      setPage(1);
      setMeta({ current_page: 1, last_page: 1, per_page: PER_PAGE, total: 0 });
      setError(null);
    }
  }, [isOpen]);

  const notifyError = (title, fallbackMessage) => {
    if (typeof showNotification !== 'function') return;
    showNotification('error', title, fallbackMessage);
  };

  const getAxiosErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    if (!err?.response) return 'Unable to connect to the server. Please check your connection.';
    const status = err.response.status;
    const data = err.response.data;

    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You don’t have permission to view the queue.';
    if (status === 404) return data?.message || 'Queue endpoint not found.';
    if (status === 422 && data?.errors) {
      const msgs = Object.values(data.errors).flat().filter(Boolean);
      return msgs.join('\n') || data?.message || 'Validation error.';
    }
    return data?.message || fallback;
  };

  const fetchStaffQueue = async (pageValue = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/queue', {
        params: { per_page: PER_PAGE, page: pageValue },
      });
      const items = res.data.data || [];
      const m = res.data.meta || {};

      setQueuedJobs(items);
      setMeta({
        current_page: m.current_page || 1,
        last_page: m.last_page || 1,
        per_page: m.per_page || PER_PAGE,
        total: typeof m.total === 'number' ? m.total : items.length,
      });
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      const message = getAxiosErrorMessage(error, 'Failed to load queue. Please try again.');
      setError(message);
      notifyError('Queue Load Failed', message);
      setQueuedJobs([]);
      setMeta({ current_page: 1, last_page: 1, per_page: PER_PAGE, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWindow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/queue/user-window');
      const entries = res.data?.entries || [];
      const total = res.data?.total_in_queue ?? 0;

      setUserEntries(entries);
      setUserTotalInQueue(total);

      const first = entries.find((e) => e.kind === 'job' && e.is_user_job);
      setUserFirstPosition(first ? first.position : null);
    } catch (error) {
      console.error('Failed to fetch user window:', error);
      const message = getAxiosErrorMessage(error, 'Failed to load your queue. Please try again.');
      setError(message);
      notifyError('Queue Load Failed', message);
      setUserEntries([]);
      setUserTotalInQueue(0);
      setUserFirstPosition(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const headerSubtitle = viewerIsStaff
    ? 'Work through these in order'
    : 'Your position in the queue';

  const emptyTitle = viewerIsStaff ? 'Queue is empty' : 'You have no jobs in queue';
  const emptyHint = viewerIsStaff
    ? 'New requests will appear here as they come in.'
    : 'When you submit a request, its position will appear here.';

  const totalJobs = viewerIsStaff ? meta.total : userTotalInQueue;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100">
                  <FaList className="w-4 h-4 text-blue-700" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Queue</h2>
                  <p className="text-gray-600 mt-0.5 text-sm">{headerSubtitle}</p>
                </div>
              </div>

              {/* Summary line */}
              {!loading && totalJobs > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  {viewerIsStaff ? (
                    <>
                      <span className="font-semibold text-gray-900">{totalJobs}</span>{' '}
                      {totalJobs === 1 ? 'job' : 'jobs'} in the worklist
                      {meta.last_page > 1 && (
                        <span className="ml-2 text-xs text-gray-400">
                          (page {meta.current_page} of {meta.last_page})
                        </span>
                      )}
                    </>
                  ) : typeof userFirstPosition === 'number' ? (
                    <>
                      You are{' '}
                      <span className="font-semibold text-gray-900">#{userFirstPosition}</span> in the queue of{' '}
                      <span className="font-semibold text-gray-900">{totalJobs}</span>
                    </>
                  ) : (
                    <>You currently have no job in the queue</>
                  )}
                </p>
              )}
            </div>

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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading queue...</span>
            </div>
          ) : viewerIsStaff ? (
            // ── STAFF VIEW ──────────────────────────────────
            queuedJobs.length === 0 ? (
              <EmptyState title={emptyTitle} hint={emptyHint} />
            ) : (
              <div className="space-y-4">
                {queuedJobs.map((job, idx) => {
                  const position = typeof job.position === 'number'
                    ? job.position
                    : (meta.current_page - 1) * meta.per_page + idx + 1;

                  const isFirstForStaff = position === 1;
                  const requesterName = job.requester?.name || null;
                  const departmentName = job.department?.name || null;

                  return (
                    <div
                      key={job.id}
                      className={`bg-white border rounded-lg p-6 transition-shadow ${
                        isFirstForStaff
                          ? 'border-blue-300 ring-2 ring-blue-100 shadow-sm'
                          : 'border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${
                                isFirstForStaff
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {position}
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {job.job_order_no}
                            </span>
                            {isFirstForStaff && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                                Next Up
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Requester
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {requesterName || 'Unknown requester'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Department
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {departmentName || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // ── USER VIEW (windowed with gaps) ──────────────
            userEntries.length === 0 ? (
              <EmptyState title={emptyTitle} hint={emptyHint} />
            ) : (
              <div className="space-y-3">
                {userEntries.map((entry, i) => {
                  if (entry.kind === 'gap') {
                    const gapSize = entry.to - entry.from + 1;
                    return (
                      <div
                        key={`gap-${entry.from}-${i}`}
                        className="flex items-center gap-3 px-4 py-2"
                      >
                        <div className="w-8 flex justify-center text-gray-300 text-lg font-bold tracking-widest select-none">
                          ···
                        </div>
                        <p className="text-xs text-gray-500">
                          {gapSize} {gapSize === 1 ? 'other job' : 'other jobs'} in the queue
                        </p>
                      </div>
                    );
                  }

                  const isUser = entry.is_user_job;
                  return (
                    <div
                      key={`job-${entry.id}`}
                      className={`bg-white border rounded-lg p-6 transition-shadow ${
                        isUser
                          ? 'border-blue-300 ring-2 ring-blue-100 shadow-sm'
                          : 'border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${
                              isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {entry.position}
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {entry.job_order_no}
                          </span>
                          {isUser && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                              Your Turn
                            </span>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <p className="text-sm text-gray-600">
                          Position{' '}
                          <span className="font-semibold text-gray-900">#{entry.position}</span> of{' '}
                          <span className="font-semibold text-gray-900">{userTotalInQueue}</span>{' '}
                          in the queue
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          {/* Pager — staff only, and only when there is more than one page */}
          <div className="flex items-center gap-2">
            {viewerIsStaff && meta.last_page > 1 && (
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
            <button
              onClick={() => (viewerIsStaff ? fetchStaffQueue(page) : fetchUserWindow())}
              disabled={loading}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-60"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

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

function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
      </svg>
      <p className="text-gray-500 font-medium">{title}</p>
      <p className="text-gray-400 text-sm mt-1">{hint}</p>
    </div>
  );
}