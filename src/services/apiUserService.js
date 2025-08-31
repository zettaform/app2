import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../config/api-config.js';

// ========================================
// API USER SERVICE
// ========================================
// Centralized user management API service

class ApiUserService {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.headers = API_CONFIG.headers;
  }

  // Helper method for API calls with error handling
  async makeApiCall(endpoint, options = {}) {
    try {
      const url = buildApiUrl(endpoint);
      const response = await fetch(url, {
        headers: this.headers,
        timeout: this.timeout,
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // List all users
  async listUsers() {
    return this.makeApiCall(ENDPOINTS.users);
  }

  // Create a new user
  async createUser(userData) {
    return this.makeApiCall(ENDPOINTS.users, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Update user
  async updateUser(userId, updateData) {
    return this.makeApiCall(`${ENDPOINTS.users}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Delete user
  async deleteUser(userId) {
    return this.makeApiCall(`${ENDPOINTS.users}/${userId}`, {
      method: 'DELETE'
    });
  }

  // User login
  async userLogin(userId, password) {
    return this.makeApiCall(`${ENDPOINTS.users}/${userId}/login`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }

  // Request password reset
  async requestPasswordReset(email) {
    return this.makeApiCall(ENDPOINTS.userResetPassword, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Create external user
  async createExternalUser(userData, adminKey) {
    const headers = {
      ...this.headers,
      'x-admin-key': adminKey
    };

    return this.makeApiCall(ENDPOINTS.externalUsers, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    });
  }

  // Get user by ID
  async getUserById(userId) {
    return this.makeApiCall(`${ENDPOINTS.users}/${userId}`);
  }

  // Search users
  async searchUsers(query) {
    const params = new URLSearchParams({ q: query });
    return this.makeApiCall(`${ENDPOINTS.users}?${params}`);
  }
}

// Export singleton instance
const apiUserService = new ApiUserService();
export default apiUserService;
