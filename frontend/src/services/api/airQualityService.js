// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Air Quality API Service
 * Service layer cho Air Quality endpoints (openapi.yaml)
 * 
 * Endpoints:
 * - GET /api/airquality          → getAll(limit)
 * - GET /api/airquality/latest   → getLatest()
 * - GET /api/airquality/history  → getHistory(from, to)
 * - POST /api/iot-data           → postIotData(data)
 */

import { airQualityAxios } from './axiosInstance';

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform NGSI-LD data to frontend-friendly format
 * @param {object} ngsiData - NGSI-LD AirQualityObserved entity
 * @returns {object} Simplified air quality data
 */
export const transformAirQualityData = (ngsiData) => {
  if (!ngsiData) return null;

  return {
    // Basic info
    id: ngsiData.id,
    type: ngsiData.type,
    
    // Location
    location: {
      type: ngsiData.location?.value?.type || 'Point',
      coordinates: ngsiData.location?.value?.coordinates || [0, 0],
      lat: ngsiData.location?.value?.coordinates?.[1] || 0,
      lng: ngsiData.location?.value?.coordinates?.[0] || 0,
    },
    
    // Timestamp
    dateObserved: ngsiData.dateObserved?.value,
    timestamp: new Date(ngsiData.dateObserved?.value).getTime(),
    
    // Sensor info
    sensor: ngsiData['sosa:madeBySensor'],
    observedProperty: ngsiData['sosa:observedProperty'],
    featureOfInterest: ngsiData['sosa:hasFeatureOfInterest'],
    
    // Air Quality Index
    aqi: ngsiData.airQualityIndex?.value || 0,
    aqiUnitCode: ngsiData.airQualityIndex?.unitCode,
    
    // Pollutants (µg/m³)
    pm25: ngsiData.pm25?.value || null,
    pm10: ngsiData.pm10?.value || null,
    o3: ngsiData.o3?.value || null,
    no2: ngsiData.no2?.value || null,
    so2: ngsiData.so2?.value || null,
    co: ngsiData.co?.value || null,
    
    // Pollutants metadata
    pollutants: {
      pm25: {
        value: ngsiData.pm25?.value || null,
        unit: ngsiData.pm25?.unitCode || 'µg/m³',
        observedAt: ngsiData.pm25?.observedAt,
      },
      pm10: {
        value: ngsiData.pm10?.value || null,
        unit: ngsiData.pm10?.unitCode || 'µg/m³',
        observedAt: ngsiData.pm10?.observedAt,
      },
      o3: {
        value: ngsiData.o3?.value || null,
        unit: ngsiData.o3?.unitCode || 'µg/m³',
        observedAt: ngsiData.o3?.observedAt,
      },
      no2: {
        value: ngsiData.no2?.value || null,
        unit: ngsiData.no2?.unitCode || 'µg/m³',
        observedAt: ngsiData.no2?.observedAt,
      },
      so2: {
        value: ngsiData.so2?.value || null,
        unit: ngsiData.so2?.unitCode || 'µg/m³',
        observedAt: ngsiData.so2?.observedAt,
      },
      co: {
        value: ngsiData.co?.value || null,
        unit: ngsiData.co?.unitCode || 'µg/m³',
        observedAt: ngsiData.co?.observedAt,
      },
    },
    
    // Raw NGSI-LD (for debugging)
    _raw: ngsiData,
  };
};

/**
 * Transform array of NGSI-LD data
 * @param {array} ngsiArray - Array of NGSI-LD entities
 * @returns {array} Array of transformed data
 */
export const transformAirQualityArray = (ngsiArray) => {
  if (!Array.isArray(ngsiArray)) return [];
  return ngsiArray.map(transformAirQualityData).filter(Boolean);
};

// ============================================
// API METHODS
// ============================================

/**
 * Get all air quality records
 * @param {number} limit - Maximum number of records (default: 50)
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of air quality records
 */
export const getAll = async (limit = 50, transform = true) => {
  const data = await airQualityAxios.get('/api/airquality', {
    params: { limit }
  });
  
  return transform ? transformAirQualityArray(data) : data;
};

/**
 * Get latest air quality record
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<object>} Latest air quality record
 */
export const getLatest = async (transform = true) => {
  const data = await airQualityAxios.get('/api/airquality/latest');
  
  return transform ? transformAirQualityData(data) : data;
};

/**
 * Get historical air quality data
 * @param {string|Date} from - Start date (ISO 8601 or Date object)
 * @param {string|Date} to - End date (ISO 8601 or Date object)
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of historical records
 */
export const getHistory = async (from, to, transform = true) => {
  // Convert Date objects to ISO strings
  const fromStr = from instanceof Date ? from.toISOString() : from;
  const toStr = to instanceof Date ? to.toISOString() : to;
  
  const data = await airQualityAxios.get('/api/airquality/history', {
    params: {
      from: fromStr,
      to: toStr,
    }
  });
  
  return transform ? transformAirQualityArray(data) : data;
};

/**
 * Post IoT data (admin only)
 * @param {object} iotData - NGSI-LD IoT data
 * @returns {Promise<object>} Response
 */
