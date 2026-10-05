// resources/js/components/job-orders/JobOrderList.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { FaList } from 'react-icons/fa';
import JobOrderModal from '../modals/JobOrderModal';
import JobOrderOngoingModal from '../modals/JobOrderOngoingModal';
import StatusBadge from '../ui/StatusBadge';
import StatusIndicator from '../ui/StatusIndicator';
import JobOrderForm from './JobOrderForm';
import PendingConfirmation from './PendingConfirmation';
import ConfirmModal from '../modals/ConfirmModal';
import UserPendingConfirmation from '../user/UserPendingConfirmation';
import QueueModal from '../modals/UserQueueModal';

const PER_PAGE = 10;

function isRole(user, roleName) {
  if (!user) return false;
  if (Array.isArray(user.roles)) {
    return user.roles.some(r => (typeof r === 'string' ? r : r.name) === roleName);
  }
  if (typeof user.role === 'string') return user.role === roleName;
  if (typeof user.role === 'object' && user.role?.name) return user.role.name === roleName;
  return false;
}

export default function JobOrderList({
  showNotification,
  isAdmin: isAdminProp,
  isTechnician: isTechnicianProp,
  user: userProp,
}) {
  const [activeTab, setActiveTab] = useState('all');
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({});
  const [totals, setTotals] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOngoingJob, setSelectedOngoingJob] = useState(null);
  const [ongoingModalOpen, setOngoingModalOpen] = useState(false);
  const [closeJobId, setCloseJobId] = useState(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(null);

  const [queueModalOpen, setQueueModalOpen] = useState(false);

  // User queue badge state (non-admin)
  const [userQueuePosition, setUserQueuePosition] = useState(null);
  const [userQueueTotal, setUserQueueTotal] = useState(null);
  const [queueBadgeLoading, setQueueBadgeLoading] = useState(false);

  // Newly-arrived row tracking
  const [newIds, setNewIds] = useState(() => new Set());
  const knownIdsRef = useRef(new Set());
  const newIdsTimerRef = useRef(null);

  // Resolve user
  let user = userProp;
  if (!user) {
    try {
      const userRaw = localStorage.getItem('user');
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch (e) {
      user = null;
    }
  }
  const isAdmin = typeof isAdminProp === 'boolean' ? isAdminProp : isRole(user, 'admin');
  const isTechnician = typeof isTechnicianProp === 'boolean'
    ? isTechnicianProp
    : isRole(user, 'technician');
  const userId = user?.id;

  const fetchUserQueueBadge = useCallback(async () => {
    if (!userId || isAdmin) return;
    setQueueBadgeLoading(true);
    try {
      const res = await axios.get('/queue/user-jobs');
      const rows = res.data?.data || [];

      const positions = rows
        .map(r => r.position)
        .filter(p => typeof p === 'number' && p > 0);

      if (positions.length === 0) {
        setUserQueuePosition(null);
        setUserQueueTotal(null);
        return;
      }

      setUserQueuePosition(Math.min(...positions));
      const anyTotal = rows.find(r => typeof r.total_in_queue === 'number')?.total_in_queue ?? null;
      setUserQueueTotal(anyTotal);
    } catch (e) {
      setUserQueuePosition(null);
      setUserQueueTotal(null);
    } finally {
      setQueueBadgeLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    fetchUserQueueBadge();
  }, [fetchUserQueueBadge, activeTab, search, page, filter]);

  const fetchJobs = useCallback(async (
    searchValue = search,
    pageValue = page,
    filterValue = filter,
    statusValue = statusFilter,
    options = {}
  ) => {
    const { silent = false } = options;
    if (loading && !silent) return;
    if (!silent) setLoading(true);

    try {
      const params = {
        search: searchValue,
        per_page: PER_PAGE,
        page: pageValue,
        conform_filter: filterValue,
      };
      if (statusValue) {
        params.status = statusValue;
      }

      const res = await axios.get('/job-orders', { params });

      const data = res.data.data || [];

      const incomingIds = new Set(data.map(j => j.id));

      if (knownIdsRef.current.size === 0) {
        knownIdsRef.current = incomingIds;
        setNewIds(new Set());
      } else {
        const fresh = new Set();
        data.forEach(j => {
          if (!knownIdsRef.current.has(j.id)) fresh.add(j.id);
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

      setJobs(data);
      setTotals(res.data.totals || {});

      setMeta({
        current_page: res.data.meta?.current_page || 1,
        last_page: res.data.meta?.last_page || 1,
        prev_page_url: res.data.meta?.current_page > 1,
        next_page_url: res.data.meta?.current_page < res.data.meta?.last_page,
      });
    } catch (error) {
      console.error('Failed to fetch job orders:', error);
      setJobs([]);
      setMeta({});
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, page, loading, filter, statusFilter]);

  useEffect(() => {
    fetchJobs(search, page, filter, statusFilter);
  }, [search, page, filter, statusFilter]);

  // 13s silent refresh
  useEffect(() => {
    if (!isAdmin && !isTechnician) return;

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      if (modalOpen || ongoingModalOpen) return;
      fetchJobs(search, page, filter, statusFilter, { silent: true });
    }, 13000);

    return () => clearInterval(intervalId);
  }, [isAdmin, isTechnician, fetchJobs, search, page, filter, statusFilter, modalOpen, ongoingModalOpen]);

  useEffect(() => {
    return () => {
      if (newIdsTimerRef.current) clearTimeout(newIdsTimerRef.current);
    };
  }, []);

  const openModal = (job) => {
    const status = job.action_report?.status;

    if (status === 'Ongoing') {
      setSelectedOngoingJob(job);
      setOngoingModalOpen(true);
    } else {
      setSelectedJob(job);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedJob(null);
  };

  const closeOngoingModal = () => {
    setOngoingModalOpen(false);
    setSelectedOngoingJob(null);
  };

  const handleStatusChange = () => {
    fetchJobs();
  };

  const [statusOptions, setStatusOptions] = useState([]);
  useEffect(() => {
    axios.get('/request-statuses')
      .then(res => {
        if (Array.isArray(res.data)) setStatusOptions(res.data);
        else if (Array.isArray(res.data?.data)) setStatusOptions(res.data.data);
        else setStatusOptions([]);
      })
      .catch(() => setStatusOptions([]));
  }, []);

  const getStatusId = (statusName) => {
    const found = statusOptions.find(s => s.name === statusName);
    return found ? found.id : statusName;
  };

  const handleCloseJob = async (job) => {
    setCloseLoading(true);
    try {
      const statusId = getStatusId('Completed');
      await axios.put(`/job-orders/${job.id}`, {
        status: statusId,
        action_taken: 'Closed',
      });

      showNotification(
        'success',
        'Job Order Closed',
        'The job order has been marked as completed/closed.'
      );
      fetchJobs(search, page);
    } catch (error) {
      showNotification('error', 'Error', 'Failed to close the job order.');
    } finally {
      setCloseLoading(false);
      setCloseJobId(null);
    }
  };

  const pendingCount = totals['Pending'] ?? 0;
  const ongoingCount = totals['Ongoing'] ?? 0;

  const pendingStatusId = statusOptions.find(s => s.name === 'Pending')?.id ?? null;
  const ongoingStatusId = statusOptions.find(s => s.name === 'Ongoing')?.id ?? null;

  const isPendingFilterActive = statusFilter && statusFilter === pendingStatusId;
  const isOngoingFilterActive = statusFilter && statusFilter === ongoingStatusId;

  const toggleStatusFilter = (statusId) => {
    setPage(1);
    setStatusFilter(prev => (prev === statusId ? null : statusId));
  };

  const isNewPendingJob = (job) => {
    if (!isAdmin && !isTechnician) return false;
    if (job?.action_report?.status !== 'Pending') return false;
    const n = job?.notified;
    return n === false || n === 0 || n === '0' || n === null || n === undefined;
  };

  const isJobNew = () => false;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isAdmin ? (
          <div className="mb-4 flex gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Job Orders
            </button>

            <button
              className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Confirmations
            </button>
          </div>
        ) : (
          <div className="mb-4 flex gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600'
              }`}
              onClick={() => setActiveTab('all')}
            >
              My Job Orders
            </button>

            <button
              className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Confirmation
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Orders</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin
                ? 'Monitor, manage, and update all IT job requests'
                : 'Track and monitor your submitted IT requests'}
            </p>
          </div>

          {/* Admin stats — clickable filters + View Queue button */}
          {(isAdmin || isTechnician) && (
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => pendingStatusId && toggleStatusFilter(pendingStatusId)}
                title={isPendingFilterActive ? 'Clear Pending filter' : 'Show only Pending'}
                className={`text-center px-3 py-1.5 rounded-lg transition-all ${
                  isPendingFilterActive
                    ? 'bg-yellow-50 ring-2 ring-yellow-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                </div>
              </button>

              <div className="h-12 w-px bg-gray-300"></div>

              <button
                type="button"
                onClick={() => ongoingStatusId && toggleStatusFilter(ongoingStatusId)}
                title={isOngoingFilterActive ? 'Clear Ongoing filter' : 'Show only Ongoing'}
                className={`text-center px-3 py-1.5 rounded-lg transition-all ${
                  isOngoingFilterActive
                    ? 'bg-blue-50 ring-2 ring-blue-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Ongoing</p>
                    <p className="text-2xl font-bold text-blue-600">{ongoingCount}</p>
                  </div>
                </div>
              </button>

              <div className="h-12 w-px bg-gray-300"></div>

              {/* Staff View Queue button */}
              <button
                type="button"
                onClick={() => setQueueModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                title="View the worklist queue"
              >
                <FaList className="h-4 w-4" />
                View Queue
              </button>
            </div>
          )}

          {!isAdmin && !isTechnician && (
            <button
              onClick={async () => {
                await fetchUserQueueBadge();
                setQueueModalOpen(true);
              }}
              className="relative inline-flex items-center px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-md hover:shadow-lg"
            >
              <FaList className="w-5 h-5 mr-2" />
              <span className="font-semibold">View Queue</span>

              {!queueBadgeLoading && typeof userQueuePosition === 'number' && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-red-600 text-white text-xs font-bold leading-none">
                  {userQueuePosition}
                </span>
              )}
            </button>
          )}
        </div>

        {statusFilter && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <span className="text-sm font-medium text-blue-800">
              Filtered by status:{' '}
              <strong>
                {statusFilter === pendingStatusId
                  ? 'Pending'
                  : statusFilter === ongoingStatusId
                  ? 'Ongoing'
                  : 'Custom'}
              </strong>
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
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by job order number, department, or requester..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="mt-3 sm:mt-0">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-0 sm:ml-2"
            >
              <option value="all">All</option>
              <option value="conformed">Confirmed</option>
              <option value="awaiting">Awaiting Confirmation</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'all' ? (
          <>
            {loading && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Loading job orders...</span>
                </div>
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">No job orders found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria</p>
              </div>
            )}

            {!loading && jobs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Order No.</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categories</th>
                      {isAdmin && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requester</th>
                      )}
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${
                          newIds.has(job.id) ? 'animate-row-in' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isNewPendingJob(job) && (
                              <span className="inline-flex items-center justify-center w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm ring-2 ring-white" title="New pending request" />
                            )}
                            <span className="text-sm font-semibold text-gray-900">{job.job_order_no}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{job.department?.name || '—'}</span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {job.categories?.length > 0 ? (
                              job.categories.map((category, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {category.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400 italic">No categories</span>
                            )}
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{job.requester?.name || '—'}</span>
                          </td>
                        )}

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center space-y-1">
                            <StatusBadge status={job.action_report?.status} />
                            {job.action_report?.status === 'Ongoing' && (
                              <StatusIndicator
                                status={job.action_report?.status}
                                actionReport={job.action_report}
                                requesterId={job.requester?.id}
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openModal(job)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>

                          {(() => {
                            const isOngoing = job.action_report?.status === 'Ongoing';
                            const isConformed = job.action_report?.conformed === true || job.action_report?.conformed === 1;
                            const currentUser = userProp || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null);
                            const isRequester = currentUser?.id === job.requester?.id;
                            const hasReportContent = job.action_report && (
                              !!job.action_report.diagnosis ||
                              !!job.action_report.action_taken ||
                              !!job.action_report.serviced_by ||
                              !!job.action_report.date_started ||
                              !!job.action_report.date_finished ||
                              !!job.action_report.remarks
                            );
                            const isConfirmed = !!(job.action_report?.confirmed_at || job.action_report?.confirmed || job.action_report?.conformed);
                            let showForSubStatus = false;
                            if (isOngoing && hasReportContent && !isConfirmed) {
                              showForSubStatus = true;
                            }
                            if ((isOngoing && (isConformed || showForSubStatus)) && (isAdmin || isTechnician)) {
                              return (
                                <button
                                  onClick={() => setCloseJobId(job.id)}
                                  className="inline-flex items-center px-4 py-2 ml-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                                  disabled={closeLoading}
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {closeLoading && closeJobId === job.id ? 'Closing...' : 'Close'}
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          isAdmin ? (
            <PendingConfirmation
              openModal={openModal}
              isJobNew={isJobNew}
            />
          ) : (
            <UserPendingConfirmation
              isJobNew={isJobNew}
              showNotification={showNotification}
            />
          )
        )}
      </div>

      {!loading && jobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            <button
              disabled={!meta.prev_page_url}
              onClick={() => setPage(p => p - 1)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <span className="text-sm text-gray-700 px-4">
              Page <span className="font-semibold">{meta.current_page || 1}</span> of{' '}
              <span className="font-semibold">{meta.last_page || 1}</span>
            </span>

            <button
              disabled={!meta.next_page_url}
              onClick={() => setPage(p => p + 1)}
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

      {location.pathname === '/create' && (
        <JobOrderForm
          userRole={user?.role}
          showNotification={showNotification}
          refreshJobs={fetchJobs}
        />
      )}

      <JobOrderModal
        isOpen={modalOpen}
        job={selectedJob}
        onClose={closeModal}
        onStatusChange={handleStatusChange}
        showNotification={showNotification}
      />

      <JobOrderOngoingModal
        isOpen={ongoingModalOpen}
        jobId={selectedOngoingJob?.id}
        onClose={closeOngoingModal}
        onStatusChange={handleStatusChange}
        showNotification={showNotification}
        isAdmin={isAdmin}
      />

      <ConfirmModal
        isOpen={!!closeJobId}
        title="Close Job Order"
        message="Are you sure you want to close this job order? This will mark it as completed and closed."
        confirmText="Yes, Close"
        cancelText="Cancel"
        tone="danger"
        loading={closeLoading}
        onConfirm={() => {
          const job = jobs.find(j => j.id === closeJobId);
          if (job) handleCloseJob(job);
        }}
        onCancel={() => setCloseJobId(null)}
      />

      <QueueModal
        isOpen={queueModalOpen}
        onClose={() => setQueueModalOpen(false)}
        user={user}
        showNotification={showNotification}
        viewerIsStaff={isAdmin || isTechnician}
      />
    </div>
  );
}