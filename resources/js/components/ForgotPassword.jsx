import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/school-bg.png')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/75"></div>

      {/* FORGOT PASSWORD CARD */}
      <div className="flex w-full items-center justify-center px-6 relative z-10">
        <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-10">

          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src="/images/cmt-logo.png"  
              alt="Logo"
              className="mx-auto w-28 sm:w-32 md:w-40 mb-4 object-contain"
            />
            <h2 className="text-2xl font-semibold text-gray-900">Forgot Password</h2>
            <p className="text-sm text-gray-500 mt-1">Password reset feature coming soon</p>
          </div>

          {/* Placeholder Content */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg 
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Under Development</p>
                <p className="text-xs text-blue-700 mt-1">
                  The password reset functionality is currently under development. 
                  Please contact your system administrator for password assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder Form (disabled) */}
          <form className="space-y-5 opacity-50 pointer-events-none">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number or Email
              </label>
              <input
                type="text"
                className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your ID number or email"
                disabled
              />
            </div>

            <button
              type="submit"
              disabled
              className="w-3/5 mx-auto block bg-blue-900 text-white py-2.5 rounded-lg font-medium cursor-not-allowed"
            >
              Send Reset Link
            </button>
          </form>

          {/* Back to Login */}
          <p className="text-center text-sm text-gray-700 mt-6">
            <span 
              onClick={() => navigate('/login')}
              className="text-blue-900 font-medium cursor-pointer hover:underline inline-flex items-center space-x-1"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span>Back to Login</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
