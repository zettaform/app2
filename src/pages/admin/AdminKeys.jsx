import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../../config/api-config';

function AdminKeys() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminKeys, setAdminKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state for creating/editing keys
  const [formData, setFormData] = useState({
    user_creation_limit: '',
    description: '',
    expires_in_days: '365',
    key_status: 'active'
  });

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Check if user is admin after loading is complete
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch admin keys
  const fetchAdminKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(ENDPOINTS.adminKeys));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        // Fix: Backend returns 'admin_keys', not 'keys'
        setAdminKeys(result.admin_keys || []);
      } else {
        setError(result.error || 'Failed to fetch admin keys');
      }
    } catch (error) {
      console.error('Error fetching admin keys:', error);
      setError(error.message || 'Failed to fetch admin keys');
    } finally {
      setLoading(false);
    }
  };

  // Create new admin key
  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      
      const keyData = {
        description: formData.description,
        user_creation_limit: parseInt(formData.user_creation_limit),
        expires_at: formData.expires_in_days ? Math.floor(new Date(formData.expires_in_days).getTime() / 1000) : null,
        key_status: 'active'
      };

      const response = await fetch(buildApiUrl(ENDPOINTS.adminKeys), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowCreateModal(false);
        setFormData({ user_creation_limit: '', description: '', expires_in_days: '365', key_status: 'active' });
        fetchAdminKeys(); // Refresh the list
      } else {
        setError(result.error || 'Failed to create admin key');
      }
    } catch (error) {
      console.error('Error creating admin key:', error);
      setError(error.message || 'Failed to create admin key');
    } finally {
      setCreating(false);
    }
  };

  // Update admin key
  const handleUpdateKey = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      
      const updateData = {
        description: formData.description,
        user_creation_limit: parseInt(formData.user_creation_limit),
        expires_at: formData.expires_in_days ? Math.floor(new Date(formData.expires_in_days).getTime() / 1000) : null,
        key_status: formData.key_status
      };

      const response = await fetch(buildApiUrl(`${ENDPOINTS.adminKeys}/${editingKey.admin_key_id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowEditModal(false);
        setEditingKey(null);
        setFormData({ user_creation_limit: '', description: '', expires_in_days: '365', key_status: 'active' });
        fetchAdminKeys(); // Refresh the list
      } else {
        setError(result.error || 'Failed to update admin key');
      }
    } catch (error) {
      console.error('Error updating admin key:', error);
      setError(error.message || 'Failed to update admin key');
    } finally {
      setCreating(false);
    }
  };

  // Delete admin key
  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this admin key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(buildApiUrl(`${ENDPOINTS.adminKeys}/${keyId}`), {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchAdminKeys(); // Refresh the list
      } else {
        setError(result.error || 'Failed to delete admin key');
      }
    } catch (error) {
      console.error('Error deleting admin key:', error);
      setError(error.message || 'Failed to delete admin key');
    }
  };

  // Edit key
  const handleEdit = (key) => {
    setEditingKey(key);
    setFormData({
      user_creation_limit: key.user_creation_limit.toString(),
      description: key.description || '',
      expires_in_days: '365', // Default for editing
      key_status: key.key_status || 'active'
    });
    setShowEditModal(true);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get status badge
  const getStatusBadge = (key_status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[key_status] || statusClasses.inactive}`}>
        {key_status}
      </span>
    );
  };

  // Get usage percentage
  const getUsagePercentage = (used, limit) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  useEffect(() => {
    fetchAdminKeys();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Keys Management</h1>
                  <p className="text-slate-600 dark:text-slate-400">Manage API keys for external user creation</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="hidden xs:block ml-2">Create New Key</span>
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Admin Keys Table */}
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
              <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Admin Keys</h2>
              </header>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-slate-600 dark:text-slate-400">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                </div>
              ) : adminKeys.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-500 dark:text-slate-400">No admin keys found. Create your first key to get started.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-auto w-full">
                    <thead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Admin Key</div>
                        </th>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Description</div>
                        </th>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Usage</div>
                        </th>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Status</div>
                        </th>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Created</div>
                        </th>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Expires</div>
                        </th>
                        <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-left">Actions</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-700">
                      {adminKeys.map((key) => (
                        <tr key={key.admin_key_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            <div className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {key.admin_key.substring(0, 20)}...
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(key.admin_key)}
                              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                              title="Copy to clipboard"
                            >
                              Copy full key
                            </button>
                          </td>
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            <div className="text-slate-800 dark:text-slate-100">
                              {key.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            <div className="text-center">
                              <div className={`font-semibold ${getUsagePercentage(key.users_created, key.user_creation_limit)}`}>
                                {key.users_created} / {key.user_creation_limit}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {key.user_creation_limit - key.users_created} remaining
                              </div>
                            </div>
                          </td>
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            {getStatusBadge(key.key_status)}
                          </td>
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            <div className="text-slate-600 dark:text-slate-400">
                              {new Date(key.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            <div className="text-slate-600 dark:text-slate-400">
                              {formatDate(key.expires_at)}
                            </div>
                          </td>
                          <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(key)}
                                className="btn-xs bg-indigo-500 hover:bg-indigo-600 text-white"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => navigate(`/admin/logs?admin_key_id=${key.admin_key_id}`)}
                                className="btn-xs bg-green-500 hover:bg-green-600 text-white"
                                title="View logs for this key"
                              >
                                View Logs
                              </button>
                              <button
                                onClick={() => handleDeleteKey(key.admin_key_id)}
                                className="btn-xs bg-rose-500 hover:bg-rose-600 text-white"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Create New Admin Key</h2>
            </div>
            
            <form onSubmit={handleCreateKey} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  User Creation Limit *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.user_creation_limit}
                  onChange={(e) => setFormData({...formData, user_creation_limit: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Optional description for this key"
                  rows="3"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={formData.expires_in_days}
                  onChange={(e) => setFormData({...formData, expires_in_days: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="365"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Key'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn bg-slate-300 hover:bg-slate-400 text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Key Modal */}
      {showEditModal && editingKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Edit Admin Key</h2>
            </div>
            
            <form onSubmit={handleUpdateKey} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  User Creation Limit *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.user_creation_limit}
                  onChange={(e) => setFormData({...formData, user_creation_limit: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Optional description for this key"
                  rows="3"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.key_status || editingKey.key_status}
                  onChange={(e) => setFormData({...formData, key_status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                >
                  {creating ? 'Updating...' : 'Update Key'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingKey(null);
                  }}
                  className="flex-1 btn bg-slate-300 hover:bg-slate-400 text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminKeys;
