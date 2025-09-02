import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Simplified and stable components to prevent glitching
const WorkflowNode = React.memo(({ node, onSelect, isSelected, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState(node);

  useEffect(() => {
    setNodeData(node);
  }, [node]);

  const nodeTypeColors = {
    trigger: 'bg-green-100 border-green-300 text-green-800',
    action: 'bg-blue-100 border-blue-300 text-blue-800',
    condition: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    webhook: 'bg-purple-100 border-purple-300 text-purple-800',
    ai: 'bg-pink-100 border-pink-300 text-pink-800'
  };

  const handleEditSave = useCallback(() => {
    onUpdate(nodeData);
    setIsEditing(false);
  }, [nodeData, onUpdate]);

  return (
    <div
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-indigo-500 shadow-lg' : nodeTypeColors[node.type] || 'bg-gray-100 border-gray-300'
      }`}
      onClick={() => onSelect(node.id)}
      style={{
        position: 'absolute',
        left: node.position?.x || 0,
        top: node.position?.y || 0,
        minWidth: '200px',
        maxWidth: '300px',
        zIndex: isSelected ? 10 : 1
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${node.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="font-semibold text-sm">{node.name}</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 p-1"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="text-xs text-red-600 hover:text-red-800 p-1"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-2 space-y-1">
        <div>Type: {node.type}</div>
        <div>Executions: {node.executionCount || 0}</div>
        {node.lastExecuted && (
          <div>Last: {new Date(node.lastExecuted).toLocaleTimeString()}</div>
        )}
      </div>

      <div className="text-xs text-gray-700 bg-white/50 p-2 rounded">
        {node.description || 'No description'}
      </div>

      {/* Connection Points */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full" />
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full" />

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsEditing(false)}>
          <div className="bg-white p-6 rounded-lg w-96 max-w-90vw" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Node: {node.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={nodeData.name || ''}
                  onChange={(e) => setNodeData(prev => ({...prev, name: e.target.value}))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={nodeData.description || ''}
                  onChange={(e) => setNodeData(prev => ({...prev, description: e.target.value}))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  rows="3"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEditSave}
                  className="flex-1 bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const EmailThread = React.memo(({ thread, onReply, isProcessing }) => {
  const [replyText, setReplyText] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  if (!thread) return null;

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{thread.subject}</h3>
            <p className="text-sm text-gray-600">
              Thread ID: {thread.id} • {thread.messages?.length || 0} messages
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              thread.status === 'active' ? 'bg-green-100 text-green-800' :
              thread.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {thread.status}
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {thread.messages?.map((message, index) => (
          <div
            key={`${thread.id}-${index}`}
            className={`p-4 border-b last:border-b-0 ${
              message.type === 'incoming' ? 'bg-blue-50' : 'bg-green-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  message.type === 'incoming' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {(message.sender || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{message.sender}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              {message.type === 'incoming' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Awaiting Response
                </span>
              )}
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">{message.content}</div>
            {message.metadata && showDetails && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <div className="font-medium mb-1">Message Metadata:</div>
                <div>Sentiment: {message.metadata.sentiment}</div>
                <div>Priority: {message.metadata.priority}</div>
                <div>Category: {message.metadata.category}</div>
              </div>
            )}
          </div>
        )) || (
          <div className="p-4 text-center text-gray-500">
            No messages in this thread
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI-Generated Reply (based on user data)
          </label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="AI will generate a personalized response based on user's social media captions..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none focus:outline-none"
            rows="4"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {thread.userData && (
              <span>Using data from {thread.userData.platform} • {thread.userData.posts} posts analyzed</span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onReply(thread.id, replyText, 'draft')}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={() => onReply(thread.id, replyText, 'send')}
              disabled={isProcessing || !replyText.trim()}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const WorkflowCanvas = React.memo(({ nodes = [], connections = [], onNodeUpdate, onNodeDelete, onNodeAdd }) => {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDraggedNode(nodeId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - (node.position?.x || 0),
          y: e.clientY - rect.top - (node.position?.y || 0)
        });
      }
    }
  }, [nodes]);

  const handleMouseMove = useCallback((e) => {
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newPosition = {
        x: Math.max(0, e.clientX - rect.left - dragOffset.x),
        y: Math.max(0, e.clientY - rect.top - dragOffset.y)
      };
      
      onNodeUpdate(draggedNode, { position: newPosition });
    }
  }, [draggedNode, dragOffset, onNodeUpdate]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);
      
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  const handleAddNode = useCallback(() => {
    const newNode = {
      id: `node-${Date.now()}`,
      name: 'New Node',
      type: 'action',
      position: { x: 50 + (nodes.length * 20), y: 50 + (nodes.length * 20) },
      status: 'inactive',
      description: 'New workflow node',
      executionCount: 0
    };
    onNodeAdd(newNode);
  }, [nodes.length, onNodeAdd]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
      style={{ userSelect: 'none' }}
    >
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Connection Lines */}
      {connections.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {connections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            const fromX = (fromNode.position?.x || 0) + 200;
            const fromY = (fromNode.position?.y || 0) + 50;
            const toX = toNode.position?.x || 0;
            const toY = (toNode.position?.y || 0) + 50;
            
            return (
              <line
                key={`connection-${index}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="#6366f1"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>
        </svg>
      )}

      {/* Workflow Nodes */}
      {nodes.map(node => (
        <div
          key={node.id}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
          style={{ position: 'relative', zIndex: selectedNode === node.id ? 10 : 1 }}
        >
          <WorkflowNode
            node={node}
            onSelect={setSelectedNode}
            isSelected={selectedNode === node.id}
            onUpdate={(updatedNode) => onNodeUpdate(node.id, updatedNode)}
            onDelete={onNodeDelete}
          />
        </div>
      ))}

      {/* Add Node Button */}
      <button
        onClick={handleAddNode}
        className="absolute top-4 right-4 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 shadow-lg transition-colors z-20"
      >
        + Add Node
      </button>

      {/* Canvas Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-medium mb-2">Design Your Workflow</h3>
            <p className="text-sm">Click "Add Node" to start building your automation</p>
          </div>
        </div>
      )}
    </div>
  );
});

const UserDataPanel = React.memo(({ userData, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg">
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">User Social Data</h3>
          <button
            onClick={onRefresh}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 transition-colors"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Data from Scarlet77 API • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {userData?.posts?.length > 0 ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{userData.posts.length}</div>
              <div className="text-sm text-blue-800">Total Posts</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {userData.posts.reduce((sum, post) => sum + (post.likes || 0), 0)}
              </div>
              <div className="text-sm text-green-800">Total Likes</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recent Posts</h4>
            {userData.posts.slice(0, 3).map((post, index) => (
              <div key={post.id || index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-gray-500">
                    {post.timestamp ? new Date(post.timestamp * 1000).toLocaleDateString() : 'No date'}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>❤️ {post.likes || 0}</span>
                    <span>💬 {post.comments || 0}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{post.caption || 'No caption'}</p>
                {post.shortcode && (
                  <a
                    href={`https://instagram.com/p/${post.shortcode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 mt-2 inline-block transition-colors"
                  >
                    View Post →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          <div className="text-3xl mb-2">📱</div>
          <p>No user data available</p>
          <p className="text-sm">Click refresh to fetch latest data</p>
        </div>
      )}
    </div>
  );
});

