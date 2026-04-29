// QueueModal.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaList } from 'react-icons/fa';

export default function QueueModal({ isOpen, onClose, currentJobId, user }) {
  const [queuedJobs, setQueuedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentJobPosition, setCurrentJobPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all jobs in queue order
      const res = await axios.get('/queue');
      const queueJobs = res.data.data || [];
      setQueuedJobs(queueJobs);

      // Find position of current job (1-indexed)
      const position = queueJobs.findIndex(job => job.id === currentJobId) + 1;
      setCurrentJobPosition(position);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      setError('Failed to load queue. Please try again.');
      setQueuedJobs([]);
      setCurrentJobPosition(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaList className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Queue</h2>
          </div>
          {queuedJobs.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Total in queue: <span className="font-semibold">{queuedJobs.length}</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Loading queue...</span>
              </div>
            </div>
          ) : queuedJobs.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm text-gray-500">No jobs in queue</p>
              <p className="text-xs text-gray-400 mt-1">Queue will be populated when jobs are submitted</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {queuedJobs.map((job) => {
                const position = queuedJobs.findIndex(j => j.id === job.id) + 1;
                const isCurrentJob = job.is_user_job;

                return (
                  <div
                    key={job.id}
                    className={`p-4 transition-all flex items-center gap-4 ${
                        isCurrentJob
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                    >
                    {/* Position Number */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg flex-shrink-0 ${
                        isCurrentJob
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {position}
                    </div>

                    {/* Job Order No */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">
                        <span className="font-medium text-gray-900">Job Order Number:</span>{' '}
                          {job.job_order_no}
                        </h3>
                        {isCurrentJob && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={fetchQueue}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}