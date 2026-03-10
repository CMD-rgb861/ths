import { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch users when the component mounts (empty dependency array)
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users with the search query (if provided)
  const fetchUsers = async (query = '') => {
    if (query && query.length > 100) {  // Limit query length to 100 characters
      console.log('Search query is too long');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: query ? { search: query, limit: 10 } : {},
      });

      const rows = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setUsers(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  // Handle the search input change
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchUsers(value); // Fetch users based on the updated search value
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Users List</h1>
        <p className="text-gray-600 mt-1">Search and manage system users</p>
      </div>

      {/* Search and Results Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading users...</p>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 font-medium">No users found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      {user.role && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {user.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}