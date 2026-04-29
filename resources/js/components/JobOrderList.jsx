import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import JobOrderModal from './JobOrderModal';
import JobOrderOngoingModal from './JobOrderOngoingModal';
import StatusBadge from './ui/StatusBadge';
import StatusIndicator from './ui/StatusIndicator';
import JobOrderForm from './JobOrderForm';
import NewJobOrdersModal from './NewJobOrdersModal';
import ConfirmModal from './ConfirmModal'; // If not already imported

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

export default function JobOrderList({ showNotification, setNewPendingJobs, newPendingJobs, isAdmin: isAdminProp, isTechnician: isTechnicianProp, user: userProp }) {
  const location = useLocation();
  
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOngoingJob, setSelectedOngoingJob] = useState(null);
  const [ongoingModalOpen, setOngoingModalOpen] = useState(false);
  const [isNewJobsModalOpen, setIsNewJobsModalOpen] = useState(false);
  const [closeJobId, setCloseJobId] = useState(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'conformed', 'awaiting'

  // Use props if provided, otherwise fallback to localStorage
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
  const isTechnician = isRole(user, 'technician');
  const userId = user?.id;

  // Fetch job orders with filters
  const fetchJobs = useCallback(async (searchValue = search, pageValue = page, filterValue = filter) => {
    if (loading) return;

    setLoading(true);

    try {
      let params = {
        search: searchValue,
        per_page: PER_PAGE,
        page: pageValue,
        conform_filter: filterValue // Only send filter to backend
      };
      // Removed: any client-side filtering for status/conformed/awaiting
      const res = await axios.get('/job-orders', { params });

      let data = res.data.data || [];

      setJobs(data);

      setMeta({
        current_page: res.data.meta?.current_page || 1,
        last_page: res.data.meta?.last_page || 1,
        prev_page_url: res.data.meta?.current_page > 1,
        next_page_url: res.data.meta?.current_page < res.data.meta?.last_page
      });

      // Always update newPendingJobs from backend data (admin only)
      if (isAdmin) {
        const currentPendingJobs = data.filter(
          job => job.action_report?.status === 'Pending' && !job.notified
        );
        setNewPendingJobs(currentPendingJobs);
      }
    } catch (error) {
      console.error("Failed to fetch job orders:", error);
      setJobs([]);
      setMeta({});
      if (isAdmin) setNewPendingJobs([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, loading, isAdmin, isTechnician, userId, setNewPendingJobs, filter]);

  // Load jobs when search, page, or filter changes
  useEffect(() => {
    fetchJobs(search, page, filter);
  }, [search, page, filter]);

  // Modal handlers
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

  const handleStatusChange = (updatedJob = null, wasAccepted = false) => {
    if (wasAccepted && updatedJob) {
      setNewPendingJobs(prev => prev.filter(job => job.id !== updatedJob.id));
    }
    
    fetchJobs();
  };

  // Helper to get status id for "Completed"
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

  // --- CLOSE JOB LOGIC ---
  const handleCloseJob = async (job) => {
    setCloseLoading(true);
    try {
      // Check if we should preserve the current service status (Unserviceable with/without Form + conformed)
      const keepServiceStatus =
        (job.action_report?.conformed === true || job.action_report?.conformed === 1) &&
        (job.action_report?.action_taken === 'Unserviceable with Form'); 
        // ||
        //  job.action_report?.action_taken === 'Unserviceable without Form');

      // 1. Update action report: set action_taken = "Closed" (ONLY if we don't want to preserve)
      if (!keepServiceStatus) {
        await axios.put(`/job-orders/${job.id}/action-report`, {
          action_taken: 'Closed',
        });
      }

      // 2. Update job order: set status = Completed
      const statusId = getStatusId('Completed');
      await axios.put(`/job-orders/${job.id}`, {
        status: statusId,
        action_taken: 'Closed', // backend will decide whether to keep or overwrite action_taken
      });

      showNotification(
        'success',
        'Job Order Closed',
        'The job order has been marked as completed/closed.'
      );
      // Refresh jobs
      fetchJobs(search, page);
    } catch (error) {
      showNotification(
        'error',
        'Error',
        'Failed to close the job order.'
      );
    } finally {
      setCloseLoading(false);
      setCloseJobId(null);
    }
  };

  // Calculated counts (admin only)
  const pendingCount = jobs.filter(
    job => job.action_report?.status === 'Pending'
  ).length;

  const ongoingCount = jobs.filter(
    job => job.action_report?.status === 'Ongoing'
  ).length;

  // New jobs notification handlers
  const handleBellClick = () => {
    setIsNewJobsModalOpen(true);
  };

  const handleNewJobsModalClose = () => {
    setIsNewJobsModalOpen(false);
    // Do NOT mark as notified here!
  };

  const handleMarkAllViewed = () => {
    const jobIds = newPendingJobs.map(job => job.id);

    axios.post('/job-orders/mark-pending-notified', { jobs: jobIds })
      .then(() => {
        setNewPendingJobs([]);
        setIsNewJobsModalOpen(false);
        fetchJobs(search, page); // Refresh jobs to update notified state
      })
      .catch(error => {
        console.error('Error marking jobs as notified:', error);
      });
  };

  const isJobNew = (jobId) => {
    return newPendingJobs.some(job => job.id === jobId);
  };

  const handleViewFromNotification = (job) => {
    setIsNewJobsModalOpen(false);

    if (job.action_report?.status === 'Ongoing') {
      setSelectedOngoingJob(job);
      setOngoingModalOpen(true);
    } else {
      setSelectedJob(job);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Orders</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin
                ? 'Monitor, manage, and update all IT job requests'
                : 'Track and monitor your submitted IT requests'}
            </p>
          </div>
          
          {/* Admin Summary Stats - Inline */}
          {isAdmin && (
            <div className="flex items-center space-x-6">
              <div className="text-center relative">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                </div>
                
                {newPendingJobs.length > 0 && (
                  <button
                    onClick={handleBellClick}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg animate-pulse"
                  >
                    <FaBell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-red-700 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                      {newPendingJobs.length}
                    </span>
                  </button>
                )}
              </div>
              
              <div className="h-12 w-px bg-gray-300"></div>
              
              <div className="text-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Ongoing</p>
                    <p className="text-2xl font-bold text-blue-600">{ongoingCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar and Filter */}
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
          {/* Filter Dropdown */}
          <div className="mt-3 sm:mt-0">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-0 sm:ml-2"
            >
              <option value="all">All</option>
              <option value="conformed">Conformed</option>
              <option value="awaiting">Awaiting Confirmation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Job Order No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Categories
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Requester
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {isJobNew(job.id) && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                          </span>
                        )}
                        <span className="text-sm font-semibold text-gray-900">{job.job_order_no}</span>
                        {isJobNew(job.id) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            NEW
                          </span>
                        )}
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
                      {/* --- Show Close button if conformed is true and status is Ongoing, or substatus is 'Waiting for confirmation', and user is admin/technician --- */}
                      {(() => {
                        const isOngoing = job.action_report?.status === 'Ongoing';
                        const isConformed = job.action_report?.conformed === true || job.action_report?.conformed === 1;
                        // Substatus logic: mimic StatusIndicator logic
                        const user = userProp || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null);
                        const isRequester = user?.id === job.requester?.id;
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
                          // Substatus string as in StatusIndicator
                          const subStatus = isRequester ? 'Waiting for your confirmation' : 'Waiting for confirmation';
                          showForSubStatus = true; // If you want to show for both cases
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
      </div>

      {/* Pagination */}
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

      {/* Job Order Form (only on /create route) */}
      {location.pathname === '/create' && (
        <JobOrderForm
          userRole={user?.role}
          showNotification={showNotification}
          refreshJobs={fetchJobs}
        />
      )}

      {/* Modals */}
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

      <NewJobOrdersModal
        isOpen={isNewJobsModalOpen}
        onClose={handleNewJobsModalClose}
        newPendingJobs={newPendingJobs}
        onViewJob={handleViewFromNotification}
        onMarkAllViewed={handleMarkAllViewed}
      />

      {/* Confirm Close Modal */}
      <ConfirmModal
        isOpen={!!closeJobId}
        title="Close Job Order"
        message="Are you sure you want to close this job order? This will mark it as completed and closed."
        confirmText="Yes, Close"
        cancelText="Cancel"
        loading={closeLoading}
        onConfirm={() => {
          const job = jobs.find(j => j.id === closeJobId);
          if (job) handleCloseJob(job);
        }}
        onCancel={() => setCloseJobId(null)}
      />
    </div>
  );
}