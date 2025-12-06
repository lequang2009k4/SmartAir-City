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

import React, { useState, useEffect, useCallback } from 'react';
import './ContributionList.css';
import { getContributionsAll, getContributionStations, getContributionsByStation } from '../services';
import LoadingSpinner from './LoadingSpinner';
import { getAQILevel } from '../services';

/**
 * Contribution List Component
 * Displays list of contributed air quality data with filtering by station
 */
const ContributionList = ({ refreshTrigger }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [contributions, setContributions] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');
  
  const [limit, setLimit] = useState(50);
  const [expandedId, setExpandedId] = useState(null);

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchStations = useCallback(async () => {
    try {
      const response = await getContributionStations();
      if (response.success && response.data) {
        setStations(response.data.stations || []);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  }, []);

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getContributionsAll(limit);
      
      if (response.success) {
        setContributions(response.data || []);
      } else {
        setError(response.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchContributionsByStation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getContributionsByStation(selectedStation);
      
      if (response.success && response.data) {
        setContributions(response.data.data || []);
      } else {
        setError(response.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchStations();
    fetchContributions();
  }, [refreshTrigger, fetchStations, fetchContributions]);

  useEffect(() => {
    if (selectedStation === 'all') {
      fetchContributions();
    } else {
      fetchContributionsByStation();
    }
  }, [selectedStation, limit, fetchContributions, fetchContributionsByStation]);

  const handleRefresh = () => {
    if (selectedStation === 'all') {
      fetchContributions();
    } else {
      fetchContributionsByStation();
    }
  };

  // ============================================
  // FORMAT HELPERS
  // ============================================

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const extractStationId = (contribution) => {
    // Backend trả về object trực tiếp, không wrap trong data
    // Format: "urn:ngsi-ld:AirQualityObserved:station-hn01:2025-11-16T17:45:00Z"
    if (contribution.id) {
      const parts = contribution.id.split(':');
      if (parts.length >= 4) {
        return parts[3]; // station-hn01
      }
      return contribution.id;
    }
    return 'Unknown';
  };

  const extractAQI = (contribution) => {
    return contribution.airQualityIndex?.value || 0;
  };

  const extractPollutants = (contribution) => {
    return {
      pm25: contribution.pm25?.value || 0,
      pm10: contribution.pm10?.value || 0,
      o3: contribution.o3?.value || 0,
      no2: contribution.no2?.value || 0,
      so2: contribution.so2?.value || 0,
      co: contribution.co?.value || 0,
    };
  };

  const extractLocation = (contribution) => {
    const coords = contribution.location?.value?.coordinates;
    if (coords && coords.length === 2) {
      return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
    }
    return 'N/A';
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading && contributions.length === 0) {
    return <LoadingSpinner message="Đang tải danh sách contributions..." />;
  }

  return (
    <div className="contribution-list">
      <div className="list-header">
        <div className="header-left">
          <h2>📊 Dữ liệu đã đóng góp</h2>
          <span className="total-count">Tổng số: {contributions.length}</span>
        </div>
        
        <div className="header-controls">
          {/* Station Filter */}
          <div className="filter-group">
            <label htmlFor="stationFilter">🗺️ Lọc theo trạm:</label>
            <select
              id="stationFilter"
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              disabled={loading}
            >
              <option value="all">Tất cả trạm ({stations.length})</option>
              {stations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          {/* Limit Filter */}
          {selectedStation === 'all' && (
            <div className="filter-group">
              <label htmlFor="limitFilter">📄 Số bản ghi:</label>
              <select
                id="limitFilter"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={loading}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            className="btn-refresh"
            onClick={handleRefresh}
            disabled={loading}
            title="Làm mới dữ liệu"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={handleRefresh}>Thử lại</button>
        </div>
      )}

      {contributions.length === 0 && !loading && !error ? (
        <div className="empty-state">
          <p>📭 Chưa có dữ liệu đóng góp nào</p>
        </div>
      ) : (
        <div className="contributions-grid">
          {contributions.map((contribution, index) => {
            const stationId = extractStationId(contribution);
            const aqi = extractAQI(contribution);
            const pollutants = extractPollutants(contribution);
            const location = extractLocation(contribution);
            const isExpanded = expandedId === contribution.id;

            return (
              <div
                key={contribution.id || index}
                className={`contribution-card ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div className="station-info">
                    <h3>{stationId}</h3>
                  </div>
                  <div
                    className={`aqi-badge aqi-${getAQILevel(aqi).level}`}
                    title={getAQILevel(aqi).label}
                  >
                    AQI: {aqi}
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">📅 Ngày quan sát:</span>
                    <span className="value">{formatDate(contribution.dateObserved?.value)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">📍 Vị trí:</span>
                    <span className="value">{location}</span>
                  </div>

                  {/* Pollutants Quick View */}
                  <div className="pollutants-quick">
                    <div className="pollutant-item">
                      <span className="pollutant-name">PM2.5</span>
                      <span className="pollutant-value">{pollutants.pm25.toFixed(1)}</span>
                    </div>
                    <div className="pollutant-item">
                      <span className="pollutant-name">PM10</span>
                      <span className="pollutant-value">{pollutants.pm10.toFixed(1)}</span>
                    </div>
                    <div className="pollutant-item">
                      <span className="pollutant-name">O₃</span>
                      <span className="pollutant-value">{pollutants.o3.toFixed(1)}</span>
                    </div>
                    <div className="pollutant-item">
                      <span className="pollutant-name">NO₂</span>
                      <span className="pollutant-value">{pollutants.no2.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="expanded-details">
                      <h4>Chi tiết đầy đủ:</h4>
                      <div className="all-pollutants">
                        <div className="pollutant-detail">
                          <strong>PM2.5:</strong> {pollutants.pm25} µg/m³
                        </div>
                        <div className="pollutant-detail">
                          <strong>PM10:</strong> {pollutants.pm10} µg/m³
                        </div>
                        <div className="pollutant-detail">
                          <strong>O₃:</strong> {pollutants.o3} µg/m³
                        </div>
                        <div className="pollutant-detail">
                          <strong>NO₂:</strong> {pollutants.no2} µg/m³
                        </div>
                        <div className="pollutant-detail">
                          <strong>SO₂:</strong> {pollutants.so2} µg/m³
                        </div>
                        <div className="pollutant-detail">
                          <strong>CO:</strong> {pollutants.co} µg/m³
                        </div>
                      </div>

                      {/* Raw JSON */}
                      <details className="raw-json">
                        <summary>📄 Xem JSON gốc</summary>
                        <pre>{JSON.stringify(contribution, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <button
                    className="btn-toggle-details"
                    onClick={() => setExpandedId(isExpanded ? null : contribution.id)}
                  >
                    {isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContributionList;
