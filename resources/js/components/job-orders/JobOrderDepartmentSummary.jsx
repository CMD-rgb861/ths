import React from 'react';

export default function JobOrderDepartmentSummary({ orders = [] }) {
  /* ---------------- AGGREGATE COUNTS ---------------- */
  const counts = {};
  const defaultDepartments = ['REO', 'Admission Office', 'VPSD'];

  defaultDepartments.forEach((department) => {
    counts[department] = 0;
  });

  orders.forEach((o) => {
    const name = o.department?.name?.trim();
    if (!name) return;
    counts[name] = (counts[name] || 0) + 1;
  });

  /* ---------------- SORT ---------------- */
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = sorted.length ? sorted[0][1] : 0;

  /* ---------------- OPTIONAL: TOP N + OTHERS ---------------- */
  const TOP_LIMIT = 10;

  const visibleDepartments =
    sorted.length > TOP_LIMIT
      ? [
          ...sorted.slice(0, TOP_LIMIT),
          [
            'Others',
            sorted
              .slice(TOP_LIMIT)
              .reduce((sum, [, count]) => sum + count, 0),
          ],
        ]
      : sorted;

  /* ---------------- EMPTY STATE ---------------- */
  if (visibleDepartments.length === 0 || total === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-7 w-7 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          <p className="text-sm font-semibold text-gray-700">
            No department data available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Job orders will appear here once records are created
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-gray-500 italic" colSpan={2}>
                  No department data
                </td>
              </tr>
            ) : (
              sorted.map(([dept, count]) => (
                <tr key={dept}>
                  <td className="px-6 py-4 text-sm text-gray-700">{dept}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                    {count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}