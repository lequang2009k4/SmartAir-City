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
import contributionsService from '../services/api/contributionsService';
import ContributionRecordCard from './ContributionRecordCard';
import './ContributionList.css';

/**
 * Contribution List Component
 * Displays list of user's contributions using getContributionList API
 * Shows contribution cards with view/download functionality
 */
const ContributionList = ({ user, refreshTrigger }) => {
  const [contributionsList, setContributionsList] = useState([]);
  const [viewedData, setViewedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's contributions
  useEffect(() => {
    if (user && user.email) {
      loadContributions();
    }
  }, [user, refreshTrigger]);

  const loadContributions = async () => {
    if (!user || !user.email) {
      setError('Vui lòng đăng nhập để xem dữ liệu đã đóng góp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await contributionsService.getContributionList(user.email);
      if (result.success) {
        setContributionsList(result.contributions || []);
      } else {
        setError(result.error || 'Không thể tải danh sách contributions');
      }
    } catch (err) {
      setError('Lỗi kết nối API');
      console.error('[ContributionList] Error loading contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle download contribution
  const handleDownloadContribution = async (contributionId) => {
    const result = await contributionsService.downloadContribution(contributionId);
    if (!result.success) {
      alert(`Lỗi tải xuống: ${result.error}`);
    }
  };

  // Handle view data
  const handleViewData = async (contributionId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contributionsService.getLatestByContributionId(contributionId, 100);
      if (result.success) {
        setViewedData({
          contributionId,
          records: result.records || [],
        });
      } else {
        setError(result.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      setError('Lỗi kết nối API');
      console.error('[ContributionList] Error viewing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle close viewer
  const handleCloseViewer = () => {
    setViewedData(null);
  };

  return (
    <div className="contribution-list">
      {/* Error Display */}
      {error && (
        <div className="error-box">
          <h4>Lỗi</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Loading Display */}
      {loading && !contributionsList.length && (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* No User */}
      {!user && (
        <div className="empty-state">
          <h3>Vui lòng đăng nhập</h3>
          <p>Bạn cần đăng nhập để xem dữ liệu đã đóng góp</p>
        </div>
      )}

      {/* No Contributions */}
      {!loading && user && contributionsList.length === 0 && (
        <div className="empty-state">
          <h3>Chưa có dữ liệu đóng góp</h3>
          <p>Bạn chưa đóng góp dữ liệu nào. Hãy chuyển sang tab "Đóng góp mới" để bắt đầu!</p>
        </div>
      )}

      {/* Contributions List */}
      {!loading && contributionsList.length > 0 && !viewedData && (
        <>
          <div className="section-header">
            <h3>Dữ liệu đã đóng góp của bạn</h3>
            <div className="total-count">
              <span className="count-number">{contributionsList.length}</span>
              <span className="count-label">contributions</span>
            </div>
          </div>

          <div className="contributions-grid">
            {contributionsList.map((contribution) => (
              <ContributionRecordCard
                key={contribution.contributionId}
                contribution={contribution}
                onViewData={handleViewData}
                onDownload={handleDownloadContribution}
              />
            ))}
          </div>
        </>
      )}

      {/* Data Viewer Modal */}
      {viewedData && (
        <div className="json-modal-overlay" onClick={handleCloseViewer}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dữ liệu JSON (ID: {viewedData.contributionId?.slice(0, 8)}...)</h3>
              <button className="btn-close" onClick={handleCloseViewer}>×</button>
            </div>
            <div className="modal-body">
              <div className="viewer-info">
                <span className="info-label">Contribution ID:</span>
                <code className="info-value">{viewedData.contributionId}</code>
              </div>
              <div className="viewer-info">
                <span className="info-label">Số bản ghi:</span>
                <span className="info-value">{viewedData.records.length}</span>
              </div>
              <div className="json-actions">
                <button 
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(viewedData.records, null, 2));
                    alert('Đã copy JSON vào clipboard!');
                  }}
                >
                  Copy JSON
                </button>
              </div>
              <pre className="json-viewer">
                {JSON.stringify(viewedData.records, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributionList;
