import React from 'react';

/**
 * Renders the main status and, if applicable, the sub-status pill below it.
 */
export default function SubstatusHelper({ status, subStatus, workflowStatus }) {
  if (!status && !subStatus && !workflowStatus) return <span className="text-gray-400 italic">—</span>;

  const normalizeValue = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const normalizeSubStatus = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const mainStatusValue = status || workflowStatus || subStatus || 'Pending';
  const mainStatusKey = normalizeValue(mainStatusValue);
  const mainStatusLabel = {
    pending: 'Pending',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'waiting for supervisor approval': 'Pending',
    'waiting for admin approval': 'Pending',
    'waiting for supervisor': 'Pending',
    'waiting for admin': 'Pending',
    returned: 'Pending',
    approved: 'Ongoing',
    declined: 'Declined',
  }[mainStatusKey] || String(mainStatusValue);

  const subStatusKey = normalizeSubStatus(subStatus || workflowStatus);
  const subStatusLabel = {
    'waiting for supervisor approval': 'Waiting for Supervisor Approval',
    'waiting for admin approval': 'Waiting for Admin Approval',
    'waiting for supervisor': 'Waiting for Supervisor',
    'waiting for admin': 'Waiting for Admin',
    returned: 'Returned',
    approved: 'Approved',
    declined: 'Declined',
    completed: 'Completed',
  }[subStatusKey] || null;

  const isWaiting =
    subStatusKey === 'waiting for confirmation' ||
    subStatusKey === 'waiting for your confirmation' ||
    subStatusKey === 'waiting for supervisor approval' ||
    subStatusKey === 'waiting for admin approval';

  let mainStatusClasses = 'text-gray-800 bg-gray-100';
  if (['Pending'].includes(mainStatusLabel)) mainStatusClasses = 'text-yellow-800 bg-yellow-100';
  if (['Ongoing', 'Approved'].includes(mainStatusLabel)) mainStatusClasses = 'text-blue-800 bg-blue-100';
  if (['Completed'].includes(mainStatusLabel)) mainStatusClasses = 'text-green-800 bg-green-100';
  if (['Cancelled', 'Declined'].includes(mainStatusLabel)) mainStatusClasses = 'text-rose-800 bg-rose-100';

  const subStatusClasses = isWaiting
    ? 'text-violet-800 bg-violet-100 ring-1 ring-violet-200'
    : subStatusKey === 'approved'
      ? 'text-emerald-800 bg-emerald-100 ring-1 ring-emerald-200'
      : 'text-slate-700 bg-slate-100 ring-1 ring-slate-200';

  return (
    <div className="flex flex-col items-center justify-center space-y-1.5">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${mainStatusClasses}`}>
        {mainStatusLabel}
      </span>

      {(subStatusLabel || isWaiting) && (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${subStatusClasses}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {subStatusLabel || 'Waiting for your confirmation'}
        </span>
      )}
    </div>
  );
}