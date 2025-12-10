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

import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getAll as getAllAirQuality } from '../services/api/airQualityService';
import { externalMqttService, externalSourcesService } from '../services';
import './AdminSourcesManager.css';

/**
 * Admin Sources Manager - Dropdown menu for managing MQTT and External sources
 * Only visible to admin users
 */
const AdminSourcesManager = () => {
  const [activeTab, setActiveTab] = useState('mqtt'); // 'mqtt' | 'external'
  const [mqttSources, setMqttSources] = useState([]);
  const [externalSources, setExternalSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load MQTT sources with record counts
   */
  const loadMqttSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await externalMqttService.getAll();
      
      // Fetch record count for each source
      const sourcesWithCount = await Promise.all(
        (data || []).map(async (source) => {
          try {
            const records = await getAllAirQuality(null, source.stationId, true);
            const recordCount = Array.isArray(records) ? records.length : 0;
            return { ...source, recordCount };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch record count for ${source.stationId}:`, err);
            return { ...source, recordCount: 0 };
          }
        })
      );
      
      setMqttSources(sourcesWithCount);
    } catch (err) {
      setError('Không thể tải danh sách MQTT sources: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load External sources with record counts
   */
  const loadExternalSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await externalSourcesService.getAll();
      
      // Fetch record count for each source
      const sourcesWithCount = await Promise.all(
        (data || []).map(async (source) => {
          try {
            const records = await getAllAirQuality(null, source.stationId, true);
            const recordCount = Array.isArray(records) ? records.length : 0;
            return { ...source, recordCount };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch record count for ${source.stationId}:`, err);
            return { ...source, recordCount: 0 };
          }
        })
      );
      
      setExternalSources(sourcesWithCount);
    } catch (err) {
      setError('Không thể tải danh sách External sources: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'mqtt') {
      loadMqttSources();
    } else {
      loadExternalSources();
    }
  };

  // Load initial data
  useEffect(() => {
    loadMqttSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle delete MQTT source
   */
  const handleDeleteMqtt = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa MQTT source "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await externalMqttService.deleteSource(id);
      await loadMqttSources();
    } catch (err) {
      setError('Không thể xóa MQTT source: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete External source
   */
  const handleDeleteExternal = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa External source "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await externalSourcesService.deleteSource(id);
      await loadExternalSources();
    } catch (err) {
      setError('Không thể xóa External source: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle activate/deactivate MQTT
   */
  const handleToggleMqttStatus = async (id, isActive) => {
    try {
      setLoading(true);
      if (isActive) {
        await externalMqttService.deactivate(id);
      } else {
        await externalMqttService.activate(id);
      }
      await loadMqttSources();
    } catch (err) {
      setError('Không thể cập nhật trạng thái: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle reactivate External
   */
  const handleReactivateExternal = async (id) => {
    try {
      setLoading(true);
      await externalSourcesService.reactivate(id);
      await loadExternalSources();
    } catch (err) {
      setError('Không thể kích hoạt lại: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-sources-manager">
      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'mqtt' ? 'active' : ''}`}
          onClick={() => handleTabChange('mqtt')}
        >
          📡 MQTT Sources
        </button>
        <button
          className={`admin-tab ${activeTab === 'external' ? 'active' : ''}`}
          onClick={() => handleTabChange('external')}
        >
          🌐 External API Sources
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && <LoadingSpinner />}

          {/* MQTT Sources Tab */}
          {activeTab === 'mqtt' && !loading && (
            <div className="sources-list">
              {mqttSources.length === 0 && (
                <div className="empty-state">
                  <p>Chưa có MQTT source nào</p>
                </div>
              )}

              {mqttSources.length > 0 && (
                <div className="sources-grid">
                  {mqttSources.map(source => (
                    <div key={source.id} className={`source-card ${source.isActive ? 'active' : 'inactive'}`}>
                      <div className="source-header">
                        <h4>
                          {source.name}
                          <span className={`status-badge ${source.isActive ? 'active' : 'inactive'}`}>
                            {source.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </h4>
                      </div>
                      
                      <div className="source-info">
                        <p><strong>Station ID:</strong> {source.stationId}</p>
                        <p><strong>Broker:</strong> {source.brokerHost}:{source.brokerPort}</p>
                        <p><strong>Topic:</strong> {source.topic}</p>
                        <p><strong>Vị trí:</strong> {source.latitude}, {source.longitude}</p>
                        <p><strong>Bản ghi:</strong> {source.recordCount !== undefined ? source.recordCount : (source.messageCount || 0)}</p>
                        <p><strong>Lần tin nhắn cuối:</strong> {source.lastMessageAt ? new Date(source.lastMessageAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
                        {source.lastError && (
                          <p className="error-text"><strong>Error:</strong> {source.lastError}</p>
                        )}
                      </div>

                      <div className="source-actions">
                        {source.isActive ? (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleToggleMqttStatus(source.id, true)}
                            disabled={loading}
                          >
                            Tạm dừng
                          </button>
                        ) : (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleToggleMqttStatus(source.id, false)}
                            disabled={loading}
                          >
                            Kích hoạt
                          </button>
                        )}
                        
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteMqtt(source.id, source.name)}
                          disabled={loading}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* External Sources Tab */}
          {activeTab === 'external' && !loading && (
            <div className="sources-list">
              {externalSources.length === 0 && (
                <div className="empty-state">
                  <p>Chưa có external source nào</p>
                </div>
              )}

              {externalSources.length > 0 && (
                <div className="sources-grid">
                  {externalSources.map(source => (
                    <div key={source.id} className={`source-card ${source.isActive ? 'active' : 'inactive'}`}>
                      <div className="source-header">
                        <h4>
                          {source.name}
                          <span className={`status-badge ${source.isActive ? 'active' : 'inactive'}`}>
                            {source.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </h4>
                        <span className="format-badge">
                          {source.isNGSILD ? 'NGSI-LD' : 'Custom JSON'}
                        </span>
                      </div>
                      
                      <div className="source-info">
                        <p><strong>Station ID:</strong> {source.stationId}</p>
                        <p><strong>API URL:</strong> <a href={source.apiUrl} target="_blank" rel="noopener noreferrer">{source.apiUrl}</a></p>
                        <p><strong>Vị trí:</strong> {source.latitude}, {source.longitude}</p>
                        <p><strong>Chu kỳ:</strong> {source.intervalMinutes} phút</p>
                        <p><strong>Bản ghi:</strong> {source.recordCount !== undefined ? source.recordCount : '...'}</p>
                        <p><strong>Lần lấy cuối:</strong> {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
                        {source.lastError && (
                          <p className="error-text"><strong>Error:</strong> {source.lastError}</p>
                        )}
                      </div>

                      <div className="source-actions">
                        {!source.isActive && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleReactivateExternal(source.id)}
                            disabled={loading}
                          >
                            Reactivate
                          </button>
                        )}
                        
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteExternal(source.id, source.name)}
                          disabled={loading}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
    </div>
  );
};

export default AdminSourcesManager;
