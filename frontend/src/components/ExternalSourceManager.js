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
import ExternalSourceInfoModal from './ExternalSourceInfoModal';
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
    latitude: '',
    longitude: '',
    intervalMinutes: 60
  });

  // Test state
  const [testUrlInput, setTestUrlInput] = useState('');
  const [testApiKeyInput, setTestApiKeyInput] = useState('');
  const [jsonData, setJsonData] = useState(null);

  // UI state
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSaveSection, setShowSaveSection] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [pendingTest, setPendingTest] = useState(false);

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
            // Get ALL records for this stationId to count them (pass null for no limit)
            const records = await getAll(null, source.stationId, true);
            const recordCount = Array.isArray(records) ? records.length : 0;
            console.log(`📊 [${source.stationId}] Total record count:`, recordCount);
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
   * Test API URL - Show confirmation modal first
   */
  const handleTestUrl = () => {
    if (!testUrlInput) {
      setError('Vui lòng nhập URL');
      return;
    }

    // Show modal for confirmation
    setPendingTest(true);
    setShowInfoModal(true);
  };

  /**
   * Execute actual test after user confirms
   */
  const executeTest = async () => {
    try {
      setTestLoading(true);
      setError(null);
      setSuccess(null);
      setShowInfoModal(false);
      setPendingTest(false);

      // Build headers object
      const headers = {};
      if (testApiKeyInput) {
        headers['X-API-Key'] = testApiKeyInput;
      }

      const testData = {
        url: testUrlInput,
        headers: Object.keys(headers).length > 0 ? headers : undefined
      };

      const result = await externalSourcesService.testUrl(testData);
      
      // Extract actual data from service response wrapper
      const actualData = result.data || result;
      setJsonData(actualData);

      // Auto-detect NGSI-LD format
      const detected = detectNGSILD(actualData);
      
      if (detected) {
        setSuccess('✅ Phát hiện dữ liệu chuẩn NGSI-LD! Bạn có thể tiếp tục lưu cấu hình.');
        setShowSaveSection(true);
      } else {
        setError('❌ API phải trả về chuẩn NGSI-LD! Expected: id (URN), type (AirQualityObserved), Properties structure.');
        setShowSaveSection(false);
      }
    } catch (err) {
      setError('❌ Test thất bại: ' + (err.message || 'Không thể kết nối'));
      setJsonData(null);
      setShowSaveSection(false);
    } finally {
      setTestLoading(false);
    }
  };

  /**
   * Detect if JSON is NGSI-LD format (allows both PascalCase and camelCase)
   */
  const detectNGSILD = (data) => {
    if (!data || typeof data !== 'object') return false;

    // Check for NGSI-LD structure
    const hasValidId = data.id && typeof data.id === 'string' && data.id.startsWith('urn:ngsi-ld:');
    const hasValidType = data.type === 'AirQualityObserved' || data.type === 'airQualityObserved';
    
    if (hasValidId && hasValidType) {
      // Check for at least one Property with type and value
      for (const key in data) {
        const value = data[key];
        if (value && typeof value === 'object' && value.type === 'Property' && value.value !== undefined) {
          return true;
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

      // Build headers object
      const headers = {};
      if (testApiKeyInput) {
        headers['X-API-Key'] = testApiKeyInput;
      }

      const sourceData = {
        name: formData.name,
        stationId: stationId,
        url: testUrlInput,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        intervalMinutes: parseInt(formData.intervalMinutes),
        isNGSILD: true // Always true for new API
      };

      console.log('📤 [Create Source] Sending data:', sourceData);
      
      const result = await externalSourcesService.create(sourceData);
      
      console.log('✅ [Create Source] Response:', result);
      
      // Check if creation was successful
      if (!result || result.success === false) {
        throw new Error(result?.error || 'Tạo source thất bại - không có response');
      }
      
      const intervalMinutes = parseInt(formData.intervalMinutes);
      setSuccess(`✅ Tạo External Source "${formData.name}" thành công!

⏳ Backend đang chờ fetch dữ liệu lần đầu (interval: ${intervalMinutes} phút).
📍 Marker sẽ xuất hiện trên bản đồ sau khi có dữ liệu từ API.
🔄 Hãy reload trang sau ${intervalMinutes} phút để xem marker trên map.

💡 Tip: Kiểm tra cột "Records" trong danh sách source để biết đã có dữ liệu chưa.`);
      
      // Reset form
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        intervalMinutes: 60
      });
      setJsonData(null);
      setShowSaveSection(false);
      setTestUrlInput('');
      setTestApiKeyInput('');

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
   * Render simple JSON preview (read-only)
   */
  const renderJsonPreview = (data) => {
    if (!data) return null;
    return (
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '8px', 
        overflow: 'auto',
        maxHeight: '400px',
        fontSize: '0.875rem'
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="external-source-manager">
      {/* Header */}
      <div className="manager-header">
        <h2>Quản lý API bên thứ 3</h2>
        <p>Kết nối với các API bên ngoài để tự động thu thập dữ liệu chất lượng không khí</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button className="alert-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Info Modal */}
      <ExternalSourceInfoModal 
        isOpen={showInfoModal} 
        onClose={() => {
          setShowInfoModal(false);
          setPendingTest(false);
        }}
        onConfirm={pendingTest ? executeTest : undefined}
        showConfirmButton={pendingTest}
        confirmText="✓ Tôi đồng ý và tiếp tục test"
      />

      {/* Info Button */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button 
          className="btn btn-primary"
          onClick={() => setShowInfoModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          📌 Hướng dẫn đóng góp dữ liệu
        </button>
        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Vui lòng đọc kỹ trước khi thêm nguồn dữ liệu
        </span>
      </div>

      {/* Step 1: Test URL */}
      {!showSaveSection && (
        <div className="form-section">
          <h3>🧪 Test API Endpoint</h3>
          
          <div className="form-group">
            <label>URL Endpoint <span className="required">*</span></label>
            <input
              type="text"
              value={testUrlInput}
              onChange={(e) => setTestUrlInput(e.target.value)}
              placeholder="https://api.example.com/ngsi-ld/airquality"
            />
          </div>

          <div className="form-group">
            <label>API Key (tùy chọn)</label>
            <input
              type="text"
              value={testApiKeyInput}
              onChange={(e) => setTestApiKeyInput(e.target.value)}
              placeholder="Enter API key if required"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTestUrl}
            disabled={testLoading || !testUrlInput}
          >
            {testLoading ? '🔍 Testing...' : '🔍 Test Connection'}
          </button>

          {jsonData && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>API Response Preview:</h4>
              {renderJsonPreview(jsonData)}
            </div>
          )}
        </div>
      )}
      {/* Step 2: Save Configuration */}
      {showSaveSection && (
        <form onSubmit={handleCreateSource} className="form-section">
          <h3>💾 Save Configuration</h3>
          
          <div className="form-group">
            <label>
              Tên nguồn dữ liệu <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Example: OpenAQ Hanoi Station"
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
                placeholder="21.0491"
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
                placeholder="105.8831"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Interval (minutes) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="intervalMinutes"
              value={formData.intervalMinutes}
              onChange={handleInputChange}
              min="1"
              placeholder="60"
              required
            />
            <small>Khuyến nghị: 15-60 phút để tránh quá tải API</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowSaveSection(false);
              }}
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : '💾 Save Source'}
            </button>
          </div>
        </form>
      )}

      {/* Sources List */}
      <div className="sources-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Danh sách External Sources</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadSources}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        
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
                    {source.name}
                    <span className={`status-badge ${source.isActive ? 'active' : 'inactive'}`}>
                      {source.isActive ? 'Active' : 'Inactive'}
                    </span>
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
                      Reactivate
                    </button>
                  )}
                  
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(source.id, source.name)}
                    disabled={loading}
                  >
                    Xóa
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
