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
 * WebSocket Configuration
 * Configuration for SignalR/WebSocket connections
 * 
 * BACKEND: ASP.NET Core 8 with SignalR
 * PROTOCOL: SignalR (we'll use @microsoft/signalr library)
 */

// ============================================
// ENVIRONMENT VARIABLES
// ============================================
const AIR_WS_BASE_URL = process.env.REACT_APP_AIR_WS_URL;
const ENABLE_WEBSOCKET = process.env.REACT_APP_ENABLE_WEBSOCKET === 'true';
const WS_RECONNECT_INTERVAL = parseInt(process.env.REACT_APP_WS_RECONNECT_INTERVAL) || 5000;
const DEBUG_MODE = process.env.REACT_APP_DEBUG_MODE === 'true';

// ============================================
// WEBSOCKET ENDPOINTS
// ============================================

/**
 * Air Quality WebSocket Hub
 * Real-time air quality data updates
 */
export const WS_ENDPOINTS = {
  // SignalR Hub URL (Backend endpoint)
  AIR_QUALITY_HUB: `${AIR_WS_BASE_URL}/airqualityhub`,
  
  // Alternative: If backend uses simple WebSocket (not SignalR)
  AIR_QUALITY_WS: `${AIR_WS_BASE_URL}/api/airquality`,
};

// ============================================
// WEBSOCKET EVENTS
// ============================================

/**
 * Event names for SignalR/WebSocket communication
 * These should match backend event names
 */
export const WS_EVENTS = {
  // Air Quality events
  AIR_QUALITY: {
    NEW_DATA: 'NewAirQualityData',  
    UPDATE: 'NewAirQualityData',     // Same as NEW_DATA
    LATEST_DATA: 'ReceiveLatestData',
    ALERT: 'ReceiveAlert',
    SUBSCRIBE: 'SubscribeToAirQuality',
    UNSUBSCRIBE: 'UnsubscribeFromAirQuality',
  },
  
  // Device events
  DEVICES: {
    STATUS_CHANGED: 'ReceiveDeviceStatusChanged',
    NEW_DEVICE: 'ReceiveNewDevice',
    UPDATED: 'ReceiveDeviceUpdated',
    DELETED: 'ReceiveDeviceDeleted',
  },
  
  // Connection events
  CONNECTION: {
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected',
    RECONNECTING: 'Reconnecting',
    RECONNECTED: 'Reconnected',
    ERROR: 'Error',
  },
};

// ============================================
// WEBSOCKET CONFIG
// ============================================
export const WS_CONFIG = {
  // Enable/Disable WebSocket
  ENABLED: ENABLE_WEBSOCKET,
  
  // Connection settings
  AUTO_RECONNECT: true,
  RECONNECT_INTERVAL: WS_RECONNECT_INTERVAL,
  MAX_RECONNECT_ATTEMPTS: 10,
  
  // Timeouts
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  PING_INTERVAL: 30000, // 30 seconds (keepalive)
  
  // SignalR specific settings
  SIGNALR_OPTIONS: {
    // Logging level (None=0, Critical=1, Error=2, Warning=3, Information=4, Debug=5, Trace=6)
    logLevel: DEBUG_MODE ? 5 : 2, // Debug in dev, Error in prod
    
    // Automatically reconnect
    withAutomaticReconnect: {
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential backoff: 0ms, 2s, 5s, 10s, 30s, then 30s
        if (retryContext.previousRetryCount === 0) return 0;
        if (retryContext.previousRetryCount === 1) return 2000;
        if (retryContext.previousRetryCount === 2) return 5000;
        if (retryContext.previousRetryCount === 3) return 10000;
        return 30000;
      },
    },
  },
  
  // Debug mode
  DEBUG_MODE,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get WebSocket URL for a specific endpoint
 * @param {string} endpointName - Name of endpoint ('airQuality')
 * @returns {string} - Full SignalR Hub URL
 */
export const getWebSocketUrl = (endpointName) => {
  // Map endpoint names to WS_ENDPOINTS
  const endpointMap = {
    'airQuality': WS_ENDPOINTS.AIR_QUALITY_HUB,
    'airQualityHub': WS_ENDPOINTS.AIR_QUALITY_HUB,
  };
  
  const url = endpointMap[endpointName] || WS_ENDPOINTS.AIR_QUALITY_HUB;
  
  return url;
};

/**
 * Log WebSocket event (only in development)
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export const logWsEvent = (event, data = null) => {
  if (WS_CONFIG.DEBUG_MODE) {
    console.log(`[WebSocket Event: ${event}]`, new Date().toISOString());
    if (data) console.log('[Data]', data);
  }
};

/**
 * Check if WebSocket is enabled
 * @returns {boolean}
 */
export const isWebSocketEnabled = () => {
  return WS_CONFIG.ENABLED;
};

// Export default config object
const wsConfigExport = {
  WS_ENDPOINTS,
  WS_EVENTS,
  WS_CONFIG,
  getWebSocketUrl,
  logWsEvent,
  isWebSocketEnabled,
};

export default wsConfigExport;
