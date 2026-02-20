import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CategorySelector({ value = [], onChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define default categories in case API call fails
  const defaultCategories = [
    { id: 1, name: 'Computer Hardware' },
    { id: 2, name: 'Information System' },
    { id: 3, name: 'Internet Connection' },
    { id: 4, name: 'Laptop' },
    { id: 5, name: 'IP/VoIP Phone' },
    { id: 6, name: 'Local Area Network' },
    { id: 7, name: 'Printer' },
    { id: 8, name: 'Software' },
    { id: 9, name: 'Others' },  // The 'Others' category can also be included for description input
  ];

  /* ---------------- FETCH CATEGORIES ---------------- */
  useEffect(() => {
    axios.get('/categories')  // Make sure this is the correct API route to get categories
      .then(res => {
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setCategories(rows);
      })
      .catch(() => setCategories([]))  // Fallback to empty categories if API fails
      .finally(() => setLoading(false));
  }, []);

  // Combine API categories with default ones (in case API returns empty or no data)
  const mergedCategories = categories.length > 0 ? categories : defaultCategories;

  /* ---------------- TOGGLE CATEGORY ---------------- */
  const toggleCategory = (category) => {
    const exists = value.find(v => v.id === category.id);

    if (exists) {
      onChange(value.filter(v => v.id !== category.id));
    } else {
      onChange([
        ...value,
        { id: category.id, other_description: '' }
      ]);
    }
  };

  /* ---------------- UPDATE "OTHERS" ---------------- */
  const updateOther = (id, text) => {
    onChange(
      value.map(v =>
        v.id === id
          ? { ...v, other_description: text }
          : v
      )
    );
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-4">
      {/* Section Label */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Categories
        </h3>
        <p className="text-xs text-gray-500">
          Select one or more categories applicable to this request.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-sm text-gray-500">
          Loading categories...
        </div>
      )}

      {/* Categories List */}
      {!loading && mergedCategories.length > 0 && (
        <div className="space-y-3">
          {mergedCategories.map(cat => {
            const selected = value.find(v => v.id === cat.id);

            return (
              <div
                key={cat.id}
                className={`border rounded-lg p-3 transition
                  ${selected
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white'
                  }`}
              >

                {/* Checkbox Row */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleCategory(cat)}
                    className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-300"
                  />
                  <span className="text-sm text-gray-800">
                    {cat.name}
                  </span>
                </label>

                {/* Others Input */}
                {cat.name === 'Others' && selected && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={selected.other_description}
                      onChange={e =>
                        updateOther(cat.id, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && mergedCategories.length === 0 && (
        <div className="text-sm text-gray-500 border border-gray-200 rounded-lg p-3 bg-gray-50">
          No categories available.
        </div>
      )}

    </div>
  );
}
