import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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
import ConfirmModal from '../../ConfirmModal';
import RequestCSMModal from './WIPURRequestCSMModal'; 
import WIPURResubmitModal from './WIPURResubmitModal';

export default function JobRequestsDetailsModal({ isOpen, onClose, job, onCancelled }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const [isCsmOpen, setIsCsmOpen] = useState(false);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Fetch details when modal opens
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    let cancelled = false;
    
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/website-information/requests/${job.id}`);
        if (!cancelled) {
          setDetails(res.data?.data || res.data || job);
        }
      } catch (err) {
        if (!cancelled) {
          setDetails(job);
          console.error('Failed to load full details', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();

    return () => { cancelled = true; };
  }, [isOpen, job]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const imageAttachments = details?.attachments?.filter(file => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  }) || [];

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && lightboxIndex < imageAttachments.length - 1) {
        setLightboxIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, imageAttachments.length]);

  if (!isOpen) return null;

  const data = details || job;

  const isWaitingForConfirmation = data?.status === 'Ongoing' && data?.sub_status === 'Waiting for Confirmation';
  const isReturned = data?.sub_status === 'returned';
  
  const canCancel = 
    !isWaitingForConfirmation && 
    data?.status !== 'Ongoing' && 
    data?.status !== 'Completed' && 
    data?.status !== 'Cancelled' && 
    data?.status !== 'Unserviceable';

  const isImageAttachment = (file) => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  };

  const handleCancelRequest = async () => {
    try {
      setIsCancelling(true);
      await axios.patch(`/api/website-information/requests/${data.id}/cancel`);
      toast.success('Request has been cancelled.');
      setShowCancelConfirm(false);
      if (onCancelled) onCancelled();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request.');
      setShowCancelConfirm(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCsmSubmit = (formData) => {
    console.log('CSM Data to submit:', formData);
    toast.success('Thank you for your feedback!');
    setIsCsmOpen(false);
    if (onCancelled) onCancelled();
    onClose();
  };

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
    if (status === 'Ongoing') {
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Ongoing' };
    }
    if (status === 'Pending') {
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', label: 'Pending' };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500', label: status || 'Unknown' };
  };

  // Helper to determine the flowmap step state
  const getFlowmapSteps = () => {
    const isDeclined = data?.status === 'Declined';
    const isReturnedState = data?.sub_status === 'returned';
    const isCompleted = data?.status === 'Completed' || data?.sub_status === 'completed';
    const isApproved = data?.status === 'Approved' || data?.status === 'Approved by Admin' || data?.sub_status === 'approved';
    
    // Steps: 0 = Submitted/Pending, 1 = Supervisor, 2 = Admin, 3 = Approved, 4 = Completed
    let currentStep = 0;

    if (isDeclined) {
      currentStep = data?.declined_by === 'admin' ? 2 : 1;
    } else if (isReturnedState) {
      currentStep = 1;
    } else if (isCompleted) {
      currentStep = 4;
    } else if (isApproved) {
      currentStep = 3;
    } else if (data?.sub_status === 'waiting_for_admin_approval') {
      currentStep = 2;
    } else if (data?.sub_status === 'waiting_for_supervisor_approval' || !data?.sub_status) {
      currentStep = 1;
    }

    return [
      { label: 'Submitted', step: 0 },
      { label: 'Supervisor Review', step: 1 },
      { label: 'Admin Review', step: 2 },
      { label: 'Approved', step: 3 },
      { label: 'Completed', step: 4 },
    ].map((s) => ({
      ...s,
      isPast: currentStep > s.step,
      isCurrent: currentStep === s.step,
      isDeclined: isDeclined && currentStep === s.step,
    }));
  };

  const pill = getStatusPill(data?.status);
  const isIssue = data?.status === 'Declined' || isReturned;
  const flowSteps = getFlowmapSteps();

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{data?.control_number || data?.request_no}</p>
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
            {loading ? (
              <div className="flex justify-center py-10">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <>
                {/* Flowmap / Stepper */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    Request Progress
                  </h4>
                  
                  <div className="flex items-center">
                    {flowSteps.map((step, index) => {
                      const isLast = index === flowSteps.length - 1;
                      
                      // Determine visual state colors
                      let circleClass = 'border-gray-300 text-gray-400 bg-white';
                      if (step.isPast) circleClass = 'border-blue-600 bg-blue-600 text-white';
                      if (step.isCurrent && !step.isDeclined) circleClass = 'border-blue-600 text-blue-600 bg-blue-50 ring-4 ring-blue-50';
                      if (step.isDeclined) circleClass = 'border-rose-500 text-rose-600 bg-rose-50 ring-4 ring-rose-50';

                      let lineClass = step.isPast ? 'bg-blue-600' : 'bg-gray-200';

                      return (
                        <React.Fragment key={step.label}>
                          <div className="flex flex-col items-center relative">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors z-10 ${circleClass}`}>
                              {step.isPast ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : step.isDeclined ? (
                                <FaTimesCircle className="h-4 w-4" />
                              ) : (
                                step.step + 1
                              )}
                            </div>
                            <span className={`absolute top-10 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide ${
                              step.isDeclined ? 'text-rose-600' : step.isPast || step.isCurrent ? 'text-blue-700' : 'text-gray-400'
                            }`}>
                              {step.isDeclined ? 'Declined' : step.label}
                            </span>
                          </div>
                          {!isLast && (
                            <div className={`h-1 flex-1 mx-1 rounded ${lineClass}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="h-6"></div> {/* Spacer for absolute labels */}
                </div>

                {/* Status Area */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Status</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${pill.bg} ${pill.text} ${pill.border}`}>
                        {data?.status === 'Completed' ? (
                          <FaCheckCircle className={`h-3.5 w-3.5 ${pill.text}`} />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                        )}
                        {pill.label}
                      </span>
                    </div>
                    {data?.declined_by && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Actioned By:</span>
                        <span className="font-semibold text-rose-700 capitalize bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          {data.declined_by}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason Box (Only if issue) */}
                  {isIssue && (data?.return_reason || data?.decline_reason) && (
                    <div className="p-4 bg-rose-50/40">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <FaExclamationTriangle className="h-5 w-5 text-rose-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-rose-900">
                            {data?.status === 'Declined' ? 'Reason for Decline' : 'Reason for Return'}
                          </h4>
                          <p className="mt-1 text-sm text-rose-800 whitespace-pre-wrap">
                            {data?.return_reason || data?.decline_reason || 'No specific reason provided.'}
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
                      <p className="text-sm font-medium text-gray-900">{data?.requested_by}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Department</p>
                      <p className="text-sm font-medium text-gray-900">{data?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Date Requested</p>
                      <p className="text-sm font-medium text-gray-900">{data?.date_requested_human || data?.created_at_human || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Control Number</p>
                      <p className="text-sm font-mono font-medium text-gray-900">{data?.control_number || data?.request_no}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Website Page to be Posted/Updated
                  </h4>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {data?.request_desc || data?.purpose || '—'}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Attachments
                  </h4>
                  {!data?.attachments || data.attachments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">No attachments provided.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {data.attachments.map((file) => {
                        const image = isImageAttachment(file);
                        return (
                          <div
                            key={file.id}
                            onClick={() => image ? (() => {
                              const index = imageAttachments.findIndex(f => f.id === file.id);
                              if (index !== -1) setLightboxIndex(index);
                            })() : window.open(`/storage/${file.file_path}`, '_blank')}
                            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                          >
                            {image ? (
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-blue-50 border border-blue-100">
                                <img
                                  src={`/storage/${file.file_path}`}
                                  alt={file.original_name || 'Attachment'}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FaFileAlt className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800 group-hover:text-blue-700">
                                {file.original_name || 'Attachment'}
                              </p>
                            </div>
                            <FaDownload className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-gray-200 px-6 py-4 shrink-0 bg-gray-50/50 rounded-b-2xl">
            
            {/* Action Buttons (Left) */}
            <div className="flex flex-wrap items-center gap-3">
              {isReturned && !loading && (
                <button
                  onClick={() => setIsResubmitOpen(true)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 shadow-sm"
                >
                  Revise and Resubmit
                </button>
              )}

              {isWaitingForConfirmation && !loading && (
                <button
                  onClick={() => setIsCsmOpen(true)}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
                >
                  Confirm Request
                </button>
              )}

              {canCancel && !loading && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isCancelling}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel Request
                </button>
              )}
            </div>

            {/* Close Button (Right) */}
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Image Lightbox Overlay */}
      {lightboxIndex !== null && imageAttachments.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors"
          >
            <FaTimes className="h-6 w-6" />
          </button>

          {lightboxIndex > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (lightboxIndex > 0) setLightboxIndex(prev => prev - 1);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <img
            src={`/storage/${imageAttachments[lightboxIndex].file_path}`}
            alt={imageAttachments[lightboxIndex].original_name || 'Preview'}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIndex < imageAttachments.length - 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (lightboxIndex < imageAttachments.length - 1) setLightboxIndex(prev => prev + 1);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white tracking-wide">
            {lightboxIndex + 1} / {imageAttachments.length}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Request"
        message={`Are you sure you want to cancel request ${data?.control_number || data?.request_no}? This action cannot be undone.`}
        confirmText="Yes, Cancel Request"
        cancelText="Keep Request"
        tone="danger"
        loading={isCancelling}
        onConfirm={handleCancelRequest}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <RequestCSMModal 
        isOpen={isCsmOpen}
        onClose={() => setIsCsmOpen(false)}
        onSubmit={handleCsmSubmit}
      />

      <WIPURResubmitModal
        isOpen={isResubmitOpen}
        request={data}
        onClose={() => setIsResubmitOpen(false)}
        onResubmitted={() => {
          setIsResubmitOpen(false);
          onCancelled?.();
          onClose();
        }}
      />
    </>
  );
}