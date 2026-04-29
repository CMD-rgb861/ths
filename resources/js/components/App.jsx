import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import JobOrderForm from './JobOrderForm';
import JobOrderList from './JobOrderList';
import JobOrderReports from './JobOrderReports';
import JobOrderStatusPage from './JobOrderStatusPage';
import UserList from './UserList';
import Signatories from './Signatories';
import Login from './Login';
import Notification from './Notification';
import UserJobHistory from './UserJobHistory';
import UserPendingConfirmation from './UserPendingConfirmation';
import WelcomePage from './WelcomePage';
import ConfirmModal from './ConfirmModal';
import SerialNumberHistory from './SerialNumberHistory';
import SoftwareHistory from './SoftwareHistory'; // Add this import

// Utility function for role check
function isRole(user, roleName) {
  if (!user) return false;
  if (Array.isArray(user.roles)) {
    // roles can be array of strings or objects
    return user.roles.some(r => (typeof r === 'string' ? r : r.name) === roleName);
  }
  return false;
}

export default function App() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [newPendingJobs, setNewPendingJobs] = useState([]);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    user = null;
  }

  // Use preferredRole if set and user has both roles
  const preferredRole = localStorage.getItem('preferredRole');
  const roles = user?.roles || [];
  let isAdmin = false;
  let isTechnician = false;
  const hasDualRole = roles.includes('admin') && roles.includes('technician');

  if (hasDualRole && preferredRole) {
    isAdmin = preferredRole === 'admin';
    isTechnician = preferredRole === 'technician';
  } else {
    isAdmin = roles.includes('admin');
    isTechnician = roles.includes('technician');
  }
  const isPrivileged = isAdmin || isTechnician;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/forgot_pass';

  const showNotification = useCallback((type, title, message) => {
    const id = Date.now();
    const newNotification = { id, type, title, message };

    setNotifications((prev) => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  }, []);

  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-sm transition-all duration-200'
      : 'px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200';

  const RequirePrivileged = ({ children }) => {
    if (!isPrivileged) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const RequireAdmin = ({ children }) => {
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Memoize the main content to prevent re-renders when notifications change
  const mainContent = useMemo(() => (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route
        path="/*"
        element={
          !token ? (
            <Navigate to="/login" replace />
          ) : (
            <>
              {!isAuthPage && (
                <header className="sticky top-0 z-40 bg-white shadow-sm">
                  <div className="px-6 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-16">
                      {/* Logo & Title */}
                      <div className="flex items-center space-x-4">
                        <img
                          src="/images/cmt-logo.png"
                          alt="CMT Logo"
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                            Technical Hardware System
                          </h1>
                          <p className="text-xs text-gray-500 leading-tight">
                            Job Order Management Portal
                          </p>
                        </div>
                      </div>

                      {/* User Info & Logout */}
                      <div className="flex items-center space-x-4">
                        {user && (
                          <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <span className="text-sm font-semibold text-blue-700">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-900 leading-tight">
                                {user?.name || 'User'}
                              </p>
                              <p className="text-xs text-gray-500 leading-tight capitalize">
                                {Array.isArray(user?.roles)
                                  ? user.roles.map(r => typeof r === 'string' ? r : r.name).join(', ')
                                  : (typeof user?.role === 'object'
                                    ? user.role?.name
                                    : user?.role || 'Staff')}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Switch Role button for dual-role users */}
                        {hasDualRole && (
                          <button
                            onClick={() => setShowSwitchConfirm(true)}
                            className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Switch Role"
                          >
                            Switch Role
                          </button>
                        )}
                        <button
                          onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Logout"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="border-t border-gray-200">
                      <nav className="flex space-x-1 py-2 overflow-x-auto">
                        <NavLink to="/" end className={navLinkClass}>
                          <span className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Job Orders</span>
                          </span>
                        </NavLink>
                        <NavLink to="/create" className={navLinkClass}>
                          <span className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>New Request</span>
                          </span>
                        </NavLink>
                        {!isPrivileged && (
                          <>
                            <NavLink to="/pending-confirmations" className={navLinkClass}>
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Pending Confirmation</span>
                              </span>
                            </NavLink>
                            <NavLink to="/history" className={navLinkClass}>
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>History</span>
                              </span>
                            </NavLink>
                          </>
                        )}
                        {isPrivileged && (
                          <>
                            <NavLink to="/reports" className={navLinkClass}>
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Reports</span>
                              </span>
                            </NavLink>
                            {/* Show Serial History for both admin and technician */}
                            <NavLink to="/serial-history" className={navLinkClass}>
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span>Serial History</span>
                              </span>
                            </NavLink>
                            {/* Add Software History link */}
                            <NavLink to="/software-history" className={navLinkClass}>
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Software History</span>
                              </span>
                            </NavLink>
                            {isAdmin && (
                              <>
                                <NavLink to="/users" className={navLinkClass}>
                                  <span className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span>Users</span>
                                  </span>
                                </NavLink>
                                <NavLink to="/signatories" className={navLinkClass}>
                                  <span className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Signatories</span>
                                  </span>
                                </NavLink>
                              </>
                            )}
                          </>
                        )}
                      </nav>
                    </div>
                  </div>
                </header>
              )}

              <main className="flex-1 bg-gray-50">
                <div className="px-6 sm:px-8 lg:px-12 py-8">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <JobOrderList
                          showNotification={showNotification}
                          setNewPendingJobs={setNewPendingJobs}
                          newPendingJobs={newPendingJobs}
                          isAdmin={isPrivileged} // <-- use isPrivileged here
                          isTechnician={isTechnician}
                          user={user}
                        />
                      }
                    />
                    <Route
                      path="/create"
                      element={
                        <JobOrderForm
                          showNotification={showNotification}
                          userRole={user?.role}
                        />
                      }
                    />
                    <Route
                      path="/pending-confirmations"
                      element={<UserPendingConfirmation showNotification={showNotification} />}
                    />
                    <Route
                      path="/history"
                      element={<UserJobHistory showNotification={showNotification} />}
                    />
                    <Route
                      path="/reports/status/:status"
                      element={<JobOrderStatusPage showNotification={showNotification} />}
                    />
                    {/* Add this route for service status cards */}
                    <Route
                      path="/reports/service-status/:status"
                      element={<JobOrderStatusPage showNotification={showNotification} />}
                    />
                    <Route
                      path="/reports"
                      element={
                        <RequirePrivileged>
                          <JobOrderReports isAdmin={isPrivileged} user={user} showNotification={showNotification} />
                        </RequirePrivileged>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <RequireAdmin>
                          <UserList />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/signatories"
                      element={
                        <RequireAdmin>
                          <Signatories showNotification={showNotification} />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/serial-history"
                      element={<SerialNumberHistory />}
                    />
                    {/* Add Software History route */}
                    <Route
                      path="/software-history"
                      element={<SoftwareHistory />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </main>

              {!isAuthPage && (
                <footer className="bg-white border-t border-gray-200">
                  <div className="px-6 sm:px-8 lg:px-12 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 space-y-2 sm:space-y-0">
                      <p>© {new Date().getFullYear()} IT Support Office. All rights reserved.</p>
                      <p className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Internal Use Only</span>
                      </p>
                    </div>
                  </div>
                </footer>
              )}
            </>
          )
        }
      />
    </Routes>
  ), [token, isAuthPage, isPrivileged, isTechnician, isAdmin, user, navLinkClass, showNotification, newPendingJobs, showSwitchConfirm]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-[9999] w-full max-w-sm pointer-events-none">
        <div className="flex flex-col space-y-2">
          {[...notifications].reverse().map((notification, index) => (
            <Notification
              key={`${notification.id}-${index}`}
              id={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              onClose={(id) =>
                setNotifications((prev) =>
                  prev.filter((notif) => notif.id !== id)
                )
              }
            />
          ))}
        </div>
      </div>

      {mainContent}

      {/* Confirmation Modal for Switch Role */}
      <ConfirmModal
        isOpen={showSwitchConfirm}
        title="Switch Role"
        message="Are you sure you want to switch your role? You will be redirected to the role selection page."
        confirmText="Yes, Switch"
        cancelText="Cancel"
        onConfirm={() => {
          setShowSwitchConfirm(false);
          localStorage.removeItem('preferredRole');
          window.location.href = '/welcome';
        }}
        onCancel={() => setShowSwitchConfirm(false)}
      />
    </div>
  );
}