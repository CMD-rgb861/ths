import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaList } from 'react-icons/fa';
import WIPURNavigationPanel from '../WIPURNavigationPanel';
import SubstatusHelper from '../SubstatusHelper';
import JobRequestsDetailsModal from '../../../components/modals/WebsiteInformation/User/WIPURJobRequestsDetailsModal';
import RequestQueueModal from '../../../components/modals/WebsiteInformation/User/WIPURRequestQueueModal';

const PER_PAGE = 10;

const STATUS_STYLES = {
  Pending:   { dot: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-400', bg: 'bg-yellow-50' },
  Ongoing:   { dot: 'bg-blue-500',   text: 'text-blue-600',   ring: 'ring-blue-400',   bg: 'bg-blue-50' },
  Completed: { dot: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-400', bg: 'bg-emerald-50' },
  Cancelled: { dot: 'bg-rose-500',    text: 'text-rose-600',    ring: 'ring-rose-400',    bg: 'bg-rose-50' },
};

function CountBadge({ count, active }) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold leading-none ${
        active
          ? 'bg-white text-blue-700 ring-1 ring-blue-200'
          : 'bg-blue-600 text-white'
      }`}
      aria-label={`${count} item${count === 1 ? '' : 's'}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function DashboardPage() {
  // ── Filter / paging state ───────────────────────────────────
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(null); // 'Pending' | 'Ongoing' | null

  // ── Data state ──────────────────────────────────────────────
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    Pending: 0,
    Ongoing: 0,
  });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(false);

  // ── Modal state ─────────────────────────────────────────────
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // ── Row highlight for newly-arrived rows ────────────────────
  const [newIds, setNewIds] = useState(() => new Set());
  const knownIdsRef = useRef(new Set());
  const newIdsTimerRef = useRef(null);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchRows = useCallback(
    async (searchValue, pageValue, statusValue, options = {}) => {
      const { silent = false } = options;
      if (!silent) setLoading(true);

      try {
        const params = { per_page: PER_PAGE, page: pageValue };
        if (searchValue.trim()) params.search = searchValue.trim();
        if (statusValue) params.status = statusValue;

        const res = await axios.get('/api/website-information/my-requests', { params });
        const data = res.data?.data || [];

        const incomingIds = new Set(data.map((r) => r.id));
        if (knownIdsRef.current.size === 0) {
          knownIdsRef.current = incomingIds;
          setNewIds(new Set());
        } else {
          const fresh = new Set();
          data.forEach((r) => {
            if (!knownIdsRef.current.has(r.id)) fresh.add(r.id);
          });
          knownIdsRef.current = incomingIds;

          if (fresh.size > 0) {
            setNewIds(fresh);
            if (newIdsTimerRef.current) clearTimeout(newIdsTimerRef.current);
            newIdsTimerRef.current = setTimeout(() => {
              setNewIds(new Set());
              newIdsTimerRef.current = null;
            }, 2000);
          }
        }

        setRows(data);
        setCounts(
          res.data?.counts || {
            all: 0,
            Pending: 0,
            Ongoing: 0,
          }
        );
        setMeta({
          current_page: res.data?.meta?.current_page || 1,
          last_page: res.data?.meta?.last_page || 1,
        });
      } catch (err) {
        let message = 'Failed to load your requests.';
        if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || message;
        }
        toast.error(message);
        setRows([]);
        setMeta({ current_page: 1, last_page: 1 });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRows(search, page, statusFilter);
  }, [fetchRows, search, page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Silent refresh every 13s
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      fetchRows(search, page, statusFilter, { silent: true });
    }, 13000);
    return () => clearInterval(id);
  }, [fetchRows, search, page, statusFilter]);

  // Cleanup highlight timer
  useEffect(() => {
    return () => {
      if (newIdsTimerRef.current) clearTimeout(newIdsTimerRef.current);
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────
  const toggleStatusFilter = (status) => {
    setPage(1);
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const handleViewDetails = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const pendingCount = counts?.Pending ?? 0;
  const ongoingCount = counts?.Ongoing ?? 0;
  const myRequestsCount = counts?.all ?? 0;

  const isPendingFilterActive = statusFilter === 'Pending';
  const isOngoingFilterActive = statusFilter === 'Ongoing';

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WIPURNavigationPanel />

      <main className="flex-1 bg-gray-50">
        <div className="px-6 sm:px-8 lg:px-12 py-8 space-y-6">
          
          {/* HEADER CARD */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4 flex gap-2">
              <button
                className="inline-flex items-center px-4 py-2 rounded-t-lg font-semibold border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                type="button"
              >
                My Requests
                <CountBadge count={myRequestsCount} active />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Website Information Requests
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Track and monitor your submitted website information requests
                </p>
              </div>

              {/* Stats & Queue Button Container */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => toggleStatusFilter('Pending')}
                  title={isPendingFilterActive ? 'Clear Pending filter' : 'Show only Pending'}
                  className={`text-center px-3 py-1.5 rounded-lg transition-all ${
                    isPendingFilterActive ? `${STATUS_STYLES.Pending.bg} ring-2 ${STATUS_STYLES.Pending.ring}` : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${STATUS_STYLES.Pending.dot}`} />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                      <p className={`text-2xl font-bold ${STATUS_STYLES.Pending.text}`}>{pendingCount}</p>
                    </div>
                  </div>
                </button>

                <div className="h-12 w-px bg-gray-300" />

                <button
                  type="button"
                  onClick={() => toggleStatusFilter('Ongoing')}
                  title={isOngoingFilterActive ? 'Clear Ongoing filter' : 'Show only Ongoing'}
                  className={`text-center px-3 py-1.5 rounded-lg transition-all ${
                    isOngoingFilterActive ? `${STATUS_STYLES.Ongoing.bg} ring-2 ${STATUS_STYLES.Ongoing.ring}` : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${STATUS_STYLES.Ongoing.dot}`} />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ongoing</p>
                      <p className={`text-2xl font-bold ${STATUS_STYLES.Ongoing.text}`}>{ongoingCount}</p>
                    </div>
                  </div>
                </button>

                <div className="h-12 w-px bg-gray-300" />

                {/* View Queue Button */}
                <button
                  type="button"
                  onClick={() => setIsQueueOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <FaList className="h-4 w-4 text-blue-600" />
                  View Queue
                </button>
              </div>
            </div>

            {statusFilter && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <span className="text-sm font-medium text-blue-800">
                  Filtered by status: <strong>{statusFilter}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => { setStatusFilter(null); setPage(1); }}
                  className="ml-auto text-xs font-semibold text-blue-700 underline hover:text-blue-900"
                >
                  Clear filter
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by control number, purpose, or location..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium">Loading requests...</span>
                </div>
              </div>
            )}

            {!loading && rows.length === 0 && (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">No requests found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria</p>
              </div>
            )}

            {!loading && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Control Number</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Requested</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${newIds.has(row.id) ? 'animate-row-in' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{row.control_number}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{row.department || '—'}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{row.date_requested_human || row.date_requested || '—'}</span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <SubstatusHelper status={row.status} subStatus={row.sub_status} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleViewDetails(row)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {!loading && rows.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <span className="text-sm text-gray-700 px-4">
                  Page <span className="font-semibold">{meta.current_page}</span> of{' '}
                  <span className="font-semibold">{meta.last_page}</span>
                </span>

                <button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <JobRequestsDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onCancelled={() => {
          fetchRows(search, page, statusFilter);
        }}
      />

      <RequestQueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />
    </div>
  );
}