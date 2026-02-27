import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import JobOrderModal from './JobOrderModal';
import JobOrderOngoingModal from './JobOrderOngoingModal';
import StatusIndicator from './ui/StatusIndicator';
import { Navigate } from 'react-router-dom';

export default function JobOrderStatusPage({ showNotification }) {
  const { status } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const formattedStatus =
    status?.charAt(0).toUpperCase() + status?.slice(1);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditable, setIsEditable] = useState(true);

  const [selectedJob, setSelectedJob] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  /* ================= LOAD ORDERS ================= */
  const loadOrders = useCallback(() => {
    console.log("LOAD ORDERS CALLED");
    setLoading(true);

    axios
      .get('/job-orders', { params: { page, search } })
      .then((res) => {
        const rows = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const filtered = rows.filter(
          (o) =>
            (o.action_report?.status || 'Pending') ===
            formattedStatus
        );

        setOrders(filtered);
        setLastPage(res.data?.last_page || 1);
      })
      .catch((err) => {
        console.error('Load orders failed:', err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [page, search, formattedStatus]);

  useEffect(() => {
    loadOrders();
  }, [page, search, formattedStatus]);

  /* ================= HANDLE VIEW ================= */
  const handleView = (job) => {
    const jobStatus =
      job.action_report?.status || 'Pending';

    if (jobStatus === 'Pending') {
      setSelectedJob(job);
      setShowPendingModal(true);
    } else {
      setSelectedJobId(job.id);
      setShowModal(true);
      setIsEditable(jobStatus !== 'Completed');
    }
  };

  /* ================= STATUS BADGES ================= */
  const badgeStyle = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Ongoing: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    Unserviceable: 'bg-gray-200 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/reports')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Reports
      </button>

      {/* HEADER */}
      <h1 className="text-xl font-semibold">
        {formattedStatus} Job Orders
      </h1>

      {/* SEARCH */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search job order no or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border rounded-xl mt-4">
        {loading && (
          <div className="p-6 text-sm text-gray-500">
            Loading...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No records found.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-600">
                <th className="px-6 py-3 font-medium">
                  Job Order No.
                </th>
                <th className="px-6 py-3 font-medium">
                  Department
                </th>
                <th className="px-6 py-3 font-medium">
                  Categories
                </th>
                <th className="px-6 py-3 font-medium">
                  Status
                </th>
                <th className="px-6 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {o.job_order_no}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {o.department?.name || '—'}
                  </td>

                  <td className="px-6 py-4">
                    {o.categories?.length > 0 ? (
                      o.categories.map((category, index) => (
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

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          badgeStyle[o.action_report?.status]
                        }`}
                      >
                        {o.action_report?.status}
                      </span>

                      {/* Show waiting/confirmation indicator when an action report exists */}
                      {o.action_report && (
                        <div className="mt-1">
                          <StatusIndicator
                            status={o.action_report?.status}
                            actionReport={o.action_report}
                            requesterId={o.requester?.id}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleView(o)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center text-sm mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Previous
        </button>

        <span>
          Page {page} of {lastPage}
        </span>

        <button
          disabled={page === lastPage}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* ================= ONGOING / COMPLETED MODAL ================= */}
    {showModal && selectedJobId && (
      <JobOrderOngoingModal
        jobId={selectedJobId}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedJobId(null);
          loadOrders();
        }}
        onStatusChange={(updatedJob) => {
          setOrders(prev =>
            prev.map(o =>
              o.id === updatedJob.id ? updatedJob : o
            )
          );
        }}
        showNotification={showNotification}
        isEditable={isEditable}
        isAdmin={isAdmin}
      />
    )}

      {/* ================= PENDING MODAL ================= */}
      {showPendingModal && selectedJob && (
        <JobOrderModal
          isOpen={showPendingModal} // Pass the showPendingModal state here
          job={selectedJob}
          onClose={() => {
            loadOrders(); // refetch NOW
            setShowPendingModal(false); // Set showPendingModal to false to close the modal
            setSelectedJobId(null); // Clear selected job id
          }}
          onStatusChange={loadOrders}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}