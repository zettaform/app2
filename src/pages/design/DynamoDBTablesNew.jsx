import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../../config/api-config';

function DynamoDBTablesNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [pageKeys, setPageKeys] = useState({});
  const [currentPageData, setCurrentPageData] = useState([]);
  const [loadingContents, setLoadingContents] = useState(false);

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchTablesSilently();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fetch tables with loading state
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(buildApiUrl(ENDPOINTS.tables));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTables(result.tables || []);
        setTotalTables(result.count || 0);
      } else {
        setError(result.error || 'Failed to fetch tables');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError(error.message || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch for auto-refresh (no loading state)
  const fetchTablesSilently = async () => {
    try {
      const response = await fetch(buildApiUrl(ENDPOINTS.tables));
      const data = await response.json();
      
      if (data.success) {
        setTables(data.tables);
      }
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  // Fetch table contents with pagination
  const fetchTableContents = async (tableName, resetPagination = false) => {
    try {
      setLoadingContents(true);
      
      if (resetPagination) {
        setCurrentPage(1);
        setPageKeys({});
        setCurrentPageData([]);
      }

      const lastKey = resetPagination ? undefined : pageKeys[currentPage - 1];
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString()
      });
      
      if (lastKey) {
        params.append('lastKey', JSON.stringify(lastKey));
      }

      const response = await fetch(`http://localhost:3001/api/tables/${tableName}/scan?${params}`);
      const data = await response.json();

      if (data.success) {
        // Store the LastEvaluatedKey for the next page
        if (data.lastEvaluatedKey) {
          setPageKeys(prev => ({
            ...prev,
            [currentPage]: data.lastEvaluatedKey
          }));
        }

        setCurrentPageData(data.items || []);
        setTotalItems(data.count || data.items?.length || 0);
      } else {
        setError(data.error || 'Failed to fetch table contents');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Error fetching table contents:', err);
    } finally {
      setLoadingContents(false);
    }
  };

  // Handle table selection
  const handleTableClick = (table) => {
    setSelectedTable(table);
    setShowModal(true);
    fetchTableContents(table.name, true);
  };

  // Pagination functions
  const goToPage = (page) => {
    if (page >= 1 && page <= Math.ceil(totalItems / itemsPerPage)) {
      setCurrentPage(page);
      fetchTableContents(selectedTable.name, false);
    }
  };

  const goToNextPage = () => {
    if (pageKeys[currentPage]) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchTableContents(selectedTable.name, true);
  };

  // Filter tables based on active filter
  const getFilteredTables = () => {
    if (activeFilter === 'all') return tables;
    
    return tables.filter(table => {
      const tableName = table.name.toLowerCase();
      if (activeFilter === 'dev') return tableName.startsWith('dev-');
      if (activeFilter === 'admin') return tableName.includes('admin');
      if (activeFilter === 'user') return tableName.includes('user') || tableName.includes('customer');
      if (activeFilter === 'other') return !tableName.startsWith('dev-') && !tableName.includes('admin') && !tableName.includes('user') && !tableName.includes('customer');
      return true;
    });
  };

  // Get table icon and color based on table type
  const getTableIcon = (table) => {
    const tableName = table.name.toLowerCase();
    
    // Create 12 different icon types for variety
    const iconTypes = [
      // Database/Table themed icons
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M8 2h24c1.1 0 2 .9 2 2v32c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm2 2v28h20V4H10z"/>
            <path d="M12 8h16v2H12V8zm0 4h16v2H12v-2zm0 4h16v2H12v-2zm0 4h12v2H12v-2z"/>
          </svg>
        ),
        gradient: 'from-blue-500 to-blue-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C10.06 2 2 10.06 2 20s8.06 18 18 18 18-8.06 18-18S29.94 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.51 0-10 4.49-10 10s4.49 10 10 10 10-4.49 10-10-4.49-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
        ),
        gradient: 'from-green-500 to-green-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2L4 10v8c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12v-8L20 2zm-2 20l-4-4 1.41-1.41L18 19.17V8h2v11.17l2.59-2.58L24 18l-6 6z"/>
          </svg>
        ),
        gradient: 'from-red-500 to-red-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
          </svg>
        ),
        gradient: 'from-purple-500 to-purple-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2L2 8v4c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V8L20 2z"/>
            <path d="M20 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-yellow-500 to-yellow-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-indigo-500 to-indigo-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-pink-500 to-pink-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 28c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-teal-500 to-teal-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 28c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 32c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-orange-500 to-orange-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 28c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 32c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 36c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-cyan-500 to-cyan-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 28c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 32c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 36c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 40c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-emerald-500 to-emerald-300'
      },
      {
        icon: (
          <svg className="w-10 h-10 fill-current text-white" viewBox="0 0 40 40">
            <path d="M20 2C8.95 2 2 8.95 2 20s6.95 18 18 18 18-6.95 18-18S31.05 2 20 2zm0 32c-7.73 0-14-6.27-14-14S12.27 6 20 6s14 6.27 14 14-6.27 14-14 14z"/>
            <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M20 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M20 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 28c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 32c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 36c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 40c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            <path d="M20 44c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        ),
        gradient: 'from-rose-500 to-rose-300'
      }
    ];
    
    // Use table name hash to consistently assign icons
    let hash = 0;
    for (let i = 0; i < tableName.length; i++) {
      hash = ((hash << 5) - hash + tableName.charCodeAt(i)) & 0xffffffff;
    }
    const iconIndex = Math.abs(hash) % iconTypes.length;
    
    return iconTypes[iconIndex];
  };

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
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
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
                DynamoDB Tables Overview 🗄️
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage and monitor your AWS DynamoDB tables with real-time statistics
              </p>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm mb-8">
              <div className="p-6">
                
                {/* Filters */}
                <div className="mb-6">
                  <div className="border-b border-slate-200 dark:border-slate-700">
                    <ul className="text-sm font-medium flex flex-nowrap -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-scroll no-scrollbar">
                      <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                        <button
                          onClick={() => setActiveFilter('all')}
                          className={`whitespace-nowrap ${
                            activeFilter === 'all'
                              ? 'text-indigo-500 border-b-2 border-indigo-500 pb-3'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          View All ({tables.length})
                        </button>
                      </li>
                      <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                        <button
                          onClick={() => setActiveFilter('dev')}
                          className={`whitespace-nowrap ${
                            activeFilter === 'dev'
                              ? 'text-indigo-500 border-b-2 border-indigo-500 pb-3'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          Development ({tables.filter(t => t.name.startsWith('dev-')).length})
                        </button>
                      </li>
                      <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                        <button
                          onClick={() => setActiveFilter('admin')}
                          className={`whitespace-nowrap ${
                            activeFilter === 'admin'
                              ? 'text-indigo-500 border-b-2 border-indigo-500 pb-3'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          Admin ({tables.filter(t => t.name.includes('admin')).length})
                        </button>
                      </li>
                      <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                        <button
                          onClick={() => setActiveFilter('user')}
                          className={`whitespace-nowrap ${
                            activeFilter === 'user'
                              ? 'text-indigo-500 border-b-2 border-indigo-500 pb-3'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          Users ({tables.filter(t => t.name.includes('user') || t.name.includes('customer')).length})
                        </button>
                      </li>
                      <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                        <button
                          onClick={() => setActiveFilter('other')}
                          className={`whitespace-nowrap ${
                            activeFilter === 'other'
                              ? 'text-indigo-500 border-b-2 border-indigo-500 pb-3'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          Other ({tables.filter(t => !t.name.startsWith('dev-') && !t.name.includes('admin') && !t.name.includes('user') && !t.name.includes('customer')).length})
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Error display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tables Grid */}
                <section className="pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-12 gap-6">
                    {getFilteredTables().map((table, index) => {
                      const { icon, gradient } = getTableIcon(table);
                      const displayName = table.displayName || table.name;
                      
                      return (
                        <div key={table.name} className="col-span-full xl:col-span-6 2xl:col-span-4 bg-white dark:bg-slate-800 shadow-md rounded-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200">
                          <div className="flex flex-col h-full p-5">
                            <div className="grow">
                              <header className="flex items-center mb-4">
                                <div className={`w-10 h-10 rounded-full shrink-0 bg-gradient-to-tr ${gradient} mr-3`}>
                                  {icon}
                                </div>
                                <h3 className="text-lg text-slate-800 dark:text-slate-100 font-semibold">
                                  {displayName}
                                </h3>
                              </header>
                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {table.name}
                              </div>
                              
                              {/* Table Stats */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                  <svg className="w-4 h-4 shrink-0 fill-current mr-2" viewBox="0 0 16 16">
                                    <path d="M14.14 9.585a2.5 2.5 0 00-3.522 3.194c-.845.63-1.87.97-2.924.971a4.979 4.979 0 01-1.113-.135 4.436 4.436 0 01-1.343 1.682 6.91 6.91 0 006.9-1.165 2.5 2.5 0 002-4.547h.002zM10.125 2.188a2.5 2.5 0 10-.4 2.014 5.027 5.027 0 012.723 3.078c.148-.018.297-.028.446-.03a4.5 4.5 0 011.7.334 7.023 7.023 0 00-4.469-5.396zM4.663 10.5a2.49 2.49 0 00-1.932-1.234 4.624 4.624 0 01-.037-.516 4.97 4.97 0 011.348-3.391 4.456 4.456 0 01-.788-2.016A6.989 6.989 0 00.694 8.75c.004.391.04.781.11 1.166a2.5 2.5 0 103.86.584z" />
                                  </svg>
                                  <div className="text-sm">{table.recordCount || 0} records</div>
                                </div>
                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                  <svg className="w-4 h-4 shrink-0 fill-current mr-2" viewBox="0 0 16 16">
                                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z"/>
                                  </svg>
                                  <div className="text-sm">{formatBytes(table.sizeBytes || 0)}</div>
                                </div>
                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                  <svg className="w-4 h-4 shrink-0 fill-current mr-2" viewBox="0 0 16 16">
                                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z"/>
                                  </svg>
                                  <div className="text-sm">Created: {formatDate(table.createdAt)}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card footer */}
                            <footer className="mt-4">
                              <div className="flex flex-wrap justify-between items-center">
                                {/* Left side - Status */}
                                <div className="flex items-center">
                                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    table.status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {table.status || 'UNKNOWN'}
                                  </div>
                                </div>
                                
                                {/* Right side - Action button */}
                                <button
                                  onClick={() => handleTableClick(table)}
                                  className="btn-sm border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm flex items-center bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                >
                                  <svg className="w-3 h-3 shrink-0 fill-current mr-2" viewBox="0 0 12 12">
                                    <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                                  </svg>
                                  <span>View Data</span>
                                </button>
                              </div>
                            </footer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Summary Stats */}
                <section className="mt-6">
                  <h3 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-5">Summary Statistics</h3>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-full xl:col-span-4 bg-white dark:bg-slate-800 shadow-md rounded-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col h-full p-5">
                        <div className="grow">
                          <header>
                            <h3 className="text-lg text-slate-800 dark:text-slate-100 font-semibold mb-1">Total Tables</h3>
                          </header>
                        </div>
                        <footer className="mt-2">
                          <div className="flex flex-wrap justify-between items-center">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{tables.length}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Active Tables</div>
                          </div>
                        </footer>
                      </div>
                    </div>
                    
                    <div className="col-span-full xl:col-span-4 bg-white dark:bg-slate-800 shadow-md rounded-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col h-full p-5">
                        <div className="grow">
                          <header>
                            <h3 className="text-lg text-slate-800 dark:text-slate-100 font-semibold mb-1">Total Records</h3>
                          </header>
                        </div>
                        <footer className="mt-2">
                          <div className="flex flex-wrap justify-between items-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {tables.reduce((sum, table) => sum + (table.recordCount || 0), 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Across All Tables</div>
                          </div>
                        </footer>
                      </div>
                    </div>
                    
                    <div className="col-span-full xl:col-span-4 bg-white dark:bg-slate-800 shadow-md rounded-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col h-full p-5">
                        <div className="grow">
                          <header>
                            <h3 className="text-lg text-slate-800 dark:text-slate-100 font-semibold mb-1">Total Size</h3>
                          </header>
                        </div>
                        <footer className="mt-2">
                          <div className="flex flex-wrap justify-between items-center">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                              {formatBytes(tables.reduce((sum, table) => sum + (table.sizeBytes || 0), 0))}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Storage Used</div>
                          </div>
                        </footer>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Table Contents Modal */}
      {showModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {selectedTable.displayName || selectedTable.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Table contents with pagination
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingContents ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : currentPageData.length > 0 ? (
                <>
                  {/* Pagination Controls */}
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Items per page:
                      </label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                        Page {currentPage} of {Math.ceil(totalItems / itemsPerPage) || 1}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={!pageKeys[currentPage]}
                        className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                                                Next
                       </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          {Object.keys(currentPageData[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {currentPageData.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                            {Object.values(item).map((value, valueIndex) => (
                              <td
                                key={valueIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100"
                              >
                                {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Info */}
                  <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No data available</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    This table appears to be empty or the data couldn't be loaded.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => fetchTableContents(selectedTable.name, true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Load Table Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamoDBTablesNew;
