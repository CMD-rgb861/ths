import React from 'react';

/**
 * Renders the main status and, if applicable, the sub-status pill below it.
 */
export default function SubstatusHelper({ status, subStatus }) {
  if (!status) return <span className="text-gray-400 italic">—</span>;

  const normalizeSubStatus = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const isWaiting =
    normalizeSubStatus(subStatus) === 'waiting for confirmation' ||
    normalizeSubStatus(subStatus) === 'waiting for your confirmation';

  // Main status color logic (mirrors your existing statusBadgeClass)
  let mainStatusClasses = 'text-gray-800 bg-gray-100';
  if (status === 'Pending') mainStatusClasses = 'text-yellow-800 bg-yellow-100';
  if (status === 'Ongoing') mainStatusClasses = 'text-blue-800 bg-blue-100';
  if (status === 'Completed') mainStatusClasses = 'text-green-800 bg-green-100';
  if (status === 'Cancelled') mainStatusClasses = 'text-rose-800 bg-rose-100';

  return (
    <div className="flex flex-col items-center justify-center space-y-1.5">
      {/* Main Status */}
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mainStatusClasses}`}>
        {status}
      </span>

      {/* Sub-status Pill (Only shows if waiting for confirmation) */}
      {isWaiting && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-yellow-800 bg-yellow-50/80 ring-1 ring-yellow-200/50">
          {/* Clock Icon */}
          <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Waiting for your confirmation
        </span>
      )}
    </div>
  );
}