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
import externalMqttService from "../services/api/externalMqttService";
import externalSourcesService from "../services/api/externalSourcesService";
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
  
  // MQTT Sources state (REAL DATA)
  const [mqttSources, setMqttSources] = useState([]);
  const [loadingMqtt, setLoadingMqtt] = useState(false);
  const [mqttError, setMqttError] = useState(null);
  
  // External Sources state (REAL DATA)
  const [externalSources, setExternalSources] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [externalError, setExternalError] = useState(null);
  
  // Load public contributors on mount
  useEffect(() => {
    if (activeSubTab === 'contributions') {
      loadPublicContributors();
    }
  }, [activeSubTab]);

  // Load MQTT sources when sensor-data tab is active
  useEffect(() => {
    if (contributionTab === 'sensor-data') {
      loadMqttSources();
    }
  }, [contributionTab]);

  // Load External sources when third-party-api tab is active
  useEffect(() => {
    if (contributionTab === 'third-party-api') {
      loadExternalSources();
    }
  }, [contributionTab]);

  /**
   * Load MQTT sources from API
   */
  const loadMqttSources = async () => {
    setLoadingMqtt(true);
    setMqttError(null);
    
    try {
      const sources = await externalMqttService.getAll();
      
      // Fetch record count for each source
      const sourcesWithCount = await Promise.all(
        sources.map(async (source) => {
          try {
            // Get ALL records for this stationId to count them (no limit)
            const records = await getAll(null, source.stationId, true);
            return {
              ...source,
              recordCount: Array.isArray(records) ? records.length : 0,
            };
          } catch {
            return {
              ...source,
              recordCount: 0,
            };
          }
        })
      );
      
      setMqttSources(sourcesWithCount);
    } catch (err) {
      setMqttError(err.message || 'Không thể tải MQTT sources');
    } finally {
      setLoadingMqtt(false);
    }
  };

  /**
   * Load External sources from API
   */
  const loadExternalSources = async () => {
    setLoadingExternal(true);
    setExternalError(null);
    
    try {
      // externalSourcesService.getAll() throws error, not return {success, data}
      const sources = await externalSourcesService.getAll();
      
      // Fetch record count for each source using getAll() to count total records
      const sourcesWithCount = await Promise.all(
        sources.map(async (source) => {
          try {
            // Get ALL records for this stationId to count them (no limit)
            const records = await getAll(null, source.stationId, true);
            return {
              ...source,
              recordCount: Array.isArray(records) ? records.length : 0,
            };
          } catch {
            return {
              ...source,
              recordCount: 0,
            };
          }
        })
      );
      
      setExternalSources(sourcesWithCount);
    } catch (err) {
      console.error('❌ [OpenDataViewer] Error loading external sources:', err);
      setExternalError(err.message || 'Không thể tải External sources');
    } finally {
      setLoadingExternal(false);
    }
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
        {/* Sensor Data Tab - MQTT Sources */}
        {contributionTab === 'sensor-data' && (
          <div className="sensor-data-tab">
            {/* Error Display */}
            {mqttError && (
              <div className="error-box">
                <h4>❌ Lỗi tải dữ liệu</h4>
                <p>{mqttError}</p>
              </div>
            )}

            {/* Loading Display */}
            {loadingMqtt && (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Đang tải MQTT sources...</p>
              </div>
            )}

            {/* MQTT Sources List */}
            {!loadingMqtt && mqttSources.length > 0 && (
              <>
                <div className="section-header">
                  <h3>📡 MQTT Sensor Sources</h3>
                  <div className="stats-summary">
                    <span className="stat-item">
                      <strong>{mqttSources.length}</strong> MQTT sources
                    </span>
                    <span className="stat-divider">•</span>
                    <span className="stat-item">
                      <strong>{mqttSources.filter(s => s.isActive).length}</strong> active
                    </span>
                  </div>
                </div>

                <div className="sensors-grid">
                  {mqttSources.map(source => (
                    <div
                      key={source.id}
                      className={`sensor-card ${source.isActive ? 'active' : 'inactive'}`}
                    >
                      <div className="sensor-header">
                        <h3>{source.name}</h3>
                        <span className={`status-badge ${source.isActive ? 'active' : 'inactive'}`}>
                          {source.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </div>
                      <div className="sensor-info">
                        <p className="sensor-coords">
                          📍 Vị trí: {source.latitude}, {source.longitude}
                        </p>
                        <p className="sensor-coords">
                          📅 Tạo ngày: {source.createdAt 
                            ? new Date(source.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="sensor-stats">
                        <div className="stat-item">
                          <span className="stat-label">Số bản ghi</span>
                          <span className="stat-value">{source.messageCount || source.recordCount || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Bản tin cuối</span>
                          <span className="stat-value">
                            {source.lastMessageAt 
                              ? new Date(source.lastMessageAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {source.lastError && (
                        <div className="error-info">
                          <span>⚠️ {source.lastError}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* No Data */}
            {!loadingMqtt && mqttSources.length === 0 && (
              <div className="no-data-box">
                <h3>📡 Chưa có MQTT sources</h3>
                <p>Người dùng có thể đóng góp dữ liệu từ sensor MQTT của họ.</p>
                <p>Vui lòng đăng nhập và thêm MQTT source tại trang Đóng góp dữ liệu.</p>
              </div>
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

        {/* Third Party API Tab - External HTTP Sources */}
        {contributionTab === 'third-party-api' && (
          <div className="third-party-api-tab">
            {/* Error Display */}
            {externalError && (
              <div className="error-box">
                <h4>❌ Lỗi tải dữ liệu</h4>
                <p>{externalError}</p>
              </div>
            )}

            {/* Loading Display */}
            {loadingExternal && (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Đang tải External sources...</p>
              </div>
            )}

            {/* External Sources List */}
            {!loadingExternal && externalSources.length > 0 && (
              <>
                <div className="section-header">
                  <h3>🌐 External HTTP API Sources</h3>
                  <div className="stats-summary">
                    <span className="stat-item">
                      <strong>{externalSources.length}</strong> API sources
                    </span>
                    <span className="stat-divider">•</span>
                    <span className="stat-item">
                      <strong>{externalSources.filter(s => s.isActive).length}</strong> active
                    </span>
                  </div>
                </div>

                <div className="sensors-grid">
                  {externalSources.map(source => (
                    <div
                      key={source.id}
                      className={`sensor-card ${source.isActive ? 'active' : 'inactive'}`}
                    >
                      <div className="sensor-header">
                        <h3>{source.name}</h3>
                        <div className="badges">
                          <span className={`format-badge ${source.isNGSILD ? 'ngsi-ld' : 'custom'}`}>
                            {source.isNGSILD ? 'NGSI-LD' : 'Custom JSON'}
                          </span>
                          <span className={`status-badge ${source.isActive ? 'active' : 'inactive'}`}>
                            {source.isActive ? '🟢' : '🔴'}
                          </span>
                        </div>
                      </div>
                      <div className="sensor-info">
                        <p className="sensor-coords">
                          📍 Vị trí: {source.latitude}, {source.longitude}
                        </p>
                        <p className="sensor-coords">
                          🔄 Thời gian lấy dữ liệu: {source.intervalMinutes} phút
                        </p>
                      </div>
                      <div className="sensor-stats">
                        <div className="stat-item">
                          <span className="stat-label">Số bản ghi</span>
                          <span className="stat-value">{source.recordCount || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Last Fetch</span>
                          <span className="stat-value">
                            {source.lastFetchedAt 
                              ? new Date(source.lastFetchedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                              : 'Chưa có'}
                          </span>
                        </div>
                      </div>
                      {source.lastError && (
                        <div className="error-info">
                          <span>⚠️ {source.lastError}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* No Data */}
            {!loadingExternal && externalSources.length === 0 && (
              <div className="no-data-box">
                <h3>🌐 Chưa có External API sources</h3>
                <p>Người dùng có thể đóng góp dữ liệu từ API bên thứ 3.</p>
                <p>Vui lòng đăng nhập và thêm External API source tại trang Đóng góp dữ liệu.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenDataViewer;
