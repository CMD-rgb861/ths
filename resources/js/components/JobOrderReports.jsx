import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobOrderStatusSummary from './JobOrderStatusSummary';
import JobOrderDepartmentSummary from './JobOrderDepartmentSummary';
import JobOrderCategorySummary from './JobOrderCategorySummary';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PER_PAGE = 5;
const STATUSES = ['Pending', 'Ongoing', 'Completed', 'Cancelled'];
// Service status options for CSV export (based on action_report.action_taken)
const SERVICE_STATUS_FILTERS = [
  {
    key: 'service_unserviceable',
    label: 'Unserviceable',
    match: 'Unserviceable',
    dotClass: 'bg-gray-600',
  },
  // {
  //   key: 'service_unserviceable_without_form',
  //   label: 'Unserviceable without Form',
  //   match: 'Unserviceable without Form',
  //   dotClass: 'bg-gray-400',
  // },
  {
    key: 'service_closed',
    label: 'Service Closed',
    // Backend stores this as "Closed" in action_taken
    match: 'Closed',
    dotClass: 'bg-gray-800',
  },
];
const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Cancelled by User': 'bg-red-100 text-red-800',
  Unserviceable: 'bg-gray-200 text-gray-800',
  // fallback
  Default: 'bg-gray-100 text-gray-700',
};

export default function JobOrderReports({ isAdmin, user, showNotification }) {
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
  const [statusOptions, setStatusOptions] = useState([]);
  const [serviceTotals, setServiceTotals] = useState({
    unserviceable: null,
    closed: null,
  });

  const getOrderStatus = (order) => order.request_status?.name || order.action_report?.status || order.status || '—';

  // Fetch job orders data (for dashboard/summary only)
  useEffect(() => {
    setLoading(true);

    const fetchAllOrders = async () => {
      try {
        // Only fetch all for dashboard/summary
        let response = await axios.get('/job-orders', {
          params: {
            per_page: 1000,
            status_filter: 'all_status_page',
          }
        });
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        setOrders(rows);
        setFiltered(rows);
        setTotals(response.data.totals || {});
      } catch (error) {
        setOrders([]);
        setFiltered([]);
        // Set all status counts to null for loading state in cards
        setTotals({
          Pending: null,
          Ongoing: null,
          Completed: null,
          Cancelled: null,
          Unserviceable: null,
        });
      } finally {
        setLoading(false);
      }
    };

    // Set all status counts to null for loading state in cards
    setTotals({
      Pending: null,
      Ongoing: null,
      Completed: null,
      Cancelled: null,
      Unserviceable: null,
    });

    fetchAllOrders();
  }, []);

  // Fetch IT Director information
  useEffect(() => {
    axios.get('/signatory/it-director')
      .then(res => setItDirector(res.data))
      .catch(() => setItDirector(null));
  }, []);

  // Fetch request statuses for dynamic filtering
  useEffect(() => {
    axios.get('/request-statuses')
      .then(res => {
        if (Array.isArray(res.data)) setStatusOptions(res.data);
        else if (Array.isArray(res.data?.data)) setStatusOptions(res.data.data);
        else setStatusOptions([]);
      })
      .catch(() => setStatusOptions([]));
  }, []);

  // Fetch counts for Service Status cards from backend
  useEffect(() => {
    const fetchServiceTotals = async () => {
      try {
        const keys = [
          'unserviceable',
          'closed',
        ];
        const results = await Promise.all(
          keys.map(key =>
            axios.get('/job-orders/service-status', { params: { service_status: key } })
          )
        );
        setServiceTotals({
          unserviceable: results[0].data.count,
          closed: results[1].data.count,
        });
      } catch (e) {
        setServiceTotals({
          unserviceable: 0,
          closed: 0,
        });
      }
    };
    fetchServiceTotals();
  }, []);

  // Apply filters to job orders
  useEffect(() => {
    let data = [...orders];

    if (filters.status) {
      data = data.filter(o => getOrderStatus(o) === filters.status);
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
        getOrderStatus(o).toLowerCase().includes(term)
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

  // Generate category distribution data
  const getCategoryPieData = (data) => {
    const categoryCounts = {};
    data.forEach(order => {
      if (Array.isArray(order.categories)) {
        order.categories.forEach(cat => {
          if (cat?.name) {
            categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + 1;
          }
        });
      }
    });

    const labels = Object.keys(categoryCounts);
    const values = Object.values(categoryCounts);

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

  const categoryPieData = useMemo(() => getCategoryPieData(filtered), [filtered]);

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

    // Detect if we're filtering by request status or service status
    const serviceFilter = SERVICE_STATUS_FILTERS.find(f => f.key === statusFilter);

    if (statusFilter) {
      if (serviceFilter) {
        // Filter by service status (action_report.action_taken)
        dataToExport = dataToExport.filter(o =>
          (o.action_report?.action_taken || '').toLowerCase() === serviceFilter.match.toLowerCase()
        );
      } else {
        // Default: filter by request status
        dataToExport = dataToExport.filter(o => getOrderStatus(o) === statusFilter);
      }
    }

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Job Order No',
      'Department',
      'Request Status',
      'Service Status',
      'Requested By',
      'Signatory',
      'Accepted By',
      'Serviced By',
      'Cancelled By',
      'Date Created',
    ];

    const rows = dataToExport.map(order => {
      const requestStatus = getOrderStatus(order) || 'Pending';
      const serviceStatus = order.action_report?.action_taken || '';
      const requestedBy = order.requester?.name || '';
      const signatory = order.signature_name || '';

      // Derive serviced-by name (technician or raw value)
      const servicedByRaw = order.action_report?.serviced_by?.name || 
                        order.action_report?.serviced_by || '';
      const servicedByTrim = (servicedByRaw || '').toString().trim();

      // Default Accepted By logic (IT Director fallback for normal serviced jobs)
      let acceptedBy = order.action_report?.accepted_by_user?.name || 
                        itDirector?.user?.name || 
                        itDirector?.name || '';

      // If the job is "Closed" and there is no technician, treat it as
      // administratively declined/closed and *suppress* Accepted By in CSV.
      const serviceStatusKey = (serviceStatus || '').toString().trim().toLowerCase();
      if (serviceStatusKey === 'closed' && servicedByTrim === '') {
        acceptedBy = '';
      }

      const servicedBy = servicedByRaw;

	  const cancelledBy = order.action_report?.cancelled_by?.name || 
		itDirector?.user?.name || 
		itDirector?.name;
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
        requestStatus,
        serviceStatus,
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
    
    const filenameBase = serviceFilter
      ? serviceFilter.label.toLowerCase().replace(/\s+/g, '_')
      : (statusFilter ? statusFilter.toLowerCase().replace(/\s+/g, '_') : 'all');

    const filename = `job_orders_${filenameBase}_${new Date().toISOString().split('T')[0]}.csv`;
    
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

                    {/* Service Status export options */}
                    <div className="border-t border-gray-100 my-1"></div>
                    {SERVICE_STATUS_FILTERS.map(option => (
                      <button
                        key={option.key}
                        onClick={() => exportToCSV(option.key)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <span className={`w-2 h-2 rounded-full mr-3 ${option.dotClass}`}></span>
                        {option.label} Only
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
      <JobOrderStatusSummary
        totals={totals}
        statusOptions={statusOptions}
        serviceTotals={serviceTotals}
      />

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
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Status</option>
              {statusOptions.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Job Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Service Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Serviced By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map(order => {
                  const requestStatus = getOrderStatus(order);
                  const serviceStatus = order.action_report?.action_taken || '—';
                  const servicedBy =
                    order.action_report?.serviced_by?.name ||
                    order.action_report?.serviced_by ||
                    '—';
                  const requestedBy =
                    order.signature_name && order.requester?.role === 'admin'
                      ? `(${order.requester?.name})`
                      : order.requester?.name || '—';
                  // Use pill color for request status
                  const pillClass = STATUS_STYLES[requestStatus] || STATUS_STYLES.Default;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {order.job_order_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.department?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {requestedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${pillClass}`}>
                          {requestStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {serviceStatus}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {servicedBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* Distribution Section: Department & Category side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col h-full">
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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[320px]">
                <Pie
                  data={pieData}
                  options={{
                    ...getPieChartOptions(),
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      ...getPieChartOptions()?.plugins,
                      legend: { display: false },
                    },
                  }}
                  height={260}
                />
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <h4 className="mb-3 text-sm font-medium text-gray-700">
                  Departments
                </h4>
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
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
        </div>

        {/* Category Distribution Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col h-full">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Category Distribution
              </h3>
              <p className="text-xs text-gray-500">
                Overview of category-based records
              </p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[320px]">
                <Pie
                  data={categoryPieData}
                  options={{
                    ...getPieChartOptions(),
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      ...getPieChartOptions()?.plugins,
                      legend: { display: false },
                    },
                  }}
                  height={260}
                />
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <h4 className="mb-3 text-sm font-medium text-gray-700">
                  Categories
                </h4>
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {categoryPieData.labels?.map((label, index) => {
                    const value = categoryPieData.datasets?.[0]?.data?.[index] ?? 0;
                    const total =
                      categoryPieData.datasets?.[0]?.data?.reduce(
                        (sum, item) => sum + Number(item || 0),
                        0
                      ) || 0;
                    const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                    const color =
                      categoryPieData.datasets?.[0]?.backgroundColor?.[index] || "#9CA3AF";
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
        </div>
      </div>
    </div>
  );
}


