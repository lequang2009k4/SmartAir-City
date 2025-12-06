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
 * WebSocket Manager
 * Generic WebSocket connection manager using SignalR
 * 
 * Features:
 * - Auto reconnect
 * - Event handlers
 * - Connection state management
 * - Error handling
 * - Mock WebSocket support for development
 */

import * as signalR from '@microsoft/signalr';
import MockWebSocketAdapter from '../../mocks/mockWebSocketAdapter';

// Check if we should use mock WebSocket
const USE_MOCK_WS = process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK === 'true';

class WebSocketManager {
  constructor(hubUrl, options = {}) {
    this.hubUrl = hubUrl;
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.eventHandlers = new Map();
    this.onStateChange = options.onStateChange || null;
    this.useMock = USE_MOCK_WS;
    
    // Build SignalR connection or mock
    this.buildConnection();
  }

  /**
   * Build SignalR connection with configuration
   */
  buildConnection() {
    // Use mock WebSocket in development
    if (this.useMock) {
      console.log('[WebSocket] Using Mock WebSocket Adapter');
      this.connection = new MockWebSocketAdapter();
      return;
    }

    // Build real SignalR connection
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
        // Skip certificate validation in development (HTTPS localhost)
        ...(process.env.NODE_ENV === 'development' && {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop reconnecting
          }
          return this.reconnectDelay;
        }
      })
      .configureLogging(
        process.env.NODE_ENV === 'development' 
          ? signalR.LogLevel.Information 
          : signalR.LogLevel.Warning
      )
      .build();

    // Setup connection event handlers (only for real SignalR)
    if (!this.useMock) {
      this.setupConnectionHandlers();
    }
  }

  /**
   * Setup connection lifecycle event handlers
   */
  setupConnectionHandlers() {
    // Skip if using mock
    if (this.useMock) return;
    // Connection closed
    this.connection.onclose((error) => {
      this.isConnected = false;
      this.notifyStateChange('disconnected');
      
      if (error) {
        console.error('[WebSocket] Connection closed with error:', error);
      } else {
        console.log('[WebSocket] Connection closed');
      }
    });

    // Reconnecting
    this.connection.onreconnecting((error) => {
      this.isConnected = false;
      this.reconnectAttempts++;
      this.notifyStateChange('reconnecting');
      
      console.warn(`[WebSocket] Reconnecting (attempt ${this.reconnectAttempts})...`, error);
    });

    // Reconnected
    this.connection.onreconnected((connectionId) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyStateChange('connected');
      
      console.log('[WebSocket] Reconnected:', connectionId);
    });
  }

  /**
   * Start WebSocket connection
   */
  async start() {
    try {
      console.log('[WebSocket] Starting connection to:', this.hubUrl);
      
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyStateChange('connected');
      
      console.log('[WebSocket] Connected successfully. Connection ID:', this.connection.connectionId);
      
      return true;
    } catch (error) {
      this.isConnected = false;
      this.notifyStateChange('error');
      
      console.error('[WebSocket] Failed to start connection:', error);
      
      // Try to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`[WebSocket] Will retry in ${this.reconnectDelay}ms...`);
        setTimeout(() => this.start(), this.reconnectDelay);
      }
      
      return false;
    }
  }

  /**
   * Stop WebSocket connection
   */
  async stop() {
    try {
      if (this.connection) {
        await this.connection.stop();
        this.isConnected = false;
        this.notifyStateChange('disconnected');
        
        console.log('[WebSocket] Connection stopped');
      }
    } catch (error) {
      console.error('[WebSocket] Error stopping connection:', error);
    }
  }

  /**
   * Subscribe to server events
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler callback
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName).push(handler);
    
    // Register with SignalR
    this.connection.on(eventName, handler);
    
    console.log(`[WebSocket] Subscribed to event: ${eventName}`);
  }

  /**
   * Unsubscribe from server events
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler callback (optional)
   */
  off(eventName, handler = null) {
    if (handler) {
      // Remove specific handler
      this.connection.off(eventName, handler);
      
      const handlers = this.eventHandlers.get(eventName) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      // Remove all handlers for this event
      this.connection.off(eventName);
      this.eventHandlers.delete(eventName);
    }
    
    console.log(`[WebSocket] Unsubscribed from event: ${eventName}`);
  }

  /**
   * Invoke server method
   * @param {string} methodName - Server method name
   * @param {...any} args - Method arguments
   */
  async invoke(methodName, ...args) {
    try {
      if (!this.isConnected) {
        throw new Error('WebSocket is not connected');
      }
      
      console.log(`[WebSocket] Invoking method: ${methodName}`, args);
      
      const result = await this.connection.invoke(methodName, ...args);
      
      console.log(`[WebSocket] Method ${methodName} invoked successfully`);
      
      return result;
    } catch (error) {
      console.error(`[WebSocket] Error invoking method ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Send message to server (no response expected)
   * @param {string} methodName - Server method name
   * @param {...any} args - Method arguments
   */
  async send(methodName, ...args) {
    try {
      if (!this.isConnected) {
        throw new Error('WebSocket is not connected');
      }
      
      console.log(`[WebSocket] Sending message: ${methodName}`, args);
      
      await this.connection.send(methodName, ...args);
      
      console.log(`[WebSocket] Message ${methodName} sent successfully`);
    } catch (error) {
      console.error(`[WebSocket] Error sending message ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Notify state change listeners
   */
  notifyStateChange(state) {
    if (this.onStateChange) {
      this.onStateChange(state, {
        isConnected: this.isConnected,
        reconnectAttempts: this.reconnectAttempts,
        connectionId: this.connection?.connectionId,
      });
    }
  }

  /**
   * Get connection state
   */
  getState() {
    return {
      isConnected: this.isConnected,
      connectionState: this.connection?.state,
      connectionId: this.connection?.connectionId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Check if connected
   */
  get connected() {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export default WebSocketManager;
