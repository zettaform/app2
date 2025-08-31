// DynamoDB Authentication Service
// This service handles user authentication against DynamoDB users table
// All session data is stored in DynamoDB, no localStorage dependency

import awsDynamoService from './awsDynamoService.js';
import { AWS_CONFIG, ENVIRONMENT } from '../config/aws-config.js';

// Simple password hashing (in production, use bcrypt or similar)
const hashPassword = (password) => {
  // This is a simple hash for demo purposes
  // In production, use proper cryptographic hashing like bcrypt
  // Using the same method as backend: Buffer.from(password + 'salt').toString('base64').replace(/[^a-zA-Z0-9]/g, '')
  // Browser-compatible version that produces the same result
  const base64 = btoa(unescape(encodeURIComponent(password + 'salt')));
  return base64.replace(/[^a-zA-Z0-9]/g, '');
};

const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
};

class DynamoAuthService {
  constructor() {
    this.currentUser = null;
    this.sessionId = null;
  }

  // Generate session ID
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create or update session in DynamoDB
  async createSession(userId, userData) {
    try {
      const sessionId = this.generateSessionId();
      const sessionData = {
        session_id: sessionId,
        user_id: userId,
        user_data: userData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true
      };

      // Store session in DynamoDB (we'll use the analytics table for sessions)
      const result = await awsDynamoService.recordMetric({
        metric_id: sessionId,
        metric_type: 'user_session',
        value: 1,
        metadata: sessionData
      });

      if (result.success) {
        this.sessionId = sessionId;
        this.currentUser = userData;
        return { success: true, sessionId };
      } else {
        return { success: false, error: result.error || 'Failed to create session' };
      }
    } catch (error) {
      console.error('Create session error:', error);
      return { success: false, error: error.message || 'Failed to create session' };
    }
  }

  // Get session from DynamoDB
  async getSession(sessionId) {
    try {
      const result = await awsDynamoService.getMetricsByType('user_session');
      
      if (result.success) {
        const session = result.metrics.find(m => m.metric_id === sessionId);
        if (session && session.metadata) {
          const sessionData = session.metadata;
          const now = new Date();
          const expiresAt = new Date(sessionData.expires_at);
          
          if (now < expiresAt && sessionData.is_active) {
            return { success: true, session: sessionData };
          } else {
            // Session expired or inactive
            return { success: false, error: 'Session expired' };
          }
        }
      }
      
      return { success: false, error: 'Session not found' };
    } catch (error) {
      console.error('Get session error:', error);
      return { success: false, error: error.message || 'Failed to get session' };
    }
  }

  // Invalidate session in DynamoDB
  async invalidateSession(sessionId) {
    try {
      if (!sessionId) return { success: true };

      const result = await awsDynamoService.recordMetric({
        metric_id: sessionId,
        metric_type: 'user_session',
        value: 0,
        metadata: { is_active: false, invalidated_at: new Date().toISOString() }
      });

      return { success: true };
    } catch (error) {
      console.error('Invalidate session error:', error);
      return { success: false, error: error.message || 'Failed to invalidate session' };
    }
  }

