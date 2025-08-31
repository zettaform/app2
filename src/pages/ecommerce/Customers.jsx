import React, { useEffect, useState } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import DeleteButton from '../../partials/actions/DeleteButton';
import DateSelect from '../../components/DateSelect';
import FilterButton from '../../components/DropdownFilter';
import UsersTable from '../../partials/users/UsersTable';
import PaginationClassic from '../../components/PaginationClassic';
import { useAuth } from '../../contexts/AuthContext';
import apiUserService from '../../services/apiUserService';
import s3AvatarService from '../../services/s3AvatarService';
import AddUserModal from '../../partials/users/AddUserModal';
import { Navigate } from 'react-router-dom';

function Users() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [extraData, setExtraData] = useState({});
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKeyInfo, setShowAdminKeyInfo] = useState(false);
  
  // Enhanced filtering and pagination state
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminKeyFilter, setAdminKeyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filteredRows, setFilteredRows] = useState(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleSelectedItems = (selectedItems) => {
    setSelectedItems([...selectedItems]);
  };

  // Enhanced sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data based on current sort configuration
  const sortData = (data) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle nested properties
      if (sortConfig.key === 'name') {
        aValue = a.name || '';
        bValue = b.name || '';
      }
      
      // Handle date sorting
      if (sortConfig.key.includes('_at') || sortConfig.key.includes('login')) {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      // Handle string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Enhanced filtering function
  const applyFilters = (data) => {
    if (!data) return [];
    
    let filtered = data;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Admin key filter (if we have admin key information)
    if (adminKeyFilter !== 'all') {
      // This would need to be implemented based on your admin key logic
      // For now, we'll filter by role
      if (adminKeyFilter === 'admin') {
        filtered = filtered.filter(user => user.role === 'admin');
      } else if (adminKeyFilter === 'user') {
        filtered = filtered.filter(user => user.role === 'user');
      }
    }
    
    // Date filter
    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at);
        const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
        const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
        
        if (startDate && endDate) {
          return userDate >= startDate && userDate <= endDate;
        } else if (startDate) {
          return userDate >= startDate;
        } else if (endDate) {
          return userDate <= endDate;
        }
        return true;
      });
    }
    
    return filtered;
  };

  // Enhanced pagination function
  const paginateData = (data, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return data.slice(startIndex, endIndex);
  };

  // Apply all transformations: filter, sort, paginate
  const processData = () => {
    if (!rows) return;
    
    const filtered = applyFilters(rows);
    const sorted = sortData(filtered);
    const paginated = paginateData(sorted, currentPage, rowsPerPage);
    
    setFilteredRows(paginated);
    setTotalUsers(filtered.length);
  };

  // Update data when filters, sorting, or pagination changes
  useEffect(() => {
    processData();
  }, [rows, statusFilter, adminKeyFilter, dateFilter, sortConfig, currentPage, rowsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, adminKeyFilter, dateFilter, rowsPerPage]);

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

  useEffect(() => {
    refreshUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Debug modal state changes
    console.log('[Customers] addOpen:', addOpen);
  }, [addOpen]);

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

  const handleCreateExternalUser = async (payload) => {
    setCreating(true);
    try {
      // Create user through external API
      const result = await apiUserService.createExternalUser(payload, adminKey);
      
      if (result.success) {
        setAddOpen(false);
        await refreshUsers();
      } else {
        console.error('Failed to create external user:', result.error);
        // Keep modal open; Modal will show inline error
      }
    } catch (e) {
      console.error('Failed to create external user', e);
      // Keep modal open; Modal will show inline error
    } finally {
      setCreating(false);
    }
  };

  const handleExtraData = async (row) => {
    if (extraData[row.id]) return; // Already fetched
    
    setFetchingData(true);
    try {
      // Simulate API call for extra data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockExtraData = {
        engagement: Math.floor(Math.random() * 100),
        posts: Math.floor(Math.random() * 50),
        followers: Math.floor(Math.random() * 1000),
        score: Math.floor(60 + Math.random() * 40), // 60-100
        status: Math.random() > 0.3 ? 'Active' : 'Inactive',
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
      
      setExtraData(prev => ({
        ...prev,
        [row.id]: mockExtraData
      }));
      
      console.log(`✅ Extra data fetched for ${row.name}:`, mockExtraData);
    } catch (e) {
      console.error('Failed to fetch extra data', e);
    } finally {
      setFetchingData(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setAdminKeyFilter('all');
    setDateFilter({ start: null, end: null });
    setCurrentPage(1);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">

              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Admin User Management 🔐</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Manage all users, suspend/reactivate accounts, and control access</p>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Admin Key Input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    placeholder="Admin Global Key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="form-input w-40 text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setShowAdminKeyInfo(!showAdminKeyInfo)}
                    className="btn-xs bg-slate-500 hover:bg-slate-600 text-white"
                    title="Admin Key Info"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                {/* Add User button */}
                <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => setAddOpen(true)}>
                  <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="hidden xs:block ml-2">Add User</span>
                </button>
              </div>

            </div>

            {/* Admin Key Info */}
            {showAdminKeyInfo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Admin Global Key Information</h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p><strong>Purpose:</strong> Create users externally via API without authentication</p>
                      <p><strong>Usage:</strong> Include in request headers as <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">x-admin-key</code></p>
                      <p><strong>Endpoint:</strong> <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">POST /api/external/users</code></p>
                      <p><strong>Security:</strong> Keep this key secure and only share with authorized systems</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Filters Section */}
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 mb-6">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full form-select border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  {/* Admin Key Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Filter by Role
                    </label>
                    <select
                      value={adminKeyFilter}
                      onChange={(e) => setAdminKeyFilter(e.target.value)}
                      className="w-full form-select border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateFilter.start || ''}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        className="form-input text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={dateFilter.end || ''}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        className="form-input text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  {/* Rows Per Page */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rows per Page
                    </label>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                      className="w-full form-select border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Filter Summary and Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredRows?.length || 0} of {totalUsers} users
                    {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
                    {adminKeyFilter !== 'all' && ` • Role: ${adminKeyFilter}`}
                    {(dateFilter.start || dateFilter.end) && ' • Date filtered'}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={refreshUsers}
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="ml-3 text-slate-500">Loading users...</span>
                </div>
              </div>
            ) : (
              <UsersTable 
                selectedItems={handleSelectedItems} 
                rows={filteredRows || rows} 
                onRefresh={refreshUsers}
                extraData={extraData}
                fetchingData={fetchingData}
                isAdmin={true}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            )}

            {/* Enhanced Pagination */}
            {totalUsers > rowsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.ceil(totalUsers / rowsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      // Show current page, first page, last page, and pages around current
                      const totalPages = Math.ceil(totalUsers / rowsPerPage);
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis for gaps
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 py-2 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm border rounded-md ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalUsers / rowsPerPage)}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Add User Modal */}
            <AddUserModal
              open={addOpen}
              setOpen={setAddOpen}
              onCreated={handleCreateUser}
              onExternalCreated={handleCreateExternalUser}
              creating={creating}
              adminKey={adminKey}
            />

          </div>
        </main>

      </div>

    </div>
  );
}

export default Users;