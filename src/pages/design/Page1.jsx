import React, { useState } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import Datepicker from '../../components/Datepicker';

export default function DesignPage1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock activity data
  const activityData = [
    { id: 1, type: 'mention', user: 'Nick Mark', target: 'Sara Smith', action: 'mentioned', object: 'in a new post', time: 'Today', icon: 'chat' },
    { id: 2, type: 'remove', user: 'Nick Mark', action: 'removed', object: 'Post Name', time: 'Today', icon: 'remove' },
    { id: 3, type: 'publish', user: 'Patrick Sullivan', action: 'published a new', object: 'post', time: 'Today', icon: 'publish' },
    { id: 4, type: 'subscribe', user: '240+ users', action: 'have subscribed to', object: 'Newsletter #1', time: 'Yesterday', icon: 'subscribe' },
    { id: 5, type: 'suspend', user: 'Nick Mark', action: 'suspended', object: 'Post Name', time: 'Yesterday', icon: 'suspend' },
    { id: 6, type: 'mention', user: 'Sarah Wilson', target: 'John Doe', action: 'mentioned', object: 'in a comment', time: 'Yesterday', icon: 'chat' },
    { id: 7, type: 'publish', user: 'Mike Johnson', action: 'published a new', object: 'article', time: '2 days ago', icon: 'publish' },
    { id: 8, type: 'subscribe', user: '150+ users', action: 'have subscribed to', object: 'Weekly Update', time: '2 days ago', icon: 'subscribe' },
  ];

  const totalPages = Math.ceil(activityData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = activityData.slice(startIndex, startIndex + itemsPerPage);

  const getIconColor = (type) => {
    switch (type) {
      case 'mention': return 'bg-indigo-500';
      case 'remove': return 'bg-red-500';
      case 'publish': return 'bg-green-500';
      case 'subscribe': return 'bg-blue-500';
      case 'suspend': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'mention':
        return <path d="M18 10c-4.4 0-8 3.1-8 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L18.9 22H18c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z" />;
      case 'remove':
        return <path d="M18 8l-8 8m0-8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      case 'publish':
        return <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
      case 'subscribe':
        return <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m9-10a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.5-2.5L21 15l-2.5-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
      case 'suspend':
        return <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
      default:
        return <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            {/* Page heading and calendar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Recent Activity</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Track all recent activities and updates</p>
              </div>
              <div className="flex items-center gap-3">
                <Datepicker align="right" />
              </div>
            </div>

            {/* Responsive grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main content - responsive width */}
              <div className="lg:col-span-8 xl:col-span-9">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
                  <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">Activity Feed</h2>
                  </header>
                  
                  {/* Scrollable content */}
                  <div className="p-3">
                    <div className="max-h-96 overflow-y-auto">
                      {/* Group by time periods */}
                      {['Today', 'Yesterday', '2 days ago'].map(period => {
                        const periodItems = currentItems.filter(item => item.time === period);
                        if (periodItems.length === 0) return null;
                        
                        return (
                          <div key={period} className="mb-4">
                            <header className="text-xs uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 dark:bg-opacity-50 rounded-sm font-semibold p-2 mb-2">
                              {period}
                            </header>
                            <ul className="space-y-1">
                              {periodItems.map(item => (
                                <li key={item.id} className="flex px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded transition-colors">
                                  <div className={`w-9 h-9 rounded-full shrink-0 ${getIconColor(item.type)} my-1 mr-3 flex items-center justify-center`}>
                                    <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                                      {getIcon(item.type)}
                                    </svg>
                                  </div>
                                  <div className="grow flex items-center border-b border-slate-100 dark:border-slate-700 text-sm py-2">
                                    <div className="grow flex justify-between items-center">
                                      <div className="self-center">
                                        <span className="font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white">
                                          {item.user}
                                        </span>
                                        {item.target && (
                                          <>
                                            <span className="text-slate-600 dark:text-slate-400"> {item.action} </span>
                                            <span className="font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white">
                                              {item.target}
                                            </span>
                                          </>
                                        )}
                                        {!item.target && <span className="text-slate-600 dark:text-slate-400"> {item.action} </span>}
                                        <span className="text-slate-600 dark:text-slate-400"> {item.object}</span>
                                      </div>
                                      <div className="shrink-0 self-end ml-2">
                                        <a className="font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm" href="#0">
                                          View<span className="hidden sm:inline"> →</span>
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between px-2 py-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, activityData.length)} of {activityData.length} activities
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm rounded ${
                                currentPage === page
                                  ? 'bg-indigo-500 text-white'
                                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar info - hidden on smaller screens */}
              <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Activity Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Activities</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{activityData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Today</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {activityData.filter(item => item.time === 'Today').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Yesterday</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {activityData.filter(item => item.time === 'Yesterday').length}
                      </span>
                    </div>
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
