import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dynamoAuthService from '../services/dynamoAuthService';

import AuthImage from '../images/auth-image.jpg';
import AuthDecoration from '../images/auth-decoration.png';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await dynamoAuthService.requestPasswordReset(email);
      if (result.success) {
        setMessage(result.message);
        // For demo purposes, show the reset token
        // In production, this would be sent via email
        setResetToken(result.resetToken);
        setShowResetForm(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await dynamoAuthService.resetPasswordWithToken(resetToken, newPassword);
      if (result.success) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white dark:bg-slate-900">

      <div className="relative md:flex">

        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            {/* Header */}
            <div className="flex-1">
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link className="block" to="/signin">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <defs>
                      <linearGradient x1="28.538%" y1="20.229%" x2="100%" y2="108.156%" id="logo-a">
                        <stop stopColor="#A5B4FC" stopOpacity="0" offset="0%" />
                        <stop stopColor="#A5B4FC" offset="100%" />
                      </linearGradient>
                      <linearGradient x1="88.638%" y1="29.267%" x2="22.42%" y2="100%" id="logo-b">
                        <stop stopColor="#38BDF8" stopOpacity="0" offset="0%" />
                        <stop stopColor="#38BDF8" offset="100%" />
                      </linearGradient>
                    </defs>
                    <rect fill="#6366F1" width="32" height="32" rx="16" />
                    <path d="M18.277.16C26.035 1.267 32 7.938 32 16c0 8.837-7.163 16-16 16a15.937 15.937 0 01-10.426-3.863L18.277.161z" fill="#4F46E5" />
                    <path d="M7.404 2.503l18.339 26.19A15.93 15.93 0 0116 32C7.163 32 0 24.837 0 16 0 10.327 2.952 5.344 7.404 2.503z" fill="url(#logo-a)" />
                    <path d="M2.223 24.14L29.777 7.86A15.926 15.926 0 0132 16c0 8.837-7.163 16-16 16-5.864 0-10.991-3.154-13.777-7.86z" fill="url(#logo-b)" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6">Reset your Password ✨</h1>
              
              {!showResetForm ? (
                /* Request Reset Form */
                <form onSubmit={handleRequestReset}>
                  <div className="space-y-4">
                    {error && (
                      <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded">{error}</div>
                    )}
                    {message && (
                      <div className="text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">{message}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address <span className="text-rose-500">*</span></label>
                      <input 
                        id="email" 
                        className="form-input w-full" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button 
                      type="submit" 
                      className="btn bg-indigo-500 hover:bg-indigo-600 text-white whitespace-nowrap" 
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Reset Password Form */
                <form onSubmit={handleResetPassword}>
                  <div className="space-y-4">
                    {error && (
                      <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded">{error}</div>
                    )}
                    {message && (
                      <div className="text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">{message}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reset_token">Reset Token</label>
                      <input 
                        id="reset_token" 
                        className="form-input w-full bg-slate-100 dark:bg-slate-700" 
                        type="text" 
                        value={resetToken}
                        readOnly
                      />
                      <p className="text-xs text-slate-500 mt-1">Copy this token (in production, this would be sent via email)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="new_password">New Password <span className="text-rose-500">*</span></label>
                      <input 
                        id="new_password" 
                        className="form-input w-full" 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="confirm_password">Confirm New Password <span className="text-rose-500">*</span></label>
                      <input 
                        id="confirm_password" 
                        className="form-input w-full" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 space-x-3">
                    <button 
                      type="button" 
                      className="btn border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      onClick={() => {
                        setShowResetForm(false);
                        setResetToken('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setMessage('');
                        setError('');
                      }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn bg-indigo-500 hover:bg-indigo-600 text-white" 
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link to="/signin" className="text-sm text-indigo-500 hover:text-indigo-600">
                  ← Back to Sign In
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img className="object-cover object-center w-full h-full" src={AuthImage} width="760" height="1024" alt="Authentication" />
          <img className="absolute top-1/4 left-0 -translate-x-2 ml-8 hidden lg:block" src={AuthDecoration} width="218" height="224" alt="Authentication decoration" />
        </div>

      </div>

    </main>
  );
}

export default ResetPassword;