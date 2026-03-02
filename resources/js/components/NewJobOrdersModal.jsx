// NewJobOrdersModal.jsx
import React from 'react';

const NewJobOrdersModal = ({
  isOpen,
  onClose,
  newPendingJobs,
  onViewJob,
  onMarkAllViewed
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-lg">

        <h2 className="text-lg font-semibold mb-4">
          New Pending Job Orders
        </h2>

        {newPendingJobs.length === 0 ? (
          <p className="text-gray-500">No new pending job orders.</p>
        ) : (
          <div className="space-y-4">
            {newPendingJobs.map((job) => (
              <div
                key={job.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-blue-600">
                    {job.job_order_no}
                  </span>

                  <button
                    onClick={() => onViewJob(job)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View
                  </button>
                </div>

                {/* Requester */}
                <p className="text-sm">
                  <span className="font-medium">Requester:</span>{' '}
                  {job.requester?.name || 'N/A'}
                </p>

                {/* Date Submitted */}
                <p className="text-sm">
                  <span className="font-medium">Date Submitted:</span>{' '}
                  {new Date(job.created_at).toLocaleString()}
                </p>

                {/* Department */}
                <p className="text-sm">
                  <span className="font-medium">Department:</span>{' '}
                  {job.department?.name || 'N/A'}
                </p>

                {/* Categories */}
                <div className="mt-2">
                  <span className="font-medium text-sm">Categories:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.categories?.length > 0 ? (
                      job.categories.map((cat, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">
                        No categories
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onMarkAllViewed}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Mark All as Viewed
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewJobOrdersModal;