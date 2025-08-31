import React, { useState, useEffect } from 'react';
import apiUserService from '../../services/apiUserService';
import s3AvatarService from '../../services/s3AvatarService';

function EditUserModal({ open, setOpen, user, onUpdated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'user',
    status: 'active',
    avatar: 'goku'
  });
  const [errors, setErrors] = useState({});
  const [updating, setUpdating] = useState(false);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'user',
        status: user.status || 'active',
        avatar: user.avatar || 'goku'
      });
      setErrors({});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update user
    setUpdating(true);
    try {
      const result = await apiUserService.updateUser(user.id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        avatar: formData.avatar
      });

      if (result.success) {
        setOpen(false);
        onUpdated();
      } else {
        setErrors({ general: result.error || 'Failed to update user' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to update user' });
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const availableAvatars = s3AvatarService.getPredefinedAvatars();

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Edit User</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update user information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className={`form-input w-full ${errors.first_name ? 'border-rose-500' : ''}`}
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter first name"
            />
            {errors.first_name && (
              <p className="text-xs text-rose-500 mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className={`form-input w-full ${errors.last_name ? 'border-rose-500' : ''}`}
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter last name"
            />
            {errors.last_name && (
              <p className="text-xs text-rose-500 mt-1">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              className={`form-input w-full ${errors.email ? 'border-rose-500' : ''}`}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <select
              className="form-select w-full"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              className="form-select w-full"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Avatar
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded p-2">
              {availableAvatars.slice(0, 24).map((avatar) => (
                <button
                  key={avatar.name}
                  type="button"
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    formData.avatar === avatar.name
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => handleInputChange('avatar', avatar.name)}
                  title={avatar.displayName}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.displayName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/fallback-avatar.svg';
                    }}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Selected: {availableAvatars.find(a => a.name === formData.avatar)?.displayName || 'Unknown'}
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded">
              <p className="text-sm text-rose-600 dark:text-rose-400">{errors.general}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
          <button
            type="button"
            className="btn border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            onClick={() => setOpen(false)}
            disabled={updating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
            onClick={handleSubmit}
            disabled={updating}
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;
