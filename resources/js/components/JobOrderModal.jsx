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
  
  // Early return if modal is not open or no job is passed
  if (!isOpen || !job) {
    console.log('Modal is closed or job is missing.');
    return null;
  }

  // Format date for display
  const formattedDate = job?.date
    ? new Date(job.date).toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  console.log("Job Order Details: ", job);  // Log the full job object to inspect its properties
  console.log("User Role: ", user?.role);  // Log the user role for debugging

  const handleAction = (status) => {
    setLoadingAction(status);
    console.log(`Handling action: ${status} for Job Order ID: ${job.id}`);

    axios.put(`/job-orders/${job.id}`, { status })
      .then((response) => {
        console.log('Job Order Update Response:', response.data);  // Log response data from API

        // If an admin accepted the job (status -> Ongoing), suppress the
        // "Waiting for your confirmation" indicator immediately by clearing
        // the client-side conformed flag. The waiting indicator should only
        // appear after the admin explicitly saves changes in the Ongoing
        // modal (which will set the confirmation flag properly).
        const updatedJob = response.data;
        if (status === 'Ongoing' && user?.role === 'admin') {
          if (updatedJob.action_report) {
            updatedJob.action_report.conformed = undefined;
          }
        }

        onStatusChange(updatedJob);
        showNotification(
          'success',
          'Job Order Updated',
          `Job Order ${status} successfully.`
        );
        onClose();
      })
      .catch((error) => {
        console.error('Failed to update job order status:', error);  // Log error in case of failure
        showNotification(
          'error',
          'Error',
          'Failed to update job order status.'
        );
      })
      .finally(() => {
        setLoadingAction(null);
      });
  };

  const isLoading = loadingAction !== null;
  const isAdmin = user?.role === 'admin';

  // Log if attachments exist or not
  console.log('Attachments available: ', job?.attachments?.length > 0);

  const handleClose = () => {
    console.log('Closing modal');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 space-y-8 relative">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Job Order Details
            </h2>
            <p className="text-sm text-gray-500">
              View and manage job order information.
            </p>
          </div>

          <span className="px-4 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            {job.status}
          </span>
        </div>

        {/* ================= BASIC INFO ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600">Job Order No.</label>
            <div className="text-sm text-gray-700">{job?.job_order_no}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600">Date</label>
            <div className="text-sm text-gray-700">{formattedDate}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600">Department</label>
            <div className="text-sm text-gray-700">{job?.department?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600">Requested By</label>
            <div className="text-sm text-gray-700">
              {job?.signature_name && job?.requester?.role === 'admin' ? (
                <div className="">Signatory: <span className="font-medium">{job.signature_name}</span></div>
              ) : null}

              <div>
                Requested by: {job?.requester?.name ? (
                  job?.signature_name && job?.requester?.role === 'admin' ? `(${job.requester.name})` : job.requester.name
                ) : '—'}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600">Contact Number</label>
            <div className="text-sm text-gray-700">{job?.contact_no}</div>
          </div>  
        </div>

        {/* ================= CATEGORIES ================= */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Categories
          </h3>

          <div className="flex flex-wrap gap-2">
            {Array.isArray(job?.categories) && job.categories.length > 0 ? (
              job.categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  {category.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">
                No categories assigned
              </span>
            )}
          </div>
        </div>

        {/* ================= DESCRIPTION ================= */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Request Description
          </h3>

          <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed">
            {job?.request_description || '—'}
          </div>
        </div>

        {/* ================= ATTACHMENTS ================= */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Attachments
          </h3>

          {job?.attachments && job.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.attachments.map((file) => {
                const fileUrl = `/storage/${file.file_path}`;

                if (file.type === 'image') {
                  return (
                    <a
                      key={file.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border hover:shadow-md transition"
                    >
                      <img
                        src={fileUrl}
                        alt={file.original_name}
                        className="object-cover h-24 w-full"
                      />
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
                      className="flex items-center justify-center h-40 border rounded-xl bg-gray-100 hover:bg-gray-200 transition text-sm font-medium"
                    >
                      📄 View PDF
                    </a>
                  );
                }

                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-center h-40 border rounded-xl bg-gray-50 text-sm text-gray-500"
                  >
                    Unsupported file
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No attachments found.
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t mt-auto">

          {isAdmin && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAction('Ongoing')}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                Accept
              </button>

              <button
                onClick={() => handleAction('Cancelled')}
                disabled={isLoading}
                className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                Deny
              </button>
            </div>
          )}

          {/* Close button always stays at the bottom-right */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black transition disabled:opacity-50 sm:ml-auto"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

/* Small reusable component for stacked label/value */
function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">
        {value || '—'}
      </p>
    </div>
  );
}