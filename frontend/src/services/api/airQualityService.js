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
 * Air Quality API Service
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

  // Debug log - Check data format
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [transformAirQualityData] Input data keys:', Object.keys(ngsiData));
    console.log('🔍 [transformAirQualityData] Pollutants format check:', {
      hasUppercase: !!(ngsiData.PM25 || ngsiData.PM10),
      hasLowercase: !!(ngsiData.pm25 || ngsiData.pm10),
      PM25: ngsiData.PM25?.value,
      pm25: ngsiData.pm25?.value,
    });
  }

  // Extract location info
  const locationCoords = ngsiData.location?.value?.coordinates || [105.852, 21.034];
  const sensorIdRaw = ngsiData['sosa:madeBySensor'] || ngsiData.id;
  const sensorId = typeof sensorIdRaw === 'string' ? sensorIdRaw : (sensorIdRaw?.object || ngsiData.id);
  
  // Generate friendly name from sensor ID or location
  const generateName = () => {
    if (typeof sensorId === 'string' && sensorId.includes(':')) {
      const parts = sensorId.split(':');
      return parts[parts.length - 1].toUpperCase();
    }
    return `Station ${Math.round(locationCoords[1] * 100) / 100}`;
  };

  return {
    // Basic info
    id: ngsiData.id,
    type: ngsiData.type,
    name: generateName(), // Add friendly name
    
    // Location
    location: {
      type: ngsiData.location?.value?.type || 'Point',
      coordinates: locationCoords,
      lat: locationCoords[1],
      lng: locationCoords[0],
    },
    
    // Timestamp
    dateObserved: ngsiData.dateObserved?.value,
    timestamp: new Date(ngsiData.dateObserved?.value).getTime(),
    
    // Sensor info
    sensor: sensorId,
    observedProperty: ngsiData['sosa:observedProperty'],
    featureOfInterest: ngsiData['sosa:hasFeatureOfInterest'],
    
    // Air Quality Index
    aqi: ngsiData.airQualityIndex?.value || 0,
    aqiUnitCode: ngsiData.airQualityIndex?.unitCode,
    
    // Pollutants (GQ = µg/m³ per UN/CEFACT)
    // Support both uppercase (from backend) and lowercase (legacy)
    pm25: ngsiData.PM25?.value || ngsiData.pm25?.value || 0,
    pm10: ngsiData.PM10?.value || ngsiData.pm10?.value || 0,
    o3: ngsiData.O3?.value || ngsiData.o3?.value || 0,
    no2: ngsiData.NO2?.value || ngsiData.no2?.value || 0,
    so2: ngsiData.SO2?.value || ngsiData.so2?.value || 0,
    co: ngsiData.CO?.value || ngsiData.co?.value || 0,
    
    // Environmental data (with fallbacks)
    temperature: ngsiData.temperature?.value || 25,
    humidity: ngsiData.humidity?.value || 60,
    
    // Pollutants metadata
    pollutants: {
      pm25: {
        value: ngsiData.PM25?.value || ngsiData.pm25?.value || 0,
        unit: ngsiData.PM25?.unitCode || ngsiData.pm25?.unitCode || 'GQ',
        observedAt: ngsiData.PM25?.observedAt || ngsiData.pm25?.observedAt,
      },
      pm10: {
        value: ngsiData.PM10?.value || ngsiData.pm10?.value || 0,
        unit: ngsiData.PM10?.unitCode || ngsiData.pm10?.unitCode || 'GQ',
        observedAt: ngsiData.PM10?.observedAt || ngsiData.pm10?.observedAt,
      },
      o3: {
        value: ngsiData.O3?.value || ngsiData.o3?.value || 0,
        unit: ngsiData.O3?.unitCode || ngsiData.o3?.unitCode || 'GQ',
        observedAt: ngsiData.O3?.observedAt || ngsiData.o3?.observedAt,
      },
      no2: {
        value: ngsiData.NO2?.value || ngsiData.no2?.value || 0,
        unit: ngsiData.NO2?.unitCode || ngsiData.no2?.unitCode || 'GQ',
        observedAt: ngsiData.NO2?.observedAt || ngsiData.no2?.observedAt,
      },
      so2: {
        value: ngsiData.SO2?.value || ngsiData.so2?.value || 0,
        unit: ngsiData.SO2?.unitCode || ngsiData.so2?.unitCode || 'GQ',
        observedAt: ngsiData.SO2?.observedAt || ngsiData.so2?.observedAt,
      },
      co: {
        value: ngsiData.CO?.value || ngsiData.co?.value || 0,
        unit: ngsiData.CO?.unitCode || ngsiData.co?.unitCode || 'GQ',
        observedAt: ngsiData.CO?.observedAt || ngsiData.co?.observedAt,
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
 * @param {string|null} stationId - Filter by station ID (optional, NEW)
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of air quality records
 */
export const getAll = async (limit = 50, stationId = null, transform = true) => {
  const params = { limit };
  if (stationId) {
    params.stationId = stationId;
    console.log(`🔍 [airQualityService] Filtering by stationId: ${stationId}`);
  }
  
  const data = await airQualityAxios.get('/api/airquality', { params });
  
  console.log('📦 [airQualityService] getAll raw data:', data?.length, 'items, transform:', transform);
  console.log('📦 [airQualityService] First item structure:', data[0]);
  
  const result = transform ? transformAirQualityArray(data) : data;
  
  console.log('✅ [airQualityService] getAll transformed data:', result?.length, 'items');
  console.log('✅ [airQualityService] First transformed item:', result[0]);
  
  return result;
};

/**
 * Get latest air quality record
 * @param {string|null} stationId - Filter by station ID (optional, NEW)
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<object>} Latest air quality record
 */
export const getLatest = async (stationId = null, transform = true) => {
  const params = stationId ? { stationId } : {};
  
  if (stationId) {
    console.log(`🔍 [airQualityService] getLatest filtering by stationId: ${stationId}`);
  }
  
  const data = await airQualityAxios.get('/api/airquality/latest', { params });
  
  return transform ? transformAirQualityData(data) : data;
};

/**
 * Get historical air quality data
 * @param {string|Date} from - Start date (ISO 8601 or Date object)
 * @param {string|Date} to - End date (ISO 8601 or Date object)
 * @param {string|null} stationId - Filter by station ID (optional, NEW)
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of historical records
 */
export const getHistory = async (from, to, stationId = null, transform = true) => {
  // Convert Date objects to ISO strings
  const fromStr = from instanceof Date ? from.toISOString() : from;
  const toStr = to instanceof Date ? to.toISOString() : to;
  
  const params = {
    from: fromStr,
    to: toStr,
  };
  
  if (stationId) {
    params.stationId = stationId;
    console.log(`🔍 [airQualityService] getHistory filtering by stationId: ${stationId}`);
  }
  
  const data = await airQualityAxios.get('/api/airquality/history', { params });
  
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
 * @param {object} params - Query parameters (stationId, location, limit, etc.)
 * @returns {Promise<array>} Array of latest air quality records
 */
export const getLatestData = async (params = {}) => {
  const limit = params.limit || 50;
  const stationId = params.stationId || null; // NEW: Support stationId
  
  const data = await getAll(limit, stationId, true);
  
  // Legacy filter by location if provided (for backwards compatibility)
  if (params.location && !stationId) {
    return Array.isArray(data) 
      ? data.filter(item => item.location?.coordinates?.toString().includes(params.location))
      : [];
  }
  
  return Array.isArray(data) ? data : [];
};

/**
 * Get historical air quality data for a specific location
 * @param {string} locationId - Location ID, station ID, or coordinates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Promise<array>} Array of historical records
 */
export const getHistoricalData = async (locationId, startDate, endDate) => {
  // Try using stationId filter first (NEW API feature)
  const data = await getHistory(startDate, endDate, locationId, true);
  
  // If no results with stationId, try legacy location filtering
  if (locationId && Array.isArray(data) && data.length === 0) {
    const allData = await getHistory(startDate, endDate, null, true);
    return allData.filter(item => 
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
  const data = await getAll(50, null);
  
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
 * Get AQI color based on level
 * @param {number} aqi - Air Quality Index
 * @returns {string} Hex color code
 */
export const getAQIColor = (aqi) => {
  const { color } = getAQILevel(aqi);
  return color;
};

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
// DOWNLOAD FUNCTIONS (NEW API)
// ============================================

/**
 * Download air quality data as JSON file
 * @param {string|null} stationId - Filter by station ID (optional)
 * @param {number} limit - Maximum number of records (default: 100)
 * @param {string} format - File format (default: 'json')
 * @returns {Promise<object>} Download result
 */
export const downloadAirQuality = async (stationId = null, limit = 100, format = 'json') => {
  try {
    console.log('📥 [airQualityService] Downloading air quality data...', { stationId, limit, format });
    
    const params = { limit, format };
    if (stationId) params.stationId = stationId;
    
    const response = await airQualityAxios.get('/api/airquality/download', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    const filename = stationId 
      ? `airquality-${stationId}-${Date.now()}.json`
      : `airquality-${Date.now()}.json`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ [airQualityService] Download started:', filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('❌ [airQualityService] Download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download historical air quality data as JSON file
 * @param {string|Date} from - Start date
 * @param {string|Date} to - End date
 * @param {string|null} stationId - Filter by station ID (optional)
 * @param {string} format - File format (default: 'json')
 * @returns {Promise<object>} Download result
 */
export const downloadHistory = async (from, to, stationId = null, format = 'json') => {
  try {
    const fromStr = from instanceof Date ? from.toISOString() : from;
    const toStr = to instanceof Date ? to.toISOString() : to;
    
    console.log('📥 [airQualityService] Downloading history...', { from: fromStr, to: toStr, stationId });
    
    const params = { from: fromStr, to: toStr, format };
    if (stationId) params.stationId = stationId;
    
    const response = await airQualityAxios.get('/api/airquality/history/download', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = stationId
      ? `airquality-history-${stationId}-${dateStr}.json`
      : `airquality-history-${dateStr}.json`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ [airQualityService] Download started:', filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('❌ [airQualityService] Download error:', error);
    return { success: false, error: error.message };
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
  
  // Download methods (NEW)
  downloadAirQuality,
  downloadHistory,
  
  // Extended methods (for hooks compatibility)
  getLatestData,
  getHistoricalData,
  getLocationData,
  getAlerts,
  
  // Transformers
  transformAirQualityData,
  transformAirQualityArray,
  
  // Helpers
  getAQIColor,
  getAQILevel,
  calculateAverageAQI,
  getDateRange,
};

export default airQualityService;
