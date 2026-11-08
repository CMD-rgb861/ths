import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function WIPURResubmitModal({ isOpen, request, onClose, onResubmitted }) {
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !request) return;

    setDescription(request.request_desc || '');
    setAttachments(request.attachments || []);
    setRemovedAttachmentIds([]);
    setNewFiles([]);
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const toggleAttachmentRemoval = (attachmentId) => {
    setRemovedAttachmentIds((current) => (
      current.includes(attachmentId)
        ? current.filter((id) => id !== attachmentId)
        : [...current, attachmentId]
    ));
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
      await axios.post(
        `/api/website-information/requests/${request.id}/resubmit`,
        formData
      );
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Returned for revision</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Revise and Resubmit</h2>
          <p className="mt-1 text-sm text-slate-600">
            Request {request.control_number}. The control number will remain the same.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Supervisor remarks</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
            {request.return_reason || 'No remarks provided.'}
          </p>
        </div>

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Website page/pages to be posted or updated
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
          rows={6}
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <p className="mt-1 text-right text-xs text-slate-500">{description.length} / 4000</p>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-700">Existing attachments</h3>
          {attachments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">This request has no existing attachments.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {attachments.map((attachment) => {
                const markedForRemoval = removedAttachmentIds.includes(attachment.id);

                return (
                  <li
                    key={attachment.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                      markedForRemoval ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <a
                      href={`/storage/${attachment.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`min-w-0 truncate text-sm font-medium underline ${
                        markedForRemoval ? 'text-rose-700 line-through' : 'text-blue-700'
                      }`}
                    >
                      {attachment.original_name || 'Attachment'}
                    </a>
                    <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-rose-700">
                      <input
                        type="checkbox"
                        checked={markedForRemoval}
                        onChange={() => toggleAttachmentRemoval(attachment.id)}
                        disabled={saving}
                      />
                      Remove
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Add attachments (optional)
          </label>
          <input
            type="file"
            multiple
            onChange={(event) => setNewFiles(Array.from(event.target.files || []))}
            disabled={saving}
            className="block w-full text-sm text-slate-600"
          />
          {newFiles.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {newFiles.map((file) => file.name).join(', ')}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Resubmitting...' : 'Resubmit to Supervisor'}
          </button>
        </div>
      </form>
    </div>
  );
}
