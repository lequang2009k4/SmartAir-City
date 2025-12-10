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
 * Air Quality WebSocket Service
 * Realtime Air Quality updates using SignalR
 * 
 * Features:
 * - Subscribe to realtime Air Quality updates
 * - Auto fallback to HTTP polling if WebSocket fails
 * - Event-based updates
 */

import WebSocketManager from './WebSocketManager';
import { getWebSocketUrl, WS_EVENTS, isWebSocketEnabled } from '../config/wsConfig';
import airQualityService from '../api/airQualityService';
import { normalizeStationId } from '../../utils/stationUtils';

class AirQualityWebSocket {
  constructor() {
    this.wsManager = null;
    this.isEnabled = isWebSocketEnabled();
    this.pollingInterval = null;
    this.pollingDelay = 30000; // 30 seconds fallback polling
    this.listeners = new Map();
    this.lastData = null;
  }

  // Note: normalizeStationId is now imported from stationUtils

  /**
   * Extract station ID from NGSI-LD data
   * Logic từ test-signalr.html
   */
  extractStationId(data) {
    // 1. Check field "id"
    if (data.id && typeof data.id === 'string') {
      const id = data.id.toLowerCase();
      if (id.includes('oceanpark')) return 'hanoi-oceanpark';
      if (id.includes('nguyenvancu')) return 'hanoi-nguyenvancu';
      if (id.includes('congvien') || id.includes('hodh')) return 'hanoi-congvien-hodh';
      if (id.includes('cmt8')) return 'hcm-cmt8';
      if (id.includes('carecentre') || id.includes('care-centre')) return 'hcm-carecentre';
    }

    // 2. Check sensor URN "sosa:madeBySensor"
    const sensor = data['sosa:madeBySensor']?.object || data['sosa:madeBySensor'] || data.madeBySensor;
    if (sensor && typeof sensor === 'string') {
      const sensorLower = sensor.toLowerCase();
      if (sensorLower.includes('oceanpark')) return 'hanoi-oceanpark';
      if (sensorLower.includes('nguyenvancu')) return 'hanoi-nguyenvancu';
      if (sensorLower.includes('congvienhodh') || sensorLower.includes('hodh')) return 'hanoi-congvien-hodh';
      if (sensorLower.includes('cmt8')) return 'hcm-cmt8';
      if (sensorLower.includes('carecentre') || sensorLower.includes('care-centre')) return 'hcm-carecentre';
    }

    // 3. Check coordinates
    const coords = data.location?.value?.coordinates || data.location?.coordinates;
    if (coords && Array.isArray(coords) && coords.length === 2) {
      const [lon, lat] = coords;
      // Ocean Park: 20.9933, 105.9441
      if (Math.abs(lat - 20.9933) < 0.01 && Math.abs(lon - 105.9441) < 0.01) return 'hanoi-oceanpark';
      // Nguyễn Văn Cừ: 21.0491, 105.8831
      if (Math.abs(lat - 21.0491) < 0.01 && Math.abs(lon - 105.8831) < 0.01) return 'hanoi-nguyenvancu';
      // Công viên: 21.00309, 105.79469
      if (Math.abs(lat - 21.00309) < 0.01 && Math.abs(lon - 105.79469) < 0.01) return 'hanoi-congvien-hodh';
      // TP.HCM - CMT8: 10.78542, 106.67038
      if (Math.abs(lat - 10.78542) < 0.01 && Math.abs(lon - 106.67038) < 0.01) return 'hcm-cmt8';
      // TP.HCM - Care Centre: 10.7745, 106.66102
      if (Math.abs(lat - 10.7745) < 0.01 && Math.abs(lon - 106.66102) < 0.01) return 'hcm-carecentre';
    }

    console.warn('[AirQualityWS] Could not extract station ID from data:', data);
    return null;
  }

  /**
   * Initialize WebSocket connection
   */
  async initialize() {
    if (!this.isEnabled) {
      console.warn('[AirQualityWS] WebSocket disabled, using HTTP polling');
      this.startPolling();
      return false;
    }

    try {
      const hubUrl = getWebSocketUrl('airQuality');
      
      this.wsManager = new WebSocketManager(hubUrl, {
        maxReconnectAttempts: 5,
        reconnectDelay: 3000,
        onStateChange: (state, info) => this.handleStateChange(state, info),
      });

      // Subscribe to Air Quality events
      this.subscribeToEvents();

      // Start connection
      const connected = await this.wsManager.start();
      
      if (!connected) {
        console.warn('[AirQualityWS] Failed to connect, falling back to HTTP polling');
        this.startPolling();
      }

      return connected;
    } catch (error) {
      console.error('[AirQualityWS] Initialization error:', error);
      this.startPolling();
      return false;
    }
  }

  /**
   * Subscribe to SignalR events
   */
  subscribeToEvents() {
    if (!this.wsManager) return;

    console.log('📡 [AirQualityWS] Subscribing to events:', WS_EVENTS.AIR_QUALITY);

    // New Air Quality data event
    this.wsManager.on(WS_EVENTS.AIR_QUALITY.NEW_DATA, (data) => {
      console.log('✅ [AirQualityWS] ✨✨✨ Received NEW_DATA event!');
      console.log('📦 [AirQualityWS] Raw data:', data);
      
      // Transform data FIRST
      const transformedData = airQualityService.transformAirQualityData(data);
      console.log('📦 [AirQualityWS] Transformed data:', transformedData);
      
      // Extract station ID if not already in transformed data
      if (!transformedData.stationId) {
        const stationId = this.extractStationId(data);
        console.log('🏢 [AirQualityWS] Detected stationId (fallback):', stationId);
        if (stationId) {
          transformedData.stationId = stationId;
        }
      } else {
        console.log('✅ [AirQualityWS] Using stationId from transformed data:', transformedData.stationId);
        
        // NORMALIZE stationId to match dashboard format
        // "station-oceanpark" -> "hanoi-oceanpark"
        const normalizedStationId = normalizeStationId(transformedData.stationId);
        if (normalizedStationId) {
          transformedData.stationId = normalizedStationId;
          console.log('🔄 [AirQualityWS] Normalized stationId to:', normalizedStationId);
        }
      }
      
      console.log('📦 [AirQualityWS] Final data with stationId:', transformedData.stationId);
      this.lastData = transformedData;
      
      // Notify listeners
      this.notifyListeners('newData', transformedData);
    });

    // Air Quality update event
    this.wsManager.on(WS_EVENTS.AIR_QUALITY.UPDATE, (data) => {
      console.log('✅ [AirQualityWS] Received UPDATE:', data);
      
      // Transform data FIRST
      const transformedData = airQualityService.transformAirQualityData(data);
      
      // Extract station ID if not already in transformed data
      if (!transformedData.stationId) {
        const stationId = this.extractStationId(data);
        if (stationId) {
          transformedData.stationId = stationId;
        }
      } else {
        // NORMALIZE stationId to match dashboard format
        const normalizedStationId = normalizeStationId(transformedData.stationId);
        if (normalizedStationId) {
          transformedData.stationId = normalizedStationId;
        }
      }
      
      this.lastData = transformedData;
      
      this.notifyListeners('update', transformedData);
    });

    // Alert event
    this.wsManager.on(WS_EVENTS.AIR_QUALITY.ALERT, (alert) => {
      console.warn('🚨 [AirQualityWS] Received ALERT:', alert);
      
      this.notifyListeners('alert', alert);
    });

    // Device status change
    this.wsManager.on(WS_EVENTS.DEVICES.STATUS_CHANGED, (device) => {
      console.log('🔧 [AirQualityWS] Device status changed:', device);
      
      this.notifyListeners('deviceStatusChanged', device);
    });
  }

  /**
   * Handle connection state changes
   */
  handleStateChange(state, info) {
    console.log(`[AirQualityWS] State changed: ${state}`, info);

    switch (state) {
      case 'connected':
        // Stop polling when connected
        this.stopPolling();
        this.notifyListeners('connected', info);
        this.notifyListeners('connectionChanged', true);
        break;

      case 'disconnected':
        // Start polling when disconnected
        this.startPolling();
        this.notifyListeners('disconnected', info);
        this.notifyListeners('connectionChanged', false);
        break;

      case 'reconnecting':
        this.notifyListeners('reconnecting', info);
        this.notifyListeners('connectionChanged', false);
        break;

      case 'error':
        // Fallback to polling on error
        this.startPolling();
        this.notifyListeners('error', info);
        this.notifyListeners('connectionChanged', false);
        break;

      default:
        break;
    }
  }

