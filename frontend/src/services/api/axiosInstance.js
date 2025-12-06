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
 * Axios Instance
 * Central HTTP client với interceptors
 * 
 * Features:
 * - Request/Response logging
 * - Error handling
 * - Timeout management
 * - Headers management
 */

import axios from 'axios';
import { API_CONFIG, logApiRequest, logApiResponse } from '../config/apiConfig';
import { normalizeError, logError } from './errorHandler';

// ============================================
// CREATE AXIOS INSTANCES
// ============================================

/**
 * Air Quality API Instance (Port 5182)
 */
export const airQualityAxios = axios.create({
  baseURL: process.env.REACT_APP_AIR_API_URL || 'http://localhost:5182',
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

/**
 * Core API Instance - Devices, Users & Auth (Port 5252)
 * Backend must have CORS enabled to allow requests from localhost:3000
 */
export const coreApiAxios = axios.create({
  baseURL: process.env.REACT_APP_CORE_API_URL || 'http://localhost:5252',
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Debug logging
console.log('🔧 [Axios Config] Core API Base URL:', coreApiAxios.defaults.baseURL);
console.log('🔧 [Env] REACT_APP_CORE_API_URL:', process.env.REACT_APP_CORE_API_URL);

// ============================================
// REQUEST INTERCEPTOR
// ============================================

const requestInterceptor = (config) => {
  // Log request (chỉ trong development)
  logApiRequest(config.method?.toUpperCase(), config.url, config.data);

  // Add timestamp to request
  config.metadata = { startTime: new Date() };

  // Add authentication token
  const token = localStorage.getItem('smartair_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ [Auth] Token added to request:', config.url);
  } else {
    console.warn('⚠️ [Auth] No token found in localStorage for request:', config.url);
  }

  return config;
};

const requestErrorInterceptor = (error) => {
  logError(normalizeError(error), 'Request Error');
  return Promise.reject(error);
};

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

const responseInterceptor = (response) => {
  // Calculate response time
  const endTime = new Date();
  const startTime = response.config.metadata?.startTime;
  const duration = startTime ? endTime - startTime : 0;

  // Log response (chỉ trong development)
  if (API_CONFIG.DEBUG_MODE) {
    logApiResponse(response.config.url, response.data);
    console.log(`⏱️  Response time: ${duration}ms`);
  }

  // Return data directly (unwrap response.data)
  return response.data;
};

const responseErrorInterceptor = (error) => {
  // Normalize error
  const normalizedError = normalizeError(error);
  
  // Log error
  const context = error.config?.url 
    ? `${error.config.method?.toUpperCase()} ${error.config.url}`
    : 'Unknown endpoint';
  logError(normalizedError, context);

  // Reject với normalized error
  return Promise.reject(normalizedError);
};

// ============================================
// APPLY INTERCEPTORS
// ============================================

// Air Quality API interceptors
airQualityAxios.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor
);

airQualityAxios.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor
);

// Core API interceptors
coreApiAxios.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor
);

coreApiAxios.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * GET request helper
 * @param {object} axiosInstance - Axios instance to use
 * @param {string} url - Request URL
 * @param {object} config - Axios config
 */
export const get = (axiosInstance, url, config = {}) => {
  return axiosInstance.get(url, config);
};

/**
 * POST request helper
 * @param {object} axiosInstance - Axios instance to use
 * @param {string} url - Request URL
 * @param {object} data - Request body
 * @param {object} config - Axios config
 */
export const post = (axiosInstance, url, data, config = {}) => {
  return axiosInstance.post(url, data, config);
};

/**
 * PUT request helper
 * @param {object} axiosInstance - Axios instance to use
 * @param {string} url - Request URL
 * @param {object} data - Request body
 * @param {object} config - Axios config
 */
export const put = (axiosInstance, url, data, config = {}) => {
  return axiosInstance.put(url, data, config);
};

/**
 * DELETE request helper
 * @param {object} axiosInstance - Axios instance to use
 * @param {string} url - Request URL
 * @param {object} config - Axios config
 */
export const del = (axiosInstance, url, config = {}) => {
  return axiosInstance.delete(url, config);
};

// ============================================
// DEFAULT EXPORT
// ============================================

const axiosInstances = {
  airQualityAxios,
  coreApiAxios,
  get,
  post,
  put,
  del,
};

export default axiosInstances;
