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
import { normalizeStationId, extractStationIdFromNgsiId } from '../utils/stationUtils';

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
   * NOTE: This doesn't actually fetch from API anymore - it returns current state from WebSocket
   */
  const fetchLatestData = useCallback(async () => {
    try {
      console.log('🔄 [AirQualityContext] fetchLatestData called - returning current state (WebSocket data)');
      
      // Convert latestData object to array for compatibility
      const data = Object.values(latestData);
      
      console.log('📊 [AirQualityContext] Current data from state:', {
        count: data.length,
        stationIds: Object.keys(latestData),
        sourceTypes: data.reduce((acc, item) => {
          acc[item.sourceType] = (acc[item.sourceType] || 0) + 1;
          return acc;
        }, {})
      });
      
      // Return current data (already in state from WebSocket)
      return data;
    } catch (err) {
      console.error('❌ [AirQualityContext] Error in fetchLatestData:', err);
      return [];
    }
  }, [latestData]);

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
   * NOTE: This doesn't call API anymore - it filters current state data for high AQI
   */
  const fetchAlerts = useCallback(async () => {
    try {
      console.log('🔄 [AirQualityContext] fetchAlerts called - filtering current data for AQI >= 100');
      
      // Filter current data for high AQI
      const data = Object.values(latestData)
        .filter(item => item.aqi >= 100)
        .map(item => ({
          stationId: item.stationId,
          name: item.name,
          aqi: item.aqi,
          level: item.aqi > 300 ? 'Nguy hại' : item.aqi > 200 ? 'Rất không tốt' : item.aqi > 150 ? 'Không tốt' : 'Nhạy cảm',
          timestamp: item.timestamp || item.dateObserved,
        }));
      
      console.log('✅ [AirQualityContext] fetchAlerts success:', data.length, 'alerts');
      
      if (isMountedRef.current) {
        setAlerts(data);
      }
      
      return data;
    } catch (err) {
      console.error('❌ [AirQualityContext] Error in fetchAlerts:', err);
      return [];
    }
  }, [latestData]);

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
      console.log('📡 [AirQualityContext] Data keys:', Object.keys(data));
      console.log('📡 [AirQualityContext] StationId value:', data.stationId);
      console.log('📡 [AirQualityContext] isMountedRef.current:', isMountedRef.current);
      
      // Force log to appear
      if (data.stationId) {
        console.warn('🚨🚨🚨 [AirQualityContext] ABOUT TO UPDATE STATE WITH STATION:', data.stationId);
      }
      
      if (isMountedRef.current) {
        // Extract stationId from data
        const stationId = data.stationId;
        
        if (!stationId) {
          console.error('❌ [AirQualityContext] Received data WITHOUT stationId!', data);
          return;
        }
        
        console.log('✅ [AirQualityContext] StationId found:', stationId);
        
        setLatestData(prevData => {
          console.log('🔄 [AirQualityContext] Updating station:', stationId);
          console.log('🔄 [AirQualityContext] Previous data keys:', Object.keys(prevData));
          
          // Update specific station data
          const updatedData = {
            ...prevData,
            [stationId]: data
          };
          
          console.log('✅ [AirQualityContext] Updated latestData. Station count:', Object.keys(updatedData).length);
          console.log('✅ [AirQualityContext] Updated data keys:', Object.keys(updatedData));
          console.log('✅ [AirQualityContext] Data for', stationId, ':', updatedData[stationId]);
          console.warn('🎉🎉🎉 [AirQualityContext] STATE UPDATE COMPLETE! Keys:', Object.keys(updatedData).join(', '));
          return updatedData;
        });
        
        console.warn('🏁 [AirQualityContext] setLatestData() called successfully');
      } else {
        console.warn('⚠️ [AirQualityContext] Component not mounted, skipping update');
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
    console.log('🚀 [AirQualityContext] Skipping HTTP fetch - relying on WebSocket data');
    
    // NOTE: We don't need initial HTTP fetch because WebSocket will provide real-time data
    // The backend API has validation issues with empty parameters
    // WebSocket is more reliable and provides real-time updates
    
    // Set initial loading state
    setIsLoading(false);
    
    // Commented out HTTP fetches - WebSocket handles all data
    // const loadInitialData = async () => {
    //   try {
    //     console.log('🔄 [AirQualityContext] Starting initial fetchLatestData...');
    //     setIsLoading(true);
    //     setError(null);
    //     
    //     const data = await airQualityService.getLatestData();
    //     
    //     console.log('✅ [AirQualityContext] Initial fetchLatestData success:', data?.length || 0, 'records');
    //     
    //     if (isMountedRef.current) {
    //       setLatestData(data);
    //     }
    //   } catch (err) {
    //     console.error('❌ [AirQualityContext] Error in initial fetch:', err);
    //     if (isMountedRef.current) {
    //       setError(err.message || 'Failed to fetch air quality data');
    //     }
    //   } finally {
    //     if (isMountedRef.current) {
    //       console.log('🏁 [AirQualityContext] Setting isLoading = false');
    //       setIsLoading(false);
    //     }
    //   }
    // };
    // 
    // // Fetch alerts
    // const loadAlerts = async () => {
    //   try {
    //     console.log('🔄 [AirQualityContext] Starting initial fetchAlerts...');
    //     const data = await airQualityService.getAlerts();
    //     console.log('✅ [AirQualityContext] Initial fetchAlerts success:', data?.length || 0, 'alerts');
    //     if (isMountedRef.current) {
    //       setAlerts(data);
    //     }
    //   } catch (err) {
    //     console.error('❌ [AirQualityContext] Error fetching alerts:', err);
    //   }
    // };
    // 
    // loadInitialData();
    // loadAlerts();
    
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
