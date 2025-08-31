import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../../config/api-config';

function ExternalUserLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    admin_key: searchParams.get('admin_key') || '',
    admin_key_id: searchParams.get('admin_key_id') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    success: searchParams.get('success') || '',
    limit: parseInt(searchParams.get('limit')) || 100
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: false,
    lastKey: null,
    totalCount: 0
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async (lastKey = null, resetPagination = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      
      if (lastKey) {
        params.append('last_key', JSON.stringify(lastKey));
      }

      const response = await fetch(buildApiUrl(`${ENDPOINTS.adminLogs}?${params}`));
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (resetPagination || !lastKey) {
          setLogs(data.logs || []);
        } else {
          setLogs(prev => [...prev, ...(data.logs || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          hasMore: data.hasMore,
          lastKey: data.lastEvaluatedKey,
          totalCount: data.count || 0
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch logs. Please check your connection to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        newSearchParams.append(k, v);
      }
    });
    setSearchParams(newSearchParams);
    
    // Reset pagination
    setPagination(prev => ({ ...prev, currentPage: 1, lastKey: null }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs(null, true);
  };

  const loadMoreLogs = () => {
    if (pagination.hasMore && pagination.lastKey) {
      fetchLogs(pagination.lastKey);
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      admin_key: '',
      admin_key_id: '',
      start_date: '',
      end_date: '',
      success: '',
      limit: 100
    };
    setFilters(clearedFilters);
    setSearchParams({});
    setPagination(prev => ({ ...prev, currentPage: 1, lastKey: null }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (success) => {
    return success 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    External User Creation Logs
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                    Comprehensive audit trail of all external user creation activities
                  </p>
                  <div className="flex items-center mt-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {pagination.totalCount > 0 ? `${pagination.totalCount} log entries` : 'No logs found'}
                  </div>
                </div>
                <button
                  onClick={() => fetchLogs(null, true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 16 16">
                    <path d="M8 3a5 5 0 0 0-5 5H1l3.5 3.5L7.5 8H6a2 2 0 1 1 2 2v2a4 4 0 1 0-4-4H1a7 7 0 1 1 7 7v-2a5 5 0 0 0 0-10z" />
                  </svg>
                  Refresh Logs
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Filter Logs</h3>
              <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Key
                  </label>
                  <input
                    type="text"
                    value={filters.admin_key}
                    onChange={(e) => handleFilterChange('admin_key', e.target.value)}
                    placeholder="Enter admin key"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Admin Key ID
                  </label>
                  <input
                    type="text"
                    value={filters.admin_key_id}
                    onChange={(e) => handleFilterChange('admin_key_id', e.target.value)}
                    placeholder="Enter admin key ID"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Success Status
                  </label>
                  <select
                    value={filters.success}
                    onChange={(e) => handleFilterChange('success', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Successful</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Results Limit
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={50}>50 results</option>
                    <option value={100}>100 results</option>
                    <option value={200}>200 results</option>
                    <option value={500}>500 results</option>
                  </select>
                </div>
                
                <div className="flex items-end space-x-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-6 py-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </form>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        User Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Admin Key Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Error Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {logs.map((log, index) => (
                      <tr key={log.log_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.success)}`}>
                            {getStatusIcon(log.success)} {log.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 dark:text-slate-100">
                            <div className="font-medium">{log.user_first_name} {log.user_last_name}</div>
                            <div className="text-slate-500 dark:text-slate-400">{log.user_email}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              Role: {log.user_role} | Status: {log.user_status}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 dark:text-slate-100">
                            <div className="font-medium">{log.admin_key_id}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs">
                              {log.metadata?.admin_key_description || 'Legacy Key'}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              Usage: {log.metadata?.admin_key_usage_before || 0} → {log.metadata?.admin_key_usage_after || 0}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          {log.error_message ? (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              <div className="font-medium">Error:</div>
                              <div className="text-xs">{log.error_message}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-green-600 dark:text-green-400">No errors</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Empty state */}
              {logs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No logs found</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Try adjusting your filters or create some external users to see logs.
                  </p>
                </div>
              )}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreLogs}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? 'Loading...' : 'Load More Logs'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ExternalUserLogs;
