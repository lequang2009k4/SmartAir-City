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

import { useState, useEffect, useCallback, useRef } from 'react';
import { devicesService } from '../services';

/**
 * Custom hook for Device management
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto fetch devices on mount (default: true)
 * @param {number} options.refreshInterval - Auto refresh interval in ms (default: null)
 * @returns {Object} Devices data and methods
 */
const useDevices = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = null
  } = options;

  // State management
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const refreshTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch all devices
   */
  const fetchDevices = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await devicesService.getAllDevices(params);
      
      if (isMountedRef.current) {
        setDevices(data);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching devices:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch devices');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Get device by ID
   */
  const getDevice = useCallback(async (deviceId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await devicesService.getDeviceById(deviceId);
      
      if (isMountedRef.current) {
        setCurrentDevice(data);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching device:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch device');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Create new device
   */
  const createDevice = useCallback(async (deviceData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newDevice = await devicesService.createDevice(deviceData);
      
      if (isMountedRef.current) {
        // Add new device to the list
        setDevices(prevDevices => [...prevDevices, newDevice]);
      }
      
      return newDevice;
    } catch (err) {
      console.error('Error creating device:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to create device');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Update device
   */
  const updateDevice = useCallback(async (deviceId, deviceData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedDevice = await devicesService.updateDevice(deviceId, deviceData);
      
      if (isMountedRef.current) {
        // Update device in the list
        setDevices(prevDevices =>
          prevDevices.map(device =>
            device.id === deviceId ? updatedDevice : device
          )
        );
        
        // Update current device if it's the same
        if (currentDevice?.id === deviceId) {
          setCurrentDevice(updatedDevice);
        }
      }
      
      return updatedDevice;
    } catch (err) {
      console.error('Error updating device:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to update device');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentDevice]);

  /**
   * Delete device
   */
  const deleteDevice = useCallback(async (deviceId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await devicesService.deleteDevice(deviceId);
      
      if (isMountedRef.current) {
        // Remove device from the list
        setDevices(prevDevices =>
          prevDevices.filter(device => device.id !== deviceId)
        );
        
        // Clear current device if it's the deleted one
        if (currentDevice?.id === deviceId) {
          setCurrentDevice(null);
        }
      }
    } catch (err) {
      console.error('Error deleting device:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to delete device');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentDevice]);

  /**
   * Refresh devices list
   */
  const refresh = useCallback(async () => {
    await fetchDevices();
  }, [fetchDevices]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear current device
   */
  const clearCurrentDevice = useCallback(() => {
    setCurrentDevice(null);
  }, []);

  // Initial data fetch - Only run once on mount
  useEffect(() => {
    if (autoFetch) {
      console.log('🚀 [useDevices] Initial data fetch on mount');
      
      const loadInitialDevices = async () => {
        try {
          console.log('🔄 [useDevices] Starting initial fetchDevices...');
          setIsLoading(true);
          setError(null);
          
          const data = await devicesService.getAllDevices();
          
          console.log('✅ [useDevices] Initial fetchDevices success:', data?.length || 0, 'devices');
          
          if (isMountedRef.current) {
            setDevices(data);
          }
        } catch (err) {
          console.error('❌ [useDevices] Error in initial fetch:', err);
          if (isMountedRef.current) {
            setError(err.message || 'Failed to fetch devices');
          }
        } finally {
          if (isMountedRef.current) {
            console.log('🏁 [useDevices] Setting isLoading = false');
            setIsLoading(false);
          }
        }
      };
      
      loadInitialDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only depend on autoFetch, not fetchDevices

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
    devices,
    currentDevice,
    
    // States
    isLoading,
    error,
    
    // Methods
    fetchDevices,
    getDevice,
    createDevice,
    updateDevice,
    deleteDevice,
    refresh,
    clearError,
    clearCurrentDevice,
    
    // Computed
    devicesCount: devices.length,
    hasDevices: devices.length > 0,
  };
};

export default useDevices;
