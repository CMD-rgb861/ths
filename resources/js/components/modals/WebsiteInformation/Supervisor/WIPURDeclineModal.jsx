import React, { useEffect, useState } from 'react';

export default function WIPURDeclineModal({ isOpen, request, onClose, onConfirm, loading = false }) {
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reason is strictly for the decline, pull from decline_reason if it exists (or empty)
      setReason(request?.decline_reason ?? '');
      // Remarks are side notes, pull from step_remarks
      setRemarks(request?.step_remarks ?? '');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const isValid = reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Decline request</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Preview decline</h2>
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reason for Decline <span className="text-rose-600">(Required)</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="State the specific reason for declining this request..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            {!isValid && (
              <p className="mt-1 text-xs text-rose-600">A reason is required before declining the request.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Remarks <span className="text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Any additional side notes (optional)..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
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
            onClick={() => onConfirm({ reason, remarks })}
            disabled={loading || !isValid}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}