import React, { useState } from 'react';
import ModalBasic from '../../components/ModalBasic';

function AddCustomerModal({ open, setOpen, onCreated, creating }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onCreated(formData);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', location: '' });
    setErrors({});
    setOpen(false);
  };

  return (
    <ModalBasic isOpen={open} setIsOpen={setOpen} title="Add New Customer">
      <div className="px-5 py-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                className={`form-input w-full ${errors.name ? 'border-rose-300' : ''}`}
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter customer's full name"
                disabled={creating}
              />
              {errors.name && (
                <div className="text-xs mt-1 text-rose-500">{errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                className={`form-input w-full ${errors.email ? 'border-rose-300' : ''}`}
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                disabled={creating}
              />
              {errors.email && (
                <div className="text-xs mt-1 text-rose-500">{errors.email}</div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="location">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                id="location"
                name="location"
                className={`form-input w-full ${errors.location ? 'border-rose-300' : ''}`}
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., 🇺🇸 New York, US"
                disabled={creating}
              />
              {errors.location && (
                <div className="text-xs mt-1 text-rose-500">{errors.location}</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap justify-end space-x-2 mt-6">
            <button
              className="btn-sm border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
              type="button"
              onClick={handleClose}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              className="btn-sm bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
              type="submit"
              disabled={creating}
            >
              {creating ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBasic>
  );
}

export default AddCustomerModal;
