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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Department Summary
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Job orders grouped by department
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 px-3 py-2 text-right">
            <div className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
              Total
            </div>
            <div className="text-lg font-bold leading-none text-blue-700">
              {total}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="max-h-[420px] overflow-y-auto px-4 py-3">
        <div className="space-y-2.5">
          {visibleDepartments.map(([department, count], index) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const relativeWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div
                key={`${department}-${index}`}
                className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 transition hover:border-gray-200 hover:bg-gray-100/70"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-700">
                        {index + 1}
                      </span>

                      <span
                        className="truncate text-sm font-semibold text-gray-900"
                        title={department}
                      >
                        {department}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="inline-flex min-w-[48px] items-center justify-center rounded-full bg-blue-100 px-2.5 py-1 text-sm font-bold text-blue-700">
                      {count}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${relativeWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Departments Shown
          </span>
          <span className="text-sm font-bold text-gray-900">
            {visibleDepartments.length}
          </span>
        </div>
      </div>
    </div>
  );
}