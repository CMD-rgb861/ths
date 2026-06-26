import { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../ui/StatusBadge';
import UserPendingConfirmationModal from '../modals/UserPendingConfirmationModal';

export default function UserPendingConfirmation({ isJobNew, showNotification }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (jobId) => {
    setSelectedJobId(jobId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedJobId(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    setLoading(true);
    axios.get('/pending-confirmations')
      .then(res => {
        setJobs(res.data.data || []);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  // ✅ SAFE FUNCTION WRAPPER (prevents crash)
  const checkIfJobNew = (jobId) => {
    if (typeof isJobNew === 'function') {
      return isJobNew(jobId);
    }
    return false;
  };

  // Get substatus text for users (always "Waiting for your confirmation" since they're the requester)
  const getSubStatus = () => {
    return 'Waiting for your confirmation';
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center space-x-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-sm text-gray-500">No pending confirmations found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Order No.</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categories</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-150">

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {checkIfJobNew(job.id) && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      {job.job_order_no}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {job.department?.name || '—'}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {job.categories?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {job.categories.map((category) => (
                          <span key={category.id} className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                            {category.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col items-center space-y-1">
                    <StatusBadge status={job.action_report?.status} />
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                      <svg className="w-3 h-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {getSubStatus()}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => openModal(job.id)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserPendingConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        jobId={selectedJobId}
        showNotification={showNotification}
      />
    </>
  );
}