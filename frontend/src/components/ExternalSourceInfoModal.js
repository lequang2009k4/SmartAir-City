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

import React from 'react';
import './ExternalSourceInfoModal.css';

/**
 * Information Modal for External Data Source Contributors
 * Displays guidelines and important information about data contribution
 */
const ExternalSourceInfoModal = ({ isOpen, onClose, onConfirm, showConfirmButton = false, confirmText = '✓ Tôi đã hiểu' }) => {
  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="info-modal-header">
          <h2>🌐 Hướng dẫn đóng góp dữ liệu</h2>
          <button className="info-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="info-modal-body">
          {/* Technical Requirements */}
          <div className="info-section">
            <h3>📋 Yêu cầu kỹ thuật</h3>
            <p>
              Hệ thống chỉ hỗ trợ API trả về dữ liệu chuẩn <span className="info-code">NGSI-LD format</span>. 
              API phải trả về JSON với cấu trúc:
            </p>
            <ul>
              <li><span className="info-code">id</span> (URN format: urn:ngsi-ld:AirQualityObserved:...)</li>
              <li><span className="info-code">type</span> (AirQualityObserved hoặc airQualityObserved)</li>
              <li><span className="info-code">Properties</span> (các thuộc tính với cấu trúc type: "Property", value: ...)</li>
            </ul>
          </div>

          {/* Open Data Policy */}
          <div className="info-section">
            <h3>🔓 Chính sách dữ liệu mở</h3>
            <p>
              <strong>SmartAir City</strong> là một dự án mã nguồn mở thuộc cộng đồng. 
              Khi đóng góp dữ liệu vào hệ thống, bạn đồng ý:
            </p>
            <ul>
              <li>Dữ liệu sẽ được công khai miễn phí cho cộng đồng sử dụng</li>
              <li>Tuân thủ giấy phép MIT License và FiWARE Standards</li>
              <li>Dữ liệu có thể được sử dụng cho nghiên cứu, phát triển ứng dụng</li>
              <li>Không chứa thông tin cá nhân hoặc bí mật thương mại</li>
              <li>Dữ liệu phải chính xác và đáng tin cậy</li>
            </ul>
          </div>

          {/* Data Usage */}
          <div className="info-section">
            <h3>💡 Dữ liệu được sử dụng như thế nào?</h3>
            <p>Dữ liệu đóng góp của bạn sẽ:</p>
            <ul>
              <li>Hiển thị công khai trên bản đồ chất lượng không khí</li>
              <li>Được cung cấp qua API mở cho các ứng dụng bên thứ ba</li>
              <li>Đóng góp vào phân tích và dự báo chất lượng không khí</li>
              <li>Hỗ trợ nghiên cứu khoa học và chính sách công</li>
              <li>Tích hợp với các nền tảng Smart City khác</li>
            </ul>
          </div>

          {/* Attribution */}
          <div className="info-section">
            <h3>📝 Ghi công nguồn dữ liệu</h3>
            <p>
              Tên nguồn dữ liệu của bạn sẽ được ghi nhận và hiển thị công khai. 
              Điều này giúp người dùng biết được nguồn gốc dữ liệu và tăng độ tin cậy.
            </p>
          </div>

          {/* Important Notice */}
          <div className="info-highlight">
            <strong>⚠️ Lưu ý quan trọng:</strong>
            <p>
              Bằng việc tạo External Source, bạn xác nhận rằng bạn có quyền chia sẻ dữ liệu này 
              và đồng ý với các điều khoản sử dụng của SmartAir City. Dữ liệu không thể được thu hồi 
              sau khi đã được công khai.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="info-modal-footer">
          {showConfirmButton ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={onConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              ✓ Tôi đã hiểu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExternalSourceInfoModal;
