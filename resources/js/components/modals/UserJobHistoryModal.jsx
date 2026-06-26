import React, { useMemo } from 'react';

export default function UserJobHistoryModal({
  isOpen,
  job,
  onClose,
}) {
  if (!isOpen || !job) return null;

  const formattedDate = useMemo(() => {
    if (!job?.date) return '—';
    return new Date(job.date).toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [job?.date]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Declined':
      case 'Cancelled':
      case 'Cancelled by User':
        return 'bg-red-100 text-red-800';
      case 'Unserviceable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Helper to safely extract name from user objects or return string value
  const getName = (value) => {
    if (!value) return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return '—';
  };

  // Helper to check if category is hardware or software
  const isHardwareCategory = (categories) => {
    if (!categories || categories.length === 0) return false;
    const hardwareNames = ['Computer Desktop', 'Printer', 'Laptop'];
    return categories.some(cat => hardwareNames.includes(cat.name));
  };

  const isSoftwareCategory = (categories) => {
    if (!categories || categories.length === 0) return false;
    return categories.some(cat => cat.name === 'Software');
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const requestStatusName = job?.request_status?.name || job?.status;
  const hasServiceWorkDetails = !!(
    job?.action_report?.diagnosis ||
    job?.action_report?.serviced_by ||
    job?.action_report?.servicedBy ||
    job?.action_report?.date_started ||
    job?.action_report?.date_finished ||
    job?.action_report?.serial_number ||
    job?.action_report?.software_name
  );

  const isDeniedByAdminOrTech =
    requestStatusName === 'Completed' &&
    job?.action_report?.action_taken === 'Closed' &&
    !!job?.action_report?.remarks &&
    !hasServiceWorkDetails;

  const cancelledByRaw = job?.action_report?.cancelled_by;
  const cancelledById =
    typeof cancelledByRaw === 'object' && cancelledByRaw
      ? cancelledByRaw.id
      : cancelledByRaw;
  const requesterId = job?.requester?.id;
  const isCancelledByUser =
    (job?.action_report?.status === 'Cancelled' || job?.action_report?.status === 'Cancelled by User') &&
    !!cancelledById &&
    !!requesterId &&
    cancelledById === requesterId;

  const isCancelledByAdminOrTech =
    job?.action_report?.status === 'Cancelled' &&
    !!cancelledById &&
    !!requesterId &&
    cancelledById !== requesterId;

  const terminalStatusLabel = isDeniedByAdminOrTech
    ? 'Declined'
    : (isCancelledByUser || isCancelledByAdminOrTech ? 'Cancelled' : null);

  const terminalActorName = isDeniedByAdminOrTech
    ? getName(job?.action_report?.cancelledBy || job?.action_report?.cancelled_by)
    : (isCancelledByUser
      ? getName(job?.requester)
      : getName(job?.action_report?.cancelledBy || job?.action_report?.cancelled_by));

  const terminalAt = job?.action_report?.cancelled_at || job?.action_report?.updated_at;

  const statusDisplay = isDeniedByAdminOrTech
    ? 'Declined'
    : (job.action_report?.status === 'Cancelled by User'
      ? 'Cancelled'
      : (job.action_report?.status || requestStatusName || job.status));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job Request History</h2>
            <p className="text-gray-600 mt-1">Complete information about this completed job request</p>
          </div>
          <div className="flex items-center gap-3">
            {job?.action_report?.status === 'Completed' && (
              <button
                onClick={() =>
                  window.open(`/job-orders/${job.id}/completed/pdf`, "_blank")
                }
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Report
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {/* Job Order Summary */}
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(statusDisplay)}`}>
                  {statusDisplay || 'Pending'}
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
                  <p className="text-sm text-gray-900">
                    {job?.signature_name && job?.requester?.role === 'admin'
                      ? (
                        <span>
                          <span className="font-medium">{job.signature_name}</span>
                          <span className="text-gray-500 text-xs ml-1">({getName(job.requester)})</span>
                        </span>
                      )
                      : getName(job?.requester)
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Number</p>
                  <p className="text-sm text-gray-900">{job?.contact_no || '—'}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signature Name</p>
                  <p className="text-sm text-gray-900">{job?.signature_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created By</p>
                  <p className="text-sm text-gray-900">{getName(job?.creator)}</p>
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

          {/* Technician's Report */}
          {job.action_report && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Technician's Report
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                {terminalStatusLabel ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(terminalStatusLabel)}`}>
                        {terminalStatusLabel}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {isDeniedByAdminOrTech ? 'Declined By' : 'Cancelled By'}
                      </p>
                      <p className="text-sm text-gray-900">{terminalActorName}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {isDeniedByAdminOrTech ? 'Declined At' : 'Cancelled At'}
                      </p>
                      <p className="text-sm text-gray-900">{formatDateTime(terminalAt)}</p>
                    </div>

                    {job.action_report.remarks && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {isDeniedByAdminOrTech ? 'Decline Reason' : 'Reason'}
                        </p>
                        <div className="bg-white rounded-lg border border-red-200 p-4">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {job.action_report.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(job.action_report.status)}`}>
                          {job.action_report.status || '—'}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Serviced By</p>
                        <p className="text-sm text-gray-900">
                          {getName(job.action_report.servicedBy || job.action_report.serviced_by)}
                        </p>
                      </div>

                      {job.action_report.acceptedBy && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Accepted By</p>
                          <p className="text-sm text-gray-900">{getName(job.action_report.acceptedBy)}</p>
                        </div>
                      )}

                      {job.action_report.cancelledBy && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cancelled By</p>
                          <p className="text-sm text-gray-900">{getName(job.action_report.cancelledBy)}</p>
                        </div>
                      )}
                    </div>

                    {job.action_report.diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Diagnosis</p>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {job.action_report.diagnosis}
                          </p>
                        </div>
                      </div>
                    )}

                    {job.action_report.remarks && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Remarks</p>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {job.action_report.remarks}
                          </p>
                        </div>
                      </div>
                    )}

                    {isHardwareCategory(job.categories) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hardware Details</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Serial Number</p>
                            <p className="text-sm text-gray-900">{job.action_report.serial_number || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Brand Model</p>
                            <p className="text-sm text-gray-900">{job.action_report.brand_model || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Brand Name</p>
                            <p className="text-sm text-gray-900">{job.action_report.brand_name || '—'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isSoftwareCategory(job.categories) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Software Name</p>
                        <p className="text-sm text-gray-900">{job.action_report.software_name || '—'}</p>
                      </div>
                    )}

                    {job.action_report.findings && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unserviceable Reason</p>
                        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {job.action_report.findings}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {job.attachments && job.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7.172a4 4 0 00-5.656 0l-3.536 3.536a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l3.536-3.536a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Attachments
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`/storage/${attachment.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                    >
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                        {attachment.original_filename || 'Attachment'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
    </div>
  );
}
