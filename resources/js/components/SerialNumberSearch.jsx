import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function SerialNumberCompareModal({
  isOpen,
  onClose,
  jobs = [],
  currentJob,
  currentIndex,
  onPrev,
  onNext,
}) {
  if (!isOpen) return null;

  const oldJob = jobs[currentIndex] || null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < jobs.length - 1;

  const getStatusText = (job, fallback = '—') =>
    job?.action_report?.status || job?.status || fallback;

  const DetailRow = ({ label, value, strong = false }) => (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className={strong ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-700'}>
        {value || '—'}
      </span>
    </div>
  );

  const StatusBadge = ({ value, tone = 'blue' }) => {
    const classes =
      tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-blue-200 bg-blue-50 text-blue-700';

    return (
      <span
        className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
      >
        {value || '—'}
      </span>
    );
  };

  // Helper to format date
  const formatDate = (date) =>
    date ? new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="relative w-full max-w-6xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-1 top-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-3xl text-gray-700 transition hover:bg-white/70 hover:text-black"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Top indicator */}
        <div className="mb-5 flex justify-center">
          <div className="rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-gray-800">
              Comparing previous history {jobs.length > 0 ? currentIndex + 1 : 0} of {jobs.length}
            </span>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex items-center justify-center gap-5 lg:gap-7">
          {/* Prev button */}
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-2xl text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
            aria-label="Previous"
          >
            &#x276E;
          </button>

          {/* Old Job */}
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-5 text-center">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                History {jobs.length > 0 ? currentIndex + 1 : 0} of {jobs.length}
              </div>

              <h2 className="mt-3 text-xl font-semibold text-gray-900">OLD JOB ORDER</h2>

              {jobs.length > 1 && (
                <>
                  <div className="mt-3 flex justify-center gap-1.5">
                    {jobs.map((_, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full transition-all ${
                          idx === currentIndex
                            ? 'h-2.5 w-6 bg-amber-500'
                            : 'h-2.5 w-2.5 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Browse other previous records using the arrows
                  </p>
                </>
              )}
            </div>

            {oldJob ? (
              <div className="space-y-3">
                <DetailRow label="Job Order No" value={oldJob.job_order_no} strong />
                <DetailRow label="Department" value={oldJob.department?.name} />
                <DetailRow label="Requester" value={oldJob.requester?.name} />
                <DetailRow
                  label="Categories"
                  value={(oldJob.categories || []).map((c) => c.name).join(', ')}
                />
                {/* --- Additional fields for better comparison --- */}
                <DetailRow label="Date Created" value={formatDate(oldJob.created_at)} />
                <DetailRow label="Date Started" value={formatDate(oldJob.action_report?.date_started)} />
                <DetailRow label="Date Finished" value={formatDate(oldJob.action_report?.date_finished)} />
                <DetailRow label="Diagnosis" value={oldJob.action_report?.diagnosis} />
                <DetailRow label="Action Taken" value={oldJob.action_report?.action_taken} />
                <DetailRow label="Serial Number" value={oldJob.action_report?.serial_number} />
                <DetailRow label="Brand Name" value={oldJob.action_report?.brand_name} />
                <DetailRow label="Brand Model" value={oldJob.action_report?.brand_model} />
                <DetailRow label="Software Name" value={oldJob.action_report?.software_name} />
                <DetailRow label="Remarks" value={oldJob.action_report?.remarks} />
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </div>
                  <StatusBadge value={getStatusText(oldJob)} tone="amber" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
                No old job order data available.
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-2xl text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
            aria-label="Next"
          >
            &#x276F;
          </button>

          {/* New Job */}
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-5 text-center">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Current Entry
              </div>
              <h2 className="mt-3 text-xl font-semibold text-gray-900">NEW JOB ORDER</h2>
            </div>

            {currentJob ? (
              <div className="space-y-3">
                <DetailRow
                  label="Job Order No"
                  value={currentJob.job_order_no || 'New (unsaved)'}
                  strong
                />
                <DetailRow label="Department" value={currentJob.department?.name} />
                <DetailRow label="Requester" value={currentJob.requester?.name} />
                <DetailRow
                  label="Categories"
                  value={(currentJob.categories || []).map((c) => c.name).join(', ')}
                />
                {/* --- Additional fields for better comparison --- */}
                <DetailRow label="Date Created" value={formatDate(currentJob.created_at)} />
                <DetailRow label="Date Started" value={formatDate(currentJob.action_report?.date_started)} />
                <DetailRow label="Date Finished" value={formatDate(currentJob.action_report?.date_finished)} />
                <DetailRow label="Diagnosis" value={currentJob.action_report?.diagnosis} />
                <DetailRow label="Action Taken" value={currentJob.action_report?.action_taken} />
                <DetailRow label="Serial Number" value={currentJob.action_report?.serial_number} />
                <DetailRow label="Brand Name" value={currentJob.action_report?.brand_name} />
                <DetailRow label="Brand Model" value={currentJob.action_report?.brand_model} />
                <DetailRow label="Software Name" value={currentJob.action_report?.software_name} />
                <DetailRow label="Remarks" value={currentJob.action_report?.remarks} />
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </div>
                  <StatusBadge value={getStatusText(currentJob, 'Draft')} tone="blue" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
                No current job order data available.
              </div>
            )}
          </div>
        </div>

        {/* Mobile buttons */}
        <div className="mt-5 flex items-center justify-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            &#x276E;
            <span className="ml-2">Previous</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <span className="mr-2">Next</span>
            &#x276F;
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SerialNumberSearch({ value, onChange, readOnly, currentJob }) {
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState({ count: 0, jobs: [] });
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const debounceRef = useRef();

  useEffect(() => {
    if (!value || value.length < 2) {
      setResult({ count: 0, jobs: [] });
      setSearching(false);
      return;
    }

    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      axios
        .get('/serial-number/search', { params: { serial_number: value } })
        .then((res) => setResult(res.data))
        .catch(() => setResult({ count: 0, jobs: [] }))
        .finally(() => setSearching(false));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleBadgeClick = () => {
    if (result.jobs.length > 0) {
      setCurrentIndex(0);
      setCompareModalOpen(true);
    }
  };

  const newJob = currentJob
    ? currentJob
    : {
        job_order_no: 'New (unsaved)',
        department: result.jobs[0]?.department,
        requester: result.jobs[0]?.requester,
        categories: result.jobs[0]?.categories,
        action_report: { status: 'Draft' },
        serial_number: value,
      };

  const handlePrev = () => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  };

  const handleNext = () => {
    setCurrentIndex((idx) => Math.min(result.jobs.length - 1, idx + 1));
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2 pr-16 text-sm"
        placeholder="Enter Serial Number"
        disabled={readOnly}
      />

      {value && result.count > 0 && (
        <button
          type="button"
          onClick={handleBadgeClick}
          className="absolute right-2 top-2 flex items-center rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 shadow"
          tabIndex={-1}
        >
          <svg
            className="mr-1 h-4 w-4 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
          </svg>
          <span className="font-bold">{result.count}</span>
        </button>
      )}

      {searching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60">
          <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      <SerialNumberCompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        jobs={result.jobs}
        currentJob={newJob}
        currentIndex={currentIndex}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}