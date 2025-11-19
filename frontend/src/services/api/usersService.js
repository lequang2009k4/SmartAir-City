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
 * Backend response: { id?, name, email, role, password? }
 */
const transformUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'citizen',
    _raw: user,
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
 * Alias for getAll (for hook compatibility)
 */
export const getAllUsers = async () => {
  return await getAll(true);
};

/**
 * User signup
 * @param {object} userData - User registration data
 * @param {string} userData.email - Email
 * @param {string} userData.password - Password
 * @param {string} userData.name - Full name
 * @returns {Promise<object>} Response with message and userId
 */
export const signup = async (userData) => {
  const response = await coreApiAxios.post('/api/Users/signup', userData);
  
  console.log('📝 [Signup] Backend response:', response);
  
  // Backend returns: { message, userId }
  return {
    success: true,
    message: response.message,
    userId: response.userId,
  };
};

/**
 * User login
 * @param {object} credentials - Login credentials
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Password
 * @returns {Promise<object>} Response with user data
 */
export const login = async (credentials) => {
  const response = await coreApiAxios.post('/api/Users/login', credentials);
  
  console.log('🔐 [Login] Backend response:', response);
  
  // Backend returns user data directly: { name, email, role }
  const transformedUser = transformUser(response);
  
  // Save user data (no token from backend)
  saveUser(transformedUser);
  // Save a dummy token for isAuthenticated check
  saveToken('authenticated');
  
  return {
    success: true,
    user: transformedUser,
    message: 'Đăng nhập thành công',
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

/**
 * Alias for remove (for hook compatibility)
 */
export const deleteUser = async (id) => {
  return await remove(id);
};

/**
 * Send email to user
 * @param {string} email - Recipient email
 * @param {string} message - Email message
 * @returns {Promise<object>} Response with success message
 */
export const sendEmail = async (email, message) => {
  const response = await coreApiAxios.post('/api/Users/email', {
    email,
    message
  });
  
  console.log('📧 [SendEmail] Backend response:', response);
  
  return {
    success: true,
    message: response.message || `Đã gửi email tới ${email}`
  };
};

/**
 * Get current user (from token)
 * @returns {Promise<object>} Current user data
 */
export const getCurrentUser = async () => {
  // In production, this would call /api/users/me or similar
  // For now, get from localStorage
  const user = getUser();
  
  if (!user) {
    throw new Error('No user logged in');
  }
  
  return user;
};

/**
 * Register new user (alias for signup)
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Response with user and token
 */
export const register = async (userData) => {
  return await signup(userData);
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {object} userData - User data to update
 * @returns {Promise<object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  const response = await coreApiAxios.put(`/api/Users/${userId}`, userData);
  
  const transformedUser = transformUser(response);
  
  // Update localStorage if updating current user
  const currentUser = getUser();
  if (currentUser && currentUser.id === userId) {
    saveUser(transformedUser);
  }
  
  return transformedUser;
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
  getAllUsers,
  signup,
  login,
  logout,
  verifyEmail,
  remove,
  deleteUser,
  sendEmail,  // ← Added missing function
  
  // Hook-compatible methods
  getCurrentUser,
  register,
  updateUser,
  
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
