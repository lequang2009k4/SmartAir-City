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

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { airQualityService, airQualityWebSocket } from '../services';

/**
 * Air Quality Context - Single source of truth for air quality data
 */
const AirQualityContext = createContext(null);

/**
 * Air Quality Provider Component
 * Manages global air quality state and WebSocket connection
 */
export const AirQualityProvider = ({ children }) => {
  // State management - latestData theo format: { 'hanoi-oceanpark': {...}, 'hcm-cmt8': {...}, ... }
  const [latestData, setLatestData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const isMountedRef = useRef(true);

  /**
   * Fetch latest air quality data
   */
  const fetchLatestData = useCallback(async () => {
    try {
      console.log('🔄 [AirQualityContext] Starting fetchLatestData...');
      setIsLoading(true);
      setError(null);
      
      const data = await airQualityService.getLatestData();
      console.log('📊 [AirQualityContext] Fetched data:', {
        count: data?.length || 0,
        hasData: !!data,
        sourceTypes: data?.reduce((acc, item) => {
          acc[item.sourceType] = (acc[item.sourceType] || 0) + 1;
          return acc;
        }, {})
      });
      
      console.log('✅ [AirQualityContext] fetchLatestData success:', data?.length || 0, 'records');
      console.log('📦 [AirQualityContext] First item structure:', data[0]);
      console.log('📦 [AirQualityContext] Has aqi field?', data[0]?.aqi !== undefined);
      
      // SAFETY: Ensure data is in correct format (has aqi field)
      // If not, it means transform failed - manually transform
      const ensureTransformed = (items) => {
        if (!Array.isArray(items) || items.length === 0) return items;
        
        // Check if first item is already transformed (has 'aqi' field)
        if (items[0]?.aqi !== undefined) {
          console.log('✅ [AirQualityContext] Data already transformed');
          return items;
        }
        
        // If not transformed (NGSI-LD format), transform now
        console.log('⚠️ [AirQualityContext] Data NOT transformed, transforming now...');
        return items.map(item => airQualityService.transformAirQualityData(item)).filter(Boolean);
      };
      
      const transformedData = ensureTransformed(data);
      console.log('✅ [AirQualityContext] Final transformed data:', transformedData?.length, 'records');
      console.log('📦 [AirQualityContext] First transformed item:', transformedData[0]);
      
      // Convert array to object keyed by stationId
      if (isMountedRef.current) {
        const stationMap = {};
        transformedData.forEach(item => {
          // Use stationId field first (newly added), fallback to name-based key
          const stationKey = item.stationId || item.name?.toLowerCase().replace(/\s+/g, '-') || item.id;
          stationMap[stationKey] = item;
          
          // Debug: Log MQTT/External sources
          if (item.sourceType === 'mqtt' || item.sourceType === 'external-http') {
            console.log(`🔍 [AirQualityContext] Found ${item.sourceType} source:`, {
              name: item.name,
              stationId: item.stationId,
              key: stationKey,
              location: item.location
            });
          }
        });
        console.log('✅ [AirQualityContext] Converted to station map:', Object.keys(stationMap));
        console.log('📊 [AirQualityContext] Source type distribution:', 
          Object.values(stationMap).reduce((acc, item) => {
            acc[item.sourceType] = (acc[item.sourceType] || 0) + 1;
            return acc;
          }, {})
        );
        setLatestData(stationMap);
      }
    } catch (err) {
      console.error('❌ [AirQualityContext] Error fetching latest data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch air quality data');
      }
    } finally {
      if (isMountedRef.current) {
        console.log('🏁 [AirQualityContext] Setting isLoading = false');
        setIsLoading(false);
      }
    }
  }, []);

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
      console.error('❌ [AirQualityContext] Error fetching historical data:', err);
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
      console.error('❌ [AirQualityContext] Error fetching location data:', err);
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
      console.log('🔄 [AirQualityContext] Starting fetchAlerts...');
      const data = await airQualityService.getAlerts();
      console.log('✅ [AirQualityContext] fetchAlerts success:', data?.length || 0, 'alerts');
      if (isMountedRef.current) {
        setAlerts(data);
      }
      return data;
    } catch (err) {
      console.error('❌ [AirQualityContext] Error fetching alerts:', err);
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
    // Handler for new data
    const handleNewData = (data) => {
      console.log('📡 [AirQualityContext] New air quality data received:', data);
      
      if (isMountedRef.current) {
        // Extract stationId from data
        const stationId = data.stationId;
        
        if (!stationId) {
          console.warn('⚠️ [AirQualityContext] Received data without stationId:', data);
          return;
        }
        
        setLatestData(prevData => {
          console.log('🔄 [AirQualityContext] Updating station:', stationId);
          
          // Update specific station data
          const updatedData = {
            ...prevData,
            [stationId]: data
          };
          
          console.log('✅ [AirQualityContext] Updated latestData. Station count:', Object.keys(updatedData).length);
          return updatedData;
        });
      }
    };

    // Handler for data updates
    const handleUpdate = (data) => {
      console.log('🔄 [AirQualityContext] Air quality data updated:', data);
      handleNewData(data); // Same logic as new data
    };

    // Handler for alerts
    const handleAlert = (alert) => {
      console.log('⚠️ [AirQualityContext] New alert received:', alert);
      
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
      console.log('📱 [AirQualityContext] Device status changed:', status);
    };

    // Handler for connection status
    const handleConnectionChange = (connected) => {
      console.log('🔌 [AirQualityContext] WebSocket connection status:', connected ? 'Connected' : 'Disconnected');
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

    // Cleanup
    return () => {
      airQualityWebSocket.off('newData', handleNewData);
      airQualityWebSocket.off('update', handleUpdate);
      airQualityWebSocket.off('alert', handleAlert);
      airQualityWebSocket.off('deviceStatusChanged', handleDeviceStatus);
      airQualityWebSocket.off('connectionChanged', handleConnectionChange);
    };
  }, []);

  // Initial data fetch - Only run once on mount
  useEffect(() => {
    console.log('🚀 [AirQualityContext] Initial data fetch on mount');
    
    // Fetch latest data
    const loadInitialData = async () => {
      try {
        console.log('🔄 [AirQualityContext] Starting initial fetchLatestData...');
        setIsLoading(true);
        setError(null);
        
        const data = await airQualityService.getLatestData();
        
        console.log('✅ [AirQualityContext] Initial fetchLatestData success:', data?.length || 0, 'records');
        
        if (isMountedRef.current) {
          setLatestData(data);
        }
      } catch (err) {
        console.error('❌ [AirQualityContext] Error in initial fetch:', err);
        if (isMountedRef.current) {
          setError(err.message || 'Failed to fetch air quality data');
        }
      } finally {
        if (isMountedRef.current) {
          console.log('🏁 [AirQualityContext] Setting isLoading = false');
          setIsLoading(false);
        }
      }
    };
    
    // Fetch alerts
    const loadAlerts = async () => {
      try {
        console.log('🔄 [AirQualityContext] Starting initial fetchAlerts...');
        const data = await airQualityService.getAlerts();
        console.log('✅ [AirQualityContext] Initial fetchAlerts success:', data?.length || 0, 'alerts');
        if (isMountedRef.current) {
          setAlerts(data);
        }
      } catch (err) {
        console.error('❌ [AirQualityContext] Error fetching alerts:', err);
      }
    };
    
    loadInitialData();
    loadAlerts();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const value = {
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
  };

  return (
    <AirQualityContext.Provider value={value}>
      {children}
    </AirQualityContext.Provider>
  );
};

/**
 * Hook to use Air Quality Context
 * @returns {Object} Air Quality data and methods
 */
export const useAirQualityContext = () => {
  const context = useContext(AirQualityContext);
  
  if (!context) {
    throw new Error('useAirQualityContext must be used within AirQualityProvider');
  }
  
  return context;
};

export default AirQualityContext;
