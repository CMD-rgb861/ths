import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('user');
  let user = null;

  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    user = null;
  }

  // Redirect if user does not have both admin and technician roles
  useEffect(() => {
    const roles = user?.roles || [];
    if (!(roles.includes('admin') && roles.includes('technician'))) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleRoleSelect = (role) => {
    // Store preferred role for this session
    localStorage.setItem('preferredRole', role);
    // Redirect to main landing page (App will use preferredRole for UI)
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* Optional: Subtle background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/images/school-bg.png')" }}
        aria-hidden="true"
      />
      <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-10 relative z-10">
        <div className="flex flex-col items-center">
          <img
            src="/images/cmt-logo.png"
            alt="CMT Logo"
            className="w-28 sm:w-32 md:w-40 mb-6 object-contain"
          />

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            You have successfully logged in to the Technical Hardware System Job Order Portal.
          </p>
          <p className="text-xs text-gray-500 mb-8">
            Please select how you want to proceed:
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => handleRoleSelect('technician')}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg text-base font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none transition shadow"
              tabIndex={0}
            >
              Proceed as Technician
            </button>
            <button
              onClick={() => handleRoleSelect('admin')}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition shadow"
              tabIndex={0}
            >
              Proceed as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}