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
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-500">
          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading categories...
        </div>
      )}

      {/* Categories List - Two Column Layout */}
      {!loading && mergedCategories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Computer Hardware to IP/VoIP Phone */}
          <div className="space-y-3">
            {mergedCategories
              .filter(cat => 
                ['Computer Hardware', 'Information System', 'Internet Connection', 'Laptop', 'IP/VoIP Phone'].includes(cat.name)
              )
              .map(cat => {
                const selected = value.find(v => v.id === cat.id);

                return (
                  <div
                    key={cat.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleCategory(cat)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${
                        selected ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {cat.name}
                      </span>
                    </label>
                  </div>
                );
              })}
          </div>

          {/* Right Column: Rest of categories */}
          <div className="space-y-3">
            {mergedCategories
              .filter(cat => 
                !['Computer Hardware', 'Information System', 'Internet Connection', 'Laptop', 'IP/VoIP Phone'].includes(cat.name)
              )
              .map(cat => {
                const selected = value.find(v => v.id === cat.id);

                return (
                  <div
                    key={cat.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleCategory(cat)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${
                        selected ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {cat.name}
                      </span>
                    </label>

                    {/* Others Input */}
                    {cat.name === 'Others' && selected && (
                      <div className="mt-3 pl-8">
                        <input
                          type="text"
                          placeholder="Please specify the service needed..."
                          value={selected.other_description}
                          onChange={e =>
                            updateOther(cat.id, e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && mergedCategories.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-sm text-gray-500">No categories available</p>
        </div>
      )}

    </div>
  );
}
