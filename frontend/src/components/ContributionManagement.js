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

import React, { useState } from 'react';
import './ContributionManagement.css';
import ContributionUpload from './ContributionUpload';
import ContributionList from './ContributionList';

/**
 * Contribution Management Component
 * Main component for managing air quality data contributions
 * Combines upload and list functionality with tab navigation
 */
const ContributionManagement = ({ user }) => {
  const [contributionTab, setContributionTab] = useState('uploaded-json'); // 'sensor-data' | 'uploaded-json' | 'third-party-api'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sensor form state
  const [sensorData, setSensorData] = useState({
    enableMQTT: false,
    mqttUrl: '',
    mqttTopic: '',
    latitude: '',
    longitude: '',
    height: ''
  });

  /**
   * Handle sensor form input change
   */
  const handleSensorInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSensorData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handle sensor form submit
   */
  const handleSensorSubmit = (e) => {
    e.preventDefault();
    console.log('[ContributionManagement] Sensor data submitted:', sensorData);
    // TODO: Implement sensor connection logic
    alert('Chức năng kết nối sensor đang được phát triển!');
  };

  /**
   * Handle successful upload - refresh list
   */
  const handleUploadSuccess = (data) => {
    try {
      console.log('[ContributionManagement] Upload successful:', data);
      
      // Trigger refresh of list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('[ContributionManagement] Error in handleUploadSuccess:', error);
    }
  };

  return (
    <div className="contribution-management">
      {/* Page Header */}
      <div className="page-header">
        <h1>Đóng góp dữ liệu chất lượng không khí</h1>
        <p className="page-description">
          Cảm ơn bạn đã đóng góp dữ liệu chất lượng không khí! Dữ liệu của bạn giúp cộng đồng
          theo dõi và cải thiện môi trường sống.
        </p>
      </div>

      {/* Contribution Sub-tabs */}
      <div className="contribution-sub-tabs">
        <button
          className={`sub-tab-btn ${contributionTab === 'sensor-data' ? 'active' : ''}`}
          onClick={() => setContributionTab('sensor-data')}
        >
          🌡️ Dữ liệu từ sensor
        </button>
        <button
          className={`sub-tab-btn ${contributionTab === 'uploaded-json' ? 'active' : ''}`}
          onClick={() => setContributionTab('uploaded-json')}
        >
          📤 Đã tải lên JSON
        </button>
        <button
          className={`sub-tab-btn ${contributionTab === 'third-party-api' ? 'active' : ''}`}
          onClick={() => setContributionTab('third-party-api')}
        >
          🔗 API bên thứ 3
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="tab-content-area">
        {contributionTab === 'sensor-data' && (
          <div className="content-area">
            <div className="sensor-form-container">
              <h2 className="form-title">🌡️ Kết nối cảm biến IoT</h2>
              <p className="form-description">
                Kết nối trực tiếp với cảm biến của bạn qua MQTT để tự động thu thập dữ liệu chất lượng không khí.
              </p>

              <form onSubmit={handleSensorSubmit} className="sensor-form">
                {/* MQTT Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3>MQTT</h3>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="enableMQTT"
                        checked={sensorData.enableMQTT}
                        onChange={handleSensorInputChange}
                      />
                      <span>Enable MQTT</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mqttUrl">
                      Url<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="mqttUrl"
                      name="mqttUrl"
                      value={sensorData.mqttUrl}
                      onChange={handleSensorInputChange}
                      disabled={!sensorData.enableMQTT}
                      placeholder="mqtt://broker.example.com:1883"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mqttTopic">
                      Topic<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="mqttTopic"
                      name="mqttTopic"
                      value={sensorData.mqttTopic}
                      onChange={handleSensorInputChange}
                      disabled={!sensorData.enableMQTT}
                      placeholder="sensors/airquality"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h3>Vị trí cảm biến</h3>
                  </div>

                  <div className="location-grid">
                    <div className="form-group">
                      <label htmlFor="latitude">Latitude</label>
                      <input
                        type="number"
                        id="latitude"
                        name="latitude"
                        value={sensorData.latitude}
                        onChange={handleSensorInputChange}
                        step="0.000001"
                        placeholder="21.001118"
                      />
                      {sensorData.latitude && <span className="validation-icon">✓</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="longitude">Longitude</label>
                      <input
                        type="number"
                        id="longitude"
                        name="longitude"
                        value={sensorData.longitude}
                        onChange={handleSensorInputChange}
                        step="0.000001"
                        placeholder="105.747091"
                      />
                      {sensorData.longitude && <span className="validation-icon">✓</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="height">Height (GPS)</label>
                      <input
                        type="number"
                        id="height"
                        name="height"
                        value={sensorData.height}
                        onChange={handleSensorInputChange}
                        step="0.1"
                        placeholder="0"
                      />
                      {sensorData.height && <span className="validation-icon">✓</span>}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Kết nối cảm biến
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {contributionTab === 'uploaded-json' && (
          <div className="content-area">
            <ContributionUpload onUploadSuccess={handleUploadSuccess} user={user} />
            <div style={{ marginTop: '30px' }}>
              <h2 style={{ marginBottom: '20px', color: '#667eea' }}>Dữ liệu đã đóng góp</h2>
              <ContributionList user={user} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}

        {contributionTab === 'third-party-api' && (
          <div className="coming-soon">
            <h3>🔗 API bên thứ 3</h3>
            <p>Chức năng này đang được phát triển. Bạn sẽ có thể kết nối với các API bên ngoài để tự động thu thập dữ liệu.</p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="info-card">
          <h3>Về Contributions</h3>
          <p>
            Contributions là chức năng cho phép bất kỳ ai cũng có thể đóng góp dữ liệu chất lượng
            không khí theo chuẩn NGSI-LD. Dữ liệu của bạn sẽ được lưu trữ và hiển thị công khai
            để mọi người có thể xem và sử dụng.
          </p>
        </div>

        <div className="info-card">
          <h3>Yêu cầu dữ liệu</h3>
          <ul>
            <li>Tuân thủ chuẩn <strong>NGSI-LD</strong> của ETSI</li>
            <li>Các trường bắt buộc: <code>id</code>, <code>type</code>, <code>@context</code>, <code>dateObserved</code></li>
            <li>Định dạng JSON hợp lệ</li>
            <li>Kích thước file tối đa: <strong>1MB</strong></li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Quyền riêng tư</h3>
          <p>
            Thông tin người đóng góp (tên, email) là <strong>tùy chọn</strong>. Nếu không cung cấp,
            đóng góp của bạn sẽ được hiển thị dưới dạng <strong>Ẩn danh</strong>. Dữ liệu địa lý
            và chất lượng không khí sẽ được công khai để phục vụ cộng đồng.
          </p>
        </div>

        <div className="info-card">
          <h3>Gợi ý sử dụng</h3>
          <ul>
            <li>🔹 Sử dụng <strong>Upload File</strong> nếu bạn có file JSON sẵn</li>
            <li>🔹 Sử dụng <strong>Paste JSON</strong> để test nhanh hoặc gửi dữ liệu đơn lẻ</li>
            <li>🔹 Click <strong>"Tải JSON mẫu"</strong> để xem cấu trúc dữ liệu chuẩn</li>
            <li>🔹 Sử dụng <strong>"Validate"</strong> để kiểm tra JSON trước khi gửi</li>
          </ul>
        </div>
      </div>

      {/* Statistics (Optional) */}
      <div className="statistics-section">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Tổng đóng góp</div>
            <div className="stat-value">—</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Số trạm</div>
            <div className="stat-value">—</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Người đóng góp</div>
            <div className="stat-value">—</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionManagement;
