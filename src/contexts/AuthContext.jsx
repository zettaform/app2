import React, { createContext, useState, useContext, useEffect } from 'react';
import backendAuthService from '../services/backendAuthService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Legacy CSV fallback (kept for admin demo); backend auth is preferred
// Load users from CSV data
let usersData = [];

const loadUsers = async () => {
  try {
    const response = await fetch('/src/data/users.csv');
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    usersData = lines.slice(1).map(line => {
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
  } catch (error) {
    console.error('Failed to load users:', error);
    // Fallback users if CSV fails
    usersData = [
      { id: 1, username: 'john_doe', email: 'john@example.com', password: 'password123', full_name: 'John Doe', avatar: 'avatar1.png', onboarding_completed: true, role: 'user' },
      { id: 2, username: 'admin_user', email: 'admin@example.com', password: 'admin123', full_name: 'Admin User', avatar: 'avatar3.png', onboarding_completed: true, role: 'admin' }
    ];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fast authentication check with timeout
    const checkAuth = async () => {
      try {
        // Quick check for token first
        if (!backendAuthService.isAuthenticated()) {
          setLoading(false);
          return;
        }

        // Try backup data first for faster refresh recovery
        const backup = sessionStorage.getItem('mosaic_user_backup');
        if (backup) {
          try {
            const userData = JSON.parse(backup);
            setUser(userData);
            setLoading(false);
            
            // Validate token in background
            setTimeout(async () => {
              try {
                const currentUser = await backendAuthService.getCurrentUser();
                if (currentUser) {
                  setUser(currentUser);
                  sessionStorage.setItem('mosaic_user_backup', JSON.stringify(currentUser));
                } else {
                  backendAuthService.signout();
                  setUser(null);
                }
              } catch (error) {
                console.error('Background auth validation failed:', error);
                backendAuthService.signout();
                setUser(null);
              }
            }, 100);
            return;
          } catch (e) {
            // Backup data corrupted, continue with normal flow
          }
        }

        // Normal authentication flow with timeout
        const authPromise = backendAuthService.getCurrentUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        const currentUser = await Promise.race([authPromise, timeoutPromise]);
        
        if (currentUser) {
          setUser(currentUser);
          sessionStorage.setItem('mosaic_user_backup', JSON.stringify(currentUser));
        } else {
          backendAuthService.signout();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        backendAuthService.signout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (userData) => {
    try {
      // Use backend authentication service
      const result = await backendAuthService.signup({
        email: userData.email,
        password: userData.password,
        name: userData.name
      });
      
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  };

  const signin = async ({ email, password }) => {
    try {
      // Use backend authentication
      const result = await backendAuthService.signin(email, password);
      if (result.success) {
        setUser(result.user);
        // Simple backup for refresh scenarios
        sessionStorage.setItem('mosaic_user_backup', JSON.stringify(result.user));
        return { success: true };
      }
      return { success: false, error: result.error || 'Login failed' };
    } catch (err) {
      console.error('Signin failed:', err);
      return { success: false, error: err.message || 'Signin failed' };
    }
  };

  const signout = async () => {
    await backendAuthService.signout();
    sessionStorage.removeItem('mosaic_user_backup');
    setUser(null);
    navigate('/signin');
  };

  const updateUser = async (userData) => {
    try {
      // Mock update - just update local state
      const updated = { ...user, ...userData };
      setUser(updated);
      return updated;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Mock refresh user
  const refreshUser = async () => {
    try {
      // Just return current user
      return user;
    } catch (e) {
      console.error('Failed to refresh user', e);
      throw e;
    }
  };

  // Mock change avatar
  const changeAvatar = async (avatar) => {
    const updated = { ...user, avatar };
    setUser(updated);
    return updated;
  };

  const updateOnboardingStep = async (stepData) => {
    return { success: true, user };
  };
  
  const completeOnboarding = async () => {
    try {
      const updated = { ...user, onboarding_completed: true };
      setUser(updated);
      return { success: true, user: updated };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    currentUser: user,
    loading,
    signup,
    signin,
    signout,
    updateUser,
    changeAvatar,
    refreshUser,
    updateOnboardingStep,
    completeOnboarding,
    isAuthenticated: !!user,
    onboardingComplete: !!user?.onboarding_completed,
    currentOnboardingStep: 4, // consider UI already complete when server marks done
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export AuthContext for direct access
export { AuthContext };
