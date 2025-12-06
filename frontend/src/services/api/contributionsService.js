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
 * Contributions API Service
 * Service layer for Contributions endpoints
 * 
 * Endpoints:
 * - POST /api/contributions/upload  → uploadFile(file, metadata)
 * - POST /api/contributions         → submitJson(jsonData)
 * - GET /api/contributions          → getAll(limit)
 * - GET /api/contributions/stations → getStations()
 * - GET /api/contributions/station/{stationId} → getByStation(stationId)
 */

import { airQualityAxios } from './axiosInstance';
import { CONTRIBUTIONS_ENDPOINTS } from '../config/apiConfig';
import { normalizeError, logError } from './errorHandler';

// ============================================
// API CALLS
// ============================================

/**
 * Upload JSON file with AirQuality data
 * @param {File} file - JSON file to upload
 * @param {object} metadata - Optional metadata (contributorEmail, contributorName)
 * @returns {Promise<object>} Upload response with message, count, ids
 */
export const uploadFile = async (file, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata if provided
    if (metadata.contributorEmail) {
      formData.append('contributorEmail', metadata.contributorEmail);
    }
    if (metadata.contributorName) {
      formData.append('contributorName', metadata.contributorName);
    }

    const response = await airQualityAxios.post(
      CONTRIBUTIONS_ENDPOINTS.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Response đã được unwrap bởi interceptor (response.data)
    return {
      success: true,
      data: response, // response chính là data object {message, count, ids}
    };
  } catch (error) {
    // Nếu error đã được normalize bởi interceptor (có .type), dùng trực tiếp
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Upload File');
    
    // Backend error response: {message, errors: []}
    return {
      success: false,
      error: normalizedError.message,
      details: normalizedError.data || null,
    };
  }
};

/**
 * Submit JSON data directly
 * @param {object|array} jsonData - AirQuality data (single object or array)
 * @returns {Promise<object>} Submit response with message, id(s)
 */
export const submitJson = async (jsonData) => {
  try {
    const response = await airQualityAxios.post(
      CONTRIBUTIONS_ENDPOINTS.SUBMIT,
      jsonData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Response đã được unwrap bởi interceptor
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    // Nếu error đã được normalize bởi interceptor (có .type), dùng trực tiếp
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Submit JSON');
    
    // Backend error response: {message, errors: []}
    return {
      success: false,
      error: normalizedError.message,
      details: normalizedError.data || null,
    };
  }
};

/**
 * Get all contributions
 * @param {number} limit - Optional limit for number of records
 * @returns {Promise<array>} List of contributions
 */
export const getAll = async (limit = null) => {
  try {
    const url = limit 
      ? `${CONTRIBUTIONS_ENDPOINTS.GET_ALL}?limit=${limit}`
      : CONTRIBUTIONS_ENDPOINTS.GET_ALL;

    const response = await airQualityAxios.get(url);

    // Response đã được unwrap, response chính là array
    return {
      success: true,
      data: Array.isArray(response) ? response : [],
      count: Array.isArray(response) ? response.length : 0,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get All Contributions');
    
    return {
      success: false,
      error: normalizedError.message,
      data: [],
      count: 0,
    };
  }
};

/**
 * Get list of stations that have contributions
 * @returns {Promise<object>} List of station IDs and total count
 */
export const getStations = async () => {
  try {
    const response = await airQualityAxios.get(CONTRIBUTIONS_ENDPOINTS.GET_STATIONS);

    // Response đã unwrap, response = {stations: [], total: n}
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get Stations');
    
    return {
      success: false,
      error: normalizedError.message,
      data: { stations: [], total: 0 },
    };
  }
};

/**
 * Get contributions by station ID
 * @param {string} stationId - Station ID to filter by
 * @returns {Promise<object>} Contributions for the specified station
 */
export const getByStation = async (stationId) => {
  try {
    if (!stationId) {
      return {
        success: false,
        error: 'Station ID không được để trống',
        data: null,
      };
    }

    const response = await airQualityAxios.get(
      CONTRIBUTIONS_ENDPOINTS.GET_BY_STATION(stationId)
    );

    // Response đã unwrap, response = {stationId, total, data: []}
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Get By Station: ${stationId}`);
    
    return {
      success: false,
      error: normalizedError.message,
      data: null,
    };
  }
};

// ============================================
// DATA TRANSFORMATION & VALIDATION
// ============================================

/**
 * Validate JSON structure for NGSI-LD compliance
 * Basic client-side validation before sending to backend
 * @param {string} jsonString - JSON string to validate
 * @returns {object} Validation result with isValid and errors
 */
export const validateJsonStructure = (jsonString) => {
  const errors = [];

  try {
    const data = JSON.parse(jsonString);

    // Check if it's object or array
    if (!data || (typeof data !== 'object')) {
      errors.push('Dữ liệu phải là object hoặc array');
      return { isValid: false, errors, data: null };
    }

    // If array, validate each item
    const items = Array.isArray(data) ? data : [data];

    items.forEach((item, index) => {
      const prefix = Array.isArray(data) ? `[${index}] ` : '';

      // Check required NGSI-LD fields
      if (!item.id) {
        errors.push(`${prefix}Thiếu trường 'id'`);
      }
      if (!item.type) {
        errors.push(`${prefix}Thiếu trường 'type'`);
      }
      if (!item.dateObserved) {
        errors.push(`${prefix}Thiếu trường 'dateObserved'`);
      }

      // Validate @context
      if (!item['@context']) {
        errors.push(`${prefix}Thiếu trường '@context'`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      data,
    };
  } catch (e) {
    errors.push(`JSON không hợp lệ: ${e.message}`);
    return { isValid: false, errors, data: null };
  }
};

/**
 * Format contribution data for display
 * @param {object} contribution - Contribution object from backend
 * @returns {object} Formatted contribution data
 */
export const formatContribution = (contribution) => {
  if (!contribution || !contribution.data) return null;

  const airQualityData = contribution.data;
  
  return {
    id: contribution.mongoId || contribution.id,
    stationId: airQualityData.id || 'Unknown',
    location: airQualityData.location?.value?.coordinates || [0, 0],
    dateObserved: airQualityData.dateObserved?.value,
    aqi: airQualityData.airQualityIndex?.value || 0,
    pollutants: {
      pm25: airQualityData.pm25?.value || 0,
      pm10: airQualityData.pm10?.value || 0,
      o3: airQualityData.o3?.value || 0,
      no2: airQualityData.no2?.value || 0,
    },
    contributor: {
      email: contribution.contributorEmail,
      name: contribution.contributorName,
    },
    submittedAt: contribution.submittedAt,
    status: contribution.status,
  };
};

// ============================================
// EXPORT DEFAULT
// ============================================
const contributionsService = {
  uploadFile,
  submitJson,
  getAll,
  getStations,
  getByStation,
  validateJsonStructure,
  formatContribution,
};

export default contributionsService;
