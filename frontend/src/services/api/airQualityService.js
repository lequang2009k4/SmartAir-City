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
 * Service layer cho Air Quality endpoints (openapi.yaml)
 */

import { airQualityAxios } from './axiosInstance';
import { AIR_QUALITY_ENDPOINTS } from '../config/apiConfig';

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Calculate AQI from PM2.5 value using US EPA standard
 * @param {number} pm25 - PM2.5 concentration (µg/m³)
 * @returns {number} AQI value
 */
const calculateAQIFromPM25 = (pm25) => {
  if (!pm25 || pm25 < 0) return 0;
  
  // US EPA AQI breakpoints for PM2.5
  const breakpoints = [
    { cLow: 0, cHigh: 12.0, aqiLow: 0, aqiHigh: 50 },      // Good
    { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 }, // Moderate
    { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 }, // USG
    { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 }, // Unhealthy
    { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 }, // Very Unhealthy
    { cLow: 250.5, cHigh: 500.4, aqiLow: 301, aqiHigh: 500 }, // Hazardous
  ];
  
  // Find appropriate breakpoint
  let bp = breakpoints[breakpoints.length - 1]; // Default to highest
  for (const breakpoint of breakpoints) {
    if (pm25 >= breakpoint.cLow && pm25 <= breakpoint.cHigh) {
      bp = breakpoint;
      break;
    }
  }
  
  // Calculate AQI using linear interpolation
  const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.aqiLow;
  return Math.round(aqi);
};

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
  
  // Extract stationId from the ID or metadata FIRST (needed for name generation)
  const extractStationId = () => {
    // Check if there's a direct stationId field (from backend)
    if (ngsiData.stationId) return ngsiData.stationId;
    
    const id = ngsiData.id || '';
    
    // Pattern: urn:ngsi-ld:AirQualityObserved:station-xxx:timestamp
    // Extract station-xxx or mqtt-xxx or the station identifier
    const match = id.match(/AirQualityObserved:([^:]+)/);
    if (match) {
      return match[1]; // e.g., 'station-oceanpark', 'hieu-mqtt-1764992353'
    }
    
    // Fallback: use sensor ID if available
    if (sensorId && typeof sensorId === 'string') {
      const sensorMatch = sensorId.match(/Device:([^:]+)$/);
      if (sensorMatch) return sensorMatch[1];
    }
    
    return null;
  };
  
  const stationId = extractStationId();
  
  // Generate friendly name from sensor ID or stationId
  const generateName = () => {
    // For MQTT sources (ExternalMqttSource pattern), use stationId
    if (sensorId && typeof sensorId === 'string' && sensorId.includes('ExternalMqttSource')) {
      if (stationId) {
        // Convert 'hieu-mqtt-1764992353' to 'HIEU MQTT'
        const parts = stationId.split('-');
        const nameParts = parts.slice(0, -1); // Remove timestamp number
        return nameParts.map(p => p.toUpperCase()).join(' ') || stationId.toUpperCase();
      }
      return 'MQTT Sensor';
    }
    
    // For External HTTP sources (station-xxx pattern without MQ device)
    if (sensorId && typeof sensorId === 'string' && sensorId.includes('ExternalHttpSource')) {
      if (stationId) {
        return stationId.toUpperCase().replace(/-/g, ' ');
      }
      return 'External Sensor';
    }
    
    // For official devices (MQ135, etc.)
    if (typeof sensorId === 'string' && sensorId.includes(':')) {
      const parts = sensorId.split(':');
      return parts[parts.length - 1].toUpperCase();
    }
    
    // Fallback
    return `Station ${Math.round(locationCoords[1] * 100) / 100}`;
  };

  // Detect source type based on ID patterns
  const detectSourceType = () => {
    const id = (ngsiData.id || '').toLowerCase();
    const sensor = (sensorId || '').toLowerCase();
    
    // Priority 1: Check if stationId contains mqtt
    if (id.includes('mqtt') || sensor.includes('mqtt')) {
      return 'mqtt';
    }
    
    // Priority 2: Check if sensor is from official devices (MQ135, MQ7, etc)
    if (sensor.match(/urn:ngsi-ld:device:(mq\d+|sensor)/i)) {
      return 'official';
    }
    
    // Priority 3: Check if stationId is from external source (station-xxx pattern without official sensor)
    // External sources have generic stationId but sensor is NOT from device (no MQ pattern)
    if (id.includes('station-') && !sensor.includes('mq')) {
      return 'external-http';
    }
    
    // Default: official stations
    return 'official';
  };

  return {
    // Basic info
    id: ngsiData.id,
    type: ngsiData.type,
    name: generateName(), // Add friendly name
    stationId: stationId, // Use extracted stationId (already computed)
    sourceType: detectSourceType(), // Add source type detection
    
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
    
    // Get PM2.5 value (support both uppercase, lowercase, and underscore formats)
    pm25: ngsiData.PM25?.value || ngsiData.pm25?.value || ngsiData.pm2_5?.value || 0,
    pm10: ngsiData.PM10?.value || ngsiData.pm10?.value || ngsiData.pm10_?.value || 0,
    
    // Air Quality Index - Calculate from PM2.5 if not provided
    aqi: (() => {
      const providedAQI = ngsiData.airQualityIndex?.value;
      if (providedAQI !== undefined && providedAQI !== null) {
        return providedAQI;
      }
      // Calculate AQI from PM2.5 for MQTT/External sources
      const pm25Value = ngsiData.PM25?.value || ngsiData.pm25?.value || ngsiData.pm2_5?.value;
      if (pm25Value) {
        const calculatedAQI = calculateAQIFromPM25(pm25Value);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🧮 [transformAirQualityData] Calculated AQI from PM2.5: ${pm25Value} µg/m³ → AQI ${calculatedAQI}`);
        }
        return calculatedAQI;
      }
      return 0;
    })(),
    aqiUnitCode: ngsiData.airQualityIndex?.unitCode,
    
    // Pollutants (GQ = µg/m³ per UN/CEFACT)
    // Support both uppercase (from backend) and lowercase (legacy)
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
        value: ngsiData.PM25?.value || ngsiData.pm25?.value || ngsiData.pm2_5?.value || 0,
        unit: ngsiData.PM25?.unitCode || ngsiData.pm25?.unitCode || ngsiData.pm2_5?.unitCode || 'GQ',
        observedAt: ngsiData.PM25?.observedAt || ngsiData.pm25?.observedAt || ngsiData.pm2_5?.observedAt,
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
  const params = {};
  
  // Only add limit if it's a valid number (not null/undefined)
  if (limit !== null && limit !== undefined) {
    params.limit = limit;
  }
  
  if (stationId) {
    params.stationId = stationId;
    console.log(`🔍 [airQualityService] Filtering by stationId: ${stationId}`);
  }
  
  console.log(`📊 [airQualityService] Query params:`, params);
  const data = await airQualityAxios.get(AIR_QUALITY_ENDPOINTS.GET_ALL, { params });
  
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
  
  const data = await airQualityAxios.get(AIR_QUALITY_ENDPOINTS.GET_LATEST, { params });
  
  console.log(`📦 [airQualityService] Raw data for ${stationId}:`, data);
  
  const transformed = transform ? transformAirQualityData(data) : data;
  
  console.log(`✅ [airQualityService] Transformed data for ${stationId}:`, transformed);
  
  return transformed;
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
  
  const data = await airQualityAxios.get(AIR_QUALITY_ENDPOINTS.GET_HISTORY, { params });
  
  return transform ? transformAirQualityArray(data) : data;
};

/**
 * Post IoT data (admin only)
 * @param {object} iotData - NGSI-LD IoT data
 * @returns {Promise<object>} Response
 */
export const postIotData = async (iotData) => {
  const data = await airQualityAxios.post(AIR_QUALITY_ENDPOINTS.POST_IOT_DATA, iotData);
  return data;
};

/**
 * Get latest air quality data for all locations (alias for compatibility)
 * Combines official devices + MQTT sources + External HTTP sources
 * @param {object} params - Query parameters (stationId, location, limit, etc.)
 * @returns {Promise<array>} Array of latest air quality records
 */
export const getLatestData = async (params = {}) => {
  const limit = params.limit || 50;
  const stationId = params.stationId || null; // NEW: Support stationId
  
  // If specific stationId requested, use direct API call
  if (stationId) {
    const data = await getLatest(stationId, true);
    return data ? [data] : [];
  }
  
  try {
    console.log('📡 [airQualityService] getLatestData: Fetching ALL sources (official + MQTT + external)...');
    
    // Fetch official devices data
    const officialData = await getAll(limit, null, true);
    console.log(`✅ [airQualityService] Official devices: ${officialData?.length || 0} records`);
    
    // Fetch MQTT sources
    let mqttData = [];
    try {
      // Dynamic import to avoid circular dependency
      const { default: externalMqttService } = await import('./externalMqttService');
      const mqttSources = await externalMqttService.getAll();
      console.log(`📡 [airQualityService] MQTT sources: ${mqttSources?.length || 0} sources`);
      
      // Fetch latest data for each MQTT source
      const mqttPromises = (mqttSources || []).map(async (source) => {
        try {
          const data = await getLatest(source.stationId, true);
          return data;
        } catch (err) {
          console.warn(`⚠️ [airQualityService] Failed to fetch MQTT data for ${source.stationId}:`, err.message);
          return null;
        }
      });
      
      mqttData = (await Promise.all(mqttPromises)).filter(Boolean);
      console.log(`✅ [airQualityService] MQTT data fetched: ${mqttData.length} records`);
    } catch (err) {
      console.warn('⚠️ [airQualityService] Failed to fetch MQTT sources:', err.message);
    }
    
    // Fetch External HTTP sources
    let externalData = [];
    try {
      const { default: externalSourcesService } = await import('./externalSourcesService');
      const externalSources = await externalSourcesService.getAll();
      console.log(`🌐 [airQualityService] External sources: ${externalSources?.length || 0} sources`);
      
      // Fetch latest data for each External source
      const externalPromises = (externalSources || []).map(async (source) => {
        try {
          const data = await getLatest(source.stationId, true);
          return data;
        } catch (err) {
          console.warn(`⚠️ [airQualityService] Failed to fetch External data for ${source.stationId}:`, err.message);
          return null;
        }
      });
      
      externalData = (await Promise.all(externalPromises)).filter(Boolean);
      console.log(`✅ [airQualityService] External data fetched: ${externalData.length} records`);
    } catch (err) {
      console.warn('⚠️ [airQualityService] Failed to fetch External sources:', err.message);
    }
    
    // Combine all data sources
    const allData = [...(officialData || []), ...mqttData, ...externalData];
    console.log(`🎯 [airQualityService] Total combined data: ${allData.length} records (Official: ${officialData?.length || 0}, MQTT: ${mqttData.length}, External: ${externalData.length})`);
    
    // Legacy filter by location if provided
    if (params.location) {
      const filtered = allData.filter(item => 
        item.location?.coordinates?.toString().includes(params.location)
      );
      console.log(`🔍 [airQualityService] Filtered by location: ${filtered.length} records`);
      return filtered;
    }
    
    return allData;
  } catch (err) {
    console.error('❌ [airQualityService] Error in getLatestData:', err);
    // Fallback to official data only
    const data = await getAll(limit, stationId, true);
    return Array.isArray(data) ? data : [];
  }
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
    
    const response = await airQualityAxios.get(AIR_QUALITY_ENDPOINTS.DOWNLOAD, {
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
    
    const response = await airQualityAxios.get(AIR_QUALITY_ENDPOINTS.DOWNLOAD_HISTORY, {
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
