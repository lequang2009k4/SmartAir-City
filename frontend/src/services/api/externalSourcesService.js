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
 * External HTTP Sources API Service
 * Service layer for External HTTP Data Sources endpoints
 */

import { airQualityAxios } from './axiosInstance';
import { EXTERNAL_SOURCES_ENDPOINTS } from '../config/apiConfig';
import { normalizeError, logError } from './errorHandler';

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform external source data from backend
 * @param {object} source - Raw source data from API
 * @returns {object} Transformed source data
 */
export const transformSource = (source) => {
  if (!source) return null;

  return {
    id: source.id,
    name: source.name,
    url: source.url,
    stationId: source.stationId,
    intervalMinutes: source.intervalMinutes,
    latitude: source.latitude,
    longitude: source.longitude,
    headers: source.headers || {},
    isNGSILD: source.isNGSILD || false,
    mapping: source.mapping || null,
    lastFetchedAt: source.lastFetchedAt,
    failureCount: source.failureCount || 0,
    isActive: source.isActive,
    lastError: source.lastError || null,
    
    // Additional computed fields
    location: {
      type: 'Point',
      coordinates: [source.longitude, source.latitude],
      lat: source.latitude,
      lng: source.longitude,
    },
    status: source.isActive ? 'active' : 'inactive',
    hasErrors: source.failureCount > 0,
    
    // Raw data
    _raw: source,
  };
};

/**
 * Transform array of sources
 * @param {array} sources - Array of source objects
 * @returns {array} Transformed sources
 */
export const transformSources = (sources) => {
  if (!Array.isArray(sources)) return [];
  return sources.map(transformSource).filter(Boolean);
};

/**
 * Transform frontend source data to backend format for create
 * @param {object} sourceData - Frontend source data
 * @returns {object} Backend-compatible source data
 */
export const transformSourceToBackend = (sourceData) => {
  const backendData = {
    name: sourceData.name,
    url: sourceData.url,
    stationId: sourceData.stationId,
    intervalMinutes: sourceData.intervalMinutes || 60,
    latitude: sourceData.latitude,
    longitude: sourceData.longitude,
    isNGSILD: true, // Always NGSI-LD for new API
  };

  // Add headers if provided
  if (sourceData.headers && Object.keys(sourceData.headers).length > 0) {
    backendData.headers = sourceData.headers;
  }

  return backendData;
};

// ============================================
// VALIDATION
// ============================================

/**
 * Validate source data before creating
 * @param {object} sourceData - Source data to validate
 * @returns {object} Validation result { isValid: boolean, errors: array }
 */
