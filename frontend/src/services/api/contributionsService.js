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
    
    // Add metadata if provided (backend expects 'email' and 'name')
    if (metadata.contributorEmail) {
      formData.append('email', metadata.contributorEmail);
    }
    if (metadata.contributorName) {
      formData.append('name', metadata.contributorName);
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
// NEW API METHODS
// ============================================

/**
 * Get public contribution statistics
 * Shows total contributions, total contributors, and top contributors
 * @returns {Promise<object>} Public stats with success flag and data
 */
export const getPublicStats = async () => {
  try {
    console.log('📊 [contributionsService] Fetching public stats...');
    
    const response = await airQualityAxios.get(CONTRIBUTIONS_ENDPOINTS.PUBLIC_STATS);
    
    console.log('✅ [contributionsService] Public stats received:', {
      totalContributions: response.totalContributions,
      totalContributors: response.totalContributors,
    });
    
    return {
      success: true,
      data: response,
      totalContributions: response.totalContributions || 0,
      totalContributors: response.totalContributors || 0,
      contributors: response.contributors || [],
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get Public Stats');
    
    console.error('❌ [contributionsService] Error fetching public stats:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      data: null,
    };
  }
};

/**
 * Get list of contribution IDs with metadata
 * @param {string|null} email - Filter by user email (optional)
 * @returns {Promise<object>} List of contributions with success flag
 */
export const getContributionList = async (email = null) => {
  try {
    const params = email ? { email } : {};
    
    console.log('📋 [contributionsService] Fetching contribution list...', { email });
    
    const response = await airQualityAxios.get(CONTRIBUTIONS_ENDPOINTS.LIST, { params });
    
    console.log('✅ [contributionsService] Contribution list received:', {
      total: response.total,
      count: response.contributions?.length,
    });
    
    return {
      success: true,
      data: response,
      total: response.total || 0,
      contributions: response.contributions || [],
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get Contribution List');
    
    console.error('❌ [contributionsService] Error fetching contribution list:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      data: null,
    };
  }
};

/**
 * Get latest records from a specific contribution
 * @param {string} contributionId - Contribution ID
 * @param {number} limit - Number of latest records to retrieve (default: 5)
 * @returns {Promise<object>} Latest records with success flag
 */
export const getLatestByContributionId = async (contributionId, limit = 5) => {
  try {
    if (!contributionId) {
      return {
        success: false,
        error: 'Contribution ID không được để trống',
        data: null,
      };
    }
    
    console.log(`🔍 [contributionsService] Fetching latest from contribution ${contributionId}...`);
    
    const response = await airQualityAxios.get(
      CONTRIBUTIONS_ENDPOINTS.LATEST_BY_ID(contributionId),
      { params: { limit } }
    );
    
    console.log('✅ [contributionsService] Latest records received:', {
      contributionId: response.contributionId,
      count: response.count,
    });
    
    return {
      success: true,
      data: response,
      contributionId: response.contributionId,
      count: response.count || 0,
      records: response.data || [],
    };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Get Latest By Contribution: ${contributionId}`);
    
    console.error('❌ [contributionsService] Error:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
      data: null,
    };
  }
};

/**
 * Download all data from a specific contribution as JSON file
 * @param {string} contributionId - Contribution ID
 * @returns {Promise<object>} Download result
 */
export const downloadContribution = async (contributionId) => {
  try {
    if (!contributionId) {
      return {
        success: false,
        error: 'Contribution ID không được để trống',
      };
    }
    
    console.log(`📥 [contributionsService] Downloading contribution ${contributionId}...`);
    
    const response = await airQualityAxios.get(
      CONTRIBUTIONS_ENDPOINTS.DOWNLOAD_BY_ID(contributionId),
      { responseType: 'blob' }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `contribution-${contributionId}-${Date.now()}.json`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ [contributionsService] Download started:', filename);
    
    return { success: true, filename };
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Download Contribution: ${contributionId}`);
    
    console.error('❌ [contributionsService] Download error:', normalizedError.message);
    
    return {
      success: false,
      error: normalizedError.message,
    };
  }
};

// ============================================
// EXPORT DEFAULT
// ============================================
const contributionsService = {
  uploadFile,
  validateJsonStructure,
  formatContribution,
  // Valid API methods from api.yaml
  getPublicStats,
  getContributionList,
  getLatestByContributionId,
  downloadContribution,
};

export default contributionsService;
