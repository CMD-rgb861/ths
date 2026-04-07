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

  const getSerialNumber = (job) =>
    job?.action_report?.serial_number || job?.serial_number || '—';

  const getCategoriesText = (job) => {
    const names = (job?.categories || []).map((c) => c?.name).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  };

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

  const displayValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string' && value.trim() === '') return '—';
    return value;
  };

  const StatusBadge = ({ value, tone = 'blue' }) => {
    const classes =
      tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-blue-200 bg-blue-50 text-blue-700';

    return (
      <span
        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
      >
        {value || '—'}
      </span>
    );
  };

  const InfoField = ({ label, value, strong = false, className = '' }) => (
    <div className={`rounded-lg border border-gray-200 bg-white px-3 py-2.5 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </div>
      <div
        className={`mt-1 break-words ${
          strong ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-700'
        }`}
      >
        {displayValue(value)}
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-600">
        {title}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );

  const CompareCard = ({
    badge,
    badgeTone = 'blue',
    title,
    job,
    emptyText,
    statusTone = 'blue',
    showHistoryHint = false,
  }) => (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                badgeTone === 'amber'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              {badge}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">{title}</h2>
          </div>

          {job ? <StatusBadge value={getStatusText(job)} tone={statusTone} /> : null}
        </div>

        {showHistoryHint && jobs.length > 1 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-amber-800">
              <span>
                Record {currentIndex + 1} of {jobs.length}
              </span>
              <span className="text-amber-700">Use arrows to browse</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              {jobs.map((_, idx) => (
                <span
                  key={idx}
                  className={`rounded-full transition-all ${
                    idx === currentIndex ? 'h-2 w-5 bg-amber-500' : 'h-2 w-2 bg-amber-300/70'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-5">
        {!job ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-4">
            <Section title="Summary">
              <InfoField label="Job Order No" value={job?.job_order_no} strong />
              <InfoField label="Serial Number" value={getSerialNumber(job)} strong />
              <InfoField label="Department" value={job?.department?.name} />
              <InfoField label="Requester" value={job?.requester?.name} />
              <InfoField
                label="Categories"
                value={getCategoriesText(job)}
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
              <InfoField
                label="Software Name"
                value={job?.action_report?.software_name}
                className="sm:col-span-2"
              />
            </Section>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="relative w-full max-w-6xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-1 top-0 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full text-3xl text-gray-700 transition hover:bg-white/70 hover:text-black"
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="mb-5 flex justify-center">
          <div className="rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-gray-800">
              Comparing previous history {jobs.length > 0 ? currentIndex + 1 : 0} of {jobs.length}
            </span>
          </div>
        </div>

        <div className="flex items-stretch justify-center gap-5 lg:gap-7">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="hidden self-center h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-2xl text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
            aria-label="Previous"
          >
            &#x276E;
          </button>

          <CompareCard
            badge={`History ${jobs.length > 0 ? currentIndex + 1 : 0} of ${jobs.length}`}
            badgeTone="amber"
            title="OLD JOB ORDER"
            job={oldJob}
            emptyText="No old job order data available."
            statusTone="amber"
            showHistoryHint
          />

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="hidden self-center h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-2xl text-gray-800 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
            aria-label="Next"
          >
            &#x276F;
          </button>

          <CompareCard
            badge="Current Entry"
            badgeTone="blue"
            title="NEW JOB ORDER"
            job={currentJob}
            emptyText="No current job order data available."
            statusTone="blue"
          />
        </div>

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
  const debounceRef = useRef(null);

  // Get current job id if available
  const currentJobId = currentJob?.id;

  useEffect(() => {
    const trimmed = (value || '').trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

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
        .then((res) => setResult(res.data))
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
        .finally(() => {
          setSearching(false);
        });
    }, 600);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [value, currentJobId]);

  const handleBadgeClick = () => {
    if (result.jobs.length > 0) {
      setCurrentIndex(0);
      setCompareModalOpen(true);
    }
  };

  const trimmedValue = (value || '').trim();

  // Only show badge if there are OTHER jobs (not just the current job)
  const showHistoryBadge = trimmedValue && result.count > 0 && result.jobs.length > 0;

  const newJob = currentJob
    ? currentJob
    : {
        job_order_no: 'New (unsaved)',
        department: result.jobs[0]?.department,
        requester: result.jobs[0]?.requester,
        categories: result.jobs[0]?.categories,
        action_report: {
          status: 'Draft',
          serial_number: trimmedValue,
        },
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

      {showHistoryBadge && (
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
        onPrev={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
        onNext={() => setCurrentIndex((idx) => Math.min(result.jobs.length - 1, idx + 1))}
      />
    </div>
  );
}