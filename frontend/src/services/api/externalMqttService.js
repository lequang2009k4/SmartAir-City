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
 * External MQTT Sources API Service
 * Service layer for External MQTT Broker Sources endpoints
 */

import { airQualityAxios } from './axiosInstance';
import { EXTERNAL_MQTT_ENDPOINTS } from '../config/apiConfig';
import { normalizeError, logError } from './errorHandler';

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform MQTT source data from backend
 * @param {object} source - Raw MQTT source data from API
 * @returns {object} Transformed MQTT source data
 */
export const transformMqttSource = (source) => {
  if (!source) return null;

  return {
    id: source.id,
    name: source.name,
    brokerHost: source.brokerHost,
    brokerPort: source.brokerPort,
    topic: source.topic,
    username: source.username,
    stationId: source.stationId,
    latitude: source.latitude,
    longitude: source.longitude,
    openAQLocationId: source.openAQLocationId || null,
    isActive: source.isActive,
    useTls: source.useTls || false,
    createdAt: source.createdAt,
    
    // Additional computed fields
    location: {
      type: 'Point',
      coordinates: [source.longitude, source.latitude],
      lat: source.latitude,
      lng: source.longitude,
    },
    brokerUrl: `${source.useTls ? 'mqtts' : 'mqtt'}://${source.brokerHost}:${source.brokerPort}`,
    status: source.isActive ? 'active' : 'inactive',
    
    // Statistics (if available from backend)
    messageCount: source.messageCount || 0,
    lastMessageAt: source.lastMessageAt || null,
    lastError: source.lastError || null,
    
    // Raw data
    _raw: source,
  };
};

/**
 * Transform array of MQTT sources
 * @param {array} sources - Array of MQTT source objects
 * @returns {array} Transformed sources
 */
export const transformMqttSources = (sources) => {
  if (!Array.isArray(sources)) return [];
  return sources.map(transformMqttSource).filter(Boolean);
};

/**
 * Transform frontend MQTT data to backend format for create/update
 * @param {object} mqttData - Frontend MQTT data
 * @returns {object} Backend-compatible MQTT data
 */
export const transformMqttToBackend = (mqttData) => {
  const backendData = {
    name: mqttData.name,
    brokerHost: mqttData.brokerHost,
    brokerPort: mqttData.brokerPort || 1883,
    topic: mqttData.topic,
    useTls: mqttData.useTls || false,
  };

  // Optional fields
  if (mqttData.username) {
    backendData.username = mqttData.username;
  }
  if (mqttData.password) {
    backendData.password = mqttData.password;
  }
  if (mqttData.stationId) {
    backendData.stationId = mqttData.stationId;
  }
  if (mqttData.latitude !== undefined) {
    backendData.latitude = mqttData.latitude;
  }
  if (mqttData.longitude !== undefined) {
    backendData.longitude = mqttData.longitude;
  }
  if (mqttData.openAQLocationId) {
    backendData.openAQLocationId = mqttData.openAQLocationId;
  }

  return backendData;
};

// ============================================
// VALIDATION
// ============================================

/**
 * Validate MQTT source data before creating/updating
 * @param {object} mqttData - MQTT data to validate
 * @returns {object} Validation result { isValid: boolean, errors: array }
 */
