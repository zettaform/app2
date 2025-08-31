import axios from 'axios';

// Resolve backend base URL from environment
// Prefer VITE_API_URL, otherwise fall back to the deployed Render URL so the app works without Netlify envs
const DEFAULT_API = 'http://127.0.0.1:8000';
const API_URL = (import.meta.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.__API_URL__ : '') || DEFAULT_API)
  .toString()
  .replace(/\/$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL || '', // fallback to same-origin if not provided
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // needed to send/receive refresh cookie across origins
});

// Export base URL for consumers that need to construct absolute asset URLs
export const API_BASE = API_URL || '';

export const buildAvatarUrl = (filename) => {
  // Use local avatars from public folder
  return `/avatars/${filename}`;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - simplified for CSV-based auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // For CSV-based auth, we don't need complex refresh token logic
    // Just pass through errors without automatic logout
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  // Register a new user
  signup: async (userData) => {
    try {
      const response = await api.post('/signup', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Signup failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        return { success: true, data: response.data };
      }
      
      throw new Error('No access token received');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      // Avoid trailing slash to be compatible with common backends (FastAPI/Django)
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Failed to fetch user';
    }
  },

  // Get list of available avatars
  getAvatars: async () => {
    try {
      const response = await fetch('/avatars/avatars.json');
      return await response.json();
    } catch (error) {
      // Fallback avatar list
      return ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png'];
    }
  },

  // Update current user's avatar
  updateAvatar: async (avatar) => {
    const res = await api.put('/users/me/avatar', { avatar });
    return res.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to change password';
      throw new Error(msg);
    }
  },

  // Mark onboarding complete
  completeOnboarding: async () => {
    try {
      const res = await api.post('/users/me/onboarding-complete');
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to complete onboarding';
      throw new Error(msg);
    }
  },

  // Logout user
  logout: () => {
    // Clear access token and invalidate refresh cookie server-side
    localStorage.removeItem('token');
    return api.post('/logout', null, { withCredentials: true }).catch(() => {});
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Admin API - CSV-based implementation
export const adminApi = {
  listUsers: async () => {
    try {
      // Load users from CSV
      const response = await fetch('/src/data/users.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      const users = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
          let value = values[index];
          if (value === 'true') value = true;
          if (value === 'false') value = false;
          if (!isNaN(value) && value !== '' && header === 'id') value = Number(value);
          obj[header] = value;
        });
        return obj;
      });
      
      return users;
    } catch (error) {
      console.error('Failed to load users for admin:', error);
      return [];
    }
  },
  createUser: async ({ username, email, password, full_name, disabled = false, avatar = null }) => {
    // For CSV-based system, we'll just return success
    // In a real implementation, you'd append to the CSV or update the data source
    console.log('Admin creating user:', { username, email, full_name, disabled, avatar });
    return {
      id: Date.now(),
      username,
      email,
      full_name,
      disabled,
      avatar: avatar || 'avatar1.png',
      onboarding_completed: false,
      role: 'user'
    };
  },
};

export default api;
