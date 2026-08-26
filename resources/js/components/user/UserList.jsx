// Admin user list page
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [counts, setCounts] = useState({ total: 0, admins: 0, technicians: 0, regular: 0 });
  const [activeFilter, setActiveFilter] = useState(null); // 'all', 'admin', 'technician', 'regular'
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  });

  // Track which users have unsaved role changes
  const [roleChanges, setRoleChanges] = useState({});

  // Track which user is currently being saved
  const [savingUserId, setSavingUserId] = useState(null);

  // Debounce timer for search
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch users and counts when the component mounts
  useEffect(() => {
    fetchUsers();
    fetchCounts();
    fetchRoles();
  }, []);

  // =========================
  // FETCH ROLES
  // =========================
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableRoles(res.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // =========================
  // FETCH COUNTS
  // =========================
  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/users/counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCounts(res.data);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // =========================
  // FETCH USERS - SERVER-SIDE FILTERING
  // =========================
  const fetchUsers = async (query = '', page = 1, filter = null) => {
    if (query && query.length > 100) {
      console.log('Search query is too long');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const params = {
        page: page
      };
      
      if (query) {
        params.search = query;
      }

      // Send filter to server (role parameter)
      if (filter && filter !== 'all') {
        params.role = filter;
      }

      const res = await axios.get('/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params
      });

      // Backend returns paginated data structure
      const userData = res.data.data || [];
      
      // Transform backend data to frontend format
      const transformedUsers = userData.map(user => ({
        ...user,
        role: user.roles && user.roles.length > 0 ? user.roles[0] : 'user'
      }));

      setUsers(transformedUsers);
      
      // Update pagination info
      setPagination({
        currentPage: res.data.current_page || 1,
        lastPage: res.data.last_page || 1,
        perPage: res.data.per_page || 10,
        total: res.data.total || 0
      });

      // Clear any unsaved changes after refreshing the list
      setRoleChanges({});
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEARCH - WITH DEBOUNCE
  // =========================
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search by 300ms
    const timeout = setTimeout(() => {
      fetchUsers(value, 1, activeFilter);
    }, 300);

    setSearchTimeout(timeout);
  };

  // =========================
  // FILTER BY ROLE
  // =========================
  const handleFilterByRole = (filter) => {
    // Don't refetch if same filter
    if (activeFilter === filter) {
      // Toggle off if clicking the same filter
      setActiveFilter(null);
      setSearch('');
      fetchUsers('', 1, null);
      return;
    }

    setActiveFilter(filter);
    setSearch(''); // Clear search when filtering
    fetchUsers('', 1, filter);
  };

  // =========================
  // PAGE CHANGE
  // =========================
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      fetchUsers(search, newPage, activeFilter);
    }
  };

  // =========================
  // SUMMARY COUNTS - Use backend counts
  // =========================
  const totalUsers = counts.total || 0;
  const adminUsers = counts.admins || 0;
  const technicianUsers = counts.technicians || 0;
  const regularUsers = counts.regular || 0; // Now from backend

  // =========================
  // ROLE CHANGE
  // =========================
  const handleRoleChange = (userId, newRole) => {
    setRoleChanges((previous) => ({
      ...previous,
      [userId]: newRole,
    }));
  };

  // =========================
  // CANCEL ROLE CHANGE
  // =========================
  const handleCancelRoleChange = (userId) => {
    setRoleChanges((previous) => {
      const updated = { ...previous };
      delete updated[userId];
      return updated;
    });
  };

  // =========================
  // SAVE ROLE
  // =========================
  const handleSaveRole = async (user) => {
    const newRoleName = roleChanges[user.id];

    if (!newRoleName) {
      return;
    }

    try {
      setSavingUserId(user.id);

      const token = localStorage.getItem('token');

      // Find the role ID for the selected role name
      const selectedRole = availableRoles.find(role => role.name === newRoleName);
      
      if (!selectedRole) {
        throw new Error('Invalid role selected');
      }

      // Send role_id as backend expects
      await axios.put(
        `/users/${user.id}/role`,
        {
          role_id: selectedRole.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Update the user's role locally
      setUsers((previousUsers) =>
        previousUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                roles: [newRoleName],
                role: newRoleName,
                role_ids: [selectedRole.id]
              }
            : currentUser
        )
      );

      // Remove the unsaved change
      setRoleChanges((previous) => {
        const updated = { ...previous };
        delete updated[user.id];
        return updated;
      });

      // Refresh counts after role update
      await fetchCounts();

      // If we're on a filtered view, refresh to keep data consistent
      fetchUsers(search, pagination.currentPage, activeFilter);

    } catch (error) {
      console.error('Error updating user role:', error);

      alert(
        error.response?.data?.message ||
          'Failed to update the user role.'
      );
    } finally {
      setSavingUserId(null);
    }
  };

  // Helper function to get role color
  const getRoleColor = (role) => {
    if (role === 'admin') {
      return 'bg-purple-50 border-purple-200 text-purple-800';
    } else if (role === 'technician') {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else {
      return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  // Helper function to get card border style based on active filter
  const getCardStyle = (filterType) => {
    const baseStyle = 'bg-white border rounded-lg shadow-sm p-5 cursor-pointer transition-all hover:shadow-md';
    if (activeFilter === filterType) {
      return `${baseStyle} border-2 border-blue-500 ring-2 ring-blue-200`;
    }
    return `${baseStyle} border-gray-200`;
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilter(null);
    setSearch('');
    fetchUsers('', 1, null);
  };

  return (
    <div className="space-y-6">

      {/* =========================
          HEADER
      ========================== */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Users List
            </h1>
            <p className="text-gray-600 mt-1">
              Search and manage system users
            </p>
          </div>
          
          {(activeFilter || search) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* =========================
          SUMMARY CARDS - Clickable with Toggle
      ========================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* TOTAL USERS */}
        <div
          className={getCardStyle('all')}
          onClick={() => handleFilterByRole('all')}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Users
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalUsers}
              </p>
            </div>

            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

          </div>
        </div>

        {/* ADMINISTRATORS */}
        <div
          className={getCardStyle('admin')}
          onClick={() => handleFilterByRole('admin')}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Administrators
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-1">
                {adminUsers}
              </p>
            </div>

            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-.657-.052-1.303-.152-1.934z"
                />
              </svg>
            </div>

          </div>
        </div>

        {/* TECHNICIANS */}
        <div
          className={getCardStyle('technician')}
          onClick={() => handleFilterByRole('technician')}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Technicians
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-1">
                {technicianUsers}
              </p>
            </div>

            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

          </div>
        </div>

        {/* REGULAR USERS */}
        <div
          className={getCardStyle('regular')}
          onClick={() => handleFilterByRole('regular')}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Regular Users
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-1">
                {regularUsers}
              </p>
            </div>

            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

          </div>
        </div>

      </div>

      {/* Active filter indicator */}
      {(activeFilter || search) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {activeFilter && (
            <span className="px-2 py-1 bg-white border border-blue-300 rounded-md text-sm text-blue-700">
              Role: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
            </span>
          )}
          
          {search && (
            <span className="px-2 py-1 bg-white border border-blue-300 rounded-md text-sm text-blue-700">
              Search: "{search}"
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear all ×
          </button>
        </div>
      )}

      {/* =========================
          USERS CARD
      ========================== */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">

        {/* SEARCH BAR */}
        <div className="p-6 border-b border-gray-200">

          <div className="relative">

            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 014 7 7 7 0 01-7 7z"
                />
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

        {/* =========================
            LOADING
        ========================== */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">

            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

            <p className="mt-4 text-sm text-gray-500">
              Loading users...
            </p>

          </div>
        )}

        {/* =========================
            NO USERS
        ========================== */}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">

            <svg
              className="h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>

            <p className="text-gray-500 font-medium">
              No users found
            </p>

            <p className="text-gray-400 text-sm mt-1">
              {activeFilter ? `No ${activeFilter} users found matching your criteria` : 'Try adjusting your search criteria'}
            </p>

          </div>
        )}

        {/* =========================
            USER LIST
        ========================== */}
        {!loading && users.length > 0 && (
          <>
            <div className="divide-y divide-gray-200">

              {users.map((user) => {

                const hasRoleChange =
                  Object.prototype.hasOwnProperty.call(
                    roleChanges,
                    user.id
                  );

                const currentRole = hasRoleChange
                  ? roleChanges[user.id]
                  : user.role || 'user';

                const isSaving = savingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >

                    <div className="flex items-center">

                      {/* AVATAR */}
                      <div className="flex-shrink-0 mr-4">

                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">

                          <span className="text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </span>

                        </div>

                      </div>

                      {/* USER INFO */}
                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 mb-1">

                          <p className="text-base font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>

                          {/* Role badge */}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(currentRole)}`}>
                            {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                          </span>

                        </div>

                        <div className="flex items-center text-sm text-gray-500">

                          <svg
                            className="w-4 h-4 mr-1 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>

                          <span className="truncate">
                            {user.email}
                          </span>

                        </div>

                      </div>

                      {/* ROLE + ACTIONS */}
                      <div className="ml-4 flex items-center gap-2">

                        {/* ROLE DROPDOWN */}
                        <select
                          value={currentRole}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value
                            )
                          }
                          disabled={isSaving}
                          className={`px-6 py-2 text-sm font-medium border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${getRoleColor(currentRole)}`}
                        >
                          {availableRoles.length > 0 ? (
                            availableRoles.map((role) => (
                              <option key={role.id} value={role.name}>
                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                              </option>
                            ))
                          ) : (
                            // Fallback options if roles haven't loaded yet
                            <>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="technician">Technician</option>
                            </>
                          )}
                        </select>

                        {/* SAVE + CANCEL */}
                        {hasRoleChange && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveRole(user)
                              }
                              disabled={isSaving}
                              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSaving
                                ? 'Saving...'
                                : 'Save'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleCancelRoleChange(
                                  user.id
                                )
                              }
                              disabled={isSaving}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* =========================
                PAGINATION
            ========================== */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-500">
                Showing {users.length} of {pagination.total} users
                {activeFilter && ` (${activeFilter} filter applied)`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  Page {pagination.currentPage} of {pagination.lastPage}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.lastPage}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}