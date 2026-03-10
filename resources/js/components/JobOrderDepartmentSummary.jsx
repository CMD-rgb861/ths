export default function JobOrderDepartmentSummary({ orders = [] }) {
  /* ---------------- AGGREGATE COUNTS ---------------- */
  const counts = {};

  // Default departments (REO, Admission Office, VPSD)
  const defaultDepartments = ['REO', 'Admission Office', 'VPSD'];

  // Initialize counts for the default departments
  defaultDepartments.forEach(department => {
    counts[department] = 0; // Initialize counts to 0
  });

  // Aggregate the orders into department counts
  orders.forEach(o => {
    const name = o.department?.name;
    if (!name) return;

    counts[name] = (counts[name] || 0) + 1;
  });

  /* ---------------- SORT (DESCENDING) ---------------- */
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);

  // Calculate total for percentage
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-5">
      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">No department data available</p>
          <p className="text-xs text-gray-400 mt-1">Job orders will appear here once created</p>
        </div>
      )}

      {/* List with Progress Bars */}
      {sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map(([department, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            
            return (
              <div key={department} className="space-y-2">
                {/* Department Name and Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      {department}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">
                      {percentage}%
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                      {count}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total Summary */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Total Job Orders
              </span>
              <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold shadow-sm">
                {total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