export const validateMqttData = (mqttData) => {
  const errors = [];

  // Required fields
  if (!mqttData.name || mqttData.name.trim() === '') {
    errors.push('Tên nguồn MQTT là bắt buộc');
  }

  if (!mqttData.brokerHost || mqttData.brokerHost.trim() === '') {
    errors.push('Broker host là bắt buộc');
  }

  if (!mqttData.topic || mqttData.topic.trim() === '') {
    errors.push('Topic là bắt buộc');
  }

  // Validate port
  if (mqttData.brokerPort) {
    const port = parseInt(mqttData.brokerPort);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('Port phải trong khoảng 1-65535');
    }
  }

  // Validate coordinates if provided
  if (mqttData.latitude !== undefined && mqttData.latitude !== null) {
    if (mqttData.latitude < -90 || mqttData.latitude > 90) {
      errors.push('Latitude phải trong khoảng -90 đến 90');
    }
  }

  if (mqttData.longitude !== undefined && mqttData.longitude !== null) {
    if (mqttData.longitude < -180 || mqttData.longitude > 180) {
      errors.push('Longitude phải trong khoảng -180 đến 180');
    }
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
 * Get all external MQTT sources
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of MQTT sources
 */
export const getAll = async (transform = true) => {
  try {
    console.log('📡 [externalMqttService] Fetching all MQTT sources...');
    
    const response = await airQualityAxios.get(EXTERNAL_MQTT_ENDPOINTS.GET_ALL);
    
    console.log('✅ [externalMqttService] MQTT sources received:', {
      total: response?.length || 0,
    });
    
    return transform ? transformMqttSources(response) : response;
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get All MQTT Sources');
    
    console.error('❌ [externalMqttService] Error fetching MQTT sources:', normalizedError.message);
    
    throw normalizedError;
  }
};

/**
 * Get MQTT source by ID
 * @param {string} id - MQTT source ID
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<object>} MQTT source data
 */
export const getById = async (id, transform = true) => {
  try {
    if (!id) {
      throw new Error('MQTT Source ID is required');
    }
    
    console.log(`🔍 [externalMqttService] Fetching MQTT source ${id}...`);
    
    const response = await airQualityAxios.get(EXTERNAL_MQTT_ENDPOINTS.GET_BY_ID(id));
    
    console.log('✅ [externalMqttService] MQTT source received:', {
      id: response.id,
      name: response.name,
    });
    
    return transform ? transformMqttSource(response) : response;
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Get MQTT Source By ID: ${id}`);
    
    console.error('❌ [externalMqttService] Error fetching MQTT source:', normalizedError.message);
    
    throw normalizedError;
  }
};

/**
 * Create a new external MQTT source
 * @param {object} mqttData - MQTT data to create
 * @returns {Promise<object>} Created MQTT source response
 */
export const create = async (mqttData) => {
  try {
    // Validate before sending
    const validation = validateMqttData(mqttData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const backendData = transformMqttToBackend(mqttData);
    
    console.log('➕ [externalMqttService] Creating MQTT source...', {
      name: backendData.name,
      broker: `${backendData.brokerHost}:${backendData.brokerPort}`,
    });
    
    const response = await airQualityAxios.post(
      EXTERNAL_MQTT_ENDPOINTS.CREATE,
      backendData
    );
    
    console.log('✅ [externalMqttService] MQTT source created:', {
      id: response.id,
      name: response.name,
    });
    
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Create MQTT Source');
    
    console.error('❌ [externalMqttService] Error creating MQTT source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      details: normalizedError.data || null,
    };
  }
};

/**
 * Update an existing MQTT source
 * @param {string} id - MQTT source ID
 * @param {object} mqttData - Updated MQTT data
 * @returns {Promise<object>} Updated MQTT source response
 */
export const update = async (id, mqttData) => {
  try {
    if (!id) {
      throw new Error('MQTT Source ID is required');
    }

    // Validate before sending
    const validation = validateMqttData(mqttData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const backendData = transformMqttToBackend(mqttData);
    
    console.log(`✏️ [externalMqttService] Updating MQTT source ${id}...`);
    
    const response = await airQualityAxios.put(
      EXTERNAL_MQTT_ENDPOINTS.UPDATE(id),
      backendData
    );
    
    console.log('✅ [externalMqttService] MQTT source updated:', id);
    
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Update MQTT Source: ${id}`);
    
    console.error('❌ [externalMqttService] Error updating MQTT source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      details: normalizedError.data || null,
    };
  }
};

/**
 * Delete an MQTT source
 * @param {string} id - MQTT source ID to delete
 * @returns {Promise<object>} Delete response
 */
