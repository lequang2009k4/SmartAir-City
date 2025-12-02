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

import React, { useState, useRef, useEffect } from 'react';
import './ContributionUpload.css';
import { uploadContributionFile, validateJsonStructure } from '../services';

/**
 * Contribution Upload Component
 * Allows users to contribute air quality data via File Upload (.json)
 * 
 * NOTE: Direct JSON paste feature disabled - POST /api/contributions does not exist in api.yaml
 */
const ContributionUpload = ({ onUploadSuccess, user }) => {
  const [activeMethod, setActiveMethod] = useState('file'); // 'file' or 'json'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // JSON paste state
  const [jsonInput, setJsonInput] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Contributor metadata
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');

  // Auto-fill user information when component mounts or user changes
  useEffect(() => {
    if (user) {
      setContributorName(user.name || '');
      setContributorEmail(user.email || '');
    }
  }, [user]);

  // ============================================
  // FILE UPLOAD HANDLERS
  // ============================================

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    setResult(null);

    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setError('⚠️ Chỉ chấp nhận file JSON (.json)');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1048576) {
      setError('⚠️ File không được vượt quá 1MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('⚠️ Vui lòng chọn file JSON');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const metadata = {
        contributorName: contributorName.trim() || undefined,
        contributorEmail: contributorEmail.trim() || undefined,
      };

      const response = await uploadContributionFile(selectedFile, metadata);
      console.log('[ContributionUpload] Response:', response);

      if (response.success) {
        console.log('[ContributionUpload] Success data:', response.data);
        setResult({
          type: 'success',
          message: response.data.message,
          count: response.data.count,
          ids: response.data.ids,
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Call parent callback
        if (onUploadSuccess) {
          console.log('[ContributionUpload] Calling onUploadSuccess with:', response.data);
          onUploadSuccess(response.data);
        }
      } else {
        // Backend trả về {message, errors} trong error response
        const errorMsg = response.details?.message || response.error || 'Upload thất bại';
        setError(`❌ ${errorMsg}`);
        if (response.details?.errors && Array.isArray(response.details.errors)) {
          setValidationErrors(response.details.errors);
        }
      }
    } catch (err) {
      console.error('[ContributionUpload] Caught error:', err);
      const errorMessage = err?.message || err?.toString() || 'Lỗi không xác định';
      setError(`❌ Lỗi khi upload: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // JSON PASTE HANDLERS
  // ============================================

  const handleJsonChange = (e) => {
    setJsonInput(e.target.value);
    setValidationErrors([]);
    setError(null);
    setResult(null);
  };

  const handleValidateJson = () => {
    setError(null);
    setValidationErrors([]);

    if (!jsonInput.trim()) {
      setError('⚠️ Vui lòng nhập JSON');
      return;
    }

    const validation = validateJsonStructure(jsonInput);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('❌ JSON không hợp lệ theo chuẩn NGSI-LD');
    } else {
      setResult({
        type: 'info',
        message: '✅ JSON hợp lệ! Sẵn sàng gửi.',
      });
    }
  };

  const handleJsonSubmit = async () => {
    if (!jsonInput.trim()) {
      setError('⚠️ Vui lòng nhập JSON');
      return;
    }

    // Validate first
    const validation = validateJsonStructure(jsonInput);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('❌ JSON không hợp lệ theo chuẩn NGSI-LD');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // NOTE: POST /api/contributions endpoint DOES NOT EXIST in api.yaml
    // This feature is not available - only file upload is supported
    setError('❌ Tính năng submit JSON trực tiếp không khả dụng. Vui lòng sử dụng upload file.');
    setLoading(false);
  };

  const handleClearJson = () => {
    setJsonInput('');
    setValidationErrors([]);
    setError(null);
    setResult(null);
  };

  // ============================================
  // SAMPLE JSON TEMPLATE
  // ============================================

  const sampleJson = `{
  "id": "urn:ngsi-ld:AirQualityObserved:MyStation:001",
  "type": "AirQualityObserved",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "dateObserved": {
    "type": "Property",
    "value": "${new Date().toISOString()}"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.8342, 21.0278]
    }
  },
  "airQualityIndex": {
    "type": "Property",
    "value": 85,
    "unitCode": "AQI"
  },
  "pm25": {
    "type": "Property",
    "value": 25.5,
    "unitCode": "GQ"
  },
  "pm10": {
    "type": "Property",
    "value": 45.2,
    "unitCode": "GQ"
  },
  "temperature": {
    "type": "Property",
    "value": 28.5,
    "unitCode": "°C"
  },
  "humidity": {
    "type": "Property",
    "value": 65,
    "unitCode": "%"
  }
}`;

  const handleLoadSample = () => {
    setJsonInput(sampleJson);
    setValidationErrors([]);
    setError(null);
    setResult(null);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="contribution-upload">
      <div className="upload-header">
        <h2>Đóng góp dữ liệu chất lượng không khí</h2>
        <p className="upload-description">
          Bạn có thể đóng góp dữ liệu theo chuẩn NGSI-LD bằng cách upload file JSON
        </p>
      </div>

      {/* Contributor Metadata */}
      <div className="contributor-metadata">
        <div className="metadata-row">
          <div className="form-group">
            <label htmlFor="contributorName">Tên người đóng góp (tùy chọn)</label>
            <input
              type="text"
              id="contributorName"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contributorEmail">Email (tùy chọn)</label>
            <input
              type="email"
              id="contributorEmail"
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              placeholder="VD: email@example.com"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Upload Methods */}
      <div className="upload-methods">
        {/* FILE UPLOAD */}
        <div className="upload-method file-upload">
            <div
              className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={loading}
              />
              
              {selectedFile ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <button
                    className="btn-remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={loading}
                  >
                    ✖️
                  </button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <div className="drop-icon">📁</div>
                  <p>Kéo thả file JSON vào đây hoặc click để chọn</p>
                  <p className="file-hint">File JSON • Tối đa 1MB</p>
                </div>
              )}
            </div>

            <button
              className="btn-upload"
              onClick={handleFileUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? '⏳ Đang upload...' : '📤 Upload File'}
            </button>
          </div>
        <div style={{ display: 'none' }}>
          {/* JSON PASTE - DISABLED */}
          <div className="upload-method json-paste">
            <div className="json-editor">
              <div className="json-toolbar">
                <button
                  className="btn-tool"
                  onClick={handleLoadSample}
                  disabled={loading}
                  title="Load JSON mẫu"
                >
                  📋 Tải JSON mẫu
                </button>
                <button
                  className="btn-tool"
                  onClick={handleValidateJson}
                  disabled={!jsonInput.trim() || loading}
                  title="Kiểm tra JSON"
                >
                  ✅ Validate
                </button>
                <button
                  className="btn-tool"
                  onClick={handleClearJson}
                  disabled={!jsonInput.trim() || loading}
                  title="Xóa JSON"
                >
                  🗑️ Xóa
                </button>
              </div>

              <textarea
                className="json-textarea"
                value={jsonInput}
                onChange={handleJsonChange}
                placeholder="Paste JSON theo chuẩn NGSI-LD vào đây..."
                disabled={loading}
                rows={15}
              />

              {validationErrors.length > 0 && (
                <div className="validation-errors">
                  <strong>⚠️ Lỗi validation:</strong>
                  <ul>
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              className="btn-upload"
              onClick={handleJsonSubmit}
              disabled={!jsonInput.trim() || loading}
            >
              {loading ? '⏳ Đang gửi...' : '📤 Gửi JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* Result/Error Messages */}
      {error && (
        <div className="message-box error">
          <p>{error}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="message-box error">
          <h4>🚫 Lỗi validation NGSI-LD:</h4>
          <ul className="validation-errors">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
          <p className="help-text">
            <strong>Gợi ý:</strong> Vui lòng kiểm tra lại cấu trúc JSON theo chuẩn NGSI-LD 👇
          </p>
        </div>
      )}

      {result && (
        <div className={`message-box ${result.type}`}>
          {result.type === 'success' && (
            <div className="success-content">
              <div className="success-header">
                <span className="success-icon">✅</span>
                <h3>{result.message || 'Đóng góp thành công!'}</h3>
              </div>
              {result.count && (
                <p className="success-stats">
                  📄 Đã lưu thành công <strong>{result.count} bản ghi</strong> vào hệ thống
                </p>
              )}
              {result.ids && result.ids.length > 0 && (
                <details className="success-details">
                  <summary>🎯 Xem danh sách IDs ({result.ids.length})</summary>
                  <ul className="id-list">
                    {result.ids.map((id, idx) => (
                      <li key={idx}><code>{id}</code></li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="success-footer">
                👉 Bạn có thể chuyển sang tab <strong>"Dữ liệu đã đóng góp"</strong> để xem dữ liệu vừa upload
              </p>
            </div>
          )}
          {result.type === 'info' && (
            <p>{result.message}</p>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="upload-help">
        <h4>Hướng dẫn:</h4>
        <ul>
          <li>Dữ liệu phải tuân thủ chuẩn <strong>NGSI-LD</strong></li>
          <li>Có thể gửi <strong>1 object</strong> hoặc <strong>array of objects</strong></li>
          <li>Các trường bắt buộc: <code>id</code>, <code>type</code>, <code>@context</code>, <code>dateObserved</code></li>
          <li>File JSON tối đa <strong>1MB</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default ContributionUpload;
