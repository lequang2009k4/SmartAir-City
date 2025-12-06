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
  const [activeView, setActiveView] = useState('upload'); // 'upload' or 'list'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Handle successful upload - switch to list view and refresh
   */
  const handleUploadSuccess = (data) => {
    try {
      console.log('[ContributionManagement] Upload successful:', data);
      
      // Trigger refresh of list
      setRefreshTrigger(prev => prev + 1);
      
      // Auto-switch to list view after 2 seconds
      setTimeout(() => {
        setActiveView('list');
      }, 2000);
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

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${activeView === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveView('upload')}
        >
          Đóng góp mới
        </button>
        <button
          className={`toggle-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          Dữ liệu đã đóng góp
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeView === 'upload' ? (
          <ContributionUpload onUploadSuccess={handleUploadSuccess} user={user} />
        ) : (
          <ContributionList refreshTrigger={refreshTrigger} />
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
