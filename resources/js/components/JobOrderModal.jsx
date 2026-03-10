import React, { useState, useMemo } from 'react';
import axios from 'axios';

export default function JobOrderModal({
  isOpen,
  job,
  onClose,
  onStatusChange,
  showNotification,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const isAdmin = user?.role === 'admin';
  const isLoading = loadingAction !== null;

  const formattedDate = useMemo(() => {
    if (!job?.date) return '—';
    
    return new Date(job.date).toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [job?.date]);

  const handleAction = async (status) => {
    setLoadingAction(status);

    try {
      const response = await axios.put(`/job-orders/${job.id}`, { status });
      const updatedJob = response.data;

      // Clear confirmation flag when admin accepts job
      if (status === 'Ongoing' && isAdmin) {
        if (updatedJob.action_report) {
          updatedJob.action_report.conformed = undefined;
        }

        // Mark notifications as read (non-blocking)
        axios.post(`/job-orders/${job.id}/mark-notifications-read`)
          .catch(err => console.error('Failed to mark notifications as read:', err));

        // Remove "NEW" badge (non-blocking)
        axios.post('/job-orders/mark-pending-notified', { jobs: [job.id] })
          .catch(err => console.error('Failed to mark as notified:', err));
      }

      onStatusChange(updatedJob, status === 'Ongoing');
      showNotification(
        'success',
        'Job Order Updated',
        `Job Order ${status} successfully.`
      );
      onClose();
    } catch (error) {
      console.error('Failed to update job order status:', error);
      showNotification(
        'error',
        'Error',
        'Failed to update job order status.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Job Order Details</h2>
          <p className="text-gray-600 mt-1">Complete information about this job request</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          
          {/* Job Order Number & Status Card */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Order No.</p>
                <p className="text-lg font-bold text-gray-900">{job?.job_order_no || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date Requested</p>
                <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  {job.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Requester Information */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Requester Information
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                  <p className="text-sm text-gray-900">{job?.department?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requested By</p>
                  <div className="text-sm text-gray-900">
                    {job?.signature_name && job?.requester?.role === 'admin' ? (
                      <div>
                        <span className="font-medium">{job.signature_name}</span>
                        <span className="text-gray-500 text-xs ml-1">({job.requester.name})</span>
                      </div>
                    ) : (
                      <span>{job?.requester?.name || '—'}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Number</p>
                  <p className="text-sm text-gray-900">{job?.contact_no || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Service Categories
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {Array.isArray(job?.categories) && job.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {job.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No categories assigned</p>
              )}
            </div>
          </div>

          {/* Request Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Request Description
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job?.request_description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attachments
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {job?.attachments && job.attachments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {job.attachments.map((file) => {
                    const fileUrl = `/storage/${file.file_path}`;

                    if (file.type === 'image') {
                      return (
                        <a
                          key={file.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
                        >
                          <img
                            src={fileUrl}
                            alt={file.original_name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </a>
                      );
                    }

                    if (file.type === 'pdf') {
                      return (
                        <a
                          key={file.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center h-32 border border-gray-200 rounded-lg bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all group"
                        >
                          <svg className="w-12 h-12 text-red-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-red-700">View PDF</span>
                        </a>
                      );
                    }

                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-center h-32 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-400"
                      >
                        Unsupported file
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No attachments provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {isAdmin ? (
              <>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('Ongoing')}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Job Order
                  </button>

                  <button
                    onClick={() => handleAction('Cancelled')}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Deny Request
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all disabled:opacity-50"
                >
                  Close
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="ml-auto px-6 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all disabled:opacity-50"
              >
                Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}