function N8NWorkflowDesign() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('designer');
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

  // Workflow Management State
  const [workflows, setWorkflows] = useState([]);
  const [workflowNodes, setWorkflowNodes] = useState([]);
  const [workflowConnections, setWorkflowConnections] = useState([]);

  // Email Threading State
  const [emailThreads, setEmailThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [isProcessingReply, setIsProcessingReply] = useState(false);

  // User Data State
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // AI & Automation State
  const [aiPrompts, setAiPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalWorkflows: 0,
    activeThreads: 0,
    processedEmails: 0,
    aiAccuracy: 85.5,
    responseTime: 1.2
  });

  // Real-time monitoring
  const [realtimeData, setRealtimeData] = useState({
    activeConnections: 8,
    queuedJobs: 12,
    processingStatus: 'active'
  });

  // Check if user is admin after loading is complete
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch user data from Scarlet77 API
  const fetchUserData = useCallback(async (userId = '310769242') => {
    try {
      setIsLoadingUserData(true);
      setError('');
      
      const response = await fetch(`https://api.scarlet77.com/?userId=${userId}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      setUserData({
        userId,
        posts: data.posts || [],
        endCursor: data.end_cursor,
        totalPosts: data.posts?.length || 0,
        lastFetched: new Date().toISOString()
      });
      
      setSuccess('User data fetched successfully from Scarlet77 API');
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(`Failed to fetch user data: ${error.message}`);
    } finally {
      setIsLoadingUserData(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    // Initialize mock workflows
    setWorkflows([
      {
        id: 'wf-001',
        name: 'Email Response Automation',
        status: 'active',
        description: 'Automated email responses using user social data',
        createdAt: new Date().toISOString(),
        lastExecuted: new Date().toISOString(),
        executionCount: 1247
      },
      {
        id: 'wf-002',
        name: 'Social Data Enrichment',
        status: 'active',
        description: 'Enrich email contacts with social media data',
        createdAt: new Date().toISOString(),
        lastExecuted: new Date(Date.now() - 3600000).toISOString(),
        executionCount: 892
      }
    ]);

    // Initialize workflow nodes
    setWorkflowNodes([
      {
        id: 'node-1',
        name: 'Email Trigger',
        type: 'trigger',
        position: { x: 50, y: 100 },
        status: 'active',
        description: 'Triggers when new email is received',
        executionCount: 1247,
        lastExecuted: new Date().toISOString()
      },
      {
        id: 'node-2',
        name: 'Fetch User Data',
        type: 'webhook',
        position: { x: 350, y: 100 },
        status: 'active',
        description: 'Fetch user social data from Scarlet77 API',
        executionCount: 1247,
        lastExecuted: new Date().toISOString()
      },
      {
        id: 'node-3',
        name: 'AI Response Generator',
        type: 'ai',
        position: { x: 650, y: 100 },
        status: 'active',
        description: 'Generate personalized response using AI',
        executionCount: 1247,
        lastExecuted: new Date().toISOString()
      }
    ]);

    // Initialize connections
    setWorkflowConnections([
      { from: 'node-1', to: 'node-2' },
      { from: 'node-2', to: 'node-3' }
    ]);

    // Initialize email threads
    setEmailThreads([
      {
        id: 'thread-001',
        subject: 'Collaboration Inquiry',
        status: 'active',
        messages: [
          {
            type: 'incoming',
            sender: 'john.creator@email.com',
            timestamp: new Date().toISOString(),
            content: 'Hi! I love your urban sketching content. Would you be interested in collaborating on a project?',
            metadata: {
              sentiment: 'positive',
              priority: 'high',
              category: 'collaboration'
            }
          }
        ],
        userData: {
          platform: 'Instagram',
          posts: 10,
          lastActivity: new Date().toISOString()
        }
      },
      {
        id: 'thread-002',
        subject: 'Product Feedback',
        status: 'processing',
        messages: [
          {
            type: 'incoming',
            sender: 'customer@email.com',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            content: 'I purchased your VIP Urban Sketching Bundle and wanted to share my thoughts...',
            metadata: {
              sentiment: 'neutral',
              priority: 'medium',
              category: 'feedback'
            }
          },
          {
            type: 'outgoing',
            sender: 'support@company.com',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            content: 'Thank you for your feedback! We appreciate customers like you who take the time to share their experience.',
            metadata: {
              generatedBy: 'AI',
              promptUsed: 'customer-feedback-response'
            }
          }
        ],
        userData: {
          platform: 'Instagram',
          posts: 15,
          lastActivity: new Date().toISOString()
        }
      }
    ]);

    // Initialize AI prompts
    setAiPrompts([
      {
        id: 'prompt-001',
        name: 'Creative Collaboration Response',
        category: 'collaboration',
        prompt: 'Based on the user\'s recent social media posts about {topic}, craft a warm and professional response that acknowledges their work and expresses genuine interest in collaboration.',
        variables: ['topic', 'recent_posts', 'engagement_style'],
        lastUsed: new Date().toISOString()
      },
      {
        id: 'prompt-002',
        name: 'Customer Feedback Response',
        category: 'feedback',
        prompt: 'Analyze the customer\'s feedback and their social media activity to understand their communication style. Respond with appreciation and address their specific points.',
        variables: ['feedback_content', 'communication_style', 'purchase_history'],
        lastUsed: new Date(Date.now() - 3600000).toISOString()
      }
    ]);

    // Fetch user data on mount
    fetchUserData();

    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      totalWorkflows: 2,
      activeThreads: 1,
      processedEmails: 247
    }));
  }, [fetchUserData]);

  // Workflow Management Functions
  const updateWorkflowNode = useCallback((nodeId, updatedData) => {
    setWorkflowNodes(prev => 
      prev.map(node => 
        node.id === nodeId ? { ...node, ...updatedData } : node
      )
    );
  }, []);

  const deleteWorkflowNode = useCallback((nodeId) => {
    setWorkflowNodes(prev => prev.filter(node => node.id !== nodeId));
    setWorkflowConnections(prev => 
      prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId)
    );
  }, []);

  const addWorkflowNode = useCallback((nodeData) => {
    setWorkflowNodes(prev => [...prev, nodeData]);
  }, []);

  // Email Thread Management
  const handleEmailReply = useCallback(async (threadId, replyText, action) => {
    if (action === 'send') {
      setIsProcessingReply(true);
      try {
        let finalReply = replyText;
        if (!finalReply.trim() && userData?.posts?.length > 0) {
          const recentPost = userData.posts[0];
          finalReply = `Thank you for reaching out! I noticed your recent post about "${recentPost.caption?.substring(0, 50)}..." - it really resonates with my own experiences. I'd love to discuss this further.`;
        }

        const newMessage = {
          type: 'outgoing',
          sender: user.full_name || 'AI Assistant',
          timestamp: new Date().toISOString(),
          content: finalReply || 'Thank you for your message.',
          metadata: {
            generatedBy: 'AI',
            promptUsed: selectedPrompt,
            basedOnUserData: userData ? true : false
          }
        };

        setEmailThreads(prev => 
          prev.map(thread => 
            thread.id === threadId 
              ? { ...thread, messages: [...(thread.messages || []), newMessage], status: 'completed' }
              : thread
          )
        );

        setSuccess('Reply sent successfully');
      } catch (error) {
        setError('Failed to send reply');
      } finally {
        setIsProcessingReply(false);
      }
    } else {
      setSuccess('Draft saved');
    }
  }, [user, selectedPrompt, userData]);

  // N8N Workflow Execution
  const executeWorkflow = useCallback(async (workflowId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setWorkflows(prev => 
        prev.map(wf => 
          wf.id === workflowId 
            ? { 
                ...wf, 
                status: 'active',
                lastExecuted: new Date().toISOString(),
                executionCount: (wf.executionCount || 0) + 1
              }
            : wf
        )
      );
      
      setSuccess(`Workflow ${workflowId} executed successfully`);
    } catch (error) {
      setError('Failed to execute workflow');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

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
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                      N8N Automation Design Workflow
                    </h1>
                    <div className={`w-3 h-3 rounded-full ${
                      realtimeData.processingStatus === 'busy' ? 'bg-red-500' :
                      realtimeData.processingStatus === 'processing' ? 'bg-yellow-500' :
                      'bg-green-500'
                    } animate-pulse`} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Enterprise-grade email automation with social data integration
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                    <span>🔗 {realtimeData.activeConnections} active connections</span>
                    <span>⏳ {realtimeData.queuedJobs} queued jobs</span>
                    <span>📊 Status: {realtimeData.processingStatus}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
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
                      {analytics.aiAccuracy}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      AI Accuracy
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {analytics.responseTime}s
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Avg Response
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
                <span className="text-lg">✅</span>
                <span>{success}</span>
                <button onClick={clearMessages} className="ml-auto text-green-600 hover:text-green-800 transition-colors">
                  ✕
                </button>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
                <span className="text-lg">❌</span>
                <span>{error}</span>
                <button onClick={clearMessages} className="ml-auto text-red-600 hover:text-red-800 transition-colors">
                  ✕
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-8 border-b border-gray-200">
                {[
                  { id: 'designer', label: 'Workflow Designer', icon: '🔧', count: workflowNodes.length },
                  { id: 'threads', label: 'Email Threads', icon: '📧', count: emailThreads.length },
                  { id: 'automation', label: 'AI Automation', icon: '🤖', count: aiPrompts.length },
                  { id: 'monitoring', label: 'Real-time Monitoring', icon: '📊', count: analytics.activeThreads },
                  { id: 'user-data', label: 'User Data', icon: '👤', count: userData?.posts?.length || 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        activeTab === tab.id 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              
              {/* Workflow Designer Tab */}
              {activeTab === 'designer' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                            Workflow Designer
                          </h2>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Design and configure your automation workflows
                          </p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => executeWorkflow('wf-001')}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2 transition-colors"
                          >
                            <span>▶️</span>
                            <span>{loading ? 'Executing...' : 'Execute Workflow'}</span>
                          </button>
                          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                            <span>💾</span>
                            <span>Save Workflow</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <WorkflowCanvas
                        nodes={workflowNodes}
                        connections={workflowConnections}
                        onNodeUpdate={updateWorkflowNode}
                        onNodeDelete={deleteWorkflowNode}
                        onNodeAdd={addWorkflowNode}
                      />
                    </div>
                  </div>

                  {/* Workflow List */}
                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Existing Workflows
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workflows.map(workflow => (
                          <div key={workflow.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-800">{workflow.name}</h4>
                                <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {workflow.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                              <div>
                                <span className="font-medium">Executions:</span> {workflow.executionCount}
                              </div>
                              <div>
                                <span className="font-medium">Last Run:</span> {new Date(workflow.lastExecuted).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => executeWorkflow(workflow.id)}
                                className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition-colors"
                              >
                                Execute
                              </button>
                              <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-colors">
                                Configure
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Threads Tab */}
              {activeTab === 'threads' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Email Threads
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Active conversations requiring responses
                          </p>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                          {emailThreads.map(thread => (
                            <div
                              key={thread.id}
                              onClick={() => setSelectedThread(thread)}
                              className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                                selectedThread?.id === thread.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                                  {thread.subject}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  thread.status === 'active' ? 'bg-orange-100 text-orange-800' :
                                  thread.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {thread.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                {thread.messages?.length || 0} messages
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                {thread.messages?.[thread.messages.length - 1]?.content || 'No messages'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      {selectedThread ? (
                        <EmailThread
                          thread={selectedThread}
                          onReply={handleEmailReply}
                          isProcessing={isProcessingReply}
                        />
                      ) : (
                        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 p-8">
                          <div className="text-center text-slate-500 dark:text-slate-400">
                            <div className="text-4xl mb-4">📧</div>
                            <h3 className="text-lg font-medium mb-2">Select an Email Thread</h3>
                            <p className="text-sm">Choose a thread from the left to view and respond to messages</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Automation Tab */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                          AI Response Prompts
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Configure AI prompts for different scenarios
                        </p>
                      </div>
                      <div className="p-6 space-y-4">
                        {aiPrompts.map(prompt => (
                          <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-slate-800">{prompt.name}</h4>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                  {prompt.category}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedPrompt(prompt.id)}
                                className={`text-sm px-3 py-1 rounded transition-colors ${
                                  selectedPrompt === prompt.id 
                                    ? 'bg-indigo-500 text-white' 
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {selectedPrompt === prompt.id ? 'Selected' : 'Select'}
                              </button>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{prompt.prompt}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Variables: {prompt.variables.join(', ')}</span>
                              <span>Last used: {new Date(prompt.lastUsed).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                          AI Testing Environment
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Test AI responses with user data integration
                        </p>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Test Email Content
                            </label>
                            <textarea
                              placeholder="Enter a sample email to test AI response generation..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none focus:outline-none"
                              rows="4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Generated Response
                            </label>
                            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[4rem]">
                              <p className="text-gray-500 text-sm">
                                AI response will appear here based on selected prompt and user data
                              </p>
                            </div>
                          </div>
                          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors">
                            Generate Response
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Monitoring Tab */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { title: 'Active Workflows', value: analytics.totalWorkflows, icon: '⚡', color: 'blue' },
                      { title: 'Email Threads', value: analytics.activeThreads, icon: '📧', color: 'green' },
                      { title: 'Queue Jobs', value: realtimeData.queuedJobs, icon: '📊', color: 'purple' },
                      { title: 'Avg Response', value: `${analytics.responseTime}s`, icon: '⏱️', color: 'orange' }
                    ].map((metric, index) => (
                      <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-full bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                            <span className="text-2xl">{metric.icon}</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.title}</p>
                            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{metric.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Real-time Activity Feed
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {[
                          { time: new Date().toLocaleTimeString(), event: 'Email received from john.creator@email.com', status: 'success', icon: '📧' },
                          { time: new Date(Date.now() - 120000).toLocaleTimeString(), event: 'User data fetched from Scarlet77 API', status: 'success', icon: '🔄' },
                          { time: new Date(Date.now() - 180000).toLocaleTimeString(), event: 'AI response generated successfully', status: 'success', icon: '🤖' },
                          { time: new Date(Date.now() - 240000).toLocaleTimeString(), event: 'Workflow executed successfully', status: 'success', icon: '⚡' }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-lg">{activity.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">{activity.event}</p>
                              <p className="text-xs text-slate-500">{activity.time}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Data Tab */}
              {activeTab === 'user-data' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UserDataPanel 
                      userData={userData}
                      isLoading={isLoadingUserData}
                      onRefresh={() => fetchUserData()}
                    />

                    <div className="bg-white border rounded-lg">
                      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h3 className="font-semibold text-lg">Data Processing Configuration</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Configure how user data is processed for AI responses
                        </p>
                      </div>
                      <div className="p-6 space-y-4">
                        {[
                          'Analyze post sentiment',
                          'Extract keywords and topics',
                          'Track engagement patterns'
                        ].map((option, index) => (
                          <label key={index} className="flex items-center">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="ml-2 text-sm">{option}</span>
                          </label>
                        ))}
                        <div className="pt-4 border-t">
                          <label className="block text-sm font-medium mb-2">Data Retention (days)</label>
                          <input 
                            type="number" 
                            defaultValue="30" 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-lg">API Integration Status</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { name: 'Scarlet77 API', status: 'Connected', color: 'green' },
                          { name: 'N8N Webhooks', status: 'Configured', color: 'yellow' },
                          { name: 'OpenAI API', status: 'Ready', color: 'blue' }
                        ].map((api, index) => (
                          <div key={index} className={`flex items-center space-x-3 p-3 bg-${api.color}-50 rounded-lg`}>
                            <div className={`w-3 h-3 bg-${api.color}-500 rounded-full`}></div>
                            <div>
                              <div className={`font-medium text-${api.color}-800`}>{api.name}</div>
                              <div className={`text-sm text-${api.color}-600`}>{api.status}</div>
                            </div>
                          </div>
                        ))}
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

export default N8NWorkflowDesign;