import React, { useEffect, useState } from 'react';

export default function WIPURReturnModal({ isOpen, request, onClose, onConfirm, loading = false }) {
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Strictly pull from the supervisor step remarks (defaults to empty string)
      setRemarks(request?.step_remarks ?? '');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const isValid = remarks.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Return request</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Preview return for revision</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Control number</label>
            <input
              readOnly
              value={request.control_number || request.id || '—'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Remarks (Required)</label>
            <textarea
              rows={5}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Provide the reason or revision note for returning this request..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            {!isValid && (
              <p className="mt-1 text-xs text-rose-600">Remarks are required before returning the request.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ remarks })}
            disabled={loading || !isValid}
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Return'}
          </button>
        </div>
      </div>
    </div>
  );
}