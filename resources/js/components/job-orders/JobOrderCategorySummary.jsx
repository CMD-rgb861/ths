import React from 'react';

export default function JobOrderCategorySummary({ orders = [] }) {
  // Count categories
  const categoryCounts = {};
  orders.forEach(order => {
    if (Array.isArray(order.categories)) {
      order.categories.forEach(cat => {
        if (cat?.name) {
          categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + 1;
        }
      });
    }
  });

  const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Count</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-gray-500 italic" colSpan={2}>No category data</td>
              </tr>
            ) : (
              sorted.map(([cat, count]) => (
                <tr key={cat}>
                  <td className="px-6 py-4 text-sm text-gray-700">{cat}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
