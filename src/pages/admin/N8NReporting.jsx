import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const N8NReporting = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');

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
    return <Navigate to="/signin" replace />;
  }

  // Mock data for demonstration
  const [stats, setStats] = useState({
    totalExecutions: 1247,
    successfulExecutions: 1156,
    failedExecutions: 91,
    activeWorkflows: 23,
    avgExecutionTime: '2.4s',
    dataProcessed: '45.2GB'
  });

  const [workflowPerformance, setWorkflowPerformance] = useState([
    { id: 1, name: 'User Registration Flow', executions: 342, success: 98.5, avgTime: '1.2s', status: 'active' },
    { id: 2, name: 'Email Campaign Trigger', executions: 189, success: 96.8, avgTime: '3.1s', status: 'active' },
    { id: 3, name: 'Data Sync Process', executions: 156, success: 94.2, avgTime: '5.8s', status: 'warning' },
    { id: 4, name: 'Invoice Generation', executions: 98, success: 100, avgTime: '0.8s', status: 'active' },
    { id: 5, name: 'Customer Onboarding', executions: 87, success: 92.1, avgTime: '4.2s', status: 'error' }
  ]);

  const [executionHistory, setExecutionHistory] = useState([
    { id: 1, workflow: 'User Registration Flow', timestamp: '2024-09-02 14:30:22', status: 'success', duration: '1.1s' },
    { id: 2, workflow: 'Email Campaign Trigger', timestamp: '2024-09-02 14:28:15', status: 'success', duration: '2.9s' },
    { id: 3, workflow: 'Data Sync Process', timestamp: '2024-09-02 14:25:08', status: 'failed', duration: '6.2s' },
    { id: 4, workflow: 'Invoice Generation', timestamp: '2024-09-02 14:22:33', status: 'success', duration: '0.7s' },
    { id: 5, workflow: 'Customer Onboarding', timestamp: '2024-09-02 14:20:11', status: 'success', duration: '3.8s' }
  ]);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Admin-only access check after loading is complete
  if (!user || user.role !== 'admin') {
    return <Navigate to="/signin" replace />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

      {/* Page Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">N8N Reporting & Statistics</h1>
          <p className="text-slate-600 dark:text-slate-400">Monitor workflow performance and execution analytics</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-sm text-slate-600 dark:text-slate-400">Time Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select text-sm border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-300 dark:focus:border-indigo-600"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Executions</span>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalExecutions.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Successful</span>
              <div className="text-3xl font-bold text-green-600">{stats.successfulExecutions.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Failed</span>
              <div className="text-3xl font-bold text-red-600">{stats.failedExecutions.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Workflows</span>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.activeWorkflows}</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Time</span>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.avgExecutionTime}</div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-lg px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data Processed</span>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.dataProcessed}</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
            >
              Workflow Performance
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
            >
              Execution History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
          <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Workflow Performance Overview</h2>
          </header>
          <div className="p-3">
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                <thead className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/20">
                  <tr>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Workflow Name</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Executions</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Success Rate</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Avg Time</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Status</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700">
                  {workflowPerformance.map((workflow) => (
                    <tr key={workflow.id}>
                      <td className="p-2 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{workflow.name}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="text-left font-medium text-slate-800 dark:text-slate-100">{workflow.executions}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="text-left font-medium text-slate-800 dark:text-slate-100">{workflow.success}%</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="text-left font-medium text-slate-800 dark:text-slate-100">{workflow.avgTime}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                          {workflow.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
          <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Recent Execution History</h2>
          </header>
          <div className="p-3">
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                <thead className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/20">
                  <tr>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Workflow</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Timestamp</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Status</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Duration</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700">
                  {executionHistory.map((execution) => (
                    <tr key={execution.id}>
                      <td className="p-2 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{execution.workflow}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="text-left text-slate-500 dark:text-slate-400">{execution.timestamp}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                          {execution.status}
                        </span>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <div className="text-left font-medium text-slate-800 dark:text-slate-100">{execution.duration}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default N8NReporting;
