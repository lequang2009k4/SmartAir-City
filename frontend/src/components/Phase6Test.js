// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Phase 6 Integration Test Component
 * Test all hooks and verify they work correctly
 */

import React from 'react';
import { useAirQuality, useDevices, useAuth } from '../hooks';
import './Phase6Test.css';

const Phase6Test = () => {
  // Test useAirQuality hook
  const {
    latestData,
    alerts,
    isLoading: aqLoading,
    error: aqError,
    isConnected,
    refresh: refreshAQ,
  } = useAirQuality({
    enableWebSocket: true,
  });

  // Test useDevices hook
  const {
    devices,
    isLoading: devicesLoading,
    error: devicesError,
    devicesCount,
    refresh: refreshDevices,
  } = useDevices({
    autoFetch: true,
  });

  // Test useAuth hook
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    userName,
    userRole,
  } = useAuth();

  return (
    <div className="phase6-test-container">
      <h1>🧪 Phase 6 Integration Test</h1>
      <p className="subtitle">Testing all Custom Hooks and Service Integration</p>

      {/* useAirQuality Hook Test */}
      <div className="test-section">
        <h2>
          1️⃣ useAirQuality Hook
          {isConnected && <span className="badge success">🟢 WebSocket Connected</span>}
        </h2>
        
        <div className="test-info">
          <div className="info-row">
            <strong>Status:</strong>
            {aqLoading && <span className="badge warning">⏳ Loading...</span>}
            {aqError && <span className="badge error">❌ Error: {aqError}</span>}
            {!aqLoading && !aqError && <span className="badge success">✅ OK</span>}
          </div>
          
          <div className="info-row">
            <strong>Latest Data Count:</strong> {latestData.length} stations
          </div>
          
          <div className="info-row">
            <strong>Alerts Count:</strong> {alerts.length} alerts
          </div>
          
          <div className="info-row">
            <strong>WebSocket Status:</strong> 
            {isConnected ? (
              <span className="badge success">✅ Connected (Realtime)</span>
            ) : (
              <span className="badge warning">⚠️ Disconnected (HTTP Polling)</span>
            )}
          </div>
        </div>

        <button onClick={refreshAQ} className="btn-refresh">
          🔄 Refresh Air Quality Data
        </button>

        {/* Show sample data */}
        {latestData.length > 0 && (
          <div className="data-preview">
            <h3>📊 Sample Data (First 3 stations):</h3>
            <pre>{JSON.stringify(latestData.slice(0, 3), null, 2)}</pre>
          </div>
        )}

        {/* Show alerts */}
        {alerts.length > 0 && (
          <div className="alerts-preview">
            <h3>⚠️ Active Alerts:</h3>
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="alert-item">
                🚨 {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* useDevices Hook Test */}
      <div className="test-section">
        <h2>2️⃣ useDevices Hook</h2>
        
        <div className="test-info">
          <div className="info-row">
            <strong>Status:</strong>
            {devicesLoading && <span className="badge warning">⏳ Loading...</span>}
            {devicesError && <span className="badge error">❌ Error: {devicesError}</span>}
            {!devicesLoading && !devicesError && <span className="badge success">✅ OK</span>}
          </div>
          
          <div className="info-row">
            <strong>Devices Count:</strong> {devicesCount} devices
          </div>
          
          <div className="info-row">
            <strong>Has Devices:</strong> 
            {devices.length > 0 ? (
              <span className="badge success">✅ Yes</span>
            ) : (
              <span className="badge warning">⚠️ No devices found</span>
            )}
          </div>
        </div>

        <button onClick={refreshDevices} className="btn-refresh">
          🔄 Refresh Devices
        </button>

        {/* Show sample devices */}
        {devices.length > 0 && (
          <div className="data-preview">
            <h3>📱 Sample Devices (First 3):</h3>
            <pre>{JSON.stringify(devices.slice(0, 3), null, 2)}</pre>
          </div>
        )}
      </div>

      {/* useAuth Hook Test */}
      <div className="test-section">
        <h2>3️⃣ useAuth Hook</h2>
        
        <div className="test-info">
          <div className="info-row">
            <strong>Status:</strong>
            {authLoading && <span className="badge warning">⏳ Loading...</span>}
            {!authLoading && <span className="badge success">✅ OK</span>}
          </div>
          
          <div className="info-row">
            <strong>Authenticated:</strong>
            {isAuthenticated ? (
              <span className="badge success">✅ Yes</span>
            ) : (
              <span className="badge warning">⚠️ No (Guest)</span>
            )}
          </div>
          
          <div className="info-row">
            <strong>User Name:</strong> {userName}
          </div>
          
          <div className="info-row">
            <strong>User Role:</strong> {userRole}
          </div>
        </div>

        {user && (
          <div className="data-preview">
            <h3>👤 User Data:</h3>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Test Summary */}
      <div className="test-summary">
        <h2>📝 Test Summary</h2>
        <ul>
          <li className={!aqLoading && !aqError ? 'pass' : 'pending'}>
            {!aqLoading && !aqError ? '✅' : '⏳'} useAirQuality: 
            {latestData.length} stations loaded
          </li>
          <li className={isConnected ? 'pass' : 'warning'}>
            {isConnected ? '✅' : '⚠️'} WebSocket: 
            {isConnected ? 'Connected (Realtime)' : 'Using HTTP Polling'}
          </li>
          <li className={!devicesLoading && !devicesError ? 'pass' : 'pending'}>
            {!devicesLoading && !devicesError ? '✅' : '⏳'} useDevices: 
            {devicesCount} devices loaded
          </li>
          <li className={!authLoading ? 'pass' : 'pending'}>
            {!authLoading ? '✅' : '⏳'} useAuth: 
            {isAuthenticated ? 'Authenticated' : 'Guest mode'}
          </li>
        </ul>
      </div>

      {/* Instructions */}
      <div className="test-instructions">
        <h3>🎯 How to Verify Phase 6:</h3>
        <ol>
          <li>
            <strong>Check Data Loading:</strong> All sections should show "✅ OK" status
          </li>
          <li>
            <strong>Check WebSocket:</strong> Should see "🟢 WebSocket Connected" or "HTTP Polling" fallback
          </li>
          <li>
            <strong>Check Console:</strong> Open browser DevTools → Console tab → Look for:
            <ul>
              <li>✅ "[AirQualityWS] Starting HTTP polling" - Mock WebSocket working</li>
              <li>✅ "📡 New air quality data received" - Data updates</li>
              <li>✅ "🗺️ Map connected to realtime data" - Components integrated</li>
            </ul>
          </li>
          <li>
            <strong>Check Network Tab:</strong> Should see API calls to:
            <ul>
              <li>✅ GET /api/airquality</li>
              <li>✅ GET /api/devices</li>
            </ul>
          </li>
          <li>
            <strong>Wait 10 seconds:</strong> Mock WebSocket broadcasts new data every 10 seconds
          </li>
          <li>
            <strong>Check Realtime Updates:</strong> Data should auto-update without refresh
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Phase6Test;
