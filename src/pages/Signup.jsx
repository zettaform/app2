import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import AuthImage from '../images/auth-image.jpg';
import AuthDecoration from '../images/auth-decoration.png';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const { success, error, user } = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      if (success) {
        // Redirect to the first onboarding step
        navigate('/onboarding/1', { replace: true, state: { from: from } });
      } else {
        setSubmitError(error || 'Failed to create an account. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitError(error.toString() || 'Failed to create an account. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              <h1 className="text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6">Create your Account ✨</h1>
              
              {submitError && (
                <div className="mb-6 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm p-4 rounded">
                  {submitError}
                </div>
              )}
              
              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="name">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className={`form-input w-full ${errors.name ? 'border-rose-300' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && <p className="mt-1 text-sm text-rose-500">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`form-input w-full ${errors.email ? 'border-rose-300' : ''}`}
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email}</p>}
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <label className="block text-sm font-medium mb-1" htmlFor="password">
                        Password <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      className={`form-input w-full ${errors.password ? 'border-rose-300' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className={`form-input w-full ${errors.confirmPassword ? 'border-rose-300' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-rose-500">{errors.confirmPassword}</p>}
                  </div>
                  <div className="flex items-center mt-6">
                    <div className="mr-1">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          name="acceptTerms"
                          className={`form-checkbox mt-0.5 ${errors.acceptTerms ? 'border-rose-300' : ''}`}
                          checked={formData.acceptTerms}
                          onChange={handleChange}
                        />
                        <span className="text-sm ml-2">
                          I agree to the <a href="#" className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</a> and <a href="#" className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</a>
                          {errors.acceptTerms && <span className="block text-rose-500 text-sm mt-1">{errors.acceptTerms}</span>}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm">
                    Already have an account?{' '}
                    <Link 
                      to="/signin" 
                      state={{ from: location.state?.from }}
                      className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      Sign In
                    </Link>
                  </div>
                  <button
                    type="submit"
                    className="btn bg-indigo-500 hover:bg-indigo-600 text-white ml-3 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </form>

              {/* Social Login */}
              <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">
                  Or sign up with
                </div>
                <div className="flex justify-center space-x-4">
                  <button type="button" className="btn w-full flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300">
                    <svg className="w-4 h-4 fill-current text-[#4285F4] shrink-0" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    <span className="ml-2">Google</span>
                  </button>
                  <button type="button" className="btn w-full flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300">
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
                      <path d="M8.363 1.5a.5.5 0 0 1 0-1H14.5A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-2.637v-5.29h2.334l.349-2.708h-2.683V8.37c0-.98.275-1.62 1.562-1.62h1.23V4.309c-.215-.06-.81-.17-1.667-.17-1.817 0-3.096 1.05-3.096 3.033v1.5H5.637v2.708h2.401V15H1.5A1.5 1.5 0 0 1 0 13.5v-13A1.5 1.5 0 0 1 1.5 0h6.863z" />
                    </svg>
                    <span className="ml-2">Facebook</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img className="object-cover object-center w-full h-full" src={AuthImage} width="760" height="1024" alt="Authentication" />
          <img className="absolute top-1/4 left-0 -translate-x-1/2 ml-8 hidden lg:block" src={AuthDecoration} width="218" height="224" alt="Authentication decoration" />
        </div>

      </div>

    </main>
  );
}

export default Signup;