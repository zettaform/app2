import React, { useState } from 'react';
import apiUserService from '../../services/apiUserService';
import s3AvatarService from '../../services/s3AvatarService';
import EditUserModal from './EditUserModal';

function UsersTable({ rows, onRefresh, isAdmin = false, sortConfig, onSort }) {
  const [resettingPassword, setResettingPassword] = useState(null);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const handleResetPassword = async (userId, userEmail) => {
    setResettingPassword(userId);
    setResetMessage('');
    setResetError('');

    try {
      // Request password reset
      const result = await apiUserService.requestPasswordReset(userEmail);
      
      if (result.success) {
        setResetMessage(`Password reset link sent to ${userEmail}. Reset token: ${result.resetToken}`);
      } else {
        setResetError(result.error || 'Failed to send reset link');
      }
    } catch (error) {
      setResetError('Failed to send reset link');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!isAdmin) {
      alert('Only administrators can change user status');
      return;
    }

    const action = newStatus === 'active' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setUpdatingStatus(userId);
    try {
      const result = await apiUserService.updateUser(userId, { status: newStatus });
      if (result.success) {
        onRefresh();
        alert(`User ${action}d successfully`);
      } else {
        alert('Failed to update user status: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update user status: ' + error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await apiUserService.deleteUser(userId);
        if (result.success) {
          onRefresh();
        } else {
          alert('Failed to delete user: ' + result.error);
        }
      } catch (error) {
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  // Sortable column header component
  const SortableHeader = ({ columnKey, children, sortable = true }) => {
    if (!sortable || !onSort) {
      return (
        <div className="font-semibold text-left">{children}</div>
      );
    }

    const isSorted = sortConfig?.key === columnKey;
    const sortDirection = isSorted ? sortConfig.direction : null;

    return (
      <button
        onClick={() => onSort(columnKey)}
        className="font-semibold text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center group"
      >
        {children}
        <div className="ml-1 flex flex-col">
          <svg 
            className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-3 h-3 ${sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
    );
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400',
      inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-400/20 dark:text-slate-400',
      suspended: 'bg-rose-100 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400',
      pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400',
      blocked: 'bg-red-100 text-red-600 dark:bg-red-400/20 dark:text-red-400'
    };
    
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status] || statusClasses.inactive}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      admin: 'bg-purple-100 text-purple-600 dark:bg-purple-400/20 dark:text-purple-400',
      manager: 'bg-blue-100 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400',
      user: 'bg-slate-100 text-slate-600 dark:bg-slate-400/20 dark:text-slate-400'
    };
    
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleClasses[role] || roleClasses.user}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full">
          <thead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="name">User</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="role">Role</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="status">Status</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="created_at">Created</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="updated_at">Updated</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <SortableHeader columnKey="last_login">Last Login</SortableHeader>
              </th>
              <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                <div className="font-semibold text-left">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-700">
            {rows && rows.map((user) => (
              <tr key={user.id}>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3">
                      <img 
                        className="w-10 h-10 rounded-full" 
                        src={user.image} 
                        alt={`${user.name} avatar`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/fallback-avatar.svg';
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">{user.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-slate-800 dark:text-slate-100">{formatDate(user.created_at)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-slate-800 dark:text-slate-100">{formatDate(user.updated_at)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="text-slate-800 dark:text-slate-100">{formatDate(user.last_login)}</div>
                </td>
                <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {/* Edit User Button */}
                    <button
                      className="btn-xs bg-indigo-500 hover:bg-indigo-600 text-white"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    
                    {/* Status Management Dropdown */}
                    {isAdmin && (
                      <div className="relative inline-block text-left">
                        <select
                          className="btn-xs bg-indigo-500 hover:bg-indigo-600 text-white pr-8"
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          disabled={updatingStatus === user.id}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="pending">Pending</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        {updatingStatus === user.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Reset Password Button */}
                    <button
                      className="btn-xs bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleResetPassword(user.id, user.email)}
                      disabled={resettingPassword === user.id}
                    >
                      {resettingPassword === user.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                    
                    {/* Delete User Button */}
                    <button
                      className="btn-xs bg-rose-500 hover:bg-rose-600 text-white"
                      onClick={() => handleDeleteUser(user.id)}
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

      {/* Reset Password Messages */}
      {resetMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-sm">
          <div className="text-sm text-emerald-600 dark:text-emerald-400">
            {resetMessage}
          </div>
          <button
            className="text-xs text-emerald-500 hover:text-emerald-600 mt-2"
            onClick={() => setResetMessage('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {resetError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-sm">
          <div className="text-sm text-rose-600 dark:text-rose-400">
            {resetError}
          </div>
          <button
            className="text-xs text-rose-500 hover:text-rose-600 mt-2"
            onClick={() => setResetError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {(!rows || rows.length === 0) && (
        <div className="text-center py-8">
          <div className="text-slate-500 dark:text-slate-400">No users found</div>
          <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">Add your first user to get started</div>
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        user={editingUser}
        onUpdated={onRefresh}
      />
    </div>
  );
}

export default UsersTable;
