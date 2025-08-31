import React, { useState, useEffect } from 'react';
import Customer from './CustomersTableItem';
import dynamoService from '../../services/dynamoService';

import Image01 from '../../images/user-40-01.jpg';
import Image02 from '../../images/user-40-02.jpg';
import Image03 from '../../images/user-40-03.jpg';
import Image04 from '../../images/user-40-04.jpg';
import Image05 from '../../images/user-40-05.jpg';
import Image06 from '../../images/user-40-06.jpg';
import Image07 from '../../images/user-40-07.jpg';
import Image08 from '../../images/user-40-08.jpg';
import Image09 from '../../images/user-40-09.jpg';
import Image10 from '../../images/user-40-10.jpg';

function CustomersTable({
  selectedItems,
  rows,
  adminView = false,
  extraData = {},
  fetchingData = false,
}) {

  const [dynamoCustomers, setDynamoCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
  const [lastRefresh, setLastRefresh] = useState(null);

  // Mock data removed - only use DynamoDB data
  const customers = [];

  const [selectAll, setSelectAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [list, setList] = useState([]);

  // Fetch data from DynamoDB
  const fetchDynamoData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching DynamoDB data...');
      const data = await dynamoService.fetchCustomers();
      console.log('Received data:', data);
      setDynamoCustomers(data);
      setConnectionStatus(dynamoService.getConnectionStatus());
      setLastRefresh(new Date().toLocaleTimeString());
      console.log('Updated state - customers:', data.length);
    } catch (error) {
      console.error('Failed to fetch DynamoDB data:', error);
      setConnectionStatus({ isConnected: false, error: error.message });
    }
    setIsLoading(false);
  };

  // Initial data load
  useEffect(() => {
    fetchDynamoData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDynamoData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Always prioritize DynamoDB data over rows prop
    setList(dynamoCustomers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamoCustomers]);

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setIsCheck(list.map(li => li.id));
    if (selectAll) {
      setIsCheck([]);
    }
  };

  const handleClick = e => {
    const { id, checked } = e.target;
    setSelectAll(false);
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter(item => item !== id));
    }
  };

  // Toggle favourite for a specific row
  const handleToggleFavorite = (id) => {
    setList(prev => prev.map(item => item.id === id ? { ...item, fav: !item.fav } : item));
  };

  useEffect(() => {
    selectedItems(isCheck);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheck]);

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
      <header className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {adminView ? 'All Users' : 'All Customers'} 
            <span className="text-slate-400 dark:text-slate-500 font-medium">{list.length}</span>
          </h2>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-slate-500">
                {connectionStatus.isConnected ? 'DynamoDB Connected' : 'Offline'}
              </span>
            </div>
            {/* Refresh Button */}
            <button
              onClick={fetchDynamoData}
              disabled={isLoading}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md disabled:opacity-50"
            >
              {isLoading ? '🔄' : '↻'} Refresh
            </button>
            {lastRefresh && (
              <span className="text-xs text-slate-400">
                Last: {lastRefresh}
              </span>
            )}
          </div>
        </div>
        {/* DynamoDB Status Bar */}
        {connectionStatus.isConnected && (
          <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded">
            ✅ Live data from AWS DynamoDB - {dynamoCustomers.length} customers loaded
          </div>
        )}
        {!connectionStatus.isConnected && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded">
            ❌ DynamoDB connection unavailable - No data to display
          </div>
        )}
        {connectionStatus.isConnected && dynamoCustomers.length === 0 && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">
            📭 No customers found in DynamoDB table
          </div>
        )}
      </header>
      <div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-slate-300">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-t border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input className="form-checkbox" type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                    </label>
                  </div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <span className="sr-only">Favourite</span>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Name</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Email</div>
                </th>
                {adminView && (
                  <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="font-semibold text-left">Onboarding</div>
                  </th>
                )}
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Location</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold">Orders</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Last order</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Total spent</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold">Refunds</div>
                </th>
                {Object.keys(extraData).length > 0 && (
                  <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                    <div className="font-semibold text-left">Extra Data</div>
                  </th>
                )}
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="sr-only">Menu</span>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-8 text-center text-slate-500">
                    🔄 Loading customers from DynamoDB...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-8 text-center text-slate-500">
                    {connectionStatus.isConnected ? 
                      '📭 No customers found in DynamoDB table' : 
                      '❌ Unable to connect to DynamoDB'
                    }
                  </td>
                </tr>
              ) : (
                list.map(customer => {
                  return (
                    <Customer
                      key={customer.id}
                      id={customer.id}
                      image={customer.image}
                      name={customer.name}
                      email={customer.email}
                      adminView={adminView}
                      onboardingCompleted={customer.onboardingCompleted}
                      location={customer.location}
                      orders={customer.orders}
                      lastOrder={customer.lastOrder}
                      spent={customer.spent}
                      refunds={customer.refunds}
                      fav={customer.fav}
                      onToggleFavorite={handleToggleFavorite}
                      handleClick={handleClick}
                      isChecked={isCheck.includes(customer.id)}
                      extraData={extraData[customer.id]}
                      showExtraColumn={Object.keys(extraData).length > 0}
                    />
                  )
                })
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}

export default CustomersTable;
