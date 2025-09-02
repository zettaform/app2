import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../config/api-config.js';

// ========================================
// BACKEND AUTHENTICATION SERVICE
// ========================================
// Handles authentication with the Express backend

class BackendAuthService {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.headers = API_CONFIG.headers;
    this.tokenKey = 'mosaic_auth_token';
  }

  // Helper method for API calls with error handling and timeout
  async makeApiCall(endpoint, options = {}) {
    try {
      const url = buildApiUrl(endpoint);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout || 10000);
      
      const response = await fetch(url, {
        headers: this.headers,
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Authentication API call timed out for ${endpoint}`);
        throw new Error('Request timeout - please check your connection');
      }
      console.error(`Authentication API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  // Get stored authentication token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Store authentication token
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Remove authentication token
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Sign in user
  async signin(email, password) {
    try {
      // First, we need to find the user by email to get the user_id
      // This is a limitation of the current backend API design
      // In a production system, you'd have a dedicated login endpoint
      
      // For now, we'll use a placeholder approach
      // You should implement a proper /auth/login endpoint in your backend
      
      const result = await this.makeApiCall(ENDPOINTS.authLogin, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (result.success && result.sessionToken) {
        this.setToken(result.sessionToken);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  // Sign up user
  async signup(userData) {
    try {
      const result = await this.makeApiCall(ENDPOINTS.users, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (result.success) {
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'Signup failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  }

  // Get current user information
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const result = await this.makeApiCall(ENDPOINTS.authMe, {
        headers: {
          ...this.headers,
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.success) {
        return result.user;
      } else {
        // Token might be invalid, remove it
        this.removeToken();
        return null;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Token might be invalid, remove it
      this.removeToken();
      return null;
    }
  }

  // Sign out user
  signout() {
    this.removeToken();
    // You could also call a backend logout endpoint here if needed
  }

  // Refresh authentication token
  async refreshToken() {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }

      // Try to get current user to validate token
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.removeToken();
      return false;
    }
  }

  // Check if token is expired
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Browser-compatible base64 decode
      const decoded = atob(token);
      const parts = decoded.split(':');
      
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1]);
        const now = Date.now();
        const tokenAge = now - timestamp;
        
        // Token expires after 24 hours
        const maxAge = 24 * 60 * 60 * 1000;
        return tokenAge > maxAge;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return true;
    }
  }
}

// Export singleton instance
const backendAuthService = new BackendAuthService();
export default backendAuthService;

