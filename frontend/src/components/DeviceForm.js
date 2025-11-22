// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

import React, { useState, useEffect } from 'react';
import './DeviceForm.css';

/**
 * Device Form Component
 * Form for creating/editing devices
 */
const DeviceForm = ({ device, onSubmit, onCancel, isLoading }) => {
  const isEditMode = !!device;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    deviceId: '',
    deviceType: 'Air Quality Sensor',
    location: '',
    status: 'Active',
    description: '',
    firmwareVersion: '',
    isOnline: true
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Initialize form with device data if editing
  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || '',
        deviceId: device.deviceId || '',
        deviceType: device.deviceType || 'Air Quality Sensor',
        location: device.location || '',
        status: device.status || 'Active',
        description: device.description || '',
        firmwareVersion: device.firmwareVersion || '',
        isOnline: device.isOnline !== undefined ? device.isOnline : true
      });
    }
  }, [device]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên thiết bị là bắt buộc';
    }

    if (!formData.deviceId.trim()) {
      newErrors.deviceId = 'Device ID là bắt buộc';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(formData.deviceId)) {
      newErrors.deviceId = 'Device ID chỉ chứa chữ, số, dấu gạch ngang và gạch dưới';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Vị trí là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="device-form">
      <div className="form-header">
        <h2>{isEditMode ? '✏️ Chỉnh sửa thiết bị' : '➕ Thêm thiết bị mới'}</h2>
        <button 
          className="btn-close" 
          onClick={onCancel}
          disabled={isLoading}
          title="Đóng"
        >
          ✖️
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-body">
        {/* Device Name */}
        <div className="form-group">
          <label htmlFor="name" className="required">
            📝 Tên thiết bị
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="VD: Cảm biến Hoàn Kiếm 01"
            className={errors.name ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        {/* Device ID */}
        <div className="form-group">
          <label htmlFor="deviceId" className="required">
            🔑 Device ID
          </label>
          <input
            type="text"
            id="deviceId"
            name="deviceId"
            value={formData.deviceId}
            onChange={handleChange}
            placeholder="VD: sensor-hoan-kiem-01"
            className={errors.deviceId ? 'input-error' : ''}
            disabled={isLoading || isEditMode} // Device ID cannot be changed in edit mode
          />
          {errors.deviceId && <span className="error-message">{errors.deviceId}</span>}
          {isEditMode && <small className="form-hint">Device ID không thể thay đổi</small>}
        </div>

        {/* Location */}
        <div className="form-group">
          <label htmlFor="location" className="required">
            📍 Vị trí
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="VD: Quận Hoàn Kiếm, Hà Nội"
            className={errors.location ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.location && <span className="error-message">{errors.location}</span>}
        </div>

        {/* Device Type */}
        <div className="form-group">
          <label htmlFor="deviceType">
            🔧 Loại thiết bị
          </label>
          <select
            id="deviceType"
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="Air Quality Sensor">Air Quality Sensor</option>
            <option value="Weather Station">Weather Station</option>
            <option value="PM2.5 Monitor">PM2.5 Monitor</option>
            <option value="Multi-Sensor">Multi-Sensor</option>
          </select>
        </div>

        {/* Status */}
        <div className="form-group">
          <label htmlFor="status">
            📊 Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="Active">✅ Hoạt động</option>
            <option value="Inactive">⏸️ Không hoạt động</option>
            <option value="Maintenance">🔧 Bảo trì</option>
            <option value="Error">❌ Lỗi</option>
          </select>
        </div>

        {/* Firmware Version */}
        <div className="form-group">
          <label htmlFor="firmwareVersion">
            ⚙️ Phiên bản Firmware
          </label>
          <input
            type="text"
            id="firmwareVersion"
            name="firmwareVersion"
            value={formData.firmwareVersion}
            onChange={handleChange}
            placeholder="VD: v1.2.3"
            disabled={isLoading}
          />
        </div>

        {/* Online Status */}
        <div className="form-group form-group-checkbox">
          <label htmlFor="isOnline">
            <input
              type="checkbox"
              id="isOnline"
              name="isOnline"
              checked={formData.isOnline}
              onChange={handleChange}
              disabled={isLoading}
            />
            <span>🌐 Thiết bị đang trực tuyến</span>
          </label>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            📄 Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả chi tiết về thiết bị..."
            rows="3"
            disabled={isLoading}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            ❌ Hủy
          </button>
          <button
            type="submit"
            className="btn btn-submit"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Đang xử lý...' : (isEditMode ? '💾 Lưu thay đổi' : '➕ Thêm thiết bị')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeviceForm;
