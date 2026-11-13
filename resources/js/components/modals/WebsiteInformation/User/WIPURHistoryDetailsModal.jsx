import React, { useEffect } from 'react';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaUndo, 
  FaFileAlt, 
  FaDownload,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function WIPURHistoryDetailsModal({ isOpen, job, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const getStatusPill = (status) => {
    if (status === 'Completed') {
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' };
    }
    if (status === 'Approved by Admin' || status === 'Approved') {
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Approved by Admin' };
    }
    if (status === 'Declined') {
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Declined' };
    }
    if (status === 'Returned') {
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Returned for Revision' };
    }
    if (status === 'Cancelled') {
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Cancelled' };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500', label: status };
  };

  const pill = getStatusPill(job.status);
  const isIssue = job.status === 'Declined' || job.status === 'Returned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{job.control_number}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
          
          {/* Redesigned Status Area */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Status</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${pill.bg} ${pill.text} ${pill.border}`}>
                  {job.status === 'Completed' ? (
                    <FaCheckCircle className={`h-3.5 w-3.5 ${pill.text}`} />
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                  )}
                  {pill.label}
                </span>
              </div>
              {job.declined_by && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Actioned By:</span>
                  <span className="font-semibold text-rose-700 capitalize bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    {job.declined_by}
                  </span>
                </div>
              )}
            </div>

            {/* Reason Box (Only if issue) */}
            {isIssue && job.reason && (
              <div className="p-4 bg-rose-50/40">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <FaExclamationTriangle className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">
                      {job.status === 'Declined' ? 'Reason for Decline' : 'Reason for Return'}
                    </h4>
                    <p className="mt-1 text-sm text-rose-800 whitespace-pre-wrap">
                      {job.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Request Information Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Request Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Requested By</p>
                <p className="text-sm font-medium text-gray-900">{job.requested_by}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Department</p>
                <p className="text-sm font-medium text-gray-900">{job.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Date Requested</p>
                <p className="text-sm font-medium text-gray-900">{job.created_at_human || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Control Number</p>
                <p className="text-sm font-mono font-medium text-gray-900">{job.control_number}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Description
            </h4>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {job.request_desc}
              </p>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Attachments
            </h4>
            {!job.attachments || job.attachments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No attachments provided.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {job.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={`/storage/${file.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <FaFileAlt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 group-hover:text-blue-700">
                        {file.original_name || 'Attachment'}
                      </p>
                    </div>
                    <FaDownload className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}