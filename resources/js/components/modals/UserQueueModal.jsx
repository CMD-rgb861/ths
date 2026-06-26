// QueueModal.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaList } from 'react-icons/fa';

export default function QueueModal({ isOpen, onClose, currentJobId, user, showNotification }) {
  const [queuedJobs, setQueuedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentJobPosition, setCurrentJobPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchQueue();
    }
  }, [isOpen]);

  const notifyError = (title, fallbackMessage) => {
    if (typeof showNotification !== 'function') return;
    showNotification('error', title, fallbackMessage);
  };

  const getAxiosErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    // Network / CORS / offline
    if (!err?.response) return 'Unable to connect to the server. Please check your connection.';

    const status = err.response.status;
    const data = err.response.data;

    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You don’t have permission to view the queue.';
    if (status === 404) return data?.message || 'Queue endpoint not found.';
    if (status === 422 && data?.errors) {
      // Laravel validation style errors
      const msgs = Object.values(data.errors).flat().filter(Boolean);
      return msgs.join('\n') || data?.message || 'Validation error.';
    }

    return data?.message || fallback;
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all jobs in queue order
      const res = await axios.get('/queue');
      const queueJobs = res.data.data || [];
      setQueuedJobs(queueJobs);

      // Prefer: compute the user's queue position from the `is_user_job` flag.
      // Fallback: if modal is opened with a specific currentJobId, use that.
      const userFirstIndex = queueJobs.findIndex(job => job.is_user_job);
      if (userFirstIndex >= 0) {
        setCurrentJobPosition(userFirstIndex + 1);
      } else if (currentJobId) {
        const idx = queueJobs.findIndex(job => job.id === currentJobId);
        setCurrentJobPosition(idx >= 0 ? idx + 1 : null);
      } else {
        setCurrentJobPosition(null);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      const message = getAxiosErrorMessage(error, 'Failed to load queue. Please try again.');
      setError(message);
      notifyError('Queue Load Failed', message);
      setQueuedJobs([]);
      setCurrentJobPosition(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/20">
                  <FaList className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">Queue</h2>
                  <p className="text-xs text-white/80 mt-0.5">Pending & ongoing requests in order</p>
                </div>
              </div>

              {/* USER TURN */}
              {!loading && queuedJobs.length > 0 && (
                <div className="mt-3">
                  {typeof currentJobPosition === 'number' ? (
                    <p className="text-sm text-white/90">
                      You are <span className="font-extrabold text-white">#{currentJobPosition}</span> in the queue
                    </p>
                  ) : (
                    <p className="text-sm text-white/90">
                      You currently have no job in the queue
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close queue modal"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Loading queue…</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Hang tight—this usually takes a moment.</p>
            </div>
          ) : queuedJobs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                <FaList className="w-6 h-6 text-gray-500" />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-700">No jobs in queue</p>
              <p className="text-xs text-gray-500 mt-1">New requests will show up here automatically.</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {queuedJobs.map((job) => {
                const position = queuedJobs.findIndex(j => j.id === job.id) + 1;
                const isCurrentJob = job.is_user_job;

                return (
                  <div
                    key={job.id}
                    className={`p-4 transition-all flex items-center gap-4 ${
                      isCurrentJob
                        ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Position Number */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl font-extrabold text-lg flex-shrink-0 ${
                        isCurrentJob
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {position}
                    </div>

                    {/* Job Order No */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          <span className="font-medium text-gray-700">Job Order:</span>{' '}
                          <span className="font-bold text-gray-900">{job.job_order_no}</span>
                        </h3>
                        {isCurrentJob && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                            Your Turn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Served in the order requests were created.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={fetchQueue}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}