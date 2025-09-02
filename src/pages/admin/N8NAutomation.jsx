import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function N8NAutomation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, loading: authLoading } = useAuth();

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Workflow Management
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState({});

  // Email Management
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [emailFilters, setEmailFilters] = useState({
    status: 'all',
    priority: 'all',
    dateRange: '7d'
  });

  // AI Automation
  const [aiPrompt, setAiPrompt] = useState('');
  const [inferenceRules, setInferenceRules] = useState([]);
  const [automationSettings, setAutomationSettings] = useState({
    autoReply: false,
    sentimentAnalysis: true,
    priorityDetection: true,
    responseTemplates: []
  });

  // Analytics & Monitoring
  const [analytics, setAnalytics] = useState({
    totalEmails: 0,
    processedEmails: 0,
    autoReplies: 0,
    responseTime: 0,
    accuracy: 0
  });

  // Refs for real-time updates
  const emailContainerRef = useRef(null);
  const workflowMonitorRef = useRef(null);

  // Check if user is admin after loading is complete
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch N8N workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      // This would integrate with N8N API
      const mockWorkflows = [
        {
          id: 'gmail-automation-001',
          name: 'Gmail Auto-Reply Workflow',
          status: 'active',
          lastExecuted: new Date().toISOString(),
          executionCount: 1247,
          successRate: 98.5
        },
        {
          id: 'email-classification-002',
          name: 'Email Classification & Routing',
          status: 'active',
          lastExecuted: new Date(Date.now() - 3600000).toISOString(),
          executionCount: 892,
          successRate: 99.2
        },
        {
          id: 'sentiment-analysis-003',
          name: 'Sentiment Analysis Pipeline',
          status: 'paused',
          lastExecuted: new Date(Date.now() - 7200000).toISOString(),
          executionCount: 567,
          successRate: 97.8
        }
      ];
      setWorkflows(mockWorkflows);
    } catch (error) {
      setError('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  // Fetch emails from Gmail
  const fetchEmails = async () => {
    try {
      setLoading(true);
      // This would integrate with Gmail API via N8N
      const mockEmails = [
        {
          id: 'email-001',
          from: 'john.doe@company.com',
          subject: 'Project Update Request',
          snippet: 'Hi team, I need an update on the Q4 project status...',
          receivedAt: new Date().toISOString(),
          priority: 'high',
          status: 'unread',
          category: 'work',
          sentiment: 'neutral'
        },
        {
          id: 'email-002',
          from: 'support@client.com',
          subject: 'Urgent: System Issue',
          snippet: 'We are experiencing critical system failures...',
          receivedAt: new Date(Date.now() - 1800000).toISOString(),
          priority: 'urgent',
          status: 'unread',
          category: 'support',
          sentiment: 'negative'
        },
        {
          id: 'email-003',
          from: 'hr@company.com',
          subject: 'Team Meeting Tomorrow',
          snippet: 'Reminder: All-hands meeting tomorrow at 10 AM...',
          receivedAt: new Date(Date.now() - 3600000).toISOString(),
          priority: 'medium',
          status: 'read',
          category: 'internal',
          sentiment: 'neutral'
        }
      ];
      setEmails(mockEmails);
      setAnalytics(prev => ({ ...prev, totalEmails: mockEmails.length }));
    } catch (error) {
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  // Trigger N8N workflow
  const triggerWorkflow = async (workflowId, emailIds = []) => {
    try {
      setLoading(true);
      setError('');
      
      // This would make API call to N8N webhook
      const payload = {
        workflowId,
        trigger: 'manual',
        data: {
          emailIds,
          timestamp: new Date().toISOString(),
          userId: user.id
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Workflow ${workflowId} triggered successfully`);
      setWorkflowStatus(prev => ({ ...prev, [workflowId]: 'running' }));
      
      // Update analytics
      setAnalytics(prev => ({ 
        ...prev, 
        processedEmails: prev.processedEmails + emailIds.length 
      }));
      
    } catch (error) {
      setError(`Failed to trigger workflow: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Bulk reply to emails using AI
  const bulkReplyWithAI = async () => {
    if (selectedEmails.length === 0) {
      setError('Please select emails to reply to');
      return;
    }

    if (!aiPrompt.trim()) {
      setError('Please provide an AI prompt for responses');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // This would integrate with OpenAI API via N8N
      const payload = {
        emails: selectedEmails,
        prompt: aiPrompt,
        settings: automationSettings,
        inferenceRules
      };

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSuccess(`AI processed ${selectedEmails.length} emails successfully`);
      setSelectedEmails([]);
      setAiPrompt('');
      
      // Update analytics
      setAnalytics(prev => ({ 
        ...prev, 
        autoReplies: prev.autoReplies + selectedEmails.length,
        accuracy: Math.min(100, prev.accuracy + 2.5)
      }));
      
    } catch (error) {
      setError(`AI processing failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add inference rule
  const addInferenceRule = () => {
    const newRule = {
      id: `rule-${Date.now()}`,
      condition: '',
      action: '',
      priority: 'medium'
    };
    setInferenceRules([...inferenceRules, newRule]);
  };

  // Remove inference rule
  const removeInferenceRule = (ruleId) => {
    setInferenceRules(inferenceRules.filter(rule => rule.id !== ruleId));
  };

  // Update inference rule
  const updateInferenceRule = (ruleId, field, value) => {
    setInferenceRules(inferenceRules.map(rule => 
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    ));
  };

  useEffect(() => {
    fetchWorkflows();
    fetchEmails();
    
    // Real-time updates simulation
    const interval = setInterval(() => {
      // Simulate real-time email updates
      if (emails.length > 0) {
        const randomEmail = emails[Math.floor(Math.random() * emails.length)];
        if (randomEmail && Math.random() > 0.7) {
          setEmails(prev => prev.map(email => 
            email.id === randomEmail.id 
              ? { ...email, status: 'processing' }
              : email
          ));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      unread: 'bg-blue-100 text-blue-800 border-blue-200',
      read: 'bg-gray-100 text-gray-800 border-gray-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      replied: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || colors.read;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    N8N Automation Hub
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Orchestrate Gmail workflows with AI-powered automation
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {analytics.processedEmails}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Emails Processed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analytics.accuracy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      AI Accuracy
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'workflows', label: 'Workflows', icon: '⚡' },
                  { id: 'emails', label: 'Email Management', icon: '📧' },
                  { id: 'automation', label: 'AI Automation', icon: '🤖' },
                  { id: 'analytics', label: 'Analytics', icon: '📊' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                        : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              
              {/* Workflows Tab */}
              {activeTab === 'workflows' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        N8N Workflows
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage and monitor your automation workflows
                      </p>
                    </div>
                    
                    <div className="p-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-slate-600 dark:text-slate-400">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading workflows...
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {workflows.map(workflow => (
                            <div
                              key={workflow.id}
                              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 border border-slate-200 dark:border-slate-600"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                                  {workflow.name}
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  workflow.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {workflow.status}
                                </span>
                              </div>
                              
                              <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Executions:</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-100">
                                    {workflow.executionCount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Success Rate:</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-100">
                                    {workflow.successRate}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Last Run:</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-100">
                                    {new Date(workflow.lastExecuted).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => triggerWorkflow(workflow.id)}
                                  disabled={loading || workflowStatus[workflow.id] === 'running'}
                                  className="flex-1 btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                                >
                                  {workflowStatus[workflow.id] === 'running' ? 'Running...' : 'Trigger'}
                                </button>
                                <button className="btn bg-slate-300 hover:bg-slate-400 text-slate-700">
                                  Configure
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Management Tab */}
              {activeTab === 'emails' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                            Email Management
                          </h2>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Monitor and manage incoming emails
                          </p>
                        </div>
                        <button
                          onClick={fetchEmails}
                          disabled={loading}
                          className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {/* Email Filters */}
                      <div className="mb-6 flex flex-wrap gap-4">
                        <select
                          value={emailFilters.status}
                          onChange={(e) => setEmailFilters({...emailFilters, status: e.target.value})}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                        >
                          <option value="all">All Status</option>
                          <option value="unread">Unread</option>
                          <option value="read">Read</option>
                          <option value="processing">Processing</option>
                          <option value="replied">Replied</option>
                        </select>
                        
                        <select
                          value={emailFilters.priority}
                          onChange={(e) => setEmailFilters({...emailFilters, priority: e.target.value})}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                        >
                          <option value="all">All Priorities</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        
                        <select
                          value={emailFilters.dateRange}
                          onChange={(e) => setEmailFilters({...emailFilters, dateRange: e.target.value})}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                        >
                          <option value="1d">Last 24 hours</option>
                          <option value="7d">Last 7 days</option>
                          <option value="30d">Last 30 days</option>
                          <option value="90d">Last 90 days</option>
                        </select>
                      </div>

                      {/* Email List */}
                      <div className="space-y-3" ref={emailContainerRef}>
                        {emails.map(email => (
                          <div
                            key={email.id}
                            className={`p-4 rounded-lg border transition-all cursor-pointer ${
                              selectedEmails.includes(email.id)
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                            onClick={() => {
                              if (selectedEmails.includes(email.id)) {
                                setSelectedEmails(selectedEmails.filter(id => id !== email.id));
                              } else {
                                setSelectedEmails([...selectedEmails, email.id]);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(email.priority)}`}>
                                    {email.priority}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(email.status)}`}>
                                    {email.status}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {email.category}
                                  </span>
                                </div>
                                
                                <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                                  {email.subject}
                                </h4>
                                
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                  From: {email.from}
                                </p>
                                
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {email.snippet}
                                </p>
                              </div>
                              
                              <div className="text-right text-xs text-slate-500 dark:text-slate-400 ml-4">
                                {new Date(email.receivedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Automation Tab */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        AI-Powered Automation
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Configure intelligent email responses using OpenAI
                      </p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* AI Prompt Configuration */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          AI Response Prompt
                        </label>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Configure how AI should respond to emails. Example: 'Respond professionally and helpfully to customer inquiries, maintaining a warm and supportive tone.'"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                          rows="4"
                        />
                      </div>

                      {/* Automation Settings */}
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
                          Automation Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={automationSettings.autoReply}
                              onChange={(e) => setAutomationSettings({...automationSettings, autoReply: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                              Enable Auto-Reply
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={automationSettings.sentimentAnalysis}
                              onChange={(e) => setAutomationSettings({...automationSettings, sentimentAnalysis: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                              Sentiment Analysis
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={automationSettings.priorityDetection}
                              onChange={(e) => setAutomationSettings({...automationSettings, priorityDetection: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                              Priority Detection
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Inference Rules */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                            Inference Rules
                          </h3>
                          <button
                            onClick={addInferenceRule}
                            className="btn bg-green-500 hover:bg-green-600 text-white"
                          >
                            Add Rule
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {inferenceRules.map(rule => (
                            <div key={rule.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                              <select
                                value={rule.condition}
                                onChange={(e) => updateInferenceRule(rule.id, 'condition', e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                              >
                                <option value="">Select Condition</option>
                                <option value="sentiment_negative">Negative Sentiment</option>
                                <option value="priority_high">High Priority</option>
                                <option value="category_support">Support Category</option>
                                <option value="urgent_keywords">Urgent Keywords</option>
                              </select>
                              
                              <select
                                value={rule.action}
                                onChange={(e) => updateInferenceRule(rule.id, 'action', e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                              >
                                <option value="">Select Action</option>
                                <option value="escalate">Escalate to Human</option>
                                <option value="priority_boost">Boost Priority</option>
                                <option value="custom_response">Custom Response</option>
                                <option value="auto_assign">Auto-Assign</option>
                              </select>
                              
                              <select
                                value={rule.priority}
                                onChange={(e) => updateInferenceRule(rule.id, 'priority', e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              
                              <button
                                onClick={() => removeInferenceRule(rule.id)}
                                className="btn bg-red-500 hover:bg-red-600 text-white"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bulk Actions */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {selectedEmails.length} emails selected
                          </div>
                          <button
                            onClick={bulkReplyWithAI}
                            disabled={loading || selectedEmails.length === 0 || !aiPrompt.trim()}
                            className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                          >
                            {loading ? 'Processing...' : `Process ${selectedEmails.length} Emails with AI`}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Emails</p>
                          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.totalEmails}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Processed</p>
                          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.processedEmails}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Auto Replies</p>
                          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.autoReplies}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Accuracy</p>
                          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.accuracy.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        Performance Metrics
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
                            Response Time Distribution
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Under 1 minute:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-100">45%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">1-5 minutes:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-100">38%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">5-15 minutes:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-100">12%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Over 15 minutes:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-100">5%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">
                            Workflow Success Rates
                          </h3>
                          <div className="space-y-3">
                            {workflows.map(workflow => (
                              <div key={workflow.id} className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {workflow.name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${workflow.successRate}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100 w-12">
                                    {workflow.successRate}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default N8NAutomation;
