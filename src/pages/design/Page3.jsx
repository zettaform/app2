import React, { useState, useEffect } from 'react';
import dynamoService from '../../services/dynamoService';

export default function DesignPage3() {
  // DynamoDB Integration State
  const [dynamoCustomers, setDynamoCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch data from DynamoDB
  const fetchDynamoData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching DynamoDB data...');
      const data = await dynamoService.fetchCustomers();
      console.log('📦 Received data:', data);
      setDynamoCustomers(data);
      setConnectionStatus(dynamoService.getConnectionStatus());
      setLastRefresh(new Date().toLocaleTimeString());
      console.log('✅ Updated state - customers:', data.length);
    } catch (error) {
      console.error('❌ Error fetching DynamoDB data:', error);
      setConnectionStatus({ isConnected: false, error: error.message });
    }
    setIsLoading(false);
  };

  // Initial data load and auto-refresh
  useEffect(() => {
    fetchDynamoData();
    const interval = setInterval(fetchDynamoData, 30000);
    return () => clearInterval(interval);
  }, []);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Billed yearly. All credits granted upfront',
      credits: '1.2K credits/year',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      buttonText: 'Try Clay for free',
      buttonColor: 'bg-black text-white'
    },
    {
      name: 'Starter',
      price: '$134',
      period: '/month',
      description: 'Billed yearly. All credits granted upfront',
      credits: '24K credits/year',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-900',
      buttonText: 'Get Started',
      buttonColor: 'bg-purple-600 text-white'
    },
    {
      name: 'Explorer',
      price: '$314',
      period: '/month',
      description: 'Billed yearly. All credits granted upfront',
      credits: '120K credits/year',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-900',
      buttonText: 'Get Started',
      buttonColor: 'bg-yellow-600 text-white'
    },
    {
      name: 'Pro',
      price: '$720',
      period: '/month',
      description: 'Billed yearly. All credits granted upfront',
      credits: '600K credits/year',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-900',
      buttonText: 'Get Started',
      buttonColor: 'bg-pink-600 text-white'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Contact Sales',
      credits: 'Custom Credits',
      bgColor: 'bg-slate-800',
      textColor: 'text-white',
      buttonText: 'Contact Sales',
      buttonColor: 'bg-blue-600 text-white'
    }
  ];

  const features = [
    { name: 'Credits', free: '1.2K', starter: '24K', explorer: '120K', pro: '600K', enterprise: 'Custom' },
    { name: 'Users', free: 'Unlimited', starter: 'Unlimited', explorer: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'People/Company searches', free: 'Up to 100/search', starter: 'Up to 5,000/search', explorer: 'Up to 10,000/search', pro: 'Up to 25,000/search', enterprise: 'Up to 50,000/search' },
    { name: 'Exporting', free: true, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'AI/Claygent', free: true, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Rollover credits', free: true, starter: true, explorer: true, pro: true, enterprise: true },
    { name: '100+ integration providers', free: true, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Chrome extension', free: true, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Scheduling', free: false, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Phone number enrichments', free: false, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Use your own API keys', free: false, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Signals', free: false, starter: true, explorer: true, pro: true, enterprise: true },
    { name: 'Integrate with any HTTP API', free: false, starter: false, explorer: true, pro: true, enterprise: true },
    { name: 'Webhooks', free: false, starter: false, explorer: true, pro: true, enterprise: true },
    { name: 'Email sequencing integrations', free: false, starter: false, explorer: true, pro: true, enterprise: true },
    { name: 'Exclude people/company filters', free: false, starter: false, explorer: true, pro: true, enterprise: true },
    { name: 'CRM integrations', free: false, starter: false, explorer: false, pro: true, enterprise: true },
    { name: 'Unlimited rows', free: false, starter: false, explorer: false, pro: true, enterprise: true },
    { name: '40 action columns per table', free: false, starter: false, explorer: false, pro: true, enterprise: true },
    { name: 'AI prompting support', free: false, starter: false, explorer: false, pro: true, enterprise: true },
    { name: 'Data engineering (Snowflake)', free: false, starter: false, explorer: false, pro: false, enterprise: true },
    { name: 'Dedicated Slack support', free: false, starter: false, explorer: false, pro: false, enterprise: true },
    { name: 'Credit reporting analytics', free: false, starter: false, explorer: false, pro: false, enterprise: true },
    { name: 'SSO', free: false, starter: false, explorer: false, pro: false, enterprise: true }
  ];

  const renderFeatureValue = (feature, planKey) => {
    const value = feature[planKey];
    
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex justify-center">
          <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400">-</div>
      );
    }
    
    return <div className="text-center text-sm">{value}</div>;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* DynamoDB Integration Demo Header */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AWS DynamoDB Integration Demo</h1>
        <div className="flex justify-center items-center space-x-6 mb-8">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            connectionStatus.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {connectionStatus.isConnected ? 'DynamoDB Connected' : 'DynamoDB Disconnected'}
            </span>
          </div>
          {lastRefresh && (
            <span className="text-gray-600 text-sm">Last refresh: {lastRefresh}</span>
          )}
          <button 
            onClick={fetchDynamoData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* DynamoDB Customers Table */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <div className="bg-white shadow-lg rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Live Customer Data from AWS DynamoDB</h2>
            <p className="text-sm text-slate-600 mt-1">
              {isLoading ? '🔄 Loading customers from DynamoDB...' : 
               connectionStatus.isConnected ? `✅ Live data from AWS DynamoDB - ${dynamoCustomers.length} customers loaded` :
               '❌ Unable to connect to DynamoDB'}
            </p>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading customer data...</p>
            </div>
          ) : dynamoCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600">📭 No customers found in DynamoDB table</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {dynamoCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img className="h-10 w-10 rounded-full" src={customer.image} alt="" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                            <div className="text-sm text-slate-500">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{customer.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.subscription_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Original Pricing Section (kept for reference) */}
      <div className="text-center py-8 px-4 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Original Pricing Demo (Reference)</h2>
        <div className="flex justify-center items-center space-x-6 mb-8">
          <span className="text-gray-600">Pay Monthly</span>
          <div className="flex items-center">
            <span className="text-gray-900 font-medium">Pay annually - 10% discount & all credits upfront</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {plans.map((plan, index) => (
            <div key={plan.name} className={`${plan.bgColor} p-6 relative ${index < plans.length - 1 ? 'border-r border-gray-200' : ''}`}>
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-4 ${plan.textColor}`}>{plan.name}</h3>
                <div className="mb-4">
                  <span className={`text-3xl font-bold ${plan.textColor}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.textColor} opacity-70`}>{plan.period}</span>}
                </div>
                <p className={`text-sm mb-4 ${plan.textColor} opacity-70`}>{plan.description}</p>
                <div className="mb-6">
                  <select className="w-full p-2 border border-gray-300 rounded bg-white text-sm">
                    <option>{plan.credits}</option>
                  </select>
                </div>
                {plan.name === 'Free' && (
                  <button className={`w-full py-2 px-4 rounded font-medium text-sm ${plan.buttonColor} hover:opacity-90 transition-opacity`}>
                    {plan.buttonText} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {features.map((feature, index) => (
            <div key={feature.name} className={`grid grid-cols-6 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="p-4 font-medium text-gray-900 border-r border-gray-200">
                {feature.name}
              </div>
              <div className="p-4 border-r border-gray-200">
                {renderFeatureValue(feature, 'free')}
              </div>
              <div className="p-4 border-r border-gray-200 bg-purple-50">
                {renderFeatureValue(feature, 'starter')}
              </div>
              <div className="p-4 border-r border-gray-200 bg-yellow-50">
                {renderFeatureValue(feature, 'explorer')}
              </div>
              <div className="p-4 border-r border-gray-200 bg-pink-50">
                {renderFeatureValue(feature, 'pro')}
              </div>
              <div className="p-4 bg-slate-100">
                {renderFeatureValue(feature, 'enterprise')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
