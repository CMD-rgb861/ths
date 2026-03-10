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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New Pending Job Orders</h2>
          <p className="text-gray-600 mt-1">
            {newPendingJobs.length} new {newPendingJobs.length === 1 ? 'request' : 'requests'} waiting for review
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {newPendingJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">No new pending job orders</p>
              <p className="text-gray-400 text-sm mt-1">All requests have been viewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newPendingJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-lg font-bold text-blue-600">
                          {job.job_order_no}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => onViewJob(job)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Requester
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {job.requester?.name || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Department
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {job.department?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Service Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.categories?.length > 0 ? (
                        job.categories.map((cat, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {cat.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No categories assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
          {newPendingJobs.length > 0 && (
            <button
              onClick={onMarkAllViewed}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark All as Viewed
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
  );
};

export default NewJobOrdersModal;