import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaTrash, 
  FaUndo, 
  FaFileAlt, 
  FaPaperclip, 
  FaCloudUploadAlt,
  FaTimes
} from 'react-icons/fa';

export default function WIPURResubmitModal({ isOpen, request, onClose, onResubmitted }) {
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // 👇 ALL HOOKS MUST BE AT THE TOP, BEFORE ANY RETURNS
  useEffect(() => {
    if (!isOpen || !request) return;

    setDescription(request.request_desc || '');
    setAttachments(request.attachments || []);
    setRemovedAttachmentIds([]);
    setNewFiles([]);
    setLightboxIndex(null);
  }, [isOpen, request]);

  // Filter out attachments that are marked for removal for the display
  const visibleAttachments = attachments.filter(a => !removedAttachmentIds.includes(a.id));
  const imageAttachments = visibleAttachments.filter(file => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  });

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

  const toggleAttachmentRemoval = (attachmentId) => {
    setRemovedAttachmentIds((current) => (
      current.includes(attachmentId)
        ? current.filter((id) => id !== attachmentId)
        : [...current, attachmentId]
    ));
  };

  const isImageAttachment = (file) => {
    const mime = (file?.type || '').toLowerCase();
    const name = (file?.original_name || file?.name || '').toLowerCase();
    return mime.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!description.trim()) {
      toast.error('Please describe the website changes requested.');
      return;
    }

    const formData = new FormData();
    formData.append('request_desc', description.trim());
    removedAttachmentIds.forEach((id) => formData.append('remove_attachment_ids[]', id));
    newFiles.forEach((file) => formData.append('attachments[]', file));

    try {
      setSaving(true);
      await axios.post(`/api/website-information/requests/${request.id}/resubmit`, formData);
      toast.success('Your revised request has been resubmitted to the supervisor.');
      onResubmitted?.();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to resubmit the request.'
        : 'Failed to resubmit the request.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // 👇 EARLY RETURN IS NOW AFTER ALL HOOKS
  if (!isOpen || !request) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revise and Resubmit</h3>
              <p className="text-sm text-gray-500">{request.control_number || request.id}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
            
            {/* Supervisor Remarks */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Supervisor Remarks (Reason for Return)
                </h4>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
                {request.return_reason || request.step_remarks || 'No specific remarks provided.'}
              </p>
            </div>

            {/* Request Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Website page/pages to be posted or updated
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={4000}
                rows={5}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
              />
              <p className="mt-1 text-right text-xs text-slate-500">{description.length} / 4000 characters</p>
            </div>

            {/* Existing Attachments */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Existing Attachments
              </h4>
              {attachments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">No existing attachments.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) => {
                    const isRemoved = removedAttachmentIds.includes(attachment.id);

                    if (isRemoved) {
                      return (
                        <div key={attachment.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 opacity-60">
                          <span className="truncate text-sm font-medium text-gray-500 line-through">
                            {attachment.original_name || 'Attachment'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAttachmentRemoval(attachment.id)}
                            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-blue-600 shadow-sm hover:text-blue-700"
                          >
                            <FaUndo className="h-3 w-3" /> Undo
                          </button>
                        </div>
                      );
                    }

                    const image = isImageAttachment(attachment);

                    return (
                      <div key={attachment.id} className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 pr-10 transition hover:border-blue-200 hover:bg-blue-50">
                        {/* Thumbnail / Icon */}
                        <div 
                          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-gray-200"
                          onClick={() => image ? (() => {
                            const index = imageAttachments.findIndex(f => f.id === attachment.id);
                            if (index !== -1) setLightboxIndex(index);
                          })() : window.open(`/storage/${attachment.file_path}`, '_blank')}
                        >
                          {image ? (
                            <img src={`/storage/${attachment.file_path}`} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FaFileAlt className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        {/* File Name */}
                        <div className="min-w-0 flex-1">
                          <p 
                            className="cursor-pointer truncate text-sm font-medium text-gray-800 hover:text-blue-600"
                            onClick={() => image ? (() => {
                              const index = imageAttachments.findIndex(f => f.id === attachment.id);
                              if (index !== -1) setLightboxIndex(index);
                            })() : window.open(`/storage/${attachment.file_path}`, '_blank')}
                          >
                            {attachment.original_name || 'Attachment'}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => toggleAttachmentRemoval(attachment.id)}
                          disabled={saving}
                          title="Remove attachment"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* New Attachments */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Add New Attachments (Optional)
              </h4>
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <input
                  type="file"
                  multiple
                  id="resubmit-files"
                  onChange={(event) => setNewFiles(Array.from(event.target.files || []))}
                  disabled={saving}
                  className="sr-only"
                />
                <label htmlFor="resubmit-files" className="cursor-pointer block">
                  <FaCloudUploadAlt className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-blue-600 hover:text-blue-700">Click to upload files</span>
                  <p className="mt-1 text-xs text-gray-500">You can select multiple files.</p>
                </label>
              </div>
              
              {newFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                      <FaPaperclip className="h-3.5 w-3.5" />
                      <span className="max-w-[200px] truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center border-t border-gray-200 px-6 py-4 shrink-0 bg-gray-50/50 rounded-b-2xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {saving ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Resubmitting...
                  </>
                ) : (
                  'Resubmit to Supervisor'
                )}
              </button>
            </div>
          </div>
        </form>
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
    </>
  );
}