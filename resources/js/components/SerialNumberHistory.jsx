import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusIndicator from './ui/StatusIndicator';

const CATEGORY_FILTERS = ['Computer Desktop', 'Laptop', 'Printer'];

const STATUS_BADGE_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Cancelled by User': 'bg-red-100 text-red-800',
  Unserviceable: 'bg-gray-200 text-gray-800',
};

function SerialNumberDetailModal({ isOpen, job, onClose }) {
  if (!isOpen || !job) return null;

  const displayValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string' && value.trim() === '') return '—';
    return value;
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

  const InfoField = ({ label, value, strong = false, className = '' }) => (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${className}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-2 break-words leading-relaxed ${
          strong ? 'text-[15px] font-semibold text-slate-900' : 'text-[15px] text-slate-700'
        }`}
      >
        {displayValue(value)}
      </div>
    </div>
  );

  const Section = ({ title, children, gridClassName = 'grid-cols-1 sm:grid-cols-2' }) => (
    <section className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-1.5 rounded-full bg-blue-500" />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            {title}
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${gridClassName}`}>{children}</div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-4xl">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <div className="relative border-b border-slate-200 bg-white">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-blue-50/70" />

            <div className="relative flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
                    Serial Number Detail
                  </span>
                </div>

                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                  <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                    {displayValue(job?.job_order_no)}
                  </h2>
                  <span className="text-sm font-medium text-slate-500">Job Order Record</span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Serial Number
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {displayValue(job?.action_report?.serial_number)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Requester
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {displayValue(job?.requester?.name)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Department
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {displayValue(job?.department?.name)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              <Section title="Summary">
                <InfoField label="Job Order No" value={job?.job_order_no} strong />
                <InfoField label="Serial Number" value={job?.action_report?.serial_number} strong />
                <InfoField label="Department" value={job?.department?.name} />
                <InfoField label="Requester" value={job?.requester?.name} />
                <InfoField
                  label="Categories"
                  value={job?.categories?.map((c) => c.name).join(', ') || '—'}
                  className="sm:col-span-2"
                />
              </Section>

              <Section title="Timeline" gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SerialNumberHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [detailModalJob, setDetailModalJob] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    axios
      .get('/job-orders', { params: { per_page: 1000, history: true } })
      .then((res) => {
        setJobs(Array.isArray(res.data?.data) ? res.data.data : []);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  // Reset to first page on filter/search
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  const filtered = jobs.filter((job) => {
    const ar = job.action_report;

    if (!ar || !ar.serial_number) return false;

    if (category) {
      const cats = job.categories?.map((c) => c.name) || [];
      if (!cats.includes(category)) return false;
    }

    if (search && !ar.serial_number.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  // Pagination logic
  const pageCount = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const getRequestStatus = (job) => {
    if (
      (job.request_status?.name === 'Cancelled' || job.action_report?.status === 'Cancelled') &&
      job.action_report?.cancelled_by &&
      job.requester &&
      ((typeof job.action_report.cancelled_by === 'object'
        ? job.action_report.cancelled_by.id
        : job.action_report.cancelled_by) === job.requester.id)
    ) {
      return 'Cancelled by User';
    }

    if (job.request_status?.name) return job.request_status.name;
    if (typeof job.status === 'string') return job.status;
    if (job.action_report?.status) return job.action_report.status;

    return '—';
  };

  const getStatusBadgeClass = (status) =>
    STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-700';

  const exportCsv = () => {
    window.location.href = '/job-orders/export/csv?type=serial-history';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Serial Number History</h1>
            <p className="mt-1 text-gray-600">
              View the history of serial numbers from past job orders. Filter by device type or
              search by serial number.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:flex-row">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
            Device Type
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {CATEGORY_FILTERS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
            Serial Number
          </label>
          <input
            type="text"
            placeholder="Search serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Job Order No.
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Device Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Serial Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Brand
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Model
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900">
                Date
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-900">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-900">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              paginated.map((job) => {
                const ar = job.action_report;
                const cats = job.categories?.map((c) => c.name).join(', ') || '';
                const reqStatus = getRequestStatus(job);

                return (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {job.job_order_no}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{cats}</td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {ar.serial_number}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {ar.brand_name || '—'}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {ar.brand_model || '—'}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US') : '—'}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            reqStatus
                          )}`}
                        >
                          {reqStatus}
                        </span>

                        {reqStatus === 'Ongoing' && (
                          <div className="mt-1">
                            <StatusIndicator
                              status={ar.status}
                              actionReport={ar}
                              requesterId={job.requester?.id}
                            />
                          </div>
                        )}

                        {(reqStatus === 'Cancelled' || reqStatus === 'Cancelled by User') &&
                          ar.remarks && (
                            <div className="mt-1 text-xs text-gray-500">Reason: {ar.remarks}</div>
                          )}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <button
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => setDetailModalJob(job)}
                      >
                        <svg
                          className="mr-1.5 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Always show pagination controls */}
      <div className="flex justify-center items-center gap-6 mt-4">
        <button
          className="flex items-center px-4 py-2 rounded border text-sm font-medium disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <span className="mr-2">&lt;</span> Previous
        </button>
        <span className="text-sm font-medium">
          Page {pageCount === 0 ? 0 : currentPage} of {pageCount === 0 ? 1 : pageCount}
        </span>
        <button
          className="flex items-center px-4 py-2 rounded border text-sm font-medium disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
          disabled={currentPage === pageCount || pageCount === 0}
        >
          Next <span className="ml-2">&gt;</span>
        </button>
      </div>
      <SerialNumberDetailModal
        isOpen={!!detailModalJob}
        job={detailModalJob}
        onClose={() => setDetailModalJob(null)}
      />
    </div>
  );
}