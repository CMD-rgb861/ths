import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({
    id_number: '',
    password: '',
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Replace '/login' with the full path to your backend endpoint if needed
      const res = await axios.post('/login', form); 

      // Store the token and user data in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Optionally, set the Authorization header globally
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

      // Navigate to the home page or wherever the user should go after login
      navigate('/');

    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Invalid credentials
        setError('Invalid ID number or password.');
      } else {
        // General error
        setError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/school-bg.png')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/75"></div>

      {/* RIGHT SIDE - LOGIN CARD */}
      <div className="flex w-full items-center justify-center px-6 relative z-10">
        <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-10">

          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src="/images/cmt-logo.png"  
              alt="Logo"
              className="mx-auto w-28 sm:w-32 md:w-40 mb-4 object-contain"
            />
            <h2 className="text-2xl font-semibold text-gray-900">Login</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">

            {/* ID Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input
                type="text"
                value={form.id_number}
                onChange={e => setForm({ ...form, id_number: e.target.value })}
                className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-blue-900"
                >
                  {showPassword ? (
                    /* Eye Off */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.038.338-2.02.93-2.87M6.223 6.223A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.38-.69 2.63-1.875 3.75M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L3 3" />
                    </svg>
                  ) : (
                    /* Eye */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-3/5 mx-auto block bg-blue-900 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <span onClick={() => navigate('/forgot_pass')}
              className="text-blue-900 font-medium cursor-pointer hover:underline">
              Forgot Password
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
