// resources/js/components/JobOrderStatusSummary.jsx

import { useNavigate } from 'react-router-dom';

export default function JobOrderStatusSummary({ totals = {}, statusOptions = [] }) {
  const navigate = useNavigate();

  // Define the desired order for the cards
  const CARD_ORDER = ['Pending', 'Ongoing', 'Cancelled', 'Completed'];

  // Helper to get id by name
  const getStatusIdByName = (name) => {
    const found = statusOptions.find(s => s.name === name);
    return found ? found.id : name.toLowerCase();
  };

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
    Unserviceable: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      badge: 'bg-gray-200 text-gray-800',
    },
    // fallback style
    Default: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      badge: 'bg-gray-200 text-gray-800',
    },
  };

  // Sort status names according to CARD_ORDER, then append any others
  const statusNames = [
    ...CARD_ORDER.filter(status => Object.keys(totals).includes(status)),
    ...Object.keys(totals).filter(status => !CARD_ORDER.includes(status)),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statusNames.map((status) => {
        // Comment out the Unserviceable card for now
        if (status === 'Unserviceable') {
          // return null; // uncomment this line to hide the card
          return null;
        }
        const count = totals[status] || 0;
        const style = styles[status] || styles.Default;
        const statusId = getStatusIdByName(status);

        return (
          <button
            key={status}
            onClick={() =>
              navigate(`/reports/status/${statusId}`)
            }
            className={`rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition text-left ${style.bg}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="text-sm font-medium text-gray-500">{status}</div>
              {/* Show loading spinner if count === null (loading), else show count */}
              {count === null ? (
                <div className="mt-2 flex items-center justify-center h-10">
                  <svg className="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className={`mt-2 text-3xl font-semibold ${style.text}`}>{count}</div>
              )}
              <div className={`mt-2 px-3 py-1 text-xs font-medium rounded-full ${style.badge}`}>
                {status}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}