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

/**
 * API Configuration
 * Central configuration for all API endpoints
 * 
 * USAGE:
 * - Development: Automatically uses localhost ports
 * - Production: Switch to production domain in .env.production
 * - To change domain: Just update .env files
 */

// ============================================
// ENVIRONMENT VARIABLES
// ============================================
const ENV = process.env.REACT_APP_ENV || 'development';
const AIR_API_BASE_URL = process.env.REACT_APP_AIR_API_URL;
const CORE_API_BASE_URL = process.env.REACT_APP_CORE_API_URL;
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;
const AUTO_REFRESH_INTERVAL = parseInt(process.env.REACT_APP_AUTO_REFRESH_INTERVAL) || 30000;

// ============================================
// API ENDPOINTS - AIR QUALITY
// ============================================
export const AIR_QUALITY_ENDPOINTS = {
  // Base URL
  BASE_URL: AIR_API_BASE_URL,
  
  // Air Quality Query Endpoints (Public)
  GET_ALL: `${AIR_API_BASE_URL}/api/airquality`,
  GET_LATEST: `${AIR_API_BASE_URL}/api/airquality/latest`,
  GET_HISTORY: `${AIR_API_BASE_URL}/api/airquality/history`,
  
  // Download Endpoints (NEW)
  DOWNLOAD: `${AIR_API_BASE_URL}/api/airquality/download`,
  DOWNLOAD_HISTORY: `${AIR_API_BASE_URL}/api/airquality/history/download`,
  
  // IoT Ingest Endpoint (Private - for admin only)
  POST_IOT_DATA: `${AIR_API_BASE_URL}/api/iot-data`,
};

// ============================================
// API ENDPOINTS - DEVICES
// ============================================
export const DEVICES_ENDPOINTS = {
  // Base URL
  BASE_URL: CORE_API_BASE_URL,
  
  // Devices Management
  GET_ALL: `${CORE_API_BASE_URL}/api/Devices`,
  GET_BY_ID: (id) => `${CORE_API_BASE_URL}/api/Devices/${id}`,
  UPDATE: (id) => `${CORE_API_BASE_URL}/api/Devices/${id}`,
  DELETE: (id) => `${CORE_API_BASE_URL}/api/Devices/${id}`,
};

// ============================================
// API ENDPOINTS - USERS
// ============================================
export const USERS_ENDPOINTS = {
  // Base URL
  BASE_URL: CORE_API_BASE_URL,
  
  // User Management
  GET_ALL: `${CORE_API_BASE_URL}/api/Users`,
  GET_BY_ID: (id) => `${CORE_API_BASE_URL}/api/Users/${id}`,
  DELETE: (id) => `${CORE_API_BASE_URL}/api/Users/${id}`,
  
  // Authentication
  SIGNUP: `${CORE_API_BASE_URL}/api/Users/singup`, // Note: Backend has typo 'singup'
  LOGIN: `${CORE_API_BASE_URL}/api/Users/login`,
  
  // Email
  SEND_EMAIL: `${CORE_API_BASE_URL}/api/Users/email`,
};

// ============================================
// API ENDPOINTS - CONTRIBUTIONS
// ============================================
export const CONTRIBUTIONS_ENDPOINTS = {
  // Base URL
  BASE_URL: AIR_API_BASE_URL,
  
  // Valid Contributions Endpoints from api.yaml
  UPLOAD: `${AIR_API_BASE_URL}/api/contributions/upload`,
  PUBLIC_STATS: `${AIR_API_BASE_URL}/api/contributions/public`,
  LIST: `${AIR_API_BASE_URL}/api/contributions/list`,
  LATEST_BY_ID: (contributionId) => `${AIR_API_BASE_URL}/api/contributions/${contributionId}/latest`,
  DOWNLOAD_BY_ID: (contributionId) => `${AIR_API_BASE_URL}/api/contributions/${contributionId}/download`,
};

// ============================================
// API ENDPOINTS - STATIONS
// ============================================
export const STATIONS_ENDPOINTS = {
  // Base URL
  BASE_URL: AIR_API_BASE_URL,
  
  // Stations Information
  GET_ALL: `${AIR_API_BASE_URL}/api/stations`,
  GET_FOR_MAP: `${AIR_API_BASE_URL}/api/stations/map`,
  GET_STATION_DATA: (stationId) => `${AIR_API_BASE_URL}/api/stations/${stationId}/data`,
};

// ============================================
// API ENDPOINTS - EXTERNAL HTTP SOURCES
// ============================================
export const EXTERNAL_SOURCES_ENDPOINTS = {
  // Base URL
  BASE_URL: AIR_API_BASE_URL,
  
  // External HTTP Sources Management
  GET_ALL: `${AIR_API_BASE_URL}/api/sources`,
  CREATE: `${AIR_API_BASE_URL}/api/sources`,
  DELETE: (id) => `${AIR_API_BASE_URL}/api/sources/${id}`,
  REACTIVATE: (id) => `${AIR_API_BASE_URL}/api/sources/${id}/reactivate`,
  TEST_URL: `${AIR_API_BASE_URL}/api/sources/test`,
};

// ============================================
// API ENDPOINTS - EXTERNAL MQTT SOURCES
// ============================================
export const EXTERNAL_MQTT_ENDPOINTS = {
  // Base URL
  BASE_URL: AIR_API_BASE_URL,
  
  // External MQTT Sources Management
  GET_ALL: `${AIR_API_BASE_URL}/api/mqtt/sources`,
  GET_BY_ID: (id) => `${AIR_API_BASE_URL}/api/mqtt/sources/${id}`,
  CREATE: `${AIR_API_BASE_URL}/api/mqtt/sources`,
  UPDATE: (id) => `${AIR_API_BASE_URL}/api/mqtt/sources/${id}`,
  DELETE: (id) => `${AIR_API_BASE_URL}/api/mqtt/sources/${id}`,
  UPDATE_OPENAQ: (id) => `${AIR_API_BASE_URL}/api/mqtt/sources/${id}/openaq`,
  ACTIVATE: (id) => `${AIR_API_BASE_URL}/api/mqtt/sources/${id}/activate`,
  DEACTIVATE: (id) => `${AIR_API_BASE_URL}/api/mqtt/sources/${id}/deactivate`,
  TEST_CONNECTION: `${AIR_API_BASE_URL}/api/mqtt/sources/test`,
};

// ============================================
// GENERAL CONFIG
// ============================================
export const API_CONFIG = {
  // Environment
  ENV,
  IS_PRODUCTION: ENV === 'production',
  IS_DEVELOPMENT: ENV === 'development',
  
  // Timeouts
  TIMEOUT: API_TIMEOUT,
  AUTO_REFRESH_INTERVAL,
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Feature Flags
  ENABLE_AUTH: process.env.REACT_APP_ENABLE_AUTH === 'true',
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {object} params - Query parameters
 * @returns {string} - Full URL with query string
 */
export const buildUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

/**
 * Log API request (only in development)
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} data - Request data
 */
export const logApiRequest = (method, url, data = null) => {
  if (API_CONFIG.DEBUG_MODE) {
    if (data) console.log('[Data]', data);
  }
};

/**
 * Log API response (only in development)
 * @param {string} url - Request URL
 * @param {object} response - Response data
 */
export const logApiResponse = (url, response) => {
  if (API_CONFIG.DEBUG_MODE) {
    console.log('[Data]', response);
  }
};

// Export default config object
const config = {
  AIR_QUALITY_ENDPOINTS,
  DEVICES_ENDPOINTS,
  USERS_ENDPOINTS,
  CONTRIBUTIONS_ENDPOINTS,
  STATIONS_ENDPOINTS,
  EXTERNAL_SOURCES_ENDPOINTS,
  EXTERNAL_MQTT_ENDPOINTS,
  API_CONFIG,
  buildUrl,
  logApiRequest,
  logApiResponse,
};

export default config;
