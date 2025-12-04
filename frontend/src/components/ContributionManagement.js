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
import ContributionRecordCard from './ContributionRecordCard';

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

  // Sensor data state (fake data for now)
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensorRecordsList, setSensorRecordsList] = useState([]);
  const [viewedData, setViewedData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Fake sensor data
  const fakeSensorsData = {
    totalSensors: 8,
    totalRecords: 2458,
    sensors: [
      {
        id: 'SEN001',
        name: 'Sensor Hà Nội - Hoàn Kiếm',
        location: 'Quận Hoàn Kiếm, Hà Nội',
        latitude: 21.028511,
        longitude: 105.804817,
        recordCount: 542,
        lastUpdate: '2025-12-04T10:30:00Z',
        status: 'active'
      },
      {
        id: 'SEN002',
        name: 'Sensor TP.HCM - Quận 1',
        location: 'Quận 1, TP. Hồ Chí Minh',
        latitude: 10.762622,
        longitude: 106.660172,
        recordCount: 438,
        lastUpdate: '2025-12-04T10:25:00Z',
        status: 'active'
      },
      {
        id: 'SEN003',
        name: 'Sensor Đà Nẵng - Hải Châu',
        location: 'Quận Hải Châu, Đà Nẵng',
        latitude: 16.047079,
        longitude: 108.206230,
        recordCount: 385,
        lastUpdate: '2025-12-04T10:20:00Z',
        status: 'active'
      },
      {
        id: 'SEN004',
        name: 'Sensor Hà Nội - Cầu Giấy',
        location: 'Quận Cầu Giấy, Hà Nội',
        latitude: 21.033333,
        longitude: 105.783333,
        recordCount: 312,
        lastUpdate: '2025-12-04T09:45:00Z',
        status: 'active'
      },
      {
        id: 'SEN005',
        name: 'Sensor Hải Phòng - Ngô Quyền',
        location: 'Quận Ngô Quyền, Hải Phòng',
        latitude: 20.865139,
        longitude: 106.683830,
        recordCount: 289,
        lastUpdate: '2025-12-04T10:15:00Z',
        status: 'active'
      },
      {
        id: 'SEN006',
        name: 'Sensor Cần Thơ - Ninh Kiều',
        location: 'Quận Ninh Kiều, Cần Thơ',
        latitude: 10.045162,
        longitude: 105.746857,
        recordCount: 267,
        lastUpdate: '2025-12-04T08:30:00Z',
        status: 'inactive'
      },
      {
        id: 'SEN007',
        name: 'Sensor Huế - Thành phố',
        location: 'TP. Huế, Thừa Thiên Huế',
        latitude: 16.463713,
        longitude: 107.590866,
        recordCount: 145,
        lastUpdate: '2025-12-04T10:00:00Z',
        status: 'active'
      },
      {
        id: 'SEN008',
        name: 'Sensor Nha Trang - Trung tâm',
        location: 'TP. Nha Trang, Khánh Hòa',
        latitude: 12.238791,
        longitude: 109.196749,
        recordCount: 80,
        lastUpdate: '2025-12-03T22:10:00Z',
        status: 'inactive'
      }
    ]
  };

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

  /**
   * Handle sensor card click - show sensor records
   */
  const handleSensorClick = (sensor) => {
    setSelectedSensor(sensor);
    // Generate fake records for this sensor
    const fakeRecords = generateFakeSensorRecords(sensor);
    setSensorRecordsList(fakeRecords);
  };

  /**
   * Generate fake sensor records
   */
  const generateFakeSensorRecords = (sensor) => {
    const records = [];
    const recordCount = sensor.recordCount;
    const numRecords = Math.min(recordCount, 10); // Show max 10 records
    
    for (let i = 0; i < numRecords; i++) {
      const date = new Date();
      date.setHours(date.getHours() - i * 2); // Each record 2 hours apart
      
      records.push({
        id: `${sensor.id}_REC${String(i + 1).padStart(4, '0')}`,
        sensorId: sensor.id,
        timestamp: date.toISOString(),
        temperature: (20 + Math.random() * 15).toFixed(1),
        humidity: (50 + Math.random() * 30).toFixed(1),
        pm25: (10 + Math.random() * 80).toFixed(1),
        pm10: (15 + Math.random() * 100).toFixed(1),
        aqi: Math.floor(50 + Math.random() * 100)
      });
    }
    
    return records;
  };

  /**
   * Handle view sensor record data
   */
  const handleViewSensorData = (record) => {
    setViewedData(record);
    setShowModal(true);
  };

  /**
   * Handle download sensor record
   */
  const handleDownloadSensorRecord = (record) => {
    const dataStr = JSON.stringify(record, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sensor_record_${record.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
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

            {/* Sensor Data List Below Form */}
            <div className="sensor-data-section">
              <h2 className="section-title">📡 Dữ liệu từ sensor</h2>
              
              {/* Sensors List */}
              {!selectedSensor && (
                <>
                  <div className="stats-summary">
                    <div className="stat-box">
                      <div className="stat-icon">🌡️</div>
                      <div className="stat-info">
                        <div className="stat-label">Tổng số sensor</div>
                        <div className="stat-value">{fakeSensorsData.totalSensors}</div>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">📊</div>
                      <div className="stat-info">
                        <div className="stat-label">Tổng dữ liệu</div>
                        <div className="stat-value">{fakeSensorsData.totalRecords}</div>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">✅</div>
                      <div className="stat-info">
                        <div className="stat-label">Đang hoạt động</div>
                        <div className="stat-value">{fakeSensorsData.sensors.filter(s => s.status === 'active').length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="sensors-grid">
                    {fakeSensorsData.sensors.map(sensor => (
                      <div
                        key={sensor.id}
                        className={`sensor-card ${sensor.status}`}
                        onClick={() => handleSensorClick(sensor)}
                      >
                        <div className="sensor-header">
                          <h3>{sensor.name}</h3>
                          <span className={`status-badge ${sensor.status}`}>
                            {sensor.status === 'active' ? '🟢 Hoạt động' : '⚫ Offline'}
                          </span>
                        </div>
                        <div className="sensor-info">
                          <p className="sensor-location">📍 {sensor.location}</p>
                          <p className="sensor-coords">
                            📌 {sensor.latitude.toFixed(6)}, {sensor.longitude.toFixed(6)}
                          </p>
                        </div>
                        <div className="sensor-stats">
                          <div className="stat-item">
                            <span className="stat-label">Dữ liệu</span>
                            <span className="stat-value">{sensor.recordCount}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Cập nhật</span>
                            <span className="stat-value">{new Date(sensor.lastUpdate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sensor Records List */}
              {selectedSensor && (
                <>
                  <div className="back-button-container">
                    <button className="back-btn" onClick={() => setSelectedSensor(null)}>
                      ← Quay lại danh sách sensor
                    </button>
                  </div>

                  <div className="sensor-detail-header">
                    <h2>{selectedSensor.name}</h2>
                    <p>📍 {selectedSensor.location}</p>
                    <p className="sensor-stats-text">
                      Tổng {selectedSensor.recordCount} bản ghi • Hiển thị {sensorRecordsList.length} bản ghi gần nhất
                    </p>
                  </div>

                  <div className="contributions-list">
                    {sensorRecordsList.map(record => (
                      <ContributionRecordCard
                        key={record.id}
                        contribution={{
                          id: record.id,
                          timestamp: record.timestamp,
                          location: selectedSensor.location,
                          data: {
                            temperature: record.temperature,
                            humidity: record.humidity,
                            pm25: record.pm25,
                            pm10: record.pm10,
                            aqi: record.aqi
                          }
                        }}
                        onDownload={() => handleDownloadSensorRecord(record)}
                        onViewData={() => handleViewSensorData(record)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* JSON Modal */}
            {showModal && viewedData && (
              <div className="json-modal-overlay" onClick={() => setShowModal(false)}>
                <div className="json-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="json-modal-header">
                    <h3>📊 Sensor Data - {viewedData.id}</h3>
                    <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                  </div>
                  <div className="json-modal-body">
                    <pre>{JSON.stringify(viewedData, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
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
