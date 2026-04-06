import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import JobOrderModal from './JobOrderModal';
import JobOrderOngoingModal from './JobOrderOngoingModal';
import StatusIndicator from './ui/StatusIndicator';

const STATUS_BADGE_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Cancelled by User': 'bg-red-100 text-red-800',
  Unserviceable: 'bg-gray-200 text-gray-800',
};

export default function JobOrderStatusPage({ showNotification }) {
  const { status } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Move isRole and role checks here before using isAdmin/isTechnician
  function isRole(user, roleName) {
    if (!user) return false;
    if (Array.isArray(user.roles)) {
      return user.roles.some(r => (typeof r === 'string' ? r : r.name) === roleName);
    }
    if (typeof user.role === 'string') return user.role === roleName;
    if (typeof user.role === 'object' && user.role?.name) return user.role.name === roleName;
    return false;
  }
  const isAdmin = isRole(user, 'admin');
  const isTechnician = isRole(user, 'technician');

  // --- NEW: store status id, not name ---
  const [statusOptions, setStatusOptions] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState(status || '');

  // --- NEW: Service Status Mode ---
  const SERVICE_STATUS_KEYS = [
    'unserviceable_with_form',
    'unserviceable_without_form',
    'closed',
  ];
  const [isServiceStatus, setIsServiceStatus] = useState(false);

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
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Redirect non-admin users
  if (!isAdmin && !isTechnician) {
    return <Navigate to="/" replace />;
  }

  // Load job orders
  const loadOrders = useCallback(() => {
    setLoading(true);

    if (isServiceStatus && SERVICE_STATUS_KEYS.includes(selectedStatusId)) {
      // Fetch by service status
      axios
        .get('/job-orders/service-status', { params: { service_status: selectedStatusId, search, sort: sortBy } })
        .then((res) => {
          const rows = Array.isArray(res.data?.data) ? res.data.data : [];
          setOrders(rows);
          setLastPage(1);
        })
        .catch((err) => {
          setOrders([]);
          setLastPage(1);
        })
        .finally(() => setLoading(false));
    } else {
      // Always send page, search, sort, and status (if set)
      const params = { page, search, sort: sortBy };
      if (selectedStatusId) {
        params.status = selectedStatusId;
      }

      axios
        .get('/job-orders', { params })
        .then((res) => {
          const rows = Array.isArray(res.data?.data) ? res.data.data : [];
          setOrders(rows);
          setLastPage(res.data?.meta?.last_page || 1);
        })
        .catch((err) => {
          setOrders([]);
          setLastPage(1);
        })
        .finally(() => setLoading(false));
    }
  }, [page, search, selectedStatusId, sortBy, isServiceStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    axios.get('/request-statuses')
      .then(res => setStatusOptions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setStatusOptions([]));
  }, []);

  // --- NEW: update selectedStatusId and service status mode when route param changes ---
  useEffect(() => {
    if (!status) {
      setSelectedStatusId('');
      setIsServiceStatus(false);
      return;
    }
    // If it's a service status key, set service mode
    if (SERVICE_STATUS_KEYS.includes(status)) {
      setIsServiceStatus(true);
      setSelectedStatusId(status);
    } else {
      setIsServiceStatus(false);
      // If already a number string, use as is
      if (!isNaN(status)) {
        setSelectedStatusId(status);
      } else {
        // Otherwise, map status name to id
        const found = statusOptions.find(s => s.name.toLowerCase() === status.toLowerCase());
        if (found) {
          setSelectedStatusId(String(found.id));
        } else {
          setSelectedStatusId('');
        }
      }
    }
  }, [status, statusOptions]);

  // Handle view button click
  const handleView = (job) => {
    const jobStatus = job.action_report?.status || 'Pending';

    if (jobStatus === 'Pending') {
      setSelectedJob(job);
      setShowPendingModal(true);
    } else {
      setSelectedJobId(job.id);
      setShowModal(true);
      setIsEditable(jobStatus !== 'Completed');
    }
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'department_asc', label: 'Department: A to Z' },
    { value: 'department_desc', label: 'Department: Z to A' },
    { value: 'job_order_asc', label: 'Job Order No: Low to High' },
    { value: 'job_order_desc', label: 'Job Order No: High to Low' },
  ];

  // Helper to get status name by id or from backend relation
  const getStatusName = (order) => {
    // If cancelled and cancelled_by is the requester, show "Cancelled by User"
    if (
      (order.request_status?.name === 'Cancelled' || order.action_report?.status === 'Cancelled') &&
      order.action_report?.cancelled_by &&
      order.requester &&
      (
        // cancelled_by can be an object or an id
        (typeof order.action_report.cancelled_by === 'object'
          ? order.action_report.cancelled_by.id
          : order.action_report.cancelled_by
        ) === order.requester.id
      )
    ) {
      return 'Cancelled by User';
    }
    if (order.request_status?.name) return order.request_status.name;
    if (typeof order.status === 'string') return order.status;
    if (order.action_report?.status) return order.action_report.status;
    return '—';
  };

  // --- NEW: get display label for service status ---
  const getServiceStatusLabel = (key) => {
    if (key === 'unserviceable_with_form') return 'Unserviceable with Form';
    if (key === 'unserviceable_without_form') return 'Unserviceable without Form';
    if (key === 'closed') return 'Service Closed';
    return '';
  };

  // --- NEW: get formatted status for header ---
  const formattedStatus = isServiceStatus
    ? getServiceStatusLabel(selectedStatusId)
    : statusOptions.find(s => String(s.id) === String(selectedStatusId))?.name || '';

  // --- NEW: get request status and service status for each order ---
  const getRequestStatus = (order) => {
    if (order.request_status?.name) return order.request_status.name;
    if (typeof order.status === 'string') return order.status;
    return '—';
  };
  const getServiceStatus = (order) => {
    if (order.action_report?.action_taken) return order.action_report.action_taken;
    return '—';
  };

  // --- FIX: Reset page to 1 when search or status filter changes ---
  useEffect(() => {
    setPage(1);
  }, [search, selectedStatusId, isServiceStatus]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/reports')}
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reports
      </button>

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {formattedStatus ? `${formattedStatus} Job Orders` : 'Job Orders'}
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage {formattedStatus ? formattedStatus.toLowerCase() : ''} job orders
        </p>
      </div>

      {/* Search and Table Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Search Bar and Filter */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search job order number or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[200px] justify-between"
              >
                <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        sortBy === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            {!isServiceStatus && (
              <div className="relative">
                <select
                  value={selectedStatusId}
                  onChange={e => {
                    const value = e.target.value;
                    setSelectedStatusId(value);
                    setPage(1);
                    if (value) {
                      navigate(`/reports/status/${value}`);
                    } else {
                      navigate(`/reports/status`);
                    }
                  }}
                  className="block appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Job Orders Table */}
        <div className="overflow-x-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading job orders...</p>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No {formattedStatus.toLowerCase()} job orders found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your search criteria</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Job Order No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Categories
                  </th>
                  {/* --- CHANGED: Show both Request Status and Service Status --- */}
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Request Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Service Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {order.job_order_no}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {order.department?.name || '—'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.categories?.length > 0 ? (
                          order.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              {category.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No categories</span>
                        )}
                      </div>
                    </td>

                    {/* --- NEW: Request Status column --- */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          STATUS_BADGE_STYLES[getRequestStatus(order)]
                        }`}
                      >
                        {getRequestStatus(order)}
                      </span>
                    </td>
                    {/* --- NEW: Service Status column --- */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        {getServiceStatus(order)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleView(order)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <span className="text-sm font-medium text-gray-700">
                Page {page} of {lastPage}
              </span>

              <button
                disabled={page === lastPage}
                onClick={() => setPage((p) => p + 1)}
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

      {/* Ongoing/Completed Modal */}
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
              prev.map(order =>
                order.id === updatedJob.id ? updatedJob : order
              )
            );
          }}
          showNotification={showNotification}
          isEditable={isEditable}
          isAdmin={isAdmin}
        />
      )}

      {/* Pending Modal */}
      {showPendingModal && selectedJob && (
        <JobOrderModal
          isOpen={showPendingModal}
          job={selectedJob}
          onClose={() => {
            loadOrders();
            setShowPendingModal(false);
            setSelectedJobId(null);
          }}
          onStatusChange={loadOrders}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}