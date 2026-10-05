// resources/js/components/modals/CutOffModal.jsx
import React from 'react';

/**
 * Informational modal shown to regular users when they're outside
 * the job order submission window.
 *
 * Uses `fixed inset-0` so the card is always centered in the viewport,
 * on any screen size, regardless of scroll. The wrapper is
 * `pointer-events-none` so the page behind stays clickable — only the
 * card itself captures clicks.
 *
 * No backdrop, no blur, no close button — the modal stays pinned while
 * the submission window is closed. It dismisses automatically when the
 * window reopens (via the parent's `windowOpen` state).
 *
 * Props:
 *   isOpen         — boolean
 *   nextOpeningMsg — string; e.g. "You can submit again on Wednesday at 8:30 AM."
 */
export default function CutOffModal({ isOpen, nextOpeningMsg }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cut-off-title"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        {/* Header strip */}
        <div className="flex items-start gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h2
              id="cut-off-title"
              className="text-lg font-semibold text-gray-900"
            >
              Submission window closed
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              You can't submit right now
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            Job order requests can only be submitted on{' '}
            <span className="font-semibold text-gray-900">weekdays (Mon–Fri)</span> between{' '}
            <span className="font-semibold text-gray-900">8:30 AM and 4:00 PM</span> (Asia/Manila).
          </p>

          {nextOpeningMsg && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-900">
                {nextOpeningMsg}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}