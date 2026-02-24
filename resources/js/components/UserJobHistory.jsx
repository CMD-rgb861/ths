import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobOrderModal from './JobOrderModal';

export default function UserJobHistory({ showNotification }) {
  const [orders, setOrders] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // 🔥 Auto Fetch (Debounced Search)
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchHistory();
    }, 500);

    return () => clearTimeout(delay);
  }, [search, status, category, dateFrom, dateTo, page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/job-history', {
        params: {
          search,
          status,
          category,
          dateFrom,
          dateTo,
          page,
        },
      });

      console.log('API Response:', response.data);

      // 🛡️ Defensive protection
      const safeOrders = Array.isArray(response.data?.orders)
        ? response.data.orders
        : [];

      const safePagination =
        typeof response.data?.pagination === 'object' &&
        response.data.pagination !== null
          ? response.data.pagination
          : {};

      setOrders(safeOrders);
      setPagination(safePagination);

    } catch (error) {
      console.error('Error fetching job history:', error);
      setOrders([]); // prevent crash
      setPagination({});
      if (showNotification) {
        showNotification('error', 'Error', 'Failed to load job history.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Job Request History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Completed, Cancelled, and Unserviceable requests.
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search Job Order No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Filters
          </h3>
        </div>

        <div className="grid md:grid-cols-4 gap-6">

          {/* Status */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            >
              <option value="">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Unserviceable">Unserviceable</option>
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-gray-500 text-sm">
          Loading...
        </div>
      ) : orders?.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-gray-500 text-sm">
          No history found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
          {orders?.map((order) => (
            <div
              key={order.id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-all duration-150"
              onClick={() => setSelectedJob(order)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {order.job_order_no}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.department?.name}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium
                    ${order.status === 'Completed' && 'bg-green-100 text-green-700'}
                    ${order.status === 'Cancelled' && 'bg-red-100 text-red-700'}
                    ${order.status === 'Unserviceable' && 'bg-yellow-100 text-yellow-700'}
                  `}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {pagination?.last_page > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination?.current_page ?? 1} of {pagination?.last_page ?? 1}
          </span>

          <button
            disabled={page === pagination?.last_page}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL */}
      {selectedJob && (
        <JobOrderModal
          isOpen={true}
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatusChange={() => {}}
          showNotification={showNotification}
        />
      )}

    </div>
  );
}