  /**
   * Start HTTP polling as fallback
   */
  startPolling() {
    if (this.pollingInterval) return;

    console.log('[AirQualityWS] Starting HTTP polling (fallback)');

    this.pollingInterval = setInterval(async () => {
      try {
        const latestData = await airQualityService.getLatest();
        
        // Only notify if data changed
        if (JSON.stringify(latestData) !== JSON.stringify(this.lastData)) {
          this.lastData = latestData;
          this.notifyListeners('newData', latestData);
        }
      } catch (error) {
        console.error('[AirQualityWS] Polling error:', error);
      }
    }, this.pollingDelay);
  }

  /**
   * Stop HTTP polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      console.log('[AirQualityWS] Stopping HTTP polling');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Subscribe to Air Quality updates
   * @param {string} eventType - Event type (newData, update, alert, etc.)
   * @param {function} callback - Callback function
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType).push(callback);
    
    console.log(`[AirQualityWS] Subscribed to ${eventType}`);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, callback);
  }

  /**
   * Alias for subscribe (for compatibility with hooks)
   */
  on(eventType, callback) {
    return this.subscribe(eventType, callback);
  }

  /**
   * Unsubscribe from Air Quality updates
   */
  unsubscribe(eventType, callback) {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      console.log(`[AirQualityWS] Unsubscribed from ${eventType}`);
    }
  }

  /**
   * Alias for unsubscribe (for compatibility with hooks)
   */
  off(eventType, callback) {
    this.unsubscribe(eventType, callback);
  }

  /**
   * Connect to WebSocket (alias for initialize)
   */
  async connect() {
    return await this.initialize();
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(eventType, data) {
    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.length === 0) return;

    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[AirQualityWS] Listener error for ${eventType}:`, error);
      }
    });
  }

  /**
   * Request latest data from server
   */
  async requestLatestData() {
    if (this.wsManager?.connected) {
      try {
        const data = await this.wsManager.invoke('GetLatestAirQuality');
        const transformedData = airQualityService.transformAirQualityData(data);
        this.lastData = transformedData;
        return transformedData;
      } catch (error) {
        console.error('[AirQualityWS] Error requesting latest data:', error);
        // Fallback to HTTP
        return await airQualityService.getLatest();
      }
    } else {
      // Use HTTP if not connected
      return await airQualityService.getLatest();
    }
  }

  /**
   * Join a specific location group for targeted updates
   * @param {string} locationId - Location ID to join
   */
  async joinLocation(locationId) {
    if (this.wsManager?.connected) {
      try {
        await this.wsManager.invoke('JoinLocationGroup', locationId);
        console.log(`[AirQualityWS] Joined location group: ${locationId}`);
      } catch (error) {
        console.error('[AirQualityWS] Error joining location group:', error);
      }
    }
  }

  /**
   * Leave a specific location group
   * @param {string} locationId - Location ID to leave
   */
  async leaveLocation(locationId) {
    if (this.wsManager?.connected) {
      try {
        await this.wsManager.invoke('LeaveLocationGroup', locationId);
        console.log(`[AirQualityWS] Left location group: ${locationId}`);
      } catch (error) {
        console.error('[AirQualityWS] Error leaving location group:', error);
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  async disconnect() {
    this.stopPolling();
    
    if (this.wsManager) {
      await this.wsManager.stop();
      this.wsManager = null;
    }
    
    console.log('[AirQualityWS] Disconnected');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isConnected: this.wsManager?.connected || false,
      isPolling: !!this.pollingInterval,
      lastData: this.lastData,
      connectionState: this.wsManager?.getState(),
    };
  }
}

// Create singleton instance
const airQualityWebSocket = new AirQualityWebSocket();

export default airQualityWebSocket;
