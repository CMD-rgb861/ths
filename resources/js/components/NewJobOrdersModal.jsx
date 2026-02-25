// NewJobOrdersModal.jsx
import React from 'react';

const NewJobOrdersModal = ({ isOpen, onClose, newPendingJobs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">New Pending Job Orders</h2>
        
        {/* Display job orders */}
        <div className="space-y-4">
          {newPendingJobs.length === 0 ? (
            <p>No new pending job orders.</p>
          ) : (
            newPendingJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <span>{job.job_order_no}</span>
                <span className="text-sm text-gray-500">{job.department?.name || 'N/A'}</span>
              </div>
            ))
          )}
        </div>

        {/* Close button */}
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 text-white bg-blue-600 rounded-lg"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewJobOrdersModal;