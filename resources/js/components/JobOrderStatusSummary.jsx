// resources/js/components/JobOrderStatusSummary.jsx

import { useNavigate } from 'react-router-dom';

export default function JobOrderStatusSummary({ orders = [] }) {
  const navigate = useNavigate();

  const counts = {
    Pending: 0,
    Ongoing: 0,
    Completed: 0,
    Cancelled: 0,
    Unserviceable: 0, // ✅ ADDED
  };

  // COUNT STATUSES
  orders.forEach(o => {
    const status = o.action_report?.status || 'Pending';

    if (counts[status] !== undefined) {
      counts[status]++;
    }
  });

  const styles = {
    Pending: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    Ongoing: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
    },
    Completed: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
    },
    Cancelled: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
    },
    Unserviceable: { // ✅ ADDED
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      badge: 'bg-gray-200 text-gray-800',
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {Object.entries(counts).map(([status, count]) => {
        const style = styles[status];

        return (
          <button
            key={status}
            onClick={() =>
              navigate(`/reports/status/${status.toLowerCase()}`)
            }
            className={`rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition text-left ${style.bg}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  {status}
                </div>

                <div className={`mt-2 text-3xl font-semibold ${style.text}`}>
                  {count}
                </div>
              </div>

              <div
                className={`px-3 py-1 text-xs font-medium rounded-full ${style.badge}`}
              >
                {status}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}