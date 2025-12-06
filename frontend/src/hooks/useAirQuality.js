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

import { useState, useEffect, useCallback, useRef } from 'react';
import { airQualityService, airQualityWebSocket } from '../services';

/**
 * Custom hook for Air Quality data with realtime WebSocket updates
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableWebSocket - Enable WebSocket realtime updates (default: true)
 * @param {number} options.refreshInterval - Auto refresh interval in ms (default: null - no auto refresh)
 * @param {string} options.location - Filter by location
 * @returns {Object} Air Quality data and methods
 */
const useAirQuality = (options = {}) => {
  const {
    enableWebSocket = true,
    refreshInterval = null,
    location = null
  } = options;

  // State management
  const [latestData, setLatestData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const refreshTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch latest air quality data
   */
  const fetchLatestData = useCallback(async () => {
    try {
      console.log('🔄 [useAirQuality] Starting fetchLatestData...');
      setIsLoading(true);
      setError(null);
      
      const params = location ? { location } : {};
      const data = await airQualityService.getLatestData(params);
      
      console.log('✅ [useAirQuality] fetchLatestData success:', data?.length || 0, 'records');
      
      if (isMountedRef.current) {
        setLatestData(data);
      }
    } catch (err) {
      console.error('❌ [useAirQuality] Error fetching latest data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch air quality data');
      }
    } finally {
      if (isMountedRef.current) {
        console.log('🏁 [useAirQuality] Setting isLoading = false');
        setIsLoading(false);
      }
    }
  }, [location]);

  /**
   * Fetch historical data for a specific location
   */
  const fetchHistoricalData = useCallback(async (locationId, startDate, endDate) => {
    try {
      setError(null);
      
      const data = await airQualityService.getHistoricalData(
        locationId,
        startDate,
        endDate
      );
      
      if (isMountedRef.current) {
        setHistoricalData(data);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching historical data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch historical data');
      }
      throw err;
    }
  }, []);

  /**
   * Get data for a specific location
   */
  const getLocationData = useCallback(async (locationId) => {
    try {
      setError(null);
      const data = await airQualityService.getLocationData(locationId);
      return data;
    } catch (err) {
      console.error('Error fetching location data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch location data');
      }
      throw err;
    }
  }, []);

  /**
   * Get alerts
   */
  const fetchAlerts = useCallback(async () => {
    try {
      console.log('🔄 [useAirQuality] Starting fetchAlerts...');
      const data = await airQualityService.getAlerts();
      console.log('✅ [useAirQuality] fetchAlerts success:', data?.length || 0, 'alerts');
      if (isMountedRef.current) {
        setAlerts(data);
      }
      return data;
    } catch (err) {
      console.error('❌ [useAirQuality] Error fetching alerts:', err);
      throw err;
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await fetchLatestData();
    await fetchAlerts();
  }, [fetchLatestData, fetchAlerts]);

  // WebSocket event handlers
  useEffect(() => {
    if (!enableWebSocket) return;

    // Handler for new data
    const handleNewData = (data) => {
      console.log('📡 New air quality data received:', data);
      
      if (isMountedRef.current) {
        // WebSocket sends single object, wrap in array if needed
        const dataArray = Array.isArray(data) ? data : [data];
        
        setLatestData(prevData => {
          console.log('🔄 [useAirQuality] Updating latestData. Previous count:', prevData.length);
          
          // Update all items from WebSocket
          const updatedData = [...prevData];
          
          dataArray.forEach(newItem => {
            const index = updatedData.findIndex(item => item.id === newItem.id);
            if (index !== -1) {
              // Update existing item
              console.log('✏️ [useAirQuality] Updating item:', newItem.id, 'AQI:', newItem.aqi);
              updatedData[index] = newItem;
            } else {
              // Add new item
              console.log('➕ [useAirQuality] Adding new item:', newItem.id, 'AQI:', newItem.aqi);
              updatedData.push(newItem);
            }
          });
          
          console.log('✅ [useAirQuality] Updated latestData. New count:', updatedData.length);
          return updatedData;
        });
      }
    };

    // Handler for data updates
    const handleUpdate = (data) => {
      console.log('🔄 Air quality data updated:', data);
      handleNewData(data); // Same logic as new data
    };

    // Handler for alerts
    const handleAlert = (alert) => {
      console.log('⚠️ New alert received:', alert);
      
      if (isMountedRef.current) {
        setAlerts(prevAlerts => {
          // Add new alert at the beginning
          const newAlerts = [alert, ...prevAlerts];
          // Keep only last 50 alerts
          return newAlerts.slice(0, 50);
        });
      }
    };

    // Handler for device status changes
    const handleDeviceStatus = (status) => {
      console.log('📱 Device status changed:', status);
    };

    // Handler for connection status
    const handleConnectionChange = (connected) => {
      console.log('🔌 WebSocket connection status:', connected ? 'Connected' : 'Disconnected');
      if (isMountedRef.current) {
        setIsConnected(connected);
      }
    };

    // Subscribe to events
    airQualityWebSocket.on('newData', handleNewData);
    airQualityWebSocket.on('update', handleUpdate);
    airQualityWebSocket.on('alert', handleAlert);
    airQualityWebSocket.on('deviceStatusChanged', handleDeviceStatus);
    airQualityWebSocket.on('connectionChanged', handleConnectionChange);

    // Connect WebSocket
    airQualityWebSocket.connect();

    // Join location group if specified
    if (location) {
      airQualityWebSocket.joinLocation(location);
    }

    // Cleanup
    return () => {
      airQualityWebSocket.off('newData', handleNewData);
      airQualityWebSocket.off('update', handleUpdate);
      airQualityWebSocket.off('alert', handleAlert);
      airQualityWebSocket.off('deviceStatusChanged', handleDeviceStatus);
      airQualityWebSocket.off('connectionChanged', handleConnectionChange);
      
      if (location) {
        airQualityWebSocket.leaveLocation(location);
      }
    };
  }, [enableWebSocket, location]);

  // Initial data fetch - Only run once on mount
  useEffect(() => {
    console.log('🚀 [useAirQuality] Initial data fetch on mount');
    
    // Fetch latest data
    const loadInitialData = async () => {
      try {
        console.log('🔄 [useAirQuality] Starting initial fetchLatestData...');
        setIsLoading(true);
        setError(null);
        
        const params = location ? { location } : {};
        const data = await airQualityService.getLatestData(params);
        
        console.log('✅ [useAirQuality] Initial fetchLatestData success:', data?.length || 0, 'records');
        
        if (isMountedRef.current) {
          setLatestData(data);
        }
      } catch (err) {
        console.error('❌ [useAirQuality] Error in initial fetch:', err);
        if (isMountedRef.current) {
          setError(err.message || 'Failed to fetch air quality data');
        }
      } finally {
        if (isMountedRef.current) {
          console.log('🏁 [useAirQuality] Setting isLoading = false');
          setIsLoading(false);
        }
      }
    };
    
    // Fetch alerts
    const loadAlerts = async () => {
      try {
        console.log('🔄 [useAirQuality] Starting initial fetchAlerts...');
        const data = await airQualityService.getAlerts();
        console.log('✅ [useAirQuality] Initial fetchAlerts success:', data?.length || 0, 'alerts');
        if (isMountedRef.current) {
          setAlerts(data);
        }
      } catch (err) {
        console.error('❌ [useAirQuality] Error fetching alerts:', err);
      }
    };
    
    loadInitialData();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only run once on mount

  // Auto refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [refreshInterval, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // Data
    latestData,
    historicalData,
    alerts,
    
    // States
    isLoading,
    error,
    isConnected,
    
    // Methods
    fetchLatestData,
    fetchHistoricalData,
    getLocationData,
    fetchAlerts,
    refresh,
    
    // WebSocket status
    isWebSocketEnabled: enableWebSocket,
  };
};

export default useAirQuality;