  // Register a new user
  async signup(userData) {
    try {
      const { email, password, first_name, last_name, role = 'user' } = userData;

      // Check if user already exists
      const existingUsers = await awsDynamoService.getUserByEmail(email);
      if (existingUsers.success && existingUsers.users.length > 0) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash the password
      const passwordHash = hashPassword(password);

      // Create user data
      const userDataToSave = {
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to DynamoDB
      const result = await awsDynamoService.createUser(userDataToSave);
      
      if (result.success) {
        // Don't return the password hash
        const { password_hash, ...userWithoutPassword } = result.user;
        return { success: true, user: userWithoutPassword };
      } else {
        return { success: false, error: result.error || 'Failed to create user' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  }

  // Authenticate user login
  async signin(email, password) {
    try {
      // Find user by email
      const result = await awsDynamoService.getUserByEmail(email);
      
      if (!result.success || result.users.length === 0) {
        return { success: false, error: 'Invalid email or password' };
      }

      const user = result.users[0];

      // Verify password
      if (!verifyPassword(password, user.password_hash)) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if user is active
      if (user.status !== 'active') {
        return { success: false, error: 'Account is deactivated' };
      }

      // Create session in DynamoDB
      const { password_hash, ...userWithoutPassword } = user;
      const sessionResult = await this.createSession(user.user_id, userWithoutPassword);
      
      if (sessionResult.success) {
        return { 
          success: true, 
          user: userWithoutPassword,
          sessionId: sessionResult.sessionId
        };
      } else {
        return { success: false, error: 'Failed to create session' };
      }
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: error.message || 'Signin failed' };
    }
  }

  // Sign out user
  async signout() {
    try {
      if (this.sessionId) {
        await this.invalidateSession(this.sessionId);
      }
      
      this.currentUser = null;
      this.sessionId = null;
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message || 'Signout failed' };
    }
  }

  // Get current authenticated user
  async getCurrentUser() {
    try {
      // If we already have the user in memory, return it
      if (this.currentUser) {
        return this.currentUser;
      }

      // Try to find active session
      const sessions = await awsDynamoService.getMetricsByType('user_session');
      
      if (sessions.success && sessions.metrics.length > 0) {
        // Find the most recent active session
        const activeSessions = sessions.metrics
          .filter(m => m.metadata && m.metadata.is_active)
          .sort((a, b) => new Date(b.metadata.created_at) - new Date(a.metadata.created_at));
        
        if (activeSessions.length > 0) {
          const latestSession = activeSessions[0];
          const now = new Date();
          const expiresAt = new Date(latestSession.metadata.expires_at);
          
          if (now < expiresAt) {
            this.currentUser = latestSession.metadata.user_data;
            this.sessionId = latestSession.metric_id;
            return this.currentUser;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  // Update user profile
  async updateUser(userId, updates) {
    try {
      const result = await awsDynamoService.updateUser(userId, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (result.success) {
        // Update local user if it's the current user
        if (this.currentUser && this.currentUser.user_id === userId) {
          this.currentUser = { ...this.currentUser, ...result.user };
        }
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'Failed to update user' };
      }
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message || 'Update failed' };
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user to verify current password
      const userResult = await awsDynamoService.getUser(userId);
      
      if (!userResult.success || !userResult.user) {
        return { success: false, error: 'User not found' };
      }

      const user = userResult.user;

      // Verify current password
      if (!verifyPassword(currentPassword, user.password_hash)) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const newPasswordHash = hashPassword(newPassword);

      // Update password
      const result = await awsDynamoService.updateUser(userId, {
        password_hash: newPasswordHash
      });

      if (result.success) {
        return { success: true, message: 'Password changed successfully' };
      } else {
        return { success: false, error: result.error || 'Failed to change password' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message || 'Failed to change password' };
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const result = await awsDynamoService.getUser(userId);
      
      if (result.success && result.user) {
        const { password_hash, ...userWithoutPassword } = result.user;
        return { success: true, user: userWithoutPassword };
      } else {
        return { success: false, error: result.error || 'User not found' };
      }
    } catch (error) {
      console.error('Get user by ID error:', error);
      return { success: false, error: error.message || 'Failed to get user' };
    }
  }

  // List all users (for admin)
  async listUsers(limit = 100) {
    try {
      const result = await awsDynamoService.scanTable('users', limit);
      
      if (result.success) {
        return { success: true, users: result.items };
      } else {
        return { success: false, error: result.error || 'Failed to list users' };
      }
    } catch (error) {
      console.error('List users error:', error);
      return { success: false, error: error.message || 'Failed to list users' };
    }
  }

  // Create new user (for admin)
  async createUser(userData) {
    try {
      const userId = `user-${userData.role}-${Date.now()}`;
      const now = new Date().toISOString();
      
      const user = {
        user_id: userId,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password_hash: hashPassword(userData.password),
        role: userData.role,
        status: userData.status,
        avatar: userData.avatar,
        created_at: now,
        updated_at: now
      };

      const result = await awsDynamoService.createUser(user);
      
      if (result.success) {
        // Return user without password hash
        const { password_hash, ...userWithoutPassword } = result.user;
        return { success: true, user: userWithoutPassword };
      } else {
        return { success: false, error: result.error || 'Failed to create user' };
      }
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: error.message || 'Failed to create user' };
    }
  }

  // Delete user (for admin)
  async deleteUser(userId) {
    try {
      const result = await awsDynamoService.deleteUser(userId);
      
      if (result.success) {
        return { success: true, message: 'User deleted successfully' };
      } else {
        return { success: false, error: result.error || 'Failed to delete user' };
      }
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: error.message || 'Failed to delete user' };
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      // Get user by email
      const result = await awsDynamoService.getUserByEmail(email);
      
      if (!result.success || result.users.length === 0) {
        return { success: false, error: 'User not found with this email' };
      }

      const user = result.users[0];
      
      // Generate reset token (simple implementation for demo)
      const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Store reset token in DynamoDB
      const resetResult = await awsDynamoService.recordMetric({
        metric_id: resetToken,
        metric_type: 'password_reset',
        value: 1,
        metadata: {
          user_id: user.user_id,
          email: user.email,
          reset_token: resetToken,
          expires_at: resetExpires,
          is_used: false
        }
      });

      if (resetResult.success) {
        // In a real app, you'd send an email here
        // For demo purposes, we'll just return success
        return { 
          success: true, 
          message: 'Password reset link sent to your email',
          resetToken: resetToken // Remove this in production
        };
      } else {
        return { success: false, error: 'Failed to create reset token' };
      }
    } catch (error) {
      console.error('Request password reset error:', error);
      return { success: false, error: error.message || 'Failed to request password reset' };
    }
  }

  // Reset password with token
  async resetPasswordWithToken(resetToken, newPassword) {
    try {
      // Get reset token from DynamoDB
      const result = await awsDynamoService.getMetricsByType('password_reset');
      
      if (!result.success) {
        return { success: false, error: 'Failed to verify reset token' };
      }

      const resetData = result.metrics.find(m => m.metric_id === resetToken);
      
      if (!resetData || !resetData.metadata) {
        return { success: false, error: 'Invalid reset token' };
      }

      const { user_id, expires_at, is_used } = resetData.metadata;

      // Check if token is expired or already used
      if (new Date() > new Date(expires_at)) {
        return { success: false, error: 'Reset token has expired' };
      }

      if (is_used) {
        return { success: false, error: 'Reset token has already been used' };
      }

      // Hash new password
      const newPasswordHash = hashPassword(newPassword);

      // Update user password
      const updateResult = await awsDynamoService.updateUser(user_id, {
        password_hash: newPasswordHash
      });

      if (!updateResult.success) {
        return { success: false, error: 'Failed to update password' };
      }

      // Mark reset token as used
      await awsDynamoService.recordMetric({
        metric_id: resetToken,
        metric_type: 'password_reset',
        value: 0,
        metadata: {
          ...resetData.metadata,
          is_used: true,
          used_at: new Date().toISOString()
        }
      });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Reset password with token error:', error);
      return { success: false, error: error.message || 'Failed to reset password' };
    }
  }
}

export default new DynamoAuthService();
