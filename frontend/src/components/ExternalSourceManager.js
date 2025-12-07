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
import { externalSourcesService } from '../services';
import { getAll } from '../services/api/airQualityService';
import LoadingSpinner from './LoadingSpinner';
import './ExternalSourceManager.css';

/**
 * Generate slug from text (remove diacritics, lowercase, replace spaces with dashes)
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
};

/**
 * External Source Manager Component
 * Manages external HTTP API data sources for third-party air quality data
 */
const ExternalSourceManager = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKey: '',
    latitude: '',
    longitude: '',
    fetchIntervalMinutes: 15
  });

  // Mapping state
  const [isNGSILD, setIsNGSILD] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [timestampPath, setTimestampPath] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);

  // UI state
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showMappingSection, setShowMappingSection] = useState(false);
  const [testUrlInput, setTestUrlInput] = useState('');
  const [testApiKeyInput, setTestApiKeyInput] = useState('');

  // Load sources on mount
  useEffect(() => {
    loadSources();
  }, []);

  /**
   * Load all external sources
   */
  const loadSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await externalSourcesService.getAll();
      const sourcesArray = data || [];
      
      // Fetch record count for each source from air quality API
      const sourcesWithRecords = await Promise.all(
        sourcesArray.map(async (source) => {
          try {
            // Get ALL records for this stationId to count them (no limit)
            const records = await getAll(null, source.stationId, true);
            const recordCount = Array.isArray(records) ? records.length : 0;
            console.log(`📊 [${source.stationId}] Record count:`, recordCount);
            return { ...source, recordCount };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch record count for ${source.stationId}:`, err);
            return { ...source, recordCount: 0 };
          }
        })
      );
      
      setSources(sourcesWithRecords);
      console.log('📋 Loaded external sources with records:', sourcesWithRecords.length);
    } catch (err) {
      setError('Không thể tải danh sách sources: ' + (err.message || 'Lỗi không xác định'));
      console.error('Load sources error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test API URL
   */
  const handleTestUrl = async () => {
    if (!testUrlInput) {
      setError('Vui lòng nhập URL');
      return;
    }

    try {
      setTestLoading(true);
      setError(null);
      setSuccess(null);

      const testData = {
        url: testUrlInput,
        apiKey: testApiKeyInput || null
      };

      const result = await externalSourcesService.testUrl(testData);
      
      // Extract actual data from service response wrapper
      const actualData = result.data || result;
      setJsonData(actualData);
      setSuccess('✅ Kết nối thành công!');

      // Auto-detect NGSI-LD format
      const detected = detectNGSILD(actualData);
      setIsNGSILD(detected);
      
      if (detected) {
        // NGSI-LD detected: skip mapping, go to Step 3
        setShowMappingSection(false);
        setSuccess('✅ Phát hiện dữ liệu chuẩn NGSI-LD! Có thể bỏ qua mapping.');
      } else {
        // Custom JSON: show mapping section
        setShowMappingSection(true);
        setFieldMapping({});
        setTimestampPath('');
      }
    } catch (err) {
      setError('❌ Test thất bại: ' + (err.message || 'Không thể kết nối'));
      setJsonData(null);
      setShowMappingSection(false);
    } finally {
      setTestLoading(false);
    }
  };

  /**
   * Detect if JSON is NGSI-LD format
   */
  const detectNGSILD = (data) => {
    if (!data || typeof data !== 'object') return false;

    // Check for NGSI-LD structure
    if (data.id && typeof data.id === 'string' && data.id.startsWith('urn:ngsi-ld:')) {
      if (data.type === 'AirQualityObserved') {
        // Check for at least one Property with type and value
        for (const key in data) {
          const value = data[key];
          if (value && typeof value === 'object' && value.type === 'Property' && value.value !== undefined) {
            return true;
          }
        }
      }
    }
    return false;
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Add field to mapping
   */
  const handleAddField = (fieldName) => {
    if (!selectedPath || !fieldName.trim()) return;

    setFieldMapping(prev => ({
      ...prev,
      [fieldName.trim()]: selectedPath
    }));
    setSelectedPath(null);
  };

  /**
   * Remove field from mapping
   */
  const handleRemoveField = (fieldName) => {
    setFieldMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[fieldName];
      return newMapping;
    });
  };

  /**
   * Create new external source
   */
  const handleCreateSource = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !testUrlInput || !formData.latitude || !formData.longitude) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (test URL trước)');
      return;
    }
    
    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('❌ Latitude phải là số trong khoảng -90 đến 90');
      return;
    }
    
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('❌ Longitude phải là số trong khoảng -180 đến 180 (VD: 105.804817 cho Hà Nội)');
      return;
    }

    if (!isNGSILD && Object.keys(fieldMapping).length === 0) {
      setError('Vui lòng cấu hình mapping cho dữ liệu (hoặc test URL để tự động phát hiện NGSI-LD)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Extract stationId from URL if it contains stationId query param
      let stationId = '';
      
      try {
        const url = new URL(testUrlInput);
        const urlStationId = url.searchParams.get('stationId');
        
        if (urlStationId) {
          // URL already has stationId param → use it
          stationId = urlStationId;
          console.log('✅ Using stationId from URL:', stationId);
        } else {
          // No stationId in URL → auto-generate from name
          stationId = formData.name ? 'station-' + generateSlug(formData.name) : '';
          console.log('🔧 Auto-generated stationId:', stationId);
        }
      } catch (urlError) {
        // Invalid URL format → auto-generate stationId
        stationId = formData.name ? 'station-' + generateSlug(formData.name) : '';
        console.log('⚠️ URL parse failed, auto-generated stationId:', stationId);
      }

      const sourceData = {
        name: formData.name,
        stationId: stationId,
        url: testUrlInput, // Use URL from Step 1
        apiKey: testApiKeyInput || null, // Use API Key from Step 1
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        fetchIntervalMinutes: parseInt(formData.fetchIntervalMinutes),
        isNGSILD: isNGSILD,
        fieldMapping: isNGSILD ? null : {
          fields: fieldMapping,
          timestampPath: timestampPath || null
        }
      };

      console.log('📤 [Create Source] Sending data:', sourceData);
      
      const result = await externalSourcesService.create(sourceData);
      
      console.log('✅ [Create Source] Response:', result);
      
      // Check if creation was successful
      if (!result || result.success === false) {
        throw new Error(result?.error || 'Tạo source thất bại - không có response');
      }
      
      const intervalMinutes = parseInt(formData.fetchIntervalMinutes);
      setSuccess(`✅ Tạo External Source "${formData.name}" thành công!

⏳ Backend đang chờ fetch dữ liệu lần đầu (interval: ${intervalMinutes} phút).
📍 Marker sẽ xuất hiện trên bản đồ sau khi có dữ liệu từ API.
🔄 Hãy reload trang sau ${intervalMinutes} phút để xem marker trên map.

💡 Tip: Kiểm tra cột "Records" trong danh sách source để biết đã có dữ liệu chưa.`);
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        apiKey: '',
        latitude: '',
        longitude: '',
        fetchIntervalMinutes: 15
      });
      setFieldMapping({});
      setTimestampPath('');
      setJsonData(null);
      setShowMappingSection(false);
      setTestUrlInput('');
      setTestApiKeyInput('');
      setIsNGSILD(false);

      // Reload sources immediately
      await loadSources();
      
      // Auto-refresh after interval to check if data is fetched (only for short intervals)
      if (intervalMinutes <= 5) {
        const refreshDelay = (intervalMinutes + 0.5) * 60 * 1000; // Add 30s buffer
        console.log(`⏰ Will auto-refresh sources in ${intervalMinutes + 0.5} minutes...`);
        
        setTimeout(() => {
          console.log(`🔄 Auto-refreshing sources after ${intervalMinutes} min interval...`);
          loadSources();
        }, refreshDelay);
      }
    } catch (err) {
      console.error('❌ [Create Source] Error:', err);
      setError('❌ Lỗi tạo source: ' + (err.message || 'Không thể tạo source'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete external source
   */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa source "${name}"?`)) return;

    try {
      setLoading(true);
      await externalSourcesService.deleteSource(id);
      setSuccess('🗑️ Đã xóa External Source');
      loadSources();
    } catch (err) {
      setError('❌ Lỗi xóa: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reactivate external source
   */
  const handleReactivate = async (id) => {
    try {
      setLoading(true);
      await externalSourcesService.reactivate(id);
      setSuccess('✅ Đã kích hoạt lại source');
      loadSources();
    } catch (err) {
      setError('❌ Lỗi kích hoạt: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render JSON viewer with clickable values (matches HTML demo logic)
   */
  const renderJsonViewer = (data, path = '$') => {
    if (!data) return null;

    const elements = [];

    if (Array.isArray(data)) {
      elements.push(<div key={`${path}-open`}>{'['}</div>);
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        elements.push(
          <div key={itemPath} style={{ marginLeft: '1.25rem' }}>
            {renderJsonViewer(item, itemPath)}
          </div>
        );
      });
      elements.push(<div key={`${path}-close`}>{'],'}</div>);
    } else if (typeof data === 'object' && data !== null) {
      elements.push(<div key={`${path}-open`}>{'{'}</div>);
      Object.entries(data).forEach(([key, value]) => {
        const keyPath = path === '$' ? `$.${key}` : `${path}.${key}`;
        
        if (typeof value === 'object' && value !== null) {
          elements.push(
            <div key={keyPath} style={{ marginLeft: '1.25rem' }}>
              <span className="json-key">"{key}"</span>: {Array.isArray(value) ? '[' : '{'}
              {renderJsonViewer(value, keyPath)}
              <div>{Array.isArray(value) ? '],' : '},'}</div>
            </div>
          );
        } else {
          const valueClass = typeof value === 'number' ? 'json-number' : 
                           typeof value === 'string' ? 'json-string' : 'json-value';
          const displayValue = typeof value === 'string' ? `"${value}"` : String(value);
          
          elements.push(
            <div key={keyPath} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>
              <span className="json-key">"{key}"</span>:{' '}
              <span
                className={`json-value ${valueClass} ${selectedPath === keyPath ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedPath(keyPath);
                  const fieldName = window.prompt('Nhập tên trường (VD: PM2.5, CO2, Temperature):');
                  if (fieldName && fieldName.trim()) {
                    handleAddField(fieldName.trim());
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {displayValue}
              </span>,
            </div>
          );
        }
      });
      elements.push(<div key={`${path}-close`}>{'},'}</div>);
    } else {
      const valueClass = typeof data === 'number' ? 'json-number' : 
                       typeof data === 'string' ? 'json-string' : 'json-value';
      const displayValue = typeof data === 'string' ? `"${data}"` : String(data);
      
      elements.push(
        <span
          key={path}
          className={`json-value ${valueClass} ${selectedPath === path ? 'selected' : ''}`}
          onClick={() => {
            setSelectedPath(path);
            const fieldName = window.prompt('Nhập tên trường (VD: PM2.5, CO2, Temperature):');
            if (fieldName && fieldName.trim()) {
              handleAddField(fieldName.trim());
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {displayValue}
        </span>
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className="external-source-manager">
      {/* Header */}
      <div className="manager-header">
        <h2>🔗 Quản lý API bên thứ 3</h2>
        <p>Kết nối với các API bên ngoài để tự động thu thập dữ liệu chất lượng không khí</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button className="alert-close" onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Step 1: Test URL */}
      <div className="form-section">
        <div className="section-badge">Bước 1</div>
        <h3>Kiểm tra kết nối API</h3>
        
        <div className="form-group">
          <label>URL Endpoint</label>
          <input
            type="text"
            value={testUrlInput}
            onChange={(e) => setTestUrlInput(e.target.value)}
            placeholder="https://api.openaq.org/v3/locations/4946811/latest"
          />
        </div>

        <div className="form-group">
          <label>API Key (tùy chọn)</label>
          <input
            type="text"
            value={testApiKeyInput}
            onChange={(e) => setTestApiKeyInput(e.target.value)}
            placeholder="Nhập API key nếu cần"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleTestUrl}
          disabled={testLoading}
        >
          {testLoading ? '🔄 Đang test...' : '🔌 Test kết nối'}
        </button>
      </div>

      {/* Step 2: Mapping (only for non-NGSI-LD) */}
      {showMappingSection && (
        <div className="form-section">
          <div className="section-badge">Bước 2</div>
          <h3>Định dạng dữ liệu</h3>
          
          {isNGSILD ? (
            <div className="alert alert-info">
              ✅ Tự động phát hiện: API này trả về chuẩn NGSI-LD. Không cần mapping thủ công.
            </div>
          ) : (
            <>
              <div className="alert alert-info">
                📍 Hướng dẫn: Click vào giá trị trong JSON bên dưới để chọn trường dữ liệu. Nhập tên trường đo (PM2.5, CO2, Temperature...) và trường sẽ được thêm vào mapping.
              </div>

              <div className="mapping-grid">
                <div className="json-viewer-container">
                  <h4>JSON Response</h4>
                  <div className="json-viewer">
                    {renderJsonViewer(jsonData)}
                  </div>
                </div>

                <div className="mapping-panel">
                  <h4>Field Mapping</h4>
                  {Object.keys(fieldMapping).length === 0 ? (
                    <p className="empty-mapping">Chưa có trường nào. Click vào JSON để thêm.</p>
                  ) : (
                    <div className="field-list">
                      {Object.entries(fieldMapping).map(([fieldName, path]) => (
                        <div key={fieldName} className="field-item">
                          <span className="field-name">{fieldName}</span>
                          <span className="field-path">{path}</span>
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveField(fieldName)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Source Configuration */}
      <form onSubmit={handleCreateSource} className="form-section">
        <div className="section-badge">Bước 3</div>
        <h3>Thông tin nguồn dữ liệu</h3>
        
        <div className="form-group">
          <label>
            Tên nguồn dữ liệu <span className="required">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="VD: OpenAQ Hanoi Central Station"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Latitude (vĩ độ) <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              placeholder="21.028511"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Longitude (kinh độ) <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              placeholder="105.804817"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            Chu kỳ lấy dữ liệu (phút) <span className="required">*</span>
          </label>
          <input
            type="number"
            name="fetchIntervalMinutes"
            value={formData.fetchIntervalMinutes}
            onChange={handleInputChange}
            min="1"
            placeholder="15"
            required
          />
          <small>Khuyến nghị: 15-60 phút để tránh quá tải API</small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? '🔄 Đang tạo...' : '✅ Lưu cấu hình'}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadSources}
            disabled={loading}
          >
            🔄 Refresh List
          </button>
        </div>
      </form>

      {/* Sources List */}
      <div className="sources-section">
        <h3>📋 Danh sách External Sources</h3>
        
        {loading && <LoadingSpinner />}
        
        {!loading && sources.length === 0 && (
          <div className="empty-state">
            <p>Chưa có external source nào</p>
          </div>
        )}

        {!loading && sources.length > 0 && (
          <div className="sources-grid">
            {sources.map(source => (
              <div key={source.id} className={`source-card ${source.isActive ? 'active' : 'inactive'}`}>
                <div className="source-header">
                  <h4>
                    {source.name} {source.isActive ? '🟢' : '🔴'}
                  </h4>
                  <span className="format-badge">
                    {source.isNGSILD ? 'NGSI-LD' : 'Custom JSON'}
                  </span>
                </div>
                
                <div className="source-info">
                  <p><strong>Vị trí:</strong> {source.latitude}, {source.longitude}</p>
                  <p><strong>Chu kỳ lấy dữ liệu:</strong> {source.intervalMinutes} phút</p>
                  <p><strong>Bản ghi:</strong> {source.recordCount !== undefined ? source.recordCount : '...'}</p>
                  <p><strong>Lần lấy cuối:</strong> {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
                  {source.lastError && (
                    <p className="error-text"><strong>Error:</strong> {source.lastError}</p>
                  )}
                </div>

                <div className="source-actions">
                  {!source.isActive && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleReactivate(source.id)}
                      disabled={loading}
                    >
                      ▶️ Reactivate
                    </button>
                  )}
                  
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(source.id, source.name)}
                    disabled={loading}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalSourceManager;