export const deleteSource = async (id) => {
  try {
    if (!id) {
      throw new Error('MQTT Source ID is required');
    }
    
    console.log(`🗑️ [externalMqttService] Deleting MQTT source ${id}...`);
    
    await airQualityAxios.delete(EXTERNAL_MQTT_ENDPOINTS.DELETE(id));
    
    console.log('✅ [externalMqttService] MQTT source deleted:', id);
    
    return {
      success: true,
      message: 'MQTT source deleted successfully',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Delete MQTT Source: ${id}`);
    
    console.error('❌ [externalMqttService] Error deleting MQTT source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

/**
 * Update OpenAQ Location ID for an MQTT source
 * @param {string} id - MQTT source ID
 * @param {number} locationId - OpenAQ Location ID
 * @returns {Promise<object>} Update response
 */
export const updateOpenAQLocation = async (id, locationId) => {
  try {
    if (!id) {
      throw new Error('MQTT Source ID is required');
    }
    if (!locationId) {
      throw new Error('OpenAQ Location ID is required');
    }
    
    console.log(`🔄 [externalMqttService] Updating OpenAQ LocationId for ${id}...`);
    
    const response = await airQualityAxios.patch(
      EXTERNAL_MQTT_ENDPOINTS.UPDATE_OPENAQ(id),
      { openAQLocationId: locationId }
    );
    
    console.log('✅ [externalMqttService] OpenAQ LocationId updated:', id);
    
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Update OpenAQ Location: ${id}`);
    
    console.error('❌ [externalMqttService] Error updating OpenAQ LocationId:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

/**
 * Activate an MQTT source
 * @param {string} id - MQTT source ID to activate
 * @returns {Promise<object>} Activation response
 */
export const activate = async (id) => {
  try {
    if (!id) {
      throw new Error('MQTT Source ID is required');
    }
    
    console.log(`▶️ [externalMqttService] Activating MQTT source ${id}...`);
    
    const response = await airQualityAxios.post(EXTERNAL_MQTT_ENDPOINTS.ACTIVATE(id));
    
    console.log('✅ [externalMqttService] MQTT source activated:', id);
    
    return {
      success: true,
      data: response,
      message: 'MQTT source activated successfully',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Activate MQTT Source: ${id}`);
    
    console.error('❌ [externalMqttService] Error activating MQTT source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

/**
 * Deactivate an MQTT source
 * @param {string} id - MQTT source ID to deactivate
 * @returns {Promise<object>} Deactivation response
 */
export const deactivate = async (id) => {
  try {
    if (!id) {
      throw new Error('MQTT Source ID is required');
    }
    
    console.log(`⏸️ [externalMqttService] Deactivating MQTT source ${id}...`);
    
    const response = await airQualityAxios.post(EXTERNAL_MQTT_ENDPOINTS.DEACTIVATE(id));
    
    console.log('✅ [externalMqttService] MQTT source deactivated:', id);
    
    return {
      success: true,
      data: response,
      message: 'MQTT source deactivated successfully',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Deactivate MQTT Source: ${id}`);
    
    console.error('❌ [externalMqttService] Error deactivating MQTT source:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

/**
 * Test MQTT broker connection
 * @param {object} connectionData - Connection data to test { brokerHost, brokerPort, username, password, useTls, topic }
 * @returns {Promise<object>} Test result
 */
export const testConnection = async (connectionData) => {
  try {
    if (!connectionData.brokerHost) {
      throw new Error('Broker host is required for testing');
    }
    if (!connectionData.topic) {
      throw new Error('Topic is required for testing');
    }

    console.log('🔍 [externalMqttService] Testing MQTT connection...', {
      broker: `${connectionData.brokerHost}:${connectionData.brokerPort || 1883}`,
      topic: connectionData.topic,
    });
    
    const testPayload = {
      brokerHost: connectionData.brokerHost,
      brokerPort: connectionData.brokerPort || 1883,
      topic: connectionData.topic,
      useTls: connectionData.useTls || false,
    };

    // Add credentials if provided
    if (connectionData.username) {
      testPayload.username = connectionData.username;
    }
    if (connectionData.password) {
      testPayload.password = connectionData.password;
    }
    
    const response = await airQualityAxios.post(
      EXTERNAL_MQTT_ENDPOINTS.TEST_CONNECTION,
      testPayload
    );
    
    console.log('✅ [externalMqttService] MQTT connection test successful');
    
    return {
      success: true,
      data: response,
      message: 'MQTT broker is accessible',
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Test MQTT Connection');
    
    console.error('❌ [externalMqttService] MQTT connection test failed:', normalizedError.message);
    
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
 * Filter active MQTT sources
 * @param {array} sources - Array of MQTT sources
 * @returns {array} Active sources only
 */
export const getActiveSources = (sources) => {
  return sources.filter(source => source.isActive);
};

/**
 * Filter sources with TLS enabled
 * @param {array} sources - Array of MQTT sources
 * @returns {array} TLS-enabled sources
 */
export const getTlsSources = (sources) => {
  return sources.filter(source => source.useTls);
};

/**
 * Find MQTT source by ID
 * @param {array} sources - Array of MQTT sources
 * @param {string} id - Source ID
 * @returns {object|null} Found source or null
 */
export const findSourceById = (sources, id) => {
  return sources.find(source => source.id === id) || null;
};

/**
 * Group sources by active status
 * @param {array} sources - Array of MQTT sources
 * @returns {object} Grouped sources { active: [], inactive: [] }
 */
export const groupByStatus = (sources) => {
  return sources.reduce((groups, source) => {
    const status = source.isActive ? 'active' : 'inactive';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(source);
    return groups;
  }, {});
};

// ============================================
// EXPORT DEFAULT
// ============================================
const externalMqttService = {
  getAll,
  getById,
  create,
  update,
  deleteSource,
  updateOpenAQLocation,
  activate,
  deactivate,
  testConnection,
  transformMqttSource,
  transformMqttSources,
  transformMqttToBackend,
  validateMqttData,
  // Helper functions
  getActiveSources,
  getTlsSources,
  findSourceById,
  groupByStatus,
};

export default externalMqttService;
