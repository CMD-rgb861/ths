import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function SerialNumberCompareModal({ isOpen, onClose, jobs = [], currentJob, currentIndex, onPrev, onNext }) {
  if (!isOpen) return null;

  const oldJob = jobs[currentIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-2xl text-gray-700 hover:text-black"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="flex flex-row items-center justify-center w-full gap-8">
          {/* Left Arrow */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 text-2xl bg-white hover:bg-gray-100"
            tabIndex={-1}
            onClick={onPrev}
            disabled={currentIndex === 0}
            aria-label="Previous"
          >
            <span>&#x276E;</span>
          </button>
          {/* Old Job Order */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex-1 max-w-md flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-6 text-center">OLD JOB ORDER</h2>
            {oldJob ? (
              <div className="space-y-3 text-center">
                <div>Job Order No: <b>{oldJob.job_order_no}</b></div>
                <div>Department: {oldJob.department?.name || '—'}</div>
                <div>Requester: {oldJob.requester?.name || '—'}</div>
                <div>Categories: {(oldJob.categories || []).map(c => c.name).join(', ')}</div>
                <div>Status: {oldJob.action_report?.status || oldJob.status || '—'}</div>
              </div>
            ) : (
              <div className="text-gray-400">No data</div>
            )}
          </div>
          {/* Right Arrow */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 text-2xl bg-white hover:bg-gray-100"
            tabIndex={-1}
            onClick={onNext}
            disabled={currentIndex === jobs.length - 1}
            aria-label="Next"
          >
            <span>&#x276F;</span>
          </button>
          {/* New Job Order */}
          <div className="bg-white rounded-lg shadow-lg p-8 flex-1 max-w-md flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-6 text-center">NEW JOB ORDER</h2>
            {currentJob ? (
              <div className="space-y-3 text-center">
                <div>Job Order No: <b>{currentJob.job_order_no || 'New (unsaved)'}</b></div>
                <div>Department: {currentJob.department?.name || '—'}</div>
                <div>Requester: {currentJob.requester?.name || '—'}</div>
                <div>Categories: {(currentJob.categories || []).map(c => c.name).join(', ')}</div>
                <div>Status: {currentJob.action_report?.status || 'Draft'}</div>
              </div>
            ) : (
              <div className="text-gray-400">No data</div>
            )}
          </div>
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
        .then(res => setResult(res.data))
        .catch(() => setResult({ count: 0, jobs: [] }))
        .finally(() => setSearching(false));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // When badge is clicked, open compare modal with the latest job as "old"
  const handleBadgeClick = () => {
    if (result.jobs.length > 0) {
      setCurrentIndex(0);
      setCompareModalOpen(true);
    }
  };

  // The current job (right card) is passed as prop, fallback to minimal info if not provided
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

  // Navigation handlers
  const handlePrev = () => {
    setCurrentIndex(idx => Math.max(0, idx - 1));
  };
  const handleNext = () => {
    setCurrentIndex(idx => Math.min(result.jobs.length - 1, idx + 1));
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm pr-16"
        placeholder="Enter Serial Number"
        disabled={readOnly}
      />
      {/* Badge with clock icon and number */}
      {value && result.count > 0 && (
        <button
          type="button"
          onClick={handleBadgeClick}
          className="absolute right-2 top-2 flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-300 shadow"
          tabIndex={-1}
        >
          {/* Clock icon */}
          <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
          </svg>
          <span className="font-bold">{result.count}</span>
        </button>
      )}
      {/* Blur overlay while searching */}
      {searching && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg z-10">
          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      {/* Compare Modal */}
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

