import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ id_number: '', password: '', remember: false });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post('/login', form);
            const token = response.data.token;
            const user = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            window.location.href = '/dashboard';
        } catch (error) {
            if (error.response?.status === 401) {
                setErrors({ general: 'Invalid ID number or password.' });
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'Something went wrong. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Log in" />

            <div
                className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
                style={{ backgroundImage: "url('/images/school-bg.png')" }}
            >
                <div className="absolute inset-0 bg-black/75"></div>

                <div className="flex w-full items-center justify-center px-6 relative z-10">
                    <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-10">
                        <div className="text-center mb-6">
                            <img
                                src="/images/cmt-logo.png"
                                alt="Logo"
                                className="mx-auto w-28 sm:w-32 md:w-40 mb-4 object-contain"
                            />
                            <h2 className="text-2xl font-semibold text-gray-900">Login</h2>
                            <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                {status}
                            </div>
                        )}

                        {errors.id_number && (
                            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                                {errors.id_number}
                            </div>
                        )}
                        {errors.password && (
                            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                                {errors.password}
                            </div>
                        )}
                        {errors.general && (
                            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                                <input
                                    type="text"
                                    name="id_number"
                                    value={form.id_number}
                                    onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                                    className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-blue-900"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.038.338-2.02.93-2.87M6.223 6.223A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.38-.69 2.63-1.875 3.75M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L3 3" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={form.remember}
                                        onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ms-2">Remember me</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-blue-900 underline hover:text-blue-700"
                                    >
                                        Forgot your password?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-60"
                            >
                                {processing ? 'Signing in...' : 'Login'}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white px-2 text-gray-500">or</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="mb-3 text-sm text-gray-600">Login using SSO</p>
                            <a
                                href={route('sso.validate')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:shadow"
                            >
                                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Go to SSO Portal
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
