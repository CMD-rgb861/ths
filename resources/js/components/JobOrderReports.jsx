import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobOrderStatusSummary from './JobOrderStatusSummary';
import JobOrderDepartmentSummary from './JobOrderDepartmentSummary';

const PER_PAGE = 10;

export default function JobOrderReports() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    setLoading(true);

    axios.get('/job-orders')
      .then(res => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        setOrders(rows);
        setFiltered(rows);
      })
      .catch(() => {
        setOrders([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ---------------- APPLY FILTERS ---------------- */
  useEffect(() => {
    let data = [...orders];

    if (filters.status) {
      data = data.filter(o => o.action_report?.status === filters.status);
    }

    if (filters.department) {
      data = data.filter(o => o.department?.id == filters.department);
    }

    if (filters.from) {
      data = data.filter(o => o.created_at >= filters.from);
    }

    if (filters.to) {
      data = data.filter(o => o.created_at <= filters.to);
    }

    if (search) {
      const term = search.toLowerCase();
      data = data.filter(o =>
        o.job_order_no?.toLowerCase().includes(term) ||
        o.department?.name?.toLowerCase().includes(term) ||
        o.requester?.name?.toLowerCase().includes(term)
      );
    }

    setPage(1);
    setFiltered(data);

  }, [filters, orders, search]);

  /* ---------------- PAGINATION ---------------- */
  const paginated = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  /* ---------------- STATUS BADGE ---------------- */
  const statusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Ongoing: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status || 'Pending'}
      </span>
    );
  };

  /* ---------------- NAVIGATE TO JOB ORDER STATUS ---------------- */
  const handleStatusClick = (status) => {
    navigate(`/job-orders/${status.toLowerCase()}`);
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Job Order Reports
        </h1>
        <p className="text-sm text-gray-500">
          Overview and analytics of submitted IT requests
        </p>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Filters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            onChange={e => setFilters({ ...filters, from: e.target.value })}
          />

          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            onChange={e => setFilters({ ...filters, to: e.target.value })}
          />

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            {['Pending', 'Ongoing', 'Completed', 'Cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            onChange={e => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            {[...new Map(
              orders
                .filter(o => o.department)
                .map(o => [o.department.id, o.department])
            ).values()].map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

        </div>
      </div>

      {/* STATUS SUMMARY */}
      <JobOrderStatusSummary orders={filtered} />

      {/* SEARCH BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder="Search by Job Order No, Department, or Requester..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* RESULTS SECTION */}
      <div className="space-y-4">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Job Order Results
          </h2>
          <p className="text-sm text-gray-500">
            Showing {filtered.length} total record(s)
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {loading && (
            <div className="p-6 text-sm text-gray-500">
              Loading job orders...
            </div>
          )}

          {!loading && paginated.length === 0 && (
            <div className="p-6 text-sm text-gray-500">
              No records found.
            </div>
          )}

          {!loading && paginated.length > 0 && (
            <div className="divide-y">
              {paginated.map(o => {

                const status = o.action_report?.status || 'Pending';

                const requestedBy = o.requester?.name;
                const acceptedBy = o.action_report?.accepted_by_user?.name;
                const servicedBy = o.action_report?.serviced_by_user?.name;
                const cancelledBy = o.action_report?.cancelled_by_user?.name;

                return (
                  <div
                    key={o.id}
                    className="p-6 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

                      <div>
                        <div className="font-medium text-gray-900">
                          {o.job_order_no}
                        </div>

                        <div className="text-sm text-gray-500">
                          {o.department?.name}
                        </div>

                        <div className="text-sm text-gray-500">
                          Requested by: {requestedBy || '—'}
                        </div>

                        {status === 'Ongoing' && (
                          <div className="text-sm text-blue-600">
                            Accepted by: {acceptedBy || '—'}
                          </div>
                        )}

                        {status === 'Completed' && (
                          <div className="text-sm text-green-600">
                            Serviced by: {servicedBy || '—'}
                          </div>
                        )}

                        {status === 'Cancelled' && (
                          <div className="text-sm text-red-600">
                            Cancelled by: {cancelledBy || '—'}
                          </div>
                        )}
                      </div>

                      {statusBadge(status)}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages >= 1 && (
          <div className="flex justify-center items-center gap-2">

            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 text-sm rounded-lg border transition ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100 border-gray-300'
              }`}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 text-sm rounded-lg border transition ${
                  page === i + 1
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white hover:bg-gray-100 border-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-4 py-2 text-sm rounded-lg border transition ${
                page === totalPages
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100 border-gray-300'
              }`}
            >
              Next
            </button>

          </div>
        )}
      </div>

      {/* DEPARTMENT DISTRIBUTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Department Distribution
        </h2>
        <JobOrderDepartmentSummary orders={filtered} />
      </div>

    </div>
  );
}
