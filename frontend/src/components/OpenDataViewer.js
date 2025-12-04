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

import React, { useState, useEffect } from "react";
import { useAirQualityContext } from "../contexts/AirQualityContext";
import contributionsService from "../services/api/contributionsService";
import { getAll, getLatest, getHistory, downloadAirQuality, downloadHistory } from "../services/api/airQualityService";
import ContributorCard from "./ContributorCard";
import ContributionRecordCard from "./ContributionRecordCard";
import "./OpenDataViewer.css";

/**
 * Open Data Viewer Component
 * Displays Air Quality open data and public contributions
 */
const OpenDataViewer = () => {
  // Main tab is always 'contributions' now
  const [activeSubTab, setActiveSubTab] = useState('contributions');
  
  // Sub-tab within Contributions (sensor-data, uploaded-json, third-party-api)
  const [contributionTab, setContributionTab] = useState('uploaded-json');
  
  // Sensor form state
  const [sensorData, setSensorData] = useState({
    enableMQTT: false,
    mqttUrl: '',
    mqttTopic: '',
    latitude: '',
    longitude: '',
    height: ''
  });
  
  // Air Quality API state
  const [showRaw, setShowRaw] = useState(false);
  
  // Air Quality Query state
  const [queryType, setQueryType] = useState('all'); // 'all' or 'history' or 'latest'
  const [queryParams, setQueryParams] = useState({
    stationId: '',
    limit: 50,
    from: '',
    to: '',
  });
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  // Get data from Air Quality context (shared state)
  const {
    latestData: airQualityData,
    isLoading,
    error,
  } = useAirQualityContext();
  
  // Contributions state
  const [contributorsData, setContributorsData] = useState(null);
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [contributionsList, setContributionsList] = useState([]);
  const [viewedData, setViewedData] = useState(null);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [contributionsError, setContributionsError] = useState(null);
  const [showContributionsModal, setShowContributionsModal] = useState(false);

  // Sensor data state (fake data for now)
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensorRecordsList, setSensorRecordsList] = useState([]);
  
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

  // Load public contributors on mount
  useEffect(() => {
    if (activeSubTab === 'contributions') {
      loadPublicContributors();
    }
  }, [activeSubTab]);

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
    console.log('[OpenDataViewer] Sensor data submitted:', sensorData);
    // TODO: Implement sensor connection logic
    alert('Chức năng kết nối sensor đang được phát triển!');
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
    setShowContributionsModal(true);
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

  // Load contributors from API
  const loadPublicContributors = async () => {
    setLoadingContributions(true);
    setContributionsError(null);
    
    try {
      const result = await contributionsService.getPublicStats();
      if (result.success) {
        // Fix: contributionCount from backend is wrong (total records instead of upload count)
        // Fetch actual contribution lists to get correct upload count
        const contributors = result.data.contributors || [];
        const contributorsWithCorrectCount = await Promise.all(
          contributors.map(async (contributor) => {
            try {
              const listResult = await contributionsService.getContributionList(contributor.email);
              return {
                ...contributor,
                contributionCount: listResult.success ? (listResult.contributions?.length || 0) : contributor.contributionCount,
              };
            } catch {
              return contributor;
            }
          })
        );
        
        setContributorsData({
          ...result.data,
          contributors: contributorsWithCorrectCount,
        });
      } else {
        setContributionsError(result.error || 'Không thể tải dữ liệu contributors');
      }
    } catch (err) {
      setContributionsError('Lỗi kết nối API');
    } finally {
      setLoadingContributions(false);
    }
  };

  // Handle contributor card click
  const handleContributorClick = async (contributor) => {
    setSelectedContributor(contributor);
    setViewedData(null); // Reset viewed data
    setShowContributionsModal(true); // Open modal
    setLoadingContributions(true);
    setContributionsError(null);

    try {
      const result = await contributionsService.getContributionList(contributor.email);
      if (result.success) {
        setContributionsList(result.contributions || []);
      } else {
        setContributionsError(result.error || 'Không thể tải danh sách contributions');
      }
    } catch (err) {
      setContributionsError('Lỗi kết nối API');
    } finally {
      setLoadingContributions(false);
    }
  };

  // Handle download contribution
  const handleDownloadContribution = async (contributionId) => {
    const result = await contributionsService.downloadContribution(contributionId);
    if (!result.success) {
      alert(`Lỗi tải xuống: ${result.error}`);
    }
  };

  // Handle close contributions modal
  const handleCloseContributionsModal = () => {
    setShowContributionsModal(false);
    setSelectedContributor(null);
    setContributionsList([]);
    setViewedData(null);
  };

  // Handle view data
  const handleViewData = async (contributionId) => {
    setLoadingContributions(true);
    setContributionsError(null);

    try {
      const result = await contributionsService.getLatestByContributionId(contributionId, 100);
      if (result.success) {
        setViewedData({
          contributionId,
          records: result.records || [],
        });
      } else {
        setContributionsError(result.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      setContributionsError('Lỗi kết nối API');
    } finally {
      setLoadingContributions(false);
    }
  };

  // Handle Air Quality Query
  const handleQuerySubmit = async () => {
    setQueryLoading(true);
    setQueryError(null);
    setQueryResults(null);

    try {
      let results;
      
      if (queryType === 'latest') {
        // Query latest record
        const stationId = queryParams.stationId.trim() || null;
        if (!stationId) {
          setQueryError('Vui lòng nhập Station ID để lấy dữ liệu mới nhất');
          setQueryLoading(false);
          return;
        }
        results = await getLatest(stationId);
        // Wrap single result in array for consistent display
        results = results ? [results] : [];
      } else if (queryType === 'all') {
        // Query all records
        const limit = parseInt(queryParams.limit) || 50;
        const stationId = queryParams.stationId.trim() || null;
        results = await getAll(limit, stationId, true);
      } else {
        // Query history
        if (!queryParams.from || !queryParams.to) {
          setQueryError('Vui lòng nhập thời gian bắt đầu và kết thúc');
          setQueryLoading(false);
          return;
        }
        
        const stationId = queryParams.stationId.trim() || null;
        results = await getHistory(queryParams.from, queryParams.to, stationId, true);
      }

      setQueryResults(results || []);
    } catch (err) {
      setQueryError(err.message || 'Lỗi khi query dữ liệu');
    } finally {
      setQueryLoading(false);
    }
  };

  // Handle download
  const handleDownloadQuery = async () => {
    try {
      let result;
      
      if (queryType === 'all') {
        const limit = parseInt(queryParams.limit) || 50;
        const stationId = queryParams.stationId.trim() || null;
        result = await downloadAirQuality(stationId, limit);
      } else {
        if (!queryParams.from || !queryParams.to) {
          alert('Vui lòng nhập thời gian bắt đầu và kết thúc');
          return;
        }
        
        const stationId = queryParams.stationId.trim() || null;
        result = await downloadHistory(queryParams.from, queryParams.to, stationId);
      }

      if (!result.success) {
        alert(`Lỗi tải xuống: ${result.error}`);
      }
    } catch (err) {
      alert(`Lỗi tải xuống: ${err.message}`);
    }
  };

  // Get ONLY the first record as a sample for developers
  const sampleData = Array.isArray(airQualityData) 
    ? (airQualityData.length > 0 ? [airQualityData[0]] : [])
    : (Object.keys(airQualityData || {}).length > 0 
        ? [Object.values(airQualityData)[0]] 
        : []);

  // Clean data for display - remove transformation artifacts
  const cleanData = (data) => {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
      // If showing raw NGSI-LD format
      if (showRaw && item._raw) {
        return item._raw;
      }
      
      // Show cleaned transformed data (remove nested pollutants and _raw)
      const { pollutants, _raw, ...cleanItem } = item;
      
      // Remove temperature/humidity if they are default fallback values
      if (cleanItem.temperature === 25 && cleanItem.humidity === 60) {
        delete cleanItem.temperature;
        delete cleanItem.humidity;
      }
      
      return cleanItem;
    });
  };

  const displayData = cleanData(sampleData);

  return (
    <div className="open-data-viewer">
      {/* Page Header */}
      <div className="page-header">
        <h1>📊 Dữ liệu đóng góp</h1>
        <p>Dữ liệu chất lượng không khí từ cộng đồng</p>
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

      {/* Tab Content */}
      <div className="tab-content-area">
        {/* Sensor Data Tab */}
        {contributionTab === 'sensor-data' && (
          <div className="sensor-data-tab">
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
        )}

        {/* Uploaded JSON Tab (existing contributions) */}
        {contributionTab === 'uploaded-json' && (
        <div className="contributions-tab">
          {/* Error Display */}
          {contributionsError && (
            <div className="error-box">
              <h4>❌ Lỗi tải dữ liệu</h4>
              <p>{contributionsError}</p>
            </div>
          )}

          {/* Loading Display */}
          {loadingContributions && !contributorsData && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Contributors List */}
          {!loadingContributions && contributorsData && (
            <>
              <div className="section-header">
                <h3>👥 Danh sách người đóng góp</h3>
                <div className="stats-summary">
                  <span className="stat-item">
                    <strong>{contributorsData.totalContributors || 0}</strong> contributors
                  </span>
                  <span className="stat-divider">•</span>
                  <span className="stat-item">
                    <strong>{contributorsData.totalContributions || 0}</strong> contributions
                  </span>
                </div>
              </div>

              <div className="contributors-grid">
                {contributorsData.contributors && contributorsData.contributors.length > 0 ? (
                  contributorsData.contributors.map((contributor, index) => (
                    <ContributorCard
                      key={contributor.email || index}
                      contributor={contributor}
                      onClick={() => handleContributorClick(contributor)}
                      isActive={selectedContributor?.email === contributor.email}
                    />
                  ))
                ) : (
                  <div className="no-data-box">
                    <p>⚠️ Chưa có contributors nào</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Contributions Modal */}
          {showContributionsModal && selectedContributor && (
            <div className="contributions-modal-overlay" onClick={handleCloseContributionsModal}>
              <div className="contributions-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📋 Contributions của {selectedContributor.userName}</h3>
                  <button className="btn-close" onClick={handleCloseContributionsModal}>
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  {loadingContributions && (
                    <div className="loading-box">
                      <div className="spinner"></div>
                      <p>Đang tải contributions...</p>
                    </div>
                  )}

                  {!loadingContributions && contributionsList.length > 0 && (
                    <div className="contributions-list">
                      {contributionsList.map((contribution) => (
                        <ContributionRecordCard
                          key={contribution.contributionId}
                          contribution={contribution}
                          onDownload={handleDownloadContribution}
                          onViewData={handleViewData}
                        />
                      ))}
                    </div>
                  )}

                  {!loadingContributions && contributionsList.length === 0 && (
                    <div className="no-data-box">
                      <p>⚠️ Không có contributions nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Viewed Data JSON Modal */}
          {viewedData && (
            <div className="json-modal-overlay" onClick={() => setViewedData(null)}>
              <div className="json-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📄 Dữ liệu JSON (ID: {viewedData.contributionId?.slice(0, 8)}...)</h3>
                  <button className="btn-close" onClick={() => setViewedData(null)}>
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  <div className="json-actions">
                    <button
                      className="btn-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(viewedData.records, null, 2)
                        );
                        alert("Đã copy JSON vào clipboard!");
                      }}
                    >
                      📋 Copy JSON
                    </button>
                  </div>
                  <pre className="json-viewer">
                    <code>{JSON.stringify(viewedData.records, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Third Party API Tab */}
        {contributionTab === 'third-party-api' && (
          <div className="third-party-api-tab">
            <div className="coming-soon">
              <h3>🚧 Đang phát triển</h3>
              <p>Tính năng tích hợp API bên thứ 3 đang được phát triển</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenDataViewer;
