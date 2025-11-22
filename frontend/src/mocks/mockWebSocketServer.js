// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

/**
 * Mock WebSocket Server
 * Simulate SignalR WebSocket events for development
 * Since backend WebSocket is not running yet
 */

import { generateAirQualityRecord } from './data/airQualityData';

class MockWebSocketServer {
  constructor() {
    this.clients = new Set();
    this.isRunning = false;
    this.updateInterval = null;
    this.updateFrequency = 10000; // 10 seconds
  }

  /**
   * Start mock WebSocket server
   */
  start() {
    if (this.isRunning) return;

    console.log('[MockWS] Starting mock WebSocket server...');
    this.isRunning = true;

    // Simulate periodic Air Quality updates
    this.updateInterval = setInterval(() => {
      this.broadcastNewData();
    }, this.updateFrequency);

    // Simulate occasional alerts
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance
        this.broadcastAlert();
      }
    }, 30000); // Every 30 seconds

    console.log('[MockWS] Mock WebSocket server started');
  }

  /**
   * Stop mock WebSocket server
   */
  stop() {
    if (!this.isRunning) return;

    console.log('[MockWS] Stopping mock WebSocket server...');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    this.clients.clear();

    console.log('[MockWS] Mock WebSocket server stopped');
  }

  /**
   * Register a client
   */
  registerClient(client) {
    this.clients.add(client);
    console.log(`[MockWS] Client registered. Total clients: ${this.clients.size}`);
  }

  /**
   * Unregister a client
   */
  unregisterClient(client) {
    this.clients.delete(client);
    console.log(`[MockWS] Client unregistered. Total clients: ${this.clients.size}`);
  }

  /**
   * Broadcast new Air Quality data to all clients
   */
  broadcastNewData() {
    if (this.clients.size === 0) return;

    const newData = generateAirQualityRecord();
    
    console.log('[MockWS] Broadcasting new Air Quality data to', this.clients.size, 'clients');

    this.clients.forEach(client => {
      if (client.onNewData) {
        client.onNewData(newData);
      }
    });
  }

  /**
   * Broadcast Air Quality alert
   */
  broadcastAlert() {
    if (this.clients.size === 0) return;

    const alerts = [
      {
        id: `alert-${Date.now()}`,
        type: 'warning',
        level: 'moderate',
        message: 'Chất lượng không khí đang ở mức trung bình',
        location: 'Hoàn Kiếm',
        aqi: 85,
        timestamp: new Date().toISOString(),
      },
      {
        id: `alert-${Date.now()}`,
        type: 'danger',
        level: 'unhealthy',
        message: 'Chất lượng không khí kém, hạn chế ra ngoài',
        location: 'Cầu Giấy',
        aqi: 165,
        timestamp: new Date().toISOString(),
      },
    ];

    const alert = alerts[Math.floor(Math.random() * alerts.length)];

    console.log('[MockWS] Broadcasting alert:', alert.message);

    this.clients.forEach(client => {
      if (client.onAlert) {
        client.onAlert(alert);
      }
    });
  }

  /**
   * Simulate device status change
   */
  broadcastDeviceStatusChange(deviceId, status) {
    console.log(`[MockWS] Broadcasting device status change: ${deviceId} -> ${status}`);

    const deviceUpdate = {
      deviceId,
      status,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach(client => {
      if (client.onDeviceStatusChanged) {
        client.onDeviceStatusChanged(deviceUpdate);
      }
    });
  }
}

// Create singleton instance
const mockWebSocketServer = new MockWebSocketServer();

// Auto start in development if WebSocket is enabled
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK === 'true') {
  mockWebSocketServer.start();
}

export default mockWebSocketServer;
