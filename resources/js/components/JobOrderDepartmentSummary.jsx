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

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-4">

      {/* Section Header */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          Job Orders by Department
        </h2>
        <p className="text-xs text-gray-500">
          Total requests grouped per department
        </p>
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-500 bg-gray-50">
          No department data available.
        </div>
      )}

      {/* List */}
      {sorted.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y bg-white">
          {sorted.map(([department, count]) => (
            <div
              key={department}
              className="flex justify-between items-center px-4 py-3 text-sm"
            >
              <span className="text-gray-700">
                {department}
              </span>

              <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
