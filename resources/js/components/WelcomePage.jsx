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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
        <img
          src="/images/cmt-logo.png"
          alt="Logo"
          className="mx-auto w-24 mb-6"
        />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </h1>

        <p className="text-gray-600 mb-6">
          You have successfully logged in to the Technical Hardware System Job Order Portal.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => handleRoleSelect('technician')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700 transition"
          >
            Proceed as Technician
          </button>

          <button
            onClick={() => handleRoleSelect('admin')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            Proceed as Admin
          </button>
        </div>
      </div>
    </div>
  );
}