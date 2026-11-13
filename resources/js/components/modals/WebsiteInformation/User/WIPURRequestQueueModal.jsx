import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaList } from 'react-icons/fa';

const getStatusVisuals = (status, subStatus, workflowStatus) => {
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

  return {
    mainStatusLabel,
    mainStatusClasses,
    subStatusLabel,
    subStatusClasses,
    showSubStatus: Boolean(subStatusLabel || isWaiting),
  };
};

export default function RequestQueueModal({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [userFirstPosition, setUserFirstPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/website-information/queue');
      
      setEntries(res.data?.entries || []);
      setTotalInQueue(res.data?.total_in_queue || 0);
      setUserFirstPosition(res.data?.user_position ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchQueue();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100">
                  <FaList className="w-4 h-4 text-blue-700" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Global Queue</h2>
                  <p className="text-gray-600 mt-0.5 text-sm">Your position in the processing line</p>
                </div>
              </div>

              {!loading && totalInQueue > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  {typeof userFirstPosition === 'number' ? (
                    <>Your first request is <span className="font-semibold text-gray-900">#{userFirstPosition}</span> in the queue of <span className="font-semibold text-gray-900">{totalInQueue}</span></>
                  ) : (
                    <>You currently have no active requests in the queue.</>
                  )}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12 text-gray-500">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading queue...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">The queue is currently empty</p>
              <p className="text-gray-400 text-sm mt-1">When a request is submitted, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => {
                if (entry.kind === 'gap') {
                  const gapSize = entry.to - entry.from + 1;
                  return (
                    <div key={`gap-${entry.from}-${i}`} className="flex items-center gap-3 px-4 py-2">
                      <div className="w-8 flex justify-center text-gray-400 text-lg font-bold tracking-widest select-none">
                        ···
                      </div>
                      <p className="text-xs font-medium text-gray-500">
                        {gapSize} {gapSize === 1 ? 'other request' : 'other requests'} in the queue
                      </p>
                    </div>
                  );
                }

                const isUser = entry.is_user_job;

                return (
                  <div
                    key={`job-${entry.id}`}
                    className={`bg-white border rounded-lg p-5 transition-shadow ${
                      isUser
                        ? 'border-blue-300 ring-2 ring-blue-100 shadow-sm bg-blue-50/30'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${
                            isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {entry.position}
                        </span>
                        <div className="min-w-0">
                          <span className="text-lg font-bold text-blue-600 block truncate">
                            {entry.request_no}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Position <span className="font-semibold text-gray-700">#{entry.position}</span> of {totalInQueue}
                          </p>
                        </div>
                      </div>

                      {isUser ? (() => {
                        const visuals = getStatusVisuals(entry.status, entry.sub_status, entry.workflow_status);

                        return (
                          <div className="ml-auto flex shrink-0 self-center">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${visuals.mainStatusClasses}`}>
                                {visuals.mainStatusLabel}
                              </span>

                              {visuals.showSubStatus && (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${visuals.subStatusClasses}`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {visuals.subStatusLabel || 'Waiting for your confirmation'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="ml-auto w-8" aria-hidden="true" />
                      )}
                    </div>
                    
                    {isUser && (
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          This is your request
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}