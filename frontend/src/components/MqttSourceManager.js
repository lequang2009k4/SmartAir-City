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
import { externalMqttService } from '../services';
import { getAll } from '../services/api/airQualityService';
import LoadingSpinner from './LoadingSpinner';
import './MqttSourceManager.css';

/**
 * MQTT Source Manager Component
 * Manages external MQTT broker connections for sensor data contribution
 */
const MqttSourceManager = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brokerHost: '',
    brokerPort: 1883,
    username: '',
    password: '',
    useTls: false,
    topic: '',
    latitude: '',
    longitude: ''
  });

  // UI state
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load sources on mount
  useEffect(() => {
    loadSources();
  }, []);

  /**
   * Load all MQTT sources
   */
  const loadSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await externalMqttService.getAll();
      
      // Fetch record count for each source
      const sourcesWithCount = await Promise.all(
        (data || []).map(async (source) => {
          try {
            // Get ALL records for this stationId to count them (no limit)
            const records = await getAll(null, source.stationId, true);
            const recordCount = Array.isArray(records) ? records.length : 0;
            console.log(`📊 [${source.stationId}] Record count:`, recordCount);
            return { ...source, recordCount };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch record count for ${source.stationId}:`, err);
            return { ...source, recordCount: 0 };
          }
        })
      );
      
      setSources(sourcesWithCount);
    } catch (err) {
      setError('Không thể tải danh sách MQTT sources: ' + (err.message || 'Lỗi không xác định'));
      console.error('Load sources error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Test MQTT connection
   */
  const handleTestConnection = async () => {
    try {
      setTestLoading(true);
      setError(null);
      setSuccess(null);

      const testData = {
        brokerHost: formData.brokerHost,
        brokerPort: parseInt(formData.brokerPort),
        username: formData.username || null,
        password: formData.password || null,
        useTls: formData.useTls,
        topic: formData.topic
      };

      const result = await externalMqttService.testConnection(testData);
      setSuccess('✅ Kết nối thành công! ' + (result.message || ''));
    } catch (err) {
      setError('❌ Test thất bại: ' + (err.message || 'Không thể kết nối'));
    } finally {
      setTestLoading(false);
    }
  };

  /**
   * Create new MQTT source
   */
  const handleCreateSource = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.brokerHost || !formData.topic || !formData.latitude || !formData.longitude) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const sourceData = {
        name: formData.name,
        brokerHost: formData.brokerHost,
        brokerPort: parseInt(formData.brokerPort),
        username: formData.username || null,
        password: formData.password || null,
        useTls: formData.useTls,
        topic: formData.topic,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      await externalMqttService.create(sourceData);
      setSuccess('✅ Đăng ký MQTT Broker thành công!');
      
      // Reset form
      setFormData({
        name: '',
        brokerHost: '',
        brokerPort: 1883,
        username: '',
        password: '',
        useTls: false,
        topic: '',
        latitude: '',
        longitude: ''
      });

      // Reload sources
      loadSources();
    } catch (err) {
      setError('❌ Lỗi đăng ký: ' + (err.message || 'Không thể tạo source'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activate MQTT source
   */
  const handleActivate = async (id) => {
    try {
      setLoading(true);
      await externalMqttService.activate(id);
      setSuccess('✅ Đã kích hoạt MQTT source');
      loadSources();
    } catch (err) {
      setError('❌ Lỗi kích hoạt: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deactivate MQTT source
   */
  const handleDeactivate = async (id) => {
    try {
      setLoading(true);
      await externalMqttService.deactivate(id);
      setSuccess('⏸️ Đã tạm dừng MQTT source');
      loadSources();
    } catch (err) {
      setError('❌ Lỗi tạm dừng: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete MQTT source
   */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa source "${name}"?`)) return;

    try {
      setLoading(true);
      await externalMqttService.deleteSource(id);
      setSuccess('🗑️ Đã xóa MQTT source');
      loadSources();
    } catch (err) {
      setError('❌ Lỗi xóa: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mqtt-source-manager">
      {/* Header */}
      <div className="manager-header">
        <h2>🌐 Đăng ký MQTT Broker</h2>
        <p>Kết nối MQTT broker của bạn để đóng góp dữ liệu chất lượng không khí từ sensor</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button className="alert-close" onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleCreateSource} className="mqtt-form">
        <div className="form-section">
          <h3>📝 Thông tin MQTT Broker</h3>
          
          <div className="form-group">
            <label>
              Tên nguồn dữ liệu <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="VD: My Home Sensor Station"
              required
            />
            <small>📌 Station ID sẽ tự động tạo từ tên này</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Broker Host/IP <span className="required">*</span>
              </label>
              <input
                type="text"
                name="brokerHost"
                value={formData.brokerHost}
                onChange={handleInputChange}
                placeholder="VD: broker.hivemq.com hoặc 192.168.1.100"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Port <span className="required">*</span>
              </label>
              <input
                type="number"
                name="brokerPort"
                value={formData.brokerPort}
                onChange={handleInputChange}
                placeholder="1883 (không TLS) hoặc 8883 (TLS)"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Để trống nếu không cần"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Để trống nếu không cần"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="useTls"
                checked={formData.useTls}
                onChange={handleInputChange}
              />
              Sử dụng TLS/SSL (không tick cho port 1883)
            </label>
          </div>

          <div className="form-group">
            <label>
              Topic <span className="required">*</span>
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="VD: sensors/airquality/#"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>📍 Vị trí cảm biến</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                Latitude (vĩ độ) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="VD: 21.028511"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Longitude (kinh độ) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="VD: 105.804817"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testLoading || !formData.brokerHost || !formData.topic}
          >
            {testLoading ? '🔄 Đang test...' : '🔌 Test Connection'}
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔄 Đang đăng ký...' : '✅ Đăng ký Broker'}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadSources}
            disabled={loading}
          >
            🔄 Refresh List
          </button>
        </div>
      </form>

      {/* Sources List */}
      <div className="sources-section">
        <h3>📋 Danh sách MQTT Sources</h3>
        
        {loading && <LoadingSpinner />}
        
        {!loading && sources.length === 0 && (
          <div className="empty-state">
            <p>Chưa có MQTT source nào</p>
          </div>
        )}

        {!loading && sources.length > 0 && (
          <div className="sources-grid">
            {sources.map(source => (
              <div key={source.id} className={`source-card ${source.isActive ? 'active' : 'inactive'}`}>
                <div className="source-header">
                  <h4>
                    {source.name} {source.isActive ? '🟢' : '🔴'}
                  </h4>
                </div>
                
                <div className="source-info">
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
                      onClick={() => handleDeactivate(source.id)}
                      disabled={loading}
                    >
                      ⏸️ Tạm dừng
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleActivate(source.id)}
                      disabled={loading}
                    >
                      ▶️ Kích hoạt
                    </button>
                  )}
                  
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(source.id, source.name)}
                    disabled={loading}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MqttSourceManager;
