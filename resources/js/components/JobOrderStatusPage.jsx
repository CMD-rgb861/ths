import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import JobOrderOngoingModal from './JobOrderOngoingModal';

export default function JobOrderStatusPage({ showNotification }) {
  const { status } = useParams();
  const navigate = useNavigate();

  const formattedStatus = status?.charAt(0).toUpperCase() + status?.slice(1);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* ================= LOAD ORDERS ================= */
  const loadOrders = useCallback(() => {
    setLoading(true);

    axios.get('/job-orders', { params: { page, search } })
      .then(res => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const filtered = rows.filter(
          o => (o.action_report?.status || 'Pending') === formattedStatus
        );

        setOrders(filtered);
        setLastPage(res.data?.last_page || 1);
      })
      .catch(err => {
        console.error('Load orders failed:', err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [page, search, formattedStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* ================= HANDLE VIEW ================= */
  const handleView = (id) => {
    setSelectedJobId(id);
    setShowModal(true);
  };

  /* ================= STATUS BADGES ================= */
  const badgeStyle = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Ongoing: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  const Info = ({ label, value }) => (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900 break-words">
        {value || '—'}
      </div>
    </div>
  );

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

      {/* LIST */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {loading && (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        )}

        {!loading && orders.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No records found.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="divide-y">
            {orders.map(o => (
              <div key={o.id} className="p-6 flex justify-between items-center">
                <div>
                  <div className="font-medium">{o.job_order_no}</div>
                  <div className="text-sm text-gray-500">{o.department?.name}</div>
                  <div className="text-sm text-gray-500">
                    Requested by: {o.requester?.name}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${badgeStyle[formattedStatus]}`}>
                    {formattedStatus}
                  </span>

                  <button
                    onClick={() => handleView(o.id)}
                    className="px-4 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center text-sm">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Previous
        </button>

        <span>Page {page} of {lastPage}</span>

        <button
          disabled={page === lastPage}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* ================= REUSABLE MODAL ================= */}
      {selectedJobId && (
        <JobOrderOngoingModal
          jobId={selectedJobId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onStatusChange={loadOrders}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}
