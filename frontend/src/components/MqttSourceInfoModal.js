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
import './ExternalSourceInfoModal.css'; // Reuse same styles

/**
 * Information Modal for MQTT Sensor Data Contributors
 * Displays guidelines and important information about MQTT sensor contribution
 */
const MqttSourceInfoModal = ({ isOpen, onClose, onConfirm, showConfirmButton = false, confirmText = '✓ Tôi đã hiểu' }) => {
  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="info-modal-header">
          <h2>📡 Hướng dẫn đóng góp dữ liệu từ Sensor</h2>
          <button className="info-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="info-modal-body">
          {/* Technical Requirements */}
          <div className="info-section">
            <h3>📋 Yêu cầu kỹ thuật</h3>
            <p>
              Sensor của bạn phải gửi dữ liệu qua <span className="info-code">MQTT protocol</span> với định dạng JSON chuẩn NGSI-LD:
            </p>
            <ul>
              <li>MQTT broker phải cho phép kết nối từ bên ngoài (public hoặc có authentication)</li>
              <li>Dữ liệu JSON phải tuân thủ cấu trúc NGSI-LD AirQualityObserved</li>
              <li>Hỗ trợ cả kết nối không mã hóa (port 1883) và TLS (port 8883)</li>
              <li>Topic MQTT cần được cấu hình rõ ràng</li>
            </ul>
          </div>

          {/* Data Format Example */}
          <div className="info-section">
            <h3>📝 Ví dụ định dạng dữ liệu</h3>
            <p>Sensor cần publish JSON message với cấu trúc:</p>
            <pre style={{ 
              background: '#f3f4f6', 
              padding: '1rem', 
              borderRadius: '8px',
              fontSize: '0.75rem',
              overflow: 'auto'
            }}>
{`{
  "id": "urn:ngsi-ld:AirQualityObserved:sensor-001",
  "type": "AirQualityObserved",
  "PM2_5": {
    "type": "Property",
    "value": 25.5
  },
  "temperature": {
    "type": "Property",
    "value": 28.3
  }
}`}
            </pre>
          </div>

          {/* Open Data Policy */}
          <div className="info-section">
            <h3>🔓 Chính sách dữ liệu mở</h3>
            <p>
              <strong>SmartAir City</strong> là dự án mã nguồn mở phục vụ cộng đồng. 
              Khi đăng ký sensor, bạn đồng ý:
            </p>
            <ul>
              <li>Dữ liệu từ sensor sẽ được công khai miễn phí</li>
              <li>Tuân thủ MIT License và FiWARE Standards</li>
              <li>Dữ liệu có thể được sử dụng cho nghiên cứu, ứng dụng thương mại</li>
              <li>Đảm bảo sensor hoạt động ổn định và dữ liệu chính xác</li>
              <li>Không gửi dữ liệu giả mạo hoặc spam</li>
            </ul>
          </div>

          {/* Data Usage */}
          <div className="info-section">
            <h3>💡 Dữ liệu sensor được sử dụng như thế nào?</h3>
            <ul>
              <li>Hiển thị real-time trên bản đồ chất lượng không khí</li>
              <li>Cung cấp qua API công khai cho developers</li>
              <li>Tích hợp vào hệ thống cảnh báo chất lượng không khí</li>
              <li>Phân tích xu hướng và dự báo ô nhiễm</li>
              <li>Hỗ trợ nghiên cứu khoa học và chính sách môi trường</li>
              <li>Đóng góp vào mạng lưới Smart City toàn cầu</li>
            </ul>
          </div>

          {/* Security & Privacy */}
          <div className="info-section">
            <h3>🔒 Bảo mật & Quyền riêng tư</h3>
            <ul>
              <li>Thông tin MQTT credentials (username/password) được mã hóa lưu trữ</li>
              <li>Chỉ metadata (tên, vị trí) được hiển thị công khai</li>
              <li>Không chia sẻ thông tin broker với bên thứ ba</li>
              <li>Bạn có thể xóa/tạm dừng sensor bất cứ lúc nào</li>
            </ul>
          </div>

          {/* Attribution */}
          <div className="info-section">
            <h3>📝 Ghi công đóng góp</h3>
            <p>
              Tên sensor của bạn sẽ được hiển thị công khai trên bản đồ. 
              Điều này giúp tăng độ tin cậy và ghi nhận đóng góp của bạn cho cộng đồng.
            </p>
          </div>

          {/* Important Notice */}
          <div className="info-highlight">
            <strong>⚠️ Lưu ý quan trọng:</strong>
            <p>
              Bằng việc đăng ký MQTT Broker, bạn xác nhận rằng bạn sở hữu/có quyền sử dụng sensor này 
              và đồng ý chia sẻ dữ liệu công khai. Hệ thống sẽ tự động kết nối và thu thập dữ liệu 
              từ broker của bạn 24/7. Đảm bảo broker luôn hoạt động để duy trì chất lượng dịch vụ.
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

export default MqttSourceInfoModal;