export const postIotData = async (iotData) => {
  const data = await airQualityAxios.post('/api/iot-data', iotData);
  return data;
};

/**
 * Get latest air quality data for all locations (alias for compatibility)
 * @param {object} params - Query parameters (location, limit, etc.)
 * @returns {Promise<array>} Array of latest air quality records
 */
export const getLatestData = async (params = {}) => {
  const limit = params.limit || 50;
  const data = await getAll(limit, true);
  
  // Filter by location if provided
  if (params.location) {
    return Array.isArray(data) 
      ? data.filter(item => item.location?.coordinates?.toString().includes(params.location))
      : [];
  }
  
  return Array.isArray(data) ? data : [];
};

/**
 * Get historical air quality data for a specific location
 * @param {string} locationId - Location ID or coordinates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Promise<array>} Array of historical records
 */
export const getHistoricalData = async (locationId, startDate, endDate) => {
  const data = await getHistory(startDate, endDate, true);
  
  // Filter by location if provided
  if (locationId && Array.isArray(data)) {
    return data.filter(item => 
      item.id === locationId || 
      item.location?.coordinates?.toString().includes(locationId)
    );
  }
  
  return Array.isArray(data) ? data : [];
};

/**
 * Get air quality data for a specific location
 * @param {string} locationId - Location ID
 * @returns {Promise<object>} Air quality data for the location
 */
export const getLocationData = async (locationId) => {
  const data = await getAll(1, true);
  
  // Find the location
  if (Array.isArray(data)) {
    const location = data.find(item => item.id === locationId);
    return location || null;
  }
  
  return null;
};

/**
 * Get air quality alerts (high AQI warnings)
 * @param {object} params - Query parameters
 * @returns {Promise<array>} Array of alerts
 */
export const getAlerts = async (params = {}) => {
  const data = await getAll(50, true);
  
  if (!Array.isArray(data)) return [];
  
  // Generate alerts for high AQI values
  const alerts = data
    .filter(item => item.aqi > 100) // Only AQI > 100
    .map(item => {
      const level = getAQILevel(item.aqi);
      return {
        id: `alert-${item.id}-${item.timestamp}`,
        locationId: item.id,
        locationName: item.id.split(':').pop() || 'Unknown',
        aqi: item.aqi,
        level: level.level,
        severity: item.aqi > 200 ? 'critical' : item.aqi > 150 ? 'high' : 'medium',
        message: `${level.label}: AQI ${Math.round(item.aqi)} tại ${item.id.split(':').pop()}`,
        timestamp: item.dateObserved || new Date().toISOString(),
        pollutants: {
          pm25: item.pm25,
          pm10: item.pm10,
          o3: item.o3,
          no2: item.no2,
          so2: item.so2,
          co: item.co,
        }
      };
    })
    .sort((a, b) => b.aqi - a.aqi); // Sort by AQI descending
  
  return alerts;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get AQI level and color
 * @param {number} aqi - Air Quality Index
 * @returns {object} Level info with label and color
 */
export const getAQILevel = (aqi) => {
  if (aqi <= 50) {
    return { level: 'good', label: 'Tốt', color: '#00E400' };
  } else if (aqi <= 100) {
    return { level: 'moderate', label: 'Trung bình', color: '#FFFF00' };
  } else if (aqi <= 150) {
    return { level: 'unhealthy-sensitive', label: 'Không tốt cho nhóm nhạy cảm', color: '#FF7E00' };
  } else if (aqi <= 200) {
    return { level: 'unhealthy', label: 'Không tốt', color: '#FF0000' };
  } else if (aqi <= 300) {
    return { level: 'very-unhealthy', label: 'Rất không tốt', color: '#8F3F97' };
  } else {
    return { level: 'hazardous', label: 'Nguy hại', color: '#7E0023' };
  }
};

/**
 * Calculate average AQI from array of records
 * @param {array} records - Array of air quality records
 * @returns {number} Average AQI
 */
export const calculateAverageAQI = (records) => {
  if (!Array.isArray(records) || records.length === 0) return 0;
  
  const sum = records.reduce((acc, record) => acc + (record.aqi || 0), 0);
  return parseFloat((sum / records.length).toFixed(1));
};

/**
 * Get date range for common periods
 * @param {string} period - 'today', 'yesterday', 'week', 'month'
 * @returns {object} { from, to } dates
 */
export const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        from: new Date(today),
        to: new Date(),
      };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: yesterday,
        to: new Date(today),
      };
    
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        from: weekAgo,
        to: new Date(),
      };
    
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        from: monthAgo,
        to: new Date(),
      };
    
    default:
      return {
        from: new Date(today),
        to: new Date(),
      };
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================

const airQualityService = {
  // API methods
  getAll,
  getLatest,
  getHistory,
  postIotData,
  
  // Extended methods (for hooks compatibility)
  getLatestData,
  getHistoricalData,
  getLocationData,
  getAlerts,
  
  // Transformers
  transformAirQualityData,
  transformAirQualityArray,
  
  // Helpers
  getAQILevel,
  calculateAverageAQI,
  getDateRange,
};

export default airQualityService;
