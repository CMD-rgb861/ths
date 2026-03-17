import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobOrderStatusSummary from './JobOrderStatusSummary';
import JobOrderDepartmentSummary from './JobOrderDepartmentSummary';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PER_PAGE = 5;
const STATUSES = ['Pending', 'Ongoing', 'Completed', 'Cancelled'];
const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function JobOrderReports() {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    from: '',
    to: '',
  });
  const [totals, setTotals] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [itDirector, setItDirector] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('distribution');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Fetch job orders data
  useEffect(() => {
    setLoading(true);

    // Try different approaches to get all data
    const fetchAllOrders = async () => {
      try {
        // First, try with per_page parameter
        let response = await axios.get('/job-orders', {
          params: { per_page: 1000 } // or use -1 if Laravel supports it
        });
        
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        console.log('Total job orders fetched:', rows.length);
        console.log('Ongoing orders:', rows.filter(o => o.action_report?.status === 'Ongoing').length);
        
        setOrders(rows);
        setFiltered(rows);
        setTotals(response.data.totals || {});
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setFiltered([]);
        setTotals({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  // Fetch IT Director information
  useEffect(() => {
    axios.get('/signatory/it-director')
      .then(res => setItDirector(res.data))
      .catch(() => setItDirector(null));
  }, []);

  // Apply filters to job orders
  useEffect(() => {
    let data = [...orders];

    if (filters.status) {
      data = data.filter(o => o.action_report?.status === filters.status);
    }

    if (filters.department) {
      data = data.filter(o => o.department?.id == filters.department);
    }

    if (filters.from) {
      const fromDate = new Date(filters.from + 'T00:00:00');
      data = data.filter(o => new Date(o.created_at) >= fromDate);
    }

    if (filters.to) {
      const toDate = new Date(filters.to + 'T23:59:59');
      data = data.filter(o => new Date(o.created_at) <= toDate);
    }

    if (search) {
      const term = search.toLowerCase();
      data = data.filter(o =>
        o.job_order_no?.toLowerCase().includes(term) ||
        o.department?.name?.toLowerCase().includes(term) ||
        o.requester?.name?.toLowerCase().includes(term) ||
        o.action_report?.status?.toLowerCase().includes(term)
      );
    }

    setPage(1);
    setFiltered(data);
  }, [filters, orders, search]);

  // Generate department distribution pie chart data
  const getDepartmentPieData = (data) => {
    const departmentCounts = {};
    data.forEach(order => {
      const departmentName = order.department?.name;
      if (departmentName) {
        departmentCounts[departmentName] = (departmentCounts[departmentName] || 0) + 1;
      }
    });

    const labels = Object.keys(departmentCounts);
    const values = Object.values(departmentCounts);

    if (!labels.length) {
      return { 
        labels: ['No Data'], 
        datasets: [{ 
          data: [100], 
          backgroundColor: ['#FF6384'] 
        }] 
      };
    }

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', 
          '#36A2EB', 
          '#FFCE56', 
          '#4BC0C0', 
          '#9966FF', 
          '#FF9F40'
        ],
      }],
    };
  };

  const pieData = useMemo(() => getDepartmentPieData(filtered), [filtered]);

  // Pie chart configuration options
  const getPieChartOptions = (legendPosition = 'top') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const dataset = tooltipItem.dataset;
            const total = dataset.data.reduce((sum, value) => sum + value, 0);
            const value = dataset.data[tooltipItem.dataIndex];
            const percentage = ((value / total) * 100).toFixed(2);
            return `${tooltipItem.label}: ${value} (${percentage}%)`;
          },
        },
      },
      legend: {
        position: legendPosition,
        labels: {
          generateLabels: function (chart) {
            const dataset = chart.data.datasets?.[0];
            const labels = Array.isArray(chart.data.labels) ? chart.data.labels : [];
            const data = Array.isArray(dataset?.data) ? dataset.data : [];
            const total = data.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0) || 1;

            return labels.map((lbl, index) => {
              const value = data[index] ?? 0;
              const percentage = ((value / total) * 100).toFixed(2);
              const bg = Array.isArray(dataset?.backgroundColor) 
                ? dataset.backgroundColor[index] 
                : dataset?.backgroundColor;

              return {
                text: `${lbl ?? `#${index + 1}`} (${percentage}%)`,
                fillStyle: bg,
                hidden: false,
                index,
              };
            });
          },
          boxWidth: legendPosition === 'bottom' ? 14 : 12,
          padding: legendPosition === 'bottom' ? 15 : undefined,
        },
      },
    },
  });

  // Calculate pagination
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Get unique departments from orders
  const uniqueDepartments = useMemo(() => {
    return [...new Map(
      orders
        .filter(o => o.department)
        .map(o => [o.department.id, o.department])
    ).values()];
  }, [orders]);

  // Render status badge
  const statusBadge = (status) => (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status || 'Pending'}
    </span>
  );

  // Handle navigation to job order status page
  const handleStatusClick = (status) => {
    navigate(`/job-orders/${status.toLowerCase()}`);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Export job orders to CSV
  const exportToCSV = (statusFilter = null) => {
    // Use original orders data, not filtered
    let dataToExport = [...orders];
    
    if (statusFilter) {
      dataToExport = dataToExport.filter(o => o.action_report?.status === statusFilter);
    }

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Job Order No',
      'Department',
      'Status',
      'Requested By',
      'Signatory',
      'Accepted By',
      'Serviced By',
      'Cancelled By',
      'Date Created'
    ];

    const rows = dataToExport.map(order => {
      const status = order.action_report?.status || 'Pending';
      const requestedBy = order.requester?.name || '';
      const signatory = order.signature_name || '';
      const acceptedBy = order.action_report?.accepted_by_user?.name || 
                        itDirector?.user?.name || 
                        itDirector?.name || '';
      const servicedBy = order.action_report?.serviced_by?.name || 
                        order.action_report?.serviced_by || '';
      const cancelledBy = order.action_report?.cancelled_by_user?.name || '';
      const dateCreated = order.created_at 
        ? new Date(order.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        : '';

      return [
        order.job_order_no || '',
        order.department?.name || '',
        status,
        requestedBy,
        signatory,
        acceptedBy,
        servicedBy,
        cancelledBy,
        dateCreated
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = statusFilter 
      ? `job_orders_${statusFilter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`
      : `job_orders_all_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportDropdown(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Order Reports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Overview and analytics of submitted IT requests
            </p>
          </div
          >
          
          {/* CSV Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => exportToCSV(null)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      All Job Orders
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    {STATUSES.map(status => (
                      <button
                        key={status}
                        onClick={() => exportToCSV(status)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className={`w-2 h-2 rounded-full mr-3 ${
                          status === 'Pending' ? 'bg-yellow-500' :
                          status === 'Ongoing' ? 'bg-blue-500' :
                          status === 'Completed' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></span>
                        {status} Only
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <JobOrderStatusSummary totals={totals} />

      {/* Filter Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* From Date */}
          <div>
            <label htmlFor="from" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              From Date
            </label>
            <input
              id="from"
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onChange={e => handleFilterChange('from', e.target.value)}
            />
          </div>

          {/* To Date */}
          <div>
            <label htmlFor="to" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              To Date
            </label>
            <input
              id="to"
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onChange={e => handleFilterChange('to', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </label>
            <select
              id="status"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label htmlFor="department" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Department
            </label>
            <select
              id="department"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onChange={e => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Job Order No, Department, or Requester..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Job Order Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {paginated.length} of {filtered.length} record(s)
              </p>
            </div>
          </div>
        </div>

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

        {!loading && paginated.length === 0 && (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">No records found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {!loading && paginated.length > 0 && (
          <div className="divide-y divide-gray-200">
            {paginated.map(order => {
              const status = order.action_report?.status || 'Pending';
              const requestedBy = order.requester?.name;
              const acceptedBy = order.action_report?.accepted_by_user?.name || 
                                 itDirector?.user?.name || 
                                 itDirector?.name;
              const servicedBy = order.action_report?.serviced_by?.name || 
                                 order.action_report?.serviced_by;
              const cancelledBy = order.action_report?.cancelled_by_user?.name;

              return (
                <div
                  key={order.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-gray-900 text-sm">
                          {order.job_order_no}
                        </div>
                        {statusBadge(status)}
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {order.department?.name || '—'}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {order.signature_name && order.requester?.role === 'admin' && (
                          <div>
                            <span className="font-medium">Signatory:</span> {order.signature_name}
                          </div>
                        )}

                        <div>
                          <span className="font-medium">Requested by:</span> {requestedBy ? (
                            order.signature_name && order.requester?.role === 'admin' 
                              ? `(${requestedBy})` 
                              : requestedBy
                          ) : '—'}
                        </div>
                      </div>

                      {status === 'Ongoing' && acceptedBy && (
                        <div className="flex items-center text-sm text-blue-700">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Accepted by:</span> {acceptedBy}
                        </div>
                      )}

                      {status === 'Completed' && servicedBy && (
                        <div className="flex items-center text-sm text-green-700">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Serviced by:</span> {servicedBy}
                        </div>
                      )}

                      {status === 'Cancelled' && cancelledBy && (
                        <div className="flex items-center text-sm text-red-700">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="font-medium">Cancelled by:</span> {cancelledBy}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <span className="text-sm text-gray-700 px-4">
              Page <span className="font-semibold">{page}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </span>

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                page === totalPages
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Department Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Department Distribution
          </h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            <button
              onClick={() => setSelectedTab('distribution')}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                selectedTab === 'distribution' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Distribution
            </button>
            <button
              onClick={() => setSelectedTab('pie')}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                selectedTab === 'pie' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Graph
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'distribution' && (
            <JobOrderDepartmentSummary orders={filtered} />
          )}

          {selectedTab === 'pie' && (
          <div className="py-6">
            {Array.isArray(pieData.labels) &&
            pieData.labels.length === 1 &&
            pieData.labels[0] === 'No Data' ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-14 px-6 text-center">
                <svg
                  className="mb-4 h-14 w-14 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-600">
                  No department data to display
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Try clearing filters or adjusting the date range
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Department Distribution
                    </h3>
                    <p className="text-xs text-gray-500">
                      Overview of department-based records
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,1fr)_320px]">
                  {/* Chart */}
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-[420px]">
                      <Pie
                        data={pieData}
                        options={{
                          ...getPieChartOptions(),
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            ...getPieChartOptions()?.plugins,
                            legend: {
                              display: false,
                            },
                          },
                        }}
                        height={360}
                      />
                    </div>
                  </div>

                  {/* Custom Legend */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">
                      Departments
                    </h4>

                    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {pieData.labels?.map((label, index) => {
                        const value = pieData.datasets?.[0]?.data?.[index] ?? 0;
                        const total =
                          pieData.datasets?.[0]?.data?.reduce(
                            (sum, item) => sum + Number(item || 0),
                            0
                          ) || 0;
                        const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                        const color =
                          pieData.datasets?.[0]?.backgroundColor?.[index] || "#9CA3AF";

                        return (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className="h-3 w-3 flex-shrink-0 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="truncate text-sm text-gray-700" title={label}>
                                {label}
                              </span>
                            </div>

                            <div className="ml-3 flex-shrink-0 text-right">
                              <div className="text-sm font-semibold text-gray-800">
                                {value}
                              </div>
                              <div className="text-xs text-gray-400">{percentage}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
