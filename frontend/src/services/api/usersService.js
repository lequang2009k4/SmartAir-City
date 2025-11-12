// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Users API Service
 * Service layer cho Users endpoints (openapi (1).yaml)
 * 
 * Endpoints:
 * - GET /api/users                    → getAll()
 * - POST /api/users/signup            → signup(userData)
 * - POST /api/users/login             → login(credentials)
 * - POST /api/users/verify-email      → verifyEmail(token)
 * - DELETE /api/users/{id}            → remove(id)
 */

import { coreApiAxios } from './axiosInstance';

// ============================================
// LOCAL STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  TOKEN: 'smartair_auth_token',
  USER: 'smartair_user',
  REFRESH_TOKEN: 'smartair_refresh_token',
};

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform user data từ backend → frontend format
 */
const transformUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName || user.username,
    role: user.role || 'user',
    isEmailVerified: user.isEmailVerified || false,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin,
    _raw: user, // Keep original for debugging
  };
};

/**
 * Transform array of users
 */
const transformUserArray = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(transformUser);
};

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Save auth token to localStorage
 * @param {string} token - JWT token
 */
export const saveToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
};

/**
 * Get auth token from localStorage
 * @returns {string|null} JWT token
 */
export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Remove auth token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Save user data to localStorage
 * @param {object} user - User data
 */
export const saveUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
};

/**
 * Get user data from localStorage
 * @returns {object|null} User data
 */
export const getUser = () => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Check if user has admin role
 * @returns {boolean}
 */
export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

// ============================================
// API METHODS
// ============================================

/**
 * Get all users (admin only)
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of users
 */
export const getAll = async (transform = true) => {
  const data = await coreApiAxios.get('/api/Users');
  return transform ? transformUserArray(data) : data;
};

/**
 * User signup
 * @param {object} userData - User registration data
 * @param {string} userData.email - Email
 * @param {string} userData.username - Username
 * @param {string} userData.password - Password
 * @param {string} userData.fullName - Full name (optional)
 * @returns {Promise<object>} Response with user and token
 */
export const signup = async (userData) => {
  const response = await coreApiAxios.post('/api/Users/singup', userData);
  
  // Auto save token and user if provided
  if (response.token) {
    saveToken(response.token);
  }
  if (response.user) {
    const transformedUser = transformUser(response.user);
    saveUser(transformedUser);
  }
  
  return {
    user: transformUser(response.user),
    token: response.token,
    message: response.message,
  };
};

/**
 * User login
 * @param {object} credentials - Login credentials
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Password
 * @returns {Promise<object>} Response with user and token
 */
export const login = async (credentials) => {
  const response = await coreApiAxios.post('/api/Users/login', credentials);
  
  // Auto save token and user
  if (response.token) {
    saveToken(response.token);
  }
  if (response.user) {
    const transformedUser = transformUser(response.user);
    saveUser(transformedUser);
  }
  
  return {
    user: transformUser(response.user),
    token: response.token,
    message: response.message,
  };
};

/**
 * User logout
 */
export const logout = () => {
  removeToken();
  // Optional: Call backend logout endpoint if exists
  // await coreApiAxios.post('/api/Users/logout');
};

/**
 * Verify email
 * @param {string} token - Email verification token
 * @returns {Promise<object>} Response
 */
export const verifyEmail = async (token) => {
  const response = await coreApiAxios.post('/api/Users/email', { token });
  return response;
};

/**
 * Delete user by ID (admin only)
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
export const remove = async (id) => {
  await coreApiAxios.delete(`/api/Users/${id}`);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get role info
 * @param {string} role - User role
 * @returns {object} Role info with color and icon
 */
export const getRoleInfo = (role) => {
  const roleMap = {
    admin: { label: 'Quản trị viên', color: '#f44336', icon: '👑' },
    moderator: { label: 'Điều hành viên', color: '#FF9800', icon: '🛡️' },
    user: { label: 'Người dùng', color: '#2196F3', icon: '👤' },
    guest: { label: 'Khách', color: '#9E9E9E', icon: '🚶' },
  };

  return roleMap[role?.toLowerCase()] || roleMap.guest;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: [],
    strength: 'weak',
  };

  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }

  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Mật khẩu phải có ít nhất 1 số');
  }

  // Calculate strength
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^A-Za-z0-9]/.test(password)) strengthScore++;

  if (strengthScore <= 2) result.strength = 'weak';
  else if (strengthScore <= 3) result.strength = 'medium';
  else result.strength = 'strong';

  return result;
};

/**
 * Filter users by role
 * @param {array} users - Array of users
 * @param {string} role - Role to filter
 * @returns {array} Filtered users
 */
export const filterByRole = (users, role) => {
  if (!role || role === 'all') return users;
  return users.filter(user => user.role?.toLowerCase() === role.toLowerCase());
};

/**
 * Get user statistics
 * @param {array} users - Array of users
 * @returns {object} Statistics
 */
export const getStatistics = (users) => {
  if (!Array.isArray(users)) return null;

  const stats = {
    total: users.length,
    verified: 0,
    unverified: 0,
    byRole: {},
  };

  users.forEach(user => {
    // Count verified
    if (user.isEmailVerified) {
      stats.verified++;
    } else {
      stats.unverified++;
    }

    // Count by role
    const role = user.role?.toLowerCase() || 'user';
    stats.byRole[role] = (stats.byRole[role] || 0) + 1;
  });

  return stats;
};

// Default export
const usersService = {
  // API methods
  getAll,
  signup,
  login,
  logout,
  verifyEmail,
  remove,
  
  // Auth helpers
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  isAuthenticated,
  isAdmin,
  
  // Helper functions
  getRoleInfo,
  validateEmail,
  validatePassword,
  filterByRole,
  getStatistics,
};

export default usersService;
