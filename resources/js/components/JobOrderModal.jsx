import React, { useState } from 'react';
import axios from 'axios';

export default function JobOrderModal({
  isOpen,
  job,
  onClose,
  onStatusChange,
  showNotification,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')); // Get user info from localStorage

  if (!isOpen || !job) return null;

  // Format the date using toLocaleDateString
  const formattedDate = job?.date
    ? new Date(job.date).toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila', // Ensure it's in Manila's timezone
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const handleAction = (status) => {
    setLoadingAction(status);

    axios.put(`/job-orders/${job.id}`, { status })
      .then((response) => {
        onStatusChange(response.data);
        showNotification('success', 'Job Order Updated', `Job Order ${status} successfully.`);
        onClose();
      })
      .catch((error) => {
        showNotification('error', 'Error', 'Failed to update job order status.');
      })
      .finally(() => {
        setLoadingAction(null);
      });
  };

  const isLoading = loadingAction !== null;
  const isAdmin = user?.role === 'admin'; // Check if the user is an admin

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white rounded-xl shadow-xl w-full sm:w-96 p-8 space-y-6 max-w-3xl">

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold text-gray-900">
            Job Order Details
          </h3>
          <p className="text-sm text-gray-500">
            View and manage job order details below.
          </p>
        </div>

        {/* Modal Content */}
        <div className="space-y-6">

          {/* Job Order No. */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Job Order No.</span>
            <span className="text-gray-800">{job?.job_order_no || '—'}</span>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Date</span>
            <span className="text-gray-800">{formattedDate}</span>
          </div>

          {/* Department */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Department</span>
            <span className="text-gray-800">{job?.department?.name || '—'}</span>
          </div>

          {/* Categories */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Categories</span>
            <div className="space-x-2">
              {Array.isArray(job?.categories) && job.categories.length > 0 ? (
                job.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 inline-block bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {category.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No categories assigned</span>
              )}
            </div>
          </div>

          {/* Request Description */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Request Description</span>
            <span className="text-gray-800">{job?.request_description || '—'}</span>
          </div>

          {/* Requested By */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Requested By</span>
            <span className="text-gray-800">{job?.requester?.name || '—'}</span>
          </div>

          {/* Contact Number */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Contact Number</span>
            <span className="text-gray-800">{job?.contact_no || '—'}</span>
          </div>

          {/* Approved By */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Approved By</span>
            <span className="text-gray-800">{job?.approver?.name || 'ITS Director'}</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex mt-6 justify-between">

          {isAdmin && (
            <div className="flex space-x-4">

              {/* Accept → Ongoing */}
              <button
                onClick={() => handleAction('Ongoing')}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white font-medium text-sm rounded-full hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loadingAction === 'Ongoing' && (
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                )}
                Accept
              </button>

              {/* Deny → Cancelled */}
              <button
                onClick={() => handleAction('Cancelled')}
                disabled={isLoading}
                className="px-6 py-3 bg-red-600 text-white font-medium text-sm rounded-full hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loadingAction === 'Cancelled' && (
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                )}
                Deny
              </button>

            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-900 text-white font-medium text-sm rounded-full hover:bg-black transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}