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

  const token = localStorage.getItem('token'); // Get the auth token

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
      const response = await axios.get('/job-orders', {
        params: {
          search,
          status,
          category,
          dateFrom,
          dateTo,
          page,
          history: true,  // Apply 'history' filter for Completed, Cancelled, Unserviceable
        },
        headers: {
          Authorization: `Bearer ${token}`, // Send auth token for authenticated requests
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content, // CSRF token from meta tag (Laravel)
        },
      });

      const safeOrders = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const safePagination = response.data?.meta || response.data?.pagination || {};

      setOrders(safeOrders);
      setPagination(safePagination);

      // Console log to check if the user has job orders
      console.log("Fetched Job Orders:", safeOrders);
      console.log("Pagination:", safePagination);
      console.log("User has job requests: ", safeOrders.length > 0);  // Check if there are job orders for the current user

    } catch (error) {
      console.error('Error fetching job history:', error);
      setOrders([]);
      setPagination({});
      if (showNotification) {
        showNotification('error', 'Error', 'Failed to load job history.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Request History</h1>
        <p className="text-gray-600 mt-1">Completed, Cancelled, and Unserviceable requests</p>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search job order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Unserviceable">Unserviceable</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Job Order History</h3>
        </div>

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading history...</p>
            </div>
          ) : orders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">No history found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders?.map((order) => (
                <div
                  key={order.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedJob(order)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-base font-bold text-gray-900">
                          {order.job_order_no}
                        </p>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            order.action_report?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            (order.action_report?.status === 'Cancelled' || order.action_report?.status === 'Cancelled by User') ? 'bg-red-100 text-red-800' :
                            order.action_report?.status === 'Unserviceable' ? 'bg-gray-200 text-gray-800' :
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {/* Show "Cancelled" for both "Cancelled" and "Cancelled by User" */}
                          {order.action_report?.status === 'Cancelled by User'
                            ? 'Cancelled'
                            : (order.action_report?.status || order.status)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {order.department?.name || 'No department'}
                      </div>
                    </div>
                    <button className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <span className="text-sm font-medium text-gray-700">
                Page {pagination?.current_page || page} of {pagination?.last_page || 1}
              </span>

              <button
                disabled={page >= (pagination?.last_page || 1)}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

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
