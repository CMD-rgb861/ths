import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function WIPURLogDetails({ isOpen, onClose, entry }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Fetch full details when the modal opens
  useEffect(() => {
    if (!isOpen || !entry?.request_id) return;

    let cancelled = false;
    
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/website-information/supervisor/requests/${entry.request_id}`);
        if (!cancelled) {
          setDetails(res.data?.data || res.data || entry);
        }
      } catch (err) {
        if (!cancelled) {
          setDetails(entry); // Fallback to the basic entry data
          console.error('Failed to load full details', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();

    return () => { cancelled = true; };
  }, [isOpen, entry]);

  const imageAttachments = details?.attachments?.filter(file => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  }) || [];

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && lightboxIndex < imageAttachments.length - 1) setLightboxIndex(prev => prev + 1);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(prev => prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, imageAttachments.length]);

  if (!isOpen) return null;

  const data = details || entry;

  const isImageAttachment = (file) => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Returned': return 'bg-amber-100 text-amber-700';
      case 'Declined': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Decision Log Details</h3>
              <p className="text-sm text-gray-500">{entry?.id || data?.control_number}</p>
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
                
                {/* Decision Banner */}
                <div className={`rounded-xl border p-4 ${getDecisionBadge(entry?.decision)}`}>
                   <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Supervisor Decision</p>
                        <p className="mt-1 text-lg font-bold">{entry?.decision}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Decided By</p>
                        <p className="mt-1 text-sm font-semibold">{entry?.decidedBy}</p>
                        <p className="text-xs opacity-80">{entry?.dateLabel}</p>
                      </div>
                   </div>
                   {/* Reason / Remarks for the decision */}
                   <div className="mt-4 border-t border-black/10 pt-3">
                     <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                        {entry?.decision === 'Declined' ? 'Decline Reason' : 'Supervisor Remarks'}
                     </p>
                     <p className="mt-1 text-sm font-medium">{entry?.remarks}</p>
                   </div>
                </div>

                {/* Status & Meta Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Requester</span>
                    <span className="mt-1 block font-medium text-gray-900">{data?.requester || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Department</span>
                    <span className="mt-1 block font-medium text-gray-900">{data?.department || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Date Submitted</span>
                    <span className="mt-1 block font-medium text-gray-900">{data?.submittedAt || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Control No.</span>
                    <span className="mt-1 block font-medium text-gray-900">{entry?.id || '—'}</span>
                  </div>
                </div>

                {/* Request Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Request Description</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{entry?.request_desc || data?.remarks || data?.request_desc || '—'}</p>
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
          <div className="flex justify-end items-center border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
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
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
    </>
  );
}