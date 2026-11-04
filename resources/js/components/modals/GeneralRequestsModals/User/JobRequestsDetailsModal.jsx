// resources/js/components/modals/GeneralRequestsModals/User/JobRequestsDetailsModal.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmModal from '../../ConfirmModal';
import RequestCSMModal from './RequestCSMModal'; // ✅ Import the new Modal

export default function JobRequestsDetailsModal({ isOpen, onClose, job, onCancelled }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ New state for CSM Modal
  const [isCsmOpen, setIsCsmOpen] = useState(false);

  // ✅ State for the Image Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Fetch full details when the modal opens
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    let cancelled = false;
    
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/gjor/job-orders/${job.id}`);
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

  // ✅ Extract only the image attachments for the lightbox
  const imageAttachments = details?.attachments?.filter(file => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  }) || [];

  // ✅ Lightbox Keyboard Navigation & Escape key
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

  // ✅ Conditional Logic for the Footer Buttons
  const isWaitingForConfirmation = data?.status === 'Ongoing' && data?.sub_status === 'Waiting for Confirmation';
  const canCancel = !isWaitingForConfirmation && data?.status !== 'Completed' && data?.status !== 'Cancelled' && data?.status !== 'Unserviceable';

  const isImageAttachment = (file) => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  };

  const handleCancelRequest = async () => {
    try {
      setIsCancelling(true);
      await axios.patch(`/api/gjor/job-orders/${data.id}/cancel`);
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

  // ✅ Handle CSM Submission (Backend integration to come later)
  const handleCsmSubmit = (formData) => {
    console.log('CSM Data to submit:', formData);
    toast.success('Thank you for your feedback!');
    setIsCsmOpen(false);
    if (onCancelled) onCancelled(); // Refresh the list
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
              <p className="text-sm text-gray-500">{data?.request_no}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Status & Meta Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Status</span>
                    <span className={`mt-1 block font-medium ${
                      data?.status === 'Cancelled' ? 'text-rose-600' : 'text-gray-900'
                    }`}>
                      {data?.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Date Requested</span>
                    <span className="mt-1 block font-medium text-gray-900">{data?.created_at_human}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Department</span>
                    <span className="mt-1 block font-medium text-gray-900">{data?.department || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Requested By</span>
                    <span className="mt-1 block font-medium text-gray-900">{data?.requested_by}</span>
                  </div>
                </div>

                {/* Request Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Purpose / Description</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{data?.purpose || '—'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Location</h4>
                      <p className="mt-1 text-sm text-gray-800">{data?.location || '—'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact Number</h4>
                      <p className="mt-1 text-sm text-gray-800">{data?.contact_no || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Request For (Pivot) */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Personnel Requested</h4>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    {data?.request_for_items?.length > 0 ? (
                      <ul className="space-y-2">
                        {data.request_for_items.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{item.name}</span>
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                              {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No specific personnel types requested.</p>
                    )}
                    
                    {data?.others_desc && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <span className="text-xs font-semibold text-gray-500">Others Specification:</span>
                        <p className="text-sm text-gray-800">{data.others_desc}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {data?.attachments?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Attachments</h4>
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
                            className="group block cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            {image ? (
                              <div className="overflow-hidden">
                                <img
                                  src={`/storage/${file.file_path}`}
                                  alt={file.original_name || 'Attachment'}
                                  className="h-40 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3">
                                <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="truncate text-sm font-medium text-blue-600 group-hover:underline">
                                  {file.original_name || 'Attachment'}
                                </span>
                              </div>
                            )}

                            {image && (
                              <div className="border-t border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 truncate">
                                {file.original_name || 'Image attachment'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center border-t border-gray-200 px-6 py-4">
            {/* Action Button (Left) */}
            <div>
              {/* ✅ Show Confirm button if waiting for confirmation */}
              {isWaitingForConfirmation && !loading && (
                <button
                  onClick={() => setIsCsmOpen(true)}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:!bg-green-700 transition-colors shadow-sm"
                >
                  Confirm Request
                </button>
              )}

              {/* Otherwise, show Cancel if allowed */}
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
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* ✅ Image Lightbox Overlay */}
      {lightboxIndex !== null && imageAttachments.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev Button */}
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

          {/* Image */}
          <img
            src={`/storage/${imageAttachments[lightboxIndex].file_path}`}
            alt={imageAttachments[lightboxIndex].original_name || 'Preview'}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
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

          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white tracking-wide">
            {lightboxIndex + 1} / {imageAttachments.length}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Request"
        message={`Are you sure you want to cancel request ${data?.request_no}? This action cannot be undone.`}
        confirmText="Yes, Cancel Request"
        cancelText="Keep Request"
        tone="danger"
        loading={isCancelling}
        onConfirm={handleCancelRequest}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* ✅ CSM Modal */}
      <RequestCSMModal 
        isOpen={isCsmOpen}
        onClose={() => setIsCsmOpen(false)}
        onSubmit={handleCsmSubmit}
      />
    </>
  );
}