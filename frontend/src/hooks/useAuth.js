// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// See LICENSE file in root directory for full license text.
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

import { useState, useEffect, useCallback, useRef } from 'react';
import { usersService } from '../services';

/**
 * Custom hook for Authentication
 * @returns {Object} Authentication state and methods
 */
const useAuth = () => {
  // State management
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const isMountedRef = useRef(true);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setUser(null);
        }
        return false;
      }
      
      // Validate token by getting current user profile
      const userData = await usersService.getCurrentUser();
      
      if (isMountedRef.current) {
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return true;
    } catch (err) {
      console.error('Error checking authentication:', err);
      
      // Clear invalid token
      localStorage.removeItem('token');
      
      if (isMountedRef.current) {
        setIsAuthenticated(false);
        setUser(null);
        setError(err.message || 'Authentication check failed');
      }
      
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await usersService.login(username, password);
      
      if (isMountedRef.current) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      console.error('Login error:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Login failed');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await usersService.logout();
      
      if (isMountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Logout error:', err);
      
      // Still clear local state even if API call fails
      if (isMountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError(err.message || 'Logout failed');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await usersService.register(userData);
      
      // Auto login after registration
      if (isMountedRef.current) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Registration failed');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (userId, userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await usersService.updateUser(userId, userData);
      
      // Update current user if it's the same
      if (isMountedRef.current && user?.id === userId) {
        setUser(updatedUser);
      }
      
      return updatedUser;
    } catch (err) {
      console.error('Update profile error:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to update profile');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      
      const userData = await usersService.getCurrentUser();
      
      if (isMountedRef.current) {
        setUser(userData);
      }
      
      return userData;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to refresh user data');
      }
      throw err;
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check authentication on mount - Only run once
  useEffect(() => {
    console.log('🚀 [useAuth] Checking auth on mount');
    
    const checkInitialAuth = async () => {
      try {
        console.log('🔄 [useAuth] Starting checkAuth...');
        setIsLoading(true);
        setError(null);
        
        const userData = await usersService.getCurrentUser();
        
        console.log('✅ [useAuth] checkAuth success:', userData ? 'Authenticated' : 'Guest');
        
        if (isMountedRef.current) {
          setUser(userData);
        }
      } catch (err) {
        console.error('❌ [useAuth] checkAuth error:', err);
        if (isMountedRef.current) {
          setUser(null);
        }
      } finally {
        if (isMountedRef.current) {
          console.log('🏁 [useAuth] Setting isLoading = false');
          setIsLoading(false);
        }
      }
    };
    
    checkInitialAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Methods
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    checkAuth,
    clearError,
    
    // Computed
    userName: user?.name || user?.username || 'Guest',
    userRole: user?.role || 'user',
    isAdmin: user?.role === 'admin',
  };
};

export default useAuth;
