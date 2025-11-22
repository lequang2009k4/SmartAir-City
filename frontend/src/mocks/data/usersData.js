// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

/**
 * Users Mock Data Generator
 * Based on openapi (1).yaml specs
 */

const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// ============================================
// USER ROLES
// ============================================

const USER_ROLES = ['admin', 'user', 'viewer'];

// ============================================
// GENERATE USER
// ============================================

/**
 * Generate một user theo OpenAPI schema
 * @param {object} options - Options
 * @returns {object} User object
 */
export const generateUser = (options = {}) => {
  const id = options.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const name = options.name || `User ${Math.floor(Math.random() * 1000)}`;
  
  return {
    id: id,
    role: options.role || randomChoice(USER_ROLES),
    pw: 'hashed_password_here', // Never return real password
    mail: options.mail || `${name.toLowerCase().replace(/\s/g, '.')}@smartaircity.com`,
    name: name,
  };
};

// ============================================
// GENERATE MULTIPLE USERS
// ============================================

/**
 * Generate array of users
 * @param {number} count - Number of users
 * @returns {array} Array of users
 */
export const generateUsers = (count = 5) => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push(generateUser({
      name: `User ${i + 1}`
    }));
  }
  
  return users;
};

// ============================================
// MOCK USERS DATABASE
// ============================================

export const MOCK_USERS = [
  {
    id: 'admin-001',
    role: 'admin',
    pw: 'password123', // For testing
    mail: 'admin@test.com',
    email: 'admin@test.com',
    name: 'Admin User',
    username: 'admin',
    fullName: 'Admin User',
    isEmailVerified: true,
    avatar: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-001',
    role: 'user',
    pw: 'password123', // For testing
    mail: 'user@test.com',
    email: 'user@test.com',
    name: 'Regular User',
    username: 'user',
    fullName: 'Regular User',
    isEmailVerified: true,
    avatar: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-002',
    role: 'user',
    pw: 'password123',
    mail: 'john@test.com',
    email: 'john@test.com',
    name: 'John Doe',
    username: 'john',
    fullName: 'John Doe',
    isEmailVerified: true,
    avatar: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-003',
    role: 'user',
    pw: 'password123',
    mail: 'jane@test.com',
    email: 'jane@test.com',
    name: 'Jane Smith',
    username: 'jane',
    fullName: 'Jane Smith',
    isEmailVerified: true,
    avatar: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-004',
    role: 'user',
    pw: 'password123',
    mail: 'bob@test.com',
    email: 'bob@test.com',
    name: 'Bob Johnson',
    username: 'bob',
    fullName: 'Bob Johnson',
    isEmailVerified: true,
    avatar: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Mock login - Check email and password
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {object} Login result
 */
export const mockLogin = (email, password) => {
  console.log('[mockLogin] Attempting login:', email);
  
  const user = MOCK_USERS.find(u => u.email === email || u.mail === email);
  
  if (!user) {
    console.log('[mockLogin] User not found:', email);
    return {
      success: false,
      error: 'Email hoặc mật khẩu không đúng'
    };
  }
  
  // Check password
  if (user.pw !== password) {
    console.log('[mockLogin] Invalid password');
    return {
      success: false,
      error: 'Email hoặc mật khẩu không đúng'
    };
  }
  
  console.log('[mockLogin] Login successful:', user);
  
  return {
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: user.id,
      email: user.email || user.mail,
      username: user.username || user.name,
      fullName: user.fullName || user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified || false,
      avatar: user.avatar || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: new Date().toISOString(),
    }
  };
};

/**
 * Mock signup
 * @param {string} email - Email
 * @param {string} password - Password
 * @param {string} username - Username (optional)
 * @returns {object} Signup result
 */
export const mockSignup = (email, password, username = null) => {
  console.log('[mockSignup] Attempting signup:', email);
  
  const exists = MOCK_USERS.find(u => u.email === email || u.mail === email);
  
  if (exists) {
    console.log('[mockSignup] Email already exists');
    return {
      success: false,
      error: 'Email đã được sử dụng'
    };
  }
  
  const newUser = {
    id: `user-${Date.now()}`,
    role: 'user',
    pw: password,
    mail: email,
    email: email,
    name: username || email.split('@')[0],
    username: username || email.split('@')[0],
    fullName: username || email.split('@')[0],
    isEmailVerified: false,
    avatar: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  
  MOCK_USERS.push(newUser);
  console.log('[mockSignup] Signup successful:', newUser);
  
  return {
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      isEmailVerified: newUser.isEmailVerified,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      lastLogin: newUser.lastLogin,
    }
  };
};

// Export default
const usersMockData = {
  generateUser,
  generateUsers,
  MOCK_USERS,
  mockLogin,
  mockSignup,
  USER_ROLES,
};

export default usersMockData;
