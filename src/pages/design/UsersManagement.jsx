import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiUserService from '../../services/apiUserService';
import s3AvatarService from '../../services/s3AvatarService';
import AddUserModal from '../../partials/users/AddUserModal';
import UsersTable from '../../partials/users/UsersTable';
import PaginationClassic from '../../components/PaginationClassic';

function UsersManagement() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users from API
      const result = await apiUserService.listUsers();
      
      if (result.success) {
        const mapped = result.users.map((u, idx) => {
          // Get Dragon Ball Z avatar based on user role
          const avatar = s3AvatarService.getAvatarByName(u.role || 'goku');
          return {
            id: u.user_id,
            image: avatar.url,
            name: `${u.first_name} ${u.last_name}`,
            email: u.email,
            role: u.role,
            status: u.status,
            created_at: u.created_at,
            updated_at: u.updated_at,
            last_login: u.last_login,
            fav: false,
          };
        });
        setRows(mapped);
      } else {
        console.error('Failed to load users:', result.error);
        setRows([]);
      }
    } catch (e) {
      console.error('Failed to load users', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (payload) => {
    setCreating(true);
    try {
      // Create user through API
      const result = await apiUserService.createUser(payload);
      
      if (result.success) {
        setAddOpen(false);
        await refreshUsers();
      } else {
        console.error('Failed to create user:', result.error);
        // Keep modal open; Modal will show inline error
      }
    } catch (e) {
      console.error('Failed to create user', e);
      // Keep modal open; Modal will show inline error
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
            Users Management - Design Copy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            This is a design copy of the users management system for reference purposes.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
            onClick={() => setAddOpen(true)}
          >
            <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="hidden xs:block ml-2">Add User</span>
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading users...
            </div>
          </div>
        ) : (
          <>
            <UsersTable rows={rows} onRefresh={refreshUsers} />
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-700 dark:text-slate-300">{rows.length}</span> users
                </div>
                <PaginationClassic />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        open={addOpen}
        setOpen={setAddOpen}
        onCreated={handleCreateUser}
        creating={creating}
      />
    </div>
  );
}

export default UsersManagement;
