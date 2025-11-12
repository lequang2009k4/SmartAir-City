// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

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

class AirQualityWebSocket {
  constructor() {
    this.wsManager = null;
    this.isEnabled = isWebSocketEnabled();
    this.pollingInterval = null;
    this.pollingDelay = 30000; // 30 seconds fallback polling
    this.listeners = new Map();
    this.lastData = null;
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

    // New Air Quality data event
    this.wsManager.on(WS_EVENTS.AIR_QUALITY.NEW_DATA, (data) => {
      console.log('[AirQualityWS] Received new data:', data);
      
      // Transform data
      const transformedData = airQualityService.transformAirQualityData(data);
      this.lastData = transformedData;
      
      // Notify listeners
      this.notifyListeners('newData', transformedData);
    });

    // Air Quality update event
    this.wsManager.on(WS_EVENTS.AIR_QUALITY.UPDATE, (data) => {
      console.log('[AirQualityWS] Received update:', data);
      
      const transformedData = airQualityService.transformAirQualityData(data);
      this.lastData = transformedData;
      
      this.notifyListeners('update', transformedData);
    });

    // Alert event
    this.wsManager.on(WS_EVENTS.AIR_QUALITY.ALERT, (alert) => {
      console.warn('[AirQualityWS] Received alert:', alert);
      
      this.notifyListeners('alert', alert);
    });

    // Device status change
    this.wsManager.on(WS_EVENTS.DEVICES.STATUS_CHANGED, (device) => {
      console.log('[AirQualityWS] Device status changed:', device);
      
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
