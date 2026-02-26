import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import JobOrderForm from './JobOrderForm';
import JobOrderList from './JobOrderList';
import JobOrderReports from './JobOrderReports';
import JobOrderStatusPage from './JobOrderStatusPage'; // ✅ ADDED
import UserList from './UserList';
import Signatories from './Signatories';
import Login from './Login';
import Notification from './Notification';
import UserJobHistory from './UserJobHistory';

export default function App() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [newPendingJobs, setNewPendingJobs] = useState([]); // Track new pending jobs globally
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const isAuthPage = location.pathname === '/login';
  const isAdmin = user?.role === 'admin';

  /* ---------------- GLOBAL NOTIFICATION ---------------- */
  const showNotification = (type, title, message) => {
    const id = Date.now();

    const newNotification = { id, type, title, message };

    setNotifications((prev) => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition
     ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  const RequireAdmin = ({ children }) => {
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">

      {/* ---------------- NOTIFICATIONS ---------------- */}
      <div className="fixed top-5 right-5 z-[9999] w-full max-w-xs pointer-events-none">
        <div className="flex flex-col space-y-3 max-h-[400px] overflow-y-auto">
          {[...notifications].reverse().map((notification, index) => (
            <Notification
              key={`${notification.id}-${index}`}  // Combine ID and index for uniqueness
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

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : (
              <>
                {!isAuthPage && (
                  <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                      <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                          Technical Hardware System
                        </h1>
                        <p className="text-xs text-gray-500">
                          Job Order for Technical Request
                        </p>
                      </div>

                      <nav className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
                        <NavLink to="/" end className={navLinkClass}>
                          Job Orders
                        </NavLink>
                        <NavLink to="/create" className={navLinkClass}>
                          New Request
                        </NavLink>
                        {!isAdmin && (
                          <NavLink to="/history" className={navLinkClass}>
                            History
                          </NavLink>
                        )}
                        {isAdmin && (
                          <>
                            <NavLink to="/reports" className={navLinkClass}>
                              Reports
                            </NavLink>
                            <NavLink to="/users" className={navLinkClass}>
                              Users
                            </NavLink>
                            <NavLink to="/signatories" className={navLinkClass}>
                              Signatories
                            </NavLink>
                          </>
                        )}
                      </nav>
                    </div>
                  </header>
                )}

                <main className="flex-1">
                  <div className="max-w-6xl mx-auto px-6 py-10">
                    <Routes>
                      {/* MAIN LIST */}
                      <Route
                        path="/"
                        element={<JobOrderList showNotification={showNotification} setNewPendingJobs={setNewPendingJobs} newPendingJobs={newPendingJobs} />}
                      />

                      {/* CREATE */}
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
                        path="/history"
                        element={<UserJobHistory showNotification={showNotification} />}
                      />

                      <Route
                        path="/reports/status/:status"
                        element={<JobOrderStatusPage showNotification={showNotification} />}
                      />

                      {/* REPORTS */}
                      <Route
                        path="/reports"
                        element={
                          <RequireAdmin>
                            <JobOrderReports />
                          </RequireAdmin>
                        }
                      />

                      {/* USERS */}
                      <Route
                        path="/users"
                        element={
                          <RequireAdmin>
                            <UserList />
                          </RequireAdmin>
                        }
                      />

                      {/* SIGNATORIES */}
                      <Route
                        path="/signatories"
                        element={
                          <RequireAdmin>
                            <Signatories />
                          </RequireAdmin>
                        }
                      />

                      {/* FALLBACK */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </main>

                <div className="text-center py-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/login';
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Logout
                  </button>
                </div>

                {!isAuthPage && (
                  <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
                    © {new Date().getFullYear()} IT Support Office • Internal Use Only
                  </footer>
                )}
              </>
            )
          }
        />
      </Routes>
    </div>
  );
}