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
import "./APIDataViewer.css";

/**
 * API Data Viewer Component
 * Displays raw Air Quality API data for developers
 * AND Contributions data (new feature)
 */
const APIDataViewer = () => {
  // Sub-tab state (Contributions vs API Data)
  const [activeSubTab, setActiveSubTab] = useState('contributions');
  
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

  // Load public contributors on mount
  useEffect(() => {
    if (activeSubTab === 'contributions') {
      loadPublicContributors();
    }
  }, [activeSubTab]);

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
    <div className="api-data-viewer">
      {/* Main Tab Buttons (Replace Header) */}
      <div className="main-tab-buttons">
        <button
          className={`main-tab-btn ${activeSubTab === 'contributions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('contributions')}
        >
          <div className="tab-icon">👥</div>
          <div className="tab-content">
            <h2>Dữ liệu đóng góp</h2>
            <p>Xem contributions từ cộng đồng</p>
          </div>
        </button>
        <button
          className={`main-tab-btn ${activeSubTab === 'api-data' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('api-data')}
        >
          <div className="tab-icon">📊</div>
          <div className="tab-content">
            <h2>API Data View</h2>
            <p>Xem dữ liệu Air Quality API</p>
          </div>
        </button>
      </div>

      {/* ===== TAB 1: CONTRIBUTIONS ===== */}
      {activeSubTab === 'contributions' && (
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
                          onView={handleViewData}
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

          {/* Viewed Data JSON */}
          {viewedData && (
            <div className="data-display">
              <div className="data-header">
                <h3>📄 Dữ liệu JSON (Contribution: {viewedData.contributionId?.slice(0, 8)}...)</h3>
                <div className="data-actions">
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
                  <button
                    className="btn-close"
                    onClick={() => setViewedData(null)}
                  >
                    ✕ Đóng
                  </button>
                </div>
              </div>

              <pre className="json-viewer">
                <code>{JSON.stringify(viewedData.records, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: API DATA VIEW ===== */}
      {activeSubTab === 'api-data' && (
        <>
          {/* Query Form */}
          <div className="query-section">
            <div className="section-header">
              <h3>🔍 Query Air Quality Data</h3>
            </div>

            {/* Query Type Selector */}
            <div className="query-type-selector">
              <button
                className={`type-btn ${queryType === 'latest' ? 'active' : ''}`}
                onClick={() => setQueryType('latest')}
              >
                ⚡ Get Latest
              </button>
              <button
                className={`type-btn ${queryType === 'all' ? 'active' : ''}`}
                onClick={() => setQueryType('all')}
              >
                📋 Get All Records
              </button>
              <button
                className={`type-btn ${queryType === 'history' ? 'active' : ''}`}
                onClick={() => setQueryType('history')}
              >
                📅 Get Historical Data
              </button>
            </div>

            {/* Query Form */}
            <div className="query-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Station ID {queryType === 'latest' ? '(Required)' : '(Optional)'}</label>
                  <input
                    type="text"
                    placeholder="e.g., station-hanoi-oceanpark"
                    value={queryParams.stationId}
                    onChange={(e) => setQueryParams({...queryParams, stationId: e.target.value})}
                  />
                </div>

                {queryType === 'all' && (
                  <div className="form-group">
                    <label>Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={queryParams.limit}
                      onChange={(e) => setQueryParams({...queryParams, limit: e.target.value})}
                    />
                  </div>
                )}

                {queryType === 'history' && (
                  <>
                    <div className="form-group">
                      <label>From (Date/Time)</label>
                      <input
                        type="datetime-local"
                        value={queryParams.from}
                        onChange={(e) => setQueryParams({...queryParams, from: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>To (Date/Time)</label>
                      <input
                        type="datetime-local"
                        value={queryParams.to}
                        onChange={(e) => setQueryParams({...queryParams, to: e.target.value})}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="form-actions">
                <button
                  className="btn-query"
                  onClick={handleQuerySubmit}
                  disabled={queryLoading}
                >
                  {queryLoading ? '⏳ Đang tải...' : '🔍 Query'}
                </button>
                <button
                  className="btn-download-query"
                  onClick={handleDownloadQuery}
                  disabled={queryLoading}
                >
                  💾 Download JSON
                </button>
              </div>
            </div>

            {/* Query Error */}
            {queryError && (
              <div className="error-box">
                <h4>❌ Lỗi Query</h4>
                <p>{queryError}</p>
              </div>
            )}

            {/* Query Results */}
            {queryResults && (
              <div className="query-results">
                <div className="results-header">
                  <h4>📊 Kết quả: {queryResults.length} records</h4>
                  <button
                    className="btn-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(queryResults, null, 2));
                      alert("Đã copy JSON vào clipboard!");
                    }}
                  >
                    📋 Copy JSON
                  </button>
                </div>
                <pre className="json-viewer">
                  <code>{JSON.stringify(queryResults, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="section-divider"></div>

          {/* Sample Data Section */}
          <div className="sample-section">
            <div className="section-header">
              <h3>📄 Sample Data (Real-time WebSocket)</h3>
            </div>

          {/* Error Display */}
          {error && (
            <div className="error-box">
              <h4>❌ Error Loading Data</h4>
              <p>{error}</p>
            </div>
          )}

          {/* Loading Display */}
          {isLoading && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

          {/* Data Display */}
          {!isLoading && !error && (
        <div className="data-display">
          <div className="data-header">
            <h3>Sample JSON Data (1 Record)</h3>
            <div className="data-actions">
              <button
                className={`btn-toggle ${showRaw ? 'active' : ''}`}
                onClick={() => setShowRaw(!showRaw)}
              >
                {showRaw ? '📋 Show Transformed' : '🔍 Show NGSI-LD'}
              </button>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(displayData, null, 2)
                  );
                  alert("Đã copy JSON vào clipboard!");
                }}
              >
                📋 Copy JSON
              </button>
              <button
                className="btn-download"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(displayData, null, 2)],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `sample-airquality-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                💾 Download JSON
              </button>
            </div>
          </div>

          {displayData.length > 0 ? (
            <pre className="json-viewer">
              <code>{JSON.stringify(displayData, null, 2)}</code>
            </pre>
          ) : (
            <div className="no-data-box">
              <p>⚠️ Không có dữ liệu mẫu</p>
            </div>
          )}
        </div>
          )}
          </div>

          {/* API Endpoints Reference */}
          <div className="api-reference">
            <h3>Air Quality API Endpoints</h3>
            <div className="endpoint-grid">
              <div className="endpoint-card">
                <h4>Air Quality Query</h4>
                <code>GET /api/airquality?limit=N&stationId=xxx</code>
                <code>GET /api/airquality/latest?stationId=xxx</code>
                <code>GET /api/airquality/history?from=xxx&to=xxx</code>
              </div>
              <div className="endpoint-card">
                <h4>Air Quality Download</h4>
                <code>GET /api/airquality/download</code>
                <code>GET /api/airquality/history/download</code>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default APIDataViewer;
