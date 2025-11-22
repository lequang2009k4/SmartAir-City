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

import React, { useState } from 'react';
import useDevices from '../hooks/useDevices';
import DeviceList from './DeviceList';
import DeviceForm from './DeviceForm';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { devicesService } from '../services';
import './DeviceManagement.css';

/**
 * Device Management Container
 * Main page for CRUD operations on IoT devices
 */
const DeviceManagement = () => {
  const {
    devices,
    isLoading,
    error,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice
  } = useDevices({ autoFetch: true });

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Filter devices based on search and status
  const filteredDevices = devices.filter(device => {
    // Search filter
    const matchesSearch = !searchQuery || 
      device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && device.status === 'Active') ||
      (statusFilter === 'inactive' && device.status !== 'Active');

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'Active').length,
    inactive: devices.filter(d => d.status !== 'Active').length,
    online: devices.filter(d => d.isOnline).length
  };

  /**
   * Handle Add Device
   */
  const handleAddDevice = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };
  /**
   * Handle Toggle Device Status
   */
  const handleToggleStatus = async (device) => {
    const newStatus = device.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = newStatus === 'active' 
      ? `Bạn có muốn BẬT thiết bị "${device.deviceName}"?`
      : `Bạn có muốn TẮT thiết bị "${device.deviceName}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await devicesService.updateDeviceStatus(device.id, newStatus);
      alert(result.message || 'Đã cập nhật trạng thái thành công!');
      // Refresh devices to show updated status
      fetchDevices();
    } catch (err) {
      alert(`Lỗi khi cập nhật trạng thái: ${err.message}`);
    }
  };

  /**
   * Handle View Device Details
   */
  const handleViewDetails = async (device) => {
    try {
      // Fetch full device details
      const fullDevice = await devicesService.getDeviceById(device.id);
      setSelectedDevice(fullDevice);
      setShowDeviceDetails(true);
    } catch (err) {
      alert(`Lỗi khi tải thông tin thiết bị: ${err.message}`);
    }
  };

  /**
   * Handle Delete Device
   */
  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      return;
    }

    try {
      await deleteDevice(deviceId);
      alert('Đã xóa thiết bị thành công!');
    } catch (err) {
      alert(`Lỗi khi xóa thiết bị: ${err.message}`);
    }
  };

  /**
   * Handle Form Submit (Create or Update)
   */
  const handleFormSubmit = async (deviceData) => {
    try {
      if (editingDevice) {
        // Update existing device
        await updateDevice(editingDevice.id, deviceData);
        alert('Đã cập nhật thiết bị thành công!');
      } else {
        // Create new device
        await createDevice(deviceData);
        alert('Đã thêm thiết bị mới thành công!');
      }
      
      setIsFormOpen(false);
      setEditingDevice(null);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  /**
   * Handle Form Cancel
   */
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  /**
   * Handle Refresh
   */
  const handleRefresh = () => {
    fetchDevices();
  };

  return (
    <div className="device-management">
      {/* Header */}
      <div className="device-management-header">
        <div className="header-left">
          <h1>Quản lý Thiết bị IoT</h1>
          <p className="subtitle">Quản lý và giám sát tất cả các cảm biến chất lượng không khí</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-refresh" 
            onClick={handleRefresh}
            disabled={isLoading}
            title="Làm mới dữ liệu"
          >
            🔄 Làm mới
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleAddDevice}
            disabled={isLoading}
          >
            ➕ Thêm thiết bị mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="device-filters">
        <div className="filter-group">
          <label htmlFor="search">Tìm kiếm:</label>
          <input
            id="search"
            type="text"
            placeholder="Tên thiết bị, Device ID, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="status-filter">Trạng thái:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả ({stats.total})</option>
            <option value="active">Hoạt động ({stats.active})</option>
            <option value="inactive">Không hoạt động ({stats.inactive})</option>
          </select>
        </div>

        <div className="filter-results">
          Hiển thị <strong>{filteredDevices.length}</strong> / {stats.total} thiết bị
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={handleRefresh}
        />
      )}

      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}

      {/* Device List */}
      {!isLoading && !error && (
        <DeviceList
          devices={filteredDevices}
          onToggleStatus={handleToggleStatus}
          onViewDetails={handleViewDetails}
          onDelete={handleDeleteDevice}
        />
      )}

      {/* Device Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={handleFormCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <DeviceForm
              device={editingDevice}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      {showDeviceDetails && selectedDevice && (
        <div className="modal-overlay" onClick={() => setShowDeviceDetails(false)}>
          <div className="modal-content device-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📡 Chi tiết thiết bị</h2>
              <button className="modal-close" onClick={() => setShowDeviceDetails(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Thông tin cơ bản</h3>
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedDevice.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Device ID:</span>
                  <span className="detail-value">{selectedDevice.deviceId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tên thiết bị:</span>
                  <span className="detail-value">{selectedDevice.deviceName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Loại:</span>
                  <span className="detail-value">{selectedDevice.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Trạng thái:</span>
                  <span className={`status-badge status-${selectedDevice.status}`}>
                    {selectedDevice.status === 'active' ? '✅ Hoạt động' : '⏸️ Không hoạt động'}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Thông số kỹ thuật</h3>
                <div className="detail-row">
                  <span className="detail-label">Đo đạc:</span>
                  <span className="detail-value">{selectedDevice.observedProperty}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Khu vực quan tâm:</span>
                  <span className="detail-value">{selectedDevice.featureOfInterest}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Vị trí</h3>
                <div className="detail-row">
                  <span className="detail-label">Loại:</span>
                  <span className="detail-value">{selectedDevice.location?.type || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tọa độ:</span>
                  <span className="detail-value">
                    {selectedDevice.location?.coordinates 
                      ? `[${selectedDevice.location.coordinates[0]}, ${selectedDevice.location.coordinates[1]}]`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {selectedDevice.description && (
                <div className="detail-section">
                  <h3>Mô tả</h3>
                  <p className="detail-description">{selectedDevice.description}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowDeviceDetails(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