export const validateSourceData = (sourceData) => {
  const errors = [];

  // Required fields
  if (!sourceData.name || sourceData.name.trim() === '') {
    errors.push('Tên nguồn dữ liệu là bắt buộc');
  }

  if (!sourceData.url || sourceData.url.trim() === '') {
    errors.push('URL là bắt buộc');
  } else {
    // Validate URL format
    try {
      new URL(sourceData.url);
    } catch (e) {
      errors.push('URL không hợp lệ');
    }
  }

  if (!sourceData.stationId || sourceData.stationId.trim() === '') {
    errors.push('Station ID là bắt buộc');
  }

  if (sourceData.latitude === undefined || sourceData.latitude === null) {
    errors.push('Latitude là bắt buộc');
  } else if (sourceData.latitude < -90 || sourceData.latitude > 90) {
    errors.push('Latitude phải trong khoảng -90 đến 90');
  }

  if (sourceData.longitude === undefined || sourceData.longitude === null) {
    errors.push('Longitude là bắt buộc');
  } else if (sourceData.longitude < -180 || sourceData.longitude > 180) {
    errors.push('Longitude phải trong khoảng -180 đến 180');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// API METHODS
// ============================================

/**
 * Get all external HTTP sources
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of external sources
 */
export const getAll = async (transform = true) => {
  try {
    console.log('🌐 [externalSourcesService] Fetching all external sources...');
    
    const response = await airQualityAxios.get(EXTERNAL_SOURCES_ENDPOINTS.GET_ALL);
    
    console.log('✅ [externalSourcesService] Sources received:', {
      total: response?.length || 0,
    });
    
    return transform ? transformSources(response) : response;
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get All External Sources');
    
    console.error('❌ [externalSourcesService] Error fetching sources:', normalizedError.message);
    
    throw normalizedError;
  }
};

/**
 * Create a new external HTTP source
 * @param {object} sourceData - Source data to create
 * @returns {Promise<object>} Created source response
 */
export const create = async (sourceData) => {
  try {
    // Validate before sending
    const validation = validateSourceData(sourceData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const backendData = transformSourceToBackend(sourceData);
    
    console.log('➕ [externalSourcesService] Creating external source...', {
      name: backendData.name,
      url: backendData.url,
    });
    
    const response = await airQualityAxios.post(
      EXTERNAL_SOURCES_ENDPOINTS.CREATE,
      backendData
    );
    
    console.log('✅ [externalSourcesService] Source created:', {
      id: response.id,
      name: response.name,
    });
    
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Create External Source');
    
    console.error('❌ [externalSourcesService] Error creating source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      details: normalizedError.data || null,
    };
  }
};

/**
 * Delete an external source
 * @param {string} id - Source ID to delete
 * @returns {Promise<object>} Delete response
 */
export const deleteSource = async (id) => {
  try {
    if (!id) {
      throw new Error('Source ID is required');
    }
    
    console.log(`🗑️ [externalSourcesService] Deleting source ${id}...`);
    
    await airQualityAxios.delete(EXTERNAL_SOURCES_ENDPOINTS.DELETE(id));
    
    console.log('✅ [externalSourcesService] Source deleted:', id);
    
    return {
      success: true,
      message: 'Source deleted successfully',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Delete External Source: ${id}`);
    
    console.error('❌ [externalSourcesService] Error deleting source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

/**
 * Reactivate a source that was auto-deactivated after failures
 * @param {string} id - Source ID to reactivate
 * @returns {Promise<object>} Reactivation response
 */
export const reactivate = async (id) => {
  try {
    if (!id) {
      throw new Error('Source ID is required');
    }
    
    console.log(`🔄 [externalSourcesService] Reactivating source ${id}...`);
    
    const response = await airQualityAxios.post(EXTERNAL_SOURCES_ENDPOINTS.REACTIVATE(id));
    
    console.log('✅ [externalSourcesService] Source reactivated:', id);
    
    return {
      success: true,
      data: response,
      message: 'Source reactivated successfully',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Reactivate External Source: ${id}`);
    
    console.error('❌ [externalSourcesService] Error reactivating source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

/**
 * Test if an external API URL is accessible and returns valid data
 * @param {object} urlData - URL test data { url, headers }
 * @returns {Promise<object>} Test result with API response
 */
export const testUrl = async (urlData) => {
  try {
    if (!urlData.url) {
      throw new Error('URL is required for testing');
    }

    console.log('🔍 [externalSourcesService] Testing URL...', urlData.url);
    
    const testPayload = {
      url: urlData.url,
    };
    
    // Add headers if provided
    if (urlData.headers && Object.keys(urlData.headers).length > 0) {
      testPayload.headers = urlData.headers;
    }
    
    // Test endpoint doesn't require authentication
    // Remove Authorization header for this request
    const response = await airQualityAxios.post(
      EXTERNAL_SOURCES_ENDPOINTS.TEST_URL,
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          // Explicitly don't send Authorization header
        },
        transformRequest: [(data, headers) => {
          delete headers.Authorization;
          return JSON.stringify(data);
        }]
      }
    );
    
    console.log('✅ [externalSourcesService] URL test successful');
    
    return {
      success: true,
      data: response,
      message: 'URL is accessible and returning data',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Test External URL');
    
    console.error('❌ [externalSourcesService] URL test failed:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      details: normalizedError.data || null,
    };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filter active sources
 * @param {array} sources - Array of sources
 * @returns {array} Active sources only
 */
export const getActiveSources = (sources) => {
  return sources.filter(source => source.isActive);
};

/**
 * Filter sources with errors
 * @param {array} sources - Array of sources
 * @returns {array} Sources with errors
 */
export const getSourcesWithErrors = (sources) => {
  return sources.filter(source => source.failureCount > 0);
};

/**
 * Find source by ID
 * @param {array} sources - Array of sources
 * @param {string} id - Source ID
 * @returns {object|null} Found source or null
 */
export const findSourceById = (sources, id) => {
  return sources.find(source => source.id === id) || null;
};

// ============================================
// EXPORT DEFAULT
// ============================================
const externalSourcesService = {
  getAll,
  create,
  deleteSource,
  reactivate,
  testUrl,
  transformSource,
  transformSources,
  transformSourceToBackend,
  validateSourceData,
  // Helper functions
  getActiveSources,
  getSourcesWithErrors,
  findSourceById,
};

export default externalSourcesService;
