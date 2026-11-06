import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { usePage } from '@inertiajs/react';

// ✅ Corrected relative path: from pages/GeneralServiceRequest/ → components/modals/
import ConfirmModal from '../../components/modals/ConfirmModal';

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-sm transition-all duration-200'
    : 'px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200';

export default function GJORNavigationPanel({ role: roleProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = usePage().props;
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  const user = useMemo(() => {
    if (auth?.user) return auth.user;
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, [auth?.user]);

  const roles = useMemo(() => {
    if (!user || !Array.isArray(user.roles)) return [];
    return user.roles
      .map((r) => (typeof r === 'string' ? r : r?.name))
      .filter(Boolean);
  }, [user]);

  // Role is derived internally unless explicitly passed
  const role = useMemo(() => {
    if (roleProp) return roleProp;
    const preferred = localStorage.getItem('preferredRole');
    if (preferred) return preferred;
    if (roles.includes('admin')) return 'admin';
    return 'user';
  }, [roleProp, roles]);

  const isAdmin = role === 'admin';
  const hasDualRole = roles.includes('admin') && roles.includes('technician');
  const isItsrmsSystem = [
    '/job-orders',
    '/create',
    '/history',
    '/pending-confirmations',
    '/reports',
    '/serial-history',
    '/software-history',
    '/users',
    '/signatories',
  ].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const isWebsiteInformationSystem = location.pathname.startsWith('/requests/website-information');
  const isGjorSystem = location.pathname.startsWith('/requests/general-service');
  const isWipurSupervisor = Boolean(auth?.user?.is_wipur_supervisor ?? user?.is_wipur_supervisor ?? false);
  const displayRoleLabel = isWebsiteInformationSystem && isWipurSupervisor
    ? 'User-Supervisor'
    : roles.join(', ') || user?.role || 'Staff';

  const items = [
    {
      label: 'Dashboard',
      to: isAdmin
        ? '/requests/general-service/admin'
        : '/requests/general-service/user',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'New Request',
      to: '/requests/general-service/new-request',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'History',
      to: '/requests/general-service/history',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {role === 'user' ? (
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out">
                <NavLink
                  to="/job-orders"
                  className={() =>
                    `relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-250 ease-out ${
                      isItsrmsSystem
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-white hover:text-slate-800'
                    }`
                  }
                >
                  <span className={`absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-blue-600 transition-all duration-250 ${isItsrmsSystem ? 'opacity-100' : 'opacity-0'}`} />
                  <img
                    src="/images/cmt-logo.png"
                    alt="ITSRMS Logo"
                    className="h-6 w-6 object-contain"
                  />
                  <div className="text-left">
                    <div className="text-sm font-semibold leading-tight">IT Service Request & Maintenance System</div>
                    <div className="text-[10px] leading-tight text-inherit opacity-85">IT Job Order Management Portal</div>
                  </div>
                </NavLink>

                <NavLink
                  to="/requests/website-information/user"
                  className={() =>
                    `relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-250 ease-out ${
                      isWebsiteInformationSystem
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-white hover:text-slate-800'
                    }`
                  }
                >
                  <span className={`absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-blue-600 transition-all duration-250 ${isWebsiteInformationSystem ? 'opacity-100' : 'opacity-0'}`} />
                  <img
                    src="/images/lnu_logo.png"
                    alt="WIPUR Logo"
                    className="h-6 w-6 object-contain"
                  />
                  <div className="text-left">
                    <div className="text-sm font-semibold leading-tight">Website Information Posting/Update Request</div>
                    <div className="text-[10px] leading-tight text-inherit opacity-85">WIPUR Management Portal</div>
                  </div>
                </NavLink>

                <NavLink
                  to="/requests/general-service/user"
                  className={() =>
                    `relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-250 ease-out ${
                      isGjorSystem
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-white hover:text-slate-800'
                    }`
                  }
                >
                  <span className={`absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-blue-600 transition-all duration-250 ${isGjorSystem ? 'opacity-100' : 'opacity-0'}`} />
                  <img
                    src="/images/lnu_logo.png"
                    alt="GJOR Logo"
                    className="h-6 w-6 object-contain"
                  />
                  <div className="text-left">
                    <div className="text-sm font-semibold leading-tight">General Job Order Request System</div>
                    <div className="text-[10px] leading-tight text-inherit opacity-85">GJOR Management Portal</div>
                  </div>
                </NavLink>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <img
                  src="/images/lnu_logo.png"
                  alt="LNU Logo"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                    General Job Order Request System
                  </h1>
                  <p className="text-xs text-gray-500 leading-tight">
                    GJOR Management Portal
                  </p>
                </div>
              </div>
            )}

            {/* Right: user chip · switch role · logout */}
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
                      {displayRoleLabel}
                    </p>
                  </div>
                </div>
              )}

              {hasDualRole && (
                <button
                  onClick={() => setShowSwitchConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Switch Role"
                >
                  Switch Role
                </button>
              )}

              <form
                method="POST"
                action={route('logout')}
                onSubmit={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('preferredRole');
                }}
              >
                <input type="hidden" name="_token" value={csrfToken} />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Nav row — only the page tabs now */}
          <div className="border-t border-gray-200">
            <nav className="flex space-x-1 py-2 overflow-x-auto">
              {items.map(({ label, icon, to }) => (
                <NavLink key={label} to={to} end className={navLinkClass}>
                  <span className="flex items-center space-x-2">
                    {icon}
                    <span>{label}</span>
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={showSwitchConfirm}
        title="Switch Role"
        message="Are you sure you want to switch your role? You will be redirected to the role selection page."
        confirmText="Yes, Switch"
        cancelText="Cancel"
        tone="primary"
        onConfirm={() => {
          setShowSwitchConfirm(false);
          localStorage.removeItem('preferredRole');
          window.location.href = '/dashboard/welcome';
        }}
        onCancel={() => setShowSwitchConfirm(false)}
      />
    </>
  );
}