import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import axios from 'axios';

/* ------------------------------------------------------------------ */
/* Status tone mapping                                                 */
/* ------------------------------------------------------------------ */
const STATUS_TONES = {
  Completed:      'border-emerald-200 bg-emerald-50 text-emerald-700',
  Ongoing:        'border-blue-200    bg-blue-50    text-blue-700',
  Pending:        'border-amber-200   bg-amber-50   text-amber-700',
  Cancelled:      'border-rose-200    bg-rose-50    text-rose-700',
  Unserviceable:  'border-orange-200  bg-orange-50  text-orange-700',
  Draft:          'border-gray-200    bg-gray-100   text-gray-600',
};

const statusTone = (status) =>
  STATUS_TONES[status] || 'border-gray-200 bg-gray-50 text-gray-700';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */
const InfoField = memo(function InfoField({ label, value, strong = false, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white px-3 py-2.5 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </div>
      <div
        className={`mt-1 break-words ${
          strong ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-700'
        }`}
      >
        {value === null || value === undefined || value === '' ? '—' : value}
      </div>
    </div>
  );
});

const Section = memo(function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-600">
        {title}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
});

const StatusPill = memo(function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
        status
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || '—'}
    </span>
  );
});

/* ------------------------------------------------------------------ */
/* Compare card                                                        */
/* ------------------------------------------------------------------ */
const CompareCard = memo(function CompareCard({
  badge,
  badgeTone = 'blue',
  title,
  job,
  emptyText,
  isHistory = false,
  historyIndex = 0,
  historyTotal = 0,
}) {
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const categories = (job?.categories || []).map((c) => c?.name).filter(Boolean);

  const badgeClasses =
    badgeTone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

  // Keep dot count manageable
  const maxDots = 10;
  const dotCount = Math.min(historyTotal, maxDots);
  const showOverflow = historyTotal > maxDots;

  return (
    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      {/* Header: badge left, status pill right */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}
          >
            {badge}
          </div>
          <h2 className="mt-2 truncate text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {job ? <StatusPill status={job?.action_report?.status || job?.status} /> : null}
      </div>

      {/* History pager hint */}
      {isHistory && historyTotal > 1 && (
        <div className="border-b border-amber-100 bg-amber-50/60 px-5 py-2.5">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-amber-800">
            <span>
              Record <span className="font-bold">{historyIndex + 1}</span> of{' '}
              <span className="font-bold">{historyTotal}</span>
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: dotCount }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === historyIndex ? 'w-4 bg-amber-500' : 'w-1.5 bg-amber-300'
                  }`}
                />
              ))}
              {showOverflow && (
                <span className="ml-1 text-[10px] font-semibold text-amber-700">
                  +{historyTotal - maxDots}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-h-[62vh] flex-1 overflow-y-auto p-5">
        {!job ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-4">
            <Section title="Summary">
              <InfoField label="Job Order No" value={job?.job_order_no} strong />
              <InfoField
                label="Serial Number"
                value={job?.action_report?.serial_number || job?.serial_number}
                strong
              />
              <InfoField label="Department" value={job?.department?.name} />
              <InfoField label="Requester" value={job?.requester?.name} />
              <InfoField
                label="Categories"
                value={categories.length ? categories.join(', ') : '—'}
                className="sm:col-span-2"
              />
              <InfoField
                label="Request Description"
                value={job?.request_description}
                className="sm:col-span-2"
              />
            </Section>

            <Section title="Timeline">
              <InfoField label="Date Created" value={formatDate(job?.created_at)} />
              <InfoField
                label="Date Started"
                value={formatDate(job?.action_report?.date_started)}
              />
              <InfoField
                label="Date Finished"
                value={formatDate(job?.action_report?.date_finished)}
              />
            </Section>

            <Section title="Work Details">
              <InfoField
                label="Diagnosis"
                value={job?.action_report?.diagnosis}
                className="sm:col-span-2"
              />
              <InfoField label="Action Taken" value={job?.action_report?.action_taken} />
              <InfoField label="Remarks" value={job?.action_report?.remarks} />
            </Section>

            <Section title="Asset / Software Details">
              <InfoField label="Brand Name" value={job?.action_report?.brand_name} />
              <InfoField label="Brand Model" value={job?.action_report?.brand_model} />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Compare modal                                                       */
/* ------------------------------------------------------------------ */
const SerialNumberCompareModal = memo(function SerialNumberCompareModal({
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/45 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating close button (outside card, like before, but more visible) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          title="Close"
          className="absolute -right-3 -top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Pill header */}
        <div className="mb-5 flex justify-center">
          <div className="rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-gray-800">
              Comparing previous history {jobs.length > 0 ? currentIndex + 1 : 0} of {jobs.length}
            </span>
          </div>
        </div>

        {/* Cards + arrows */}
        <div className="flex items-stretch justify-center gap-5 lg:gap-7">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="hidden self-center h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
            aria-label="Previous"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <CompareCard
            badge={`History ${jobs.length > 0 ? currentIndex + 1 : 0} of ${jobs.length}`}
            badgeTone="amber"
            title="OLD JOB ORDER"
            job={oldJob}
            emptyText="No old job order data available."
            isHistory
            historyIndex={currentIndex}
            historyTotal={jobs.length}
          />

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="hidden self-center h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
            aria-label="Next"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <CompareCard
            badge="Current Entry"
            badgeTone="blue"
            title="NEW JOB ORDER"
            job={currentJob}
            emptyText="No current job order data available."
          />
        </div>

        {/* Mobile pager */}
        <div className="mt-5 flex items-center justify-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="inline-flex h-10 min-w-[110px] items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-xs font-semibold text-gray-500">
            {jobs.length > 0 ? currentIndex + 1 : 0} / {jobs.length}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex h-10 min-w-[110px] items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function SerialNumberSearch({ value, onChange, readOnly, currentJob }) {
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState({ count: 0, jobs: [] });
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const debounceRef = useRef(null);

  const currentJobId = currentJob?.id;
  const trimmedValue = (value || '').trim();

  useEffect(() => {
    const trimmed = (value || '').trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed === '' || trimmed.length < 4) {
      setResult({ count: 0, jobs: [] });
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    debounceRef.current = setTimeout(() => {
      axios
        .get('/serial-number/search', {
          params: {
            serial_number: trimmed,
            ...(currentJobId ? { exclude_job_id: currentJobId } : {}),
          },
          signal: controller.signal,
        })
        .then((res) => {
          const data = res?.data || {};
          setResult({
            count: typeof data.count === 'number' ? data.count : 0,
            jobs: Array.isArray(data.jobs) ? data.jobs : [],
          });
        })
        .catch((error) => {
          if (
            error?.name === 'CanceledError' ||
            error?.code === 'ERR_CANCELED' ||
            error?.message === 'canceled'
          ) {
            return;
          }
          setResult({ count: 0, jobs: [] });
        })
        .finally(() => setSearching(false));
    }, 600);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [value, currentJobId]);

  const handleBadgeClick = useCallback(() => {
    setCurrentIndex(0);
    setCompareModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setCompareModalOpen(false);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((idx) =>
      Math.min((result.jobs?.length || 1) - 1, idx + 1)
    );
  }, [result.jobs.length]);

  const showHistoryBadge = useMemo(
    () =>
      Boolean(trimmedValue) &&
      result.count > 0 &&
      Array.isArray(result.jobs) &&
      result.jobs.length > 0,
    [trimmedValue, result.count, result.jobs]
  );

  const newJob = useMemo(() => {
    if (currentJob) {
      return {
        ...currentJob,
        action_report: {
          ...(currentJob.action_report || {}),
          serial_number:
            trimmedValue || currentJob?.action_report?.serial_number || '',
        },
      };
    }
    return {
      job_order_no: 'New (unsaved)',
      department: result.jobs[0]?.department,
      requester: result.jobs[0]?.requester,
      categories: result.jobs[0]?.categories,
      action_report: { status: 'Draft', serial_number: trimmedValue },
    };
  }, [currentJob, trimmedValue, result.jobs]);

  const jobsForModal = useMemo(
    () => (Array.isArray(result.jobs) ? result.jobs : []),
    [result.jobs]
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-20 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
        placeholder="Enter Serial Number"
        disabled={readOnly}
      />

      {showHistoryBadge && (
        <button
          type="button"
          onClick={handleBadgeClick}
          title={`${result.count} previous record(s) found — click to compare`}
          className="group absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 hover:shadow"
        >
          <svg
            className="h-3.5 w-3.5 text-amber-500 transition group-hover:text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 2" />
          </svg>
          <span>{result.count}</span>
        </button>
      )}

      {searching && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
          <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
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
        onClose={handleCloseModal}
        jobs={jobsForModal}
        currentJob={newJob}
        currentIndex={currentIndex}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}