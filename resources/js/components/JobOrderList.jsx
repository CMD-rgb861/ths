import { useEffect, useState } from 'react';
import axios from 'axios';
import JobOrderModal from './JobOrderModal';
import JobOrderOngoingModal from './JobOrderOngoingModal';
import StatusBadge from './ui/StatusBadge';
import StatusIndicator from './ui/StatusIndicator'; // Import StatusIndicator component
import { FaBell } from 'react-icons/fa'; // Import Bell icon for notification
import JobOrderForm from './JobOrderForm';
import { useLocation } from 'react-router-dom'; // Import useLocation
import NewJobOrdersModal from './NewJobOrdersModal'; // Import NewJobOrdersModal

const PER_PAGE = 10; // or whatever you prefer

export default function JobOrderList({ showNotification, setNewPendingJobs, newPendingJobs }) {
  const location = useLocation();  // Get current location/path
  
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedOngoingJob, setSelectedOngoingJob] = useState(null);
  const [ongoingModalOpen, setOngoingModalOpen] = useState(false);

  const [isNewJobsModalOpen, setIsNewJobsModalOpen] = useState(false); // State for the new job modal

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const isAdmin = user?.role === 'admin';

  /* ================= FETCH JOBS ================= */
  const fetchJobs = async (searchValue = search, pageValue = page) => {
    if (loading) return; // Prevent duplicate fetches

    setLoading(true);

    try {
      const res = await axios.get('/job-orders', {
        params: { search: searchValue } // send search param to backend
      });

      let data = res.data.data || [];

      // ================= FILTER =================
      // Keep only Pending & Ongoing
      data = data.filter(job =>
        ['Pending', 'Ongoing'].includes(job.action_report?.status || 'Pending')
      );

      // For non-admin, show only their own jobs
      if (!isAdmin) {
        data = data.filter(job => job.requested_by === userId);
      }

      // ================= OPTION 3 (Auto Go Back if Empty Page) =================
      const totalPages = Math.ceil(data.length / PER_PAGE) || 1;

      if (pageValue > totalPages) {
        setPage(totalPages);
        setLoading(false);
        return;
      }

      // ================= OPTION 2 (Manual Pagination) =================
      const start = (pageValue - 1) * PER_PAGE;
      const end = start + PER_PAGE;
      const paginatedData = data.slice(start, end);

      setJobs(paginatedData);

      setMeta({
        current_page: pageValue,
        last_page: totalPages,
        prev_page_url: pageValue > 1,
        next_page_url: pageValue < totalPages
      });

      // ================= TRACK NEW PENDING JOBS (ADMIN ONLY) =================
      if (isAdmin) {
        const currentPendingJobs = data.filter(
          job => job.action_report?.status === 'Pending' && !job.notified
        );

        const newPending = currentPendingJobs.filter(
          job => !newPendingJobs.some(existingJob => existingJob.id === job.id)
        );

        setNewPendingJobs(prev => [...prev, ...newPending]);
      }

    } catch (error) {
      console.log("API ERROR:", error.response || error.message);
      setJobs([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    fetchJobs(search, page);
  }, [search, page]);

  /* ================= MODAL LOGIC ================= */
  const openModal = (job) => {
    const status = job.action_report?.status;

    // 🔐 Only admin can open Ongoing dashboard modal
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

  /* ================= COUNTS (ADMIN ONLY) ================= */
  const pendingCount = jobs.filter(
    job => job.action_report?.status === 'Pending'
  ).length; // Total Pending job count

  const ongoingCount = jobs.filter(
    job => job.action_report?.status === 'Ongoing'
  ).length;

  /* ================= RESET NEW PENDING JOBS ================= */
  const handleBellClick = () => {
    setIsNewJobsModalOpen(true); // Open the modal for new jobs
    // Do not clear the state yet — we'll clear it after the modal is closed
  };

  /* ================= MARK JOBS AS VIEWED ================= */
  const handleNewJobsModalClose = () => {
    setIsNewJobsModalOpen(false);

    // Update backend so that these jobs are no longer new
    if (newPendingJobs.length > 0) {
      axios.post('/job-orders/mark-pending-notified', {
        jobs: newPendingJobs.map(job => job.id)
      })
      .then(() => {
        // After marking as notified, remove from local state
        // setNewPendingJobs([]);
        fetchJobs(search, page); // refresh list
      })
      .catch(err => console.error(err));
    }
  };

  // New Notification Modal HANDLERS

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

  const handleMarkAllViewed = () => {
    const jobIds = newPendingJobs.map(job => job.id);

    axios.post('/job-orders/mark-pending-notified', { jobs: jobIds })
      .then(() => {
        setNewPendingJobs([]);
        setIsNewJobsModalOpen(false);
      })
      .catch(error => {
        console.error('Error marking jobs as notified:', error);
      });
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Job Orders
        </h1>
        <p className="text-sm text-gray-500">
          {isAdmin
            ? 'Monitor, manage, and update all IT job requests.'
            : 'Track and monitor your submitted IT requests.'}
        </p>
      </div>

      {/* ================= ADMIN SUMMARY CARDS ================= */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pending Card */}
          <div className="bg-white border border-yellow-200 rounded-xl p-5 shadow-sm relative">
            <p className="text-sm text-gray-500">Total Pending</p>
            <h2 className="text-2xl font-bold text-yellow-600">
              {pendingCount} {/* Display the actual count of pending jobs */}
            </h2>
            {/* Notification Icon */}
            {newPendingJobs.length > 0 && (
              <div
                className="absolute top-0 right-0 p-2 bg-yellow-600 text-white rounded-full cursor-pointer"
                onClick={handleBellClick} // Open the new pending job modal
              >
                <FaBell className="w-5 h-5" />
                <div className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {newPendingJobs.length} {/* Display the count of new pending jobs */}
                </div>
              </div>
            )}
          </div>

          {/* Ongoing Card */}
          <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Ongoing</p>
            <h2 className="text-2xl font-bold text-blue-600">
              {ongoingCount}
            </h2>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search job order number or department..."
          className="w-full lg:w-96 border border-gray-300 rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && (
          <div className="p-6 text-sm text-gray-500">
            Searching...
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No job orders found.
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-600">
                  <th className="px-6 py-3 font-medium">Job Order No.</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Categories</th>
                  {isAdmin && (
                    <th className="px-6 py-3 font-medium">Requester</th>
                  )}
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {isJobNew(j.id) && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                          </span>
                        )}
                        {j.job_order_no}
                        {isJobNew(j.id) && (
                          <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {j.department?.name || '—'}
                    </td>

                    <td className="px-6 py-4">
                      {j.categories?.length > 0 ? (
                        j.categories.map((category, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 inline-block bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-1"
                          >
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">
                          No categories assigned
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 text-gray-700">
                        {j.requester?.name || '—'}
                      </td>
                    )}

                    <td className="px-6 py-4">
                      {/* StatusBadge for Pending, Ongoing, etc. */}
                      <div className="flex flex-col items-center">
                        <StatusBadge status={j.action_report?.status} />
                        {/* If the job is Ongoing, display StatusIndicator below the badge */}
                        {j.action_report?.status === 'Ongoing' && (
                          <div className="mt-1">
                                <StatusIndicator
                                  status={j.action_report?.status}
                                  actionReport={j.action_report}
                                  requesterId={j.requester?.id} // Pass the requester ID
                                />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 flex gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => openModal(j)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      {!loading && jobs.length > 0 && (
        <div className="flex justify-between items-center text-sm">
          <button
            disabled={!meta.prev_page_url}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-gray-600">
            Page {meta.current_page || 1} of {meta.last_page || 1}
          </span>

          <button
            disabled={!meta.next_page_url}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Render JobOrderForm only on the /create route */}
      {location.pathname === '/create' && (
        <JobOrderForm
          userRole={user?.role}
          showNotification={showNotification}
          refreshJobs={fetchJobs}          // Pass the job-fetching function
        />
      )}

      {/* ================= MODALS ================= */}
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

      {/* New Job Orders Modal */}
      <NewJobOrdersModal
        isOpen={isNewJobsModalOpen}
        onClose={handleNewJobsModalClose} // Use the new function to handle closing the modal
        newPendingJobs={newPendingJobs}
        onViewJob={handleViewFromNotification}
        onMarkAllViewed={handleMarkAllViewed}
      />
    </div>
  );
}
