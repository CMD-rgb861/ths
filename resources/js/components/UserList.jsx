import { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
      }, []);

      const fetchUsers = async (query = '') => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        
        const res = await axios.get('/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: query ? { search: query, limit: 10 } : {}
        });

        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setUsers(rows);
      } catch (error) {
        console.error(error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };


  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchUsers(value);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Users List</h1>
        <p className="text-sm text-gray-500">Search and manage system users</p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search users..."
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && <div className="p-6 text-sm text-gray-500">Loading users...</div>}

        {!loading && users.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No users found.</div>
        )}

        {!loading && users.length > 0 && (
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
