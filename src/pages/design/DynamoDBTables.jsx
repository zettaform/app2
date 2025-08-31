import React, { useState, useEffect } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../../config/api-config';

function DynamoDBTables() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState(null);
  const [tableContents, setTableContents] = useState([]);
  const [tableContentsLoading, setTableContentsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageKeys, setPageKeys] = useState({}); // Store LastEvaluatedKey for each page

  useEffect(() => {
    fetchTables();
    
    // Auto-refresh data every 10 seconds without re-rendering the entire page
    const interval = setInterval(() => {
      // Only refresh the data, not the entire component
      fetchTablesSilently();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call backend API to get tables with real details
      const response = await fetch(buildApiUrl(ENDPOINTS.tables));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTables(data.tables);
      } else {
        throw new Error(data.error || 'Failed to fetch tables');
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to fetch DynamoDB tables. Please check your connection to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh function that updates data without loading states
  const fetchTablesSilently = async () => {
    try {
      // Call backend API to get tables with real details
      const response = await fetch(buildApiUrl(ENDPOINTS.tables));
      if (!response.ok) {
        console.warn('Silent refresh failed:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update tables without triggering loading state
        setTables(data.tables);
      }
    } catch (err) {
      console.warn('Silent refresh error:', err);
      // Don't show error to user for silent refresh
    }
  };

  const fetchTableContents = async (tableName, page = 1, lastKey = null) => {
    try {
      setTableContentsLoading(true);
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString()
      });
      
      if (lastKey) {
        params.append('lastKey', JSON.stringify(lastKey));
      }

      const response = await fetch(`http://localhost:3001/api/tables/${tableName}/scan?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Store the LastEvaluatedKey for this page
        if (data.lastEvaluatedKey) {
          setPageKeys(prev => ({ ...prev, [page + 1]: data.lastEvaluatedKey }));
        }
        
        if (page === 1) {
          setTableContents(data.items || []);
        } else {
          setTableContents(prev => [...prev, ...(data.items || [])]);
        }
        setLastEvaluatedKey(data.lastEvaluatedKey);
        setHasMore(data.hasMore);
        setCurrentPage(page);
      } else {
        throw new Error(data.error || 'Failed to fetch table contents');
      }
    } catch (err) {
      console.error('Error fetching table contents:', err);
      setError('Failed to fetch table contents. Please try again.');
    } finally {
      setTableContentsLoading(false);
    }
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setTableDetails(table);
    setTableContents([]);
    setCurrentPage(1);
    setLastEvaluatedKey(null);
    setHasMore(false);
  };

  const handleViewContents = async (table) => {
    setSelectedTable(table);
    setTableDetails(table);
    setTableContents([]);
    setCurrentPage(1);
    setLastEvaluatedKey(null);
    setHasMore(false);
    setPageKeys({});
    await fetchTableContents(table.name, 1);
  };

  const goToPage = async (page) => {
    if (page === 1) {
      // Go to first page
      await fetchTableContents(selectedTable.name, 1, null);
    } else if (pageKeys[page]) {
      // Go to specific page using stored LastEvaluatedKey
      await fetchTableContents(selectedTable.name, page, pageKeys[page]);
    } else if (page > currentPage && hasMore) {
      // Load next page
      await fetchTableContents(selectedTable.name, currentPage + 1, lastEvaluatedKey);
    }
  };

  const goToNextPage = async () => {
    if (hasMore && lastEvaluatedKey) {
      await fetchTableContents(selectedTable.name, currentPage + 1, lastEvaluatedKey);
    }
  };

  const goToPreviousPage = async () => {
    if (currentPage > 1 && pageKeys[currentPage - 1]) {
      await fetchTableContents(selectedTable.name, currentPage - 1, pageKeys[currentPage - 1]);
    }
  };

  const handleItemsPerPageChange = async (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setPageKeys({});
    setLastEvaluatedKey(null);
    setHasMore(false);
    // Refetch with new page size
    await fetchTableContents(selectedTable.name, 1, null);
  };

  const loadMoreItems = async () => {
    if (hasMore && lastEvaluatedKey) {
      await fetchTableContents(selectedTable.name, currentPage + 1, lastEvaluatedKey);
    }
  };

  const refreshTables = () => {
    fetchTables();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400';
      case 'CREATING':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400';
      case 'UPDATING':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400';
      case 'DELETING':
        return 'bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400';
    }
  };

  const getBillingModeColor = (mode) => {
    switch (mode) {
      case 'PAY_PER_REQUEST':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400';
      case 'PROVISIONED':
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      if (value.S) return value.S;
      if (value.N) return value.N;
      if (value.BOOL !== undefined) return value.BOOL.toString();
      if (value.L) return `[${value.L.map(formatValue).join(', ')}]`;
      if (value.M) return JSON.stringify(value.M, null, 2);
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error Loading Tables
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={refreshTables}
                        className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/30"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
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
                    DynamoDB Tables Overview
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                    Monitor and manage your AWS DynamoDB tables with real-time updates
                  </p>
                  <div className="flex items-center mt-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Auto-updating data every 10 seconds (no page refresh)
                  </div>
                </div>
                <button
                  onClick={refreshTables}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 16 16">
                    <path d="M8 3a5 5 0 0 0-5 5H1l3.5 3.5L7.5 8H6a2 2 0 1 1 2 2v2a4 4 0 1 1 2 2v2a4 4 0 1 0-4-4H1a7 7 0 1 1 7 7v-2a5 5 0 0 0 0-10z" />
                  </svg>
                  Refresh Tables
                </button>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-600"
                  onClick={() => handleTableClick(table)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {table.displayName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {table.name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewContents(table);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 16 16">
                            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
                          </svg>
                          View Data
                        </button>
                      </div>
                    </div>

                    {/* Table Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {table.recordCount?.toLocaleString() || table.itemCount?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Records
                        </div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatBytes(table.sizeBytes || 0)}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          Size
                        </div>
                      </div>
                    </div>

                    {/* Table Details */}
                                          <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status || table.tableStatus)}`}>
                            {table.status || table.tableStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Billing Mode:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBillingModeColor(table.billingMode)}`}>
                            {table.billingMode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Created:</span>
                          <span className="text-slate-800 dark:text-slate-100 font-medium">
                            {formatDate(table.createdAt || table.creationDateTime)}
                          </span>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Details Modal */}
            {selectedTable && tableDetails && !tableContents.length && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        Table Details: {tableDetails.displayName}
                      </h2>
                      <button
                        onClick={() => setSelectedTable(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-3">Basic Information</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Table Name:</span>
                              <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{tableDetails.name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</span>
                              <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{tableDetails.tableStatus}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Item Count:</span>
                              <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{tableDetails.itemCount?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Table Size:</span>
                              <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{formatBytes(tableDetails.tableSizeBytes || 0)}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing Mode:</span>
                              <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{tableDetails.billingMode}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Created:</span>
                              <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{formatDate(tableDetails.creationDateTime)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Schema */}
                      {tableDetails.keySchema && tableDetails.keySchema.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-3">Key Schema</h3>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                            {tableDetails.keySchema.map((key, index) => (
                              <div key={index} className="flex items-center space-x-4 mb-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {key.AttributeName}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  key.KeyType === 'HASH' 
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
                                    : 'bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400'
                                }`}>
                                  {key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attributes */}
                      {tableDetails.attributes && tableDetails.attributes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-3">Attributes</h3>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {tableDetails.attributes.map((attr, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {attr.AttributeName}
                                  </span>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {attr.AttributeType}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Indexes */}
                      {tableDetails.indexes && tableDetails.indexes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-3">Global Secondary Indexes</h3>
                          <div className="space-y-3">
                            {tableDetails.indexes.map((index, indexIndex) => (
                              <div key={indexIndex} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {index.IndexName}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(index.IndexStatus)}`}>
                                    {index.IndexStatus}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  Projection: {index.Projection.ProjectionType}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table Contents Modal */}
            {selectedTable && tableDetails && tableContents.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        Table Contents: {tableDetails.displayName}
                      </h2>
                      <button
                        onClick={() => setSelectedTable(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-hidden">
                    {/* Table Contents with Scrollability */}
                    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                          <tr>
                            {tableContents.length > 0 && Object.keys(tableContents[0]).map((key) => (
                              <th key={key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                          {tableContents.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-150">
                              {Object.entries(item).map(([key, value]) => (
                                <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                  <div className="max-w-xs truncate" title={formatValue(value)}>
                                    {formatValue(value)}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Enhanced Pagination */}
                    <div className="mt-6 space-y-4">
                      {/* Rows Per Page Selector */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/20 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-4">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Rows per page:
                          </label>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          Showing <span className="text-indigo-600 dark:text-indigo-400 font-bold">{tableContents.length}</span> items on page <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentPage}</span>
                        </div>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPage <= 1 || tableContentsLoading}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            ← Previous
                          </button>
                          
                          <div className="px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            Page {currentPage}
                          </div>
                          
                          <button
                            onClick={goToNextPage}
                            disabled={!hasMore || tableContentsLoading}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Next →
                          </button>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => goToPage(1)}
                            disabled={currentPage <= 1 || tableContentsLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            🏠 First
                          </button>
                          
                          <button
                            onClick={() => setSelectedTable(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 border border-red-300 dark:border-red-700 rounded-lg hover:from-red-200 hover:to-pink-200 dark:hover:from-red-800 dark:hover:to-pink-800 transition-all duration-200"
                          >
                            ✕ Close
                          </button>
                        </div>
                      </div>

                      {/* Loading Indicator */}
                      {tableContentsLoading && (
                        <div className="flex items-center justify-center py-6">
                          <div className="inline-flex items-center px-6 py-3 font-semibold leading-6 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 018 8H4a8 8 0 018-8z"></path>
                            </svg>
                            Loading page {currentPage}...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DynamoDBTables;
