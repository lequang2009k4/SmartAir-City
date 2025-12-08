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
import './UserForm.css';

/**
 * User Form Component
 * Form for creating/editing users
 */
const UserForm = ({ user, onSubmit, onCancel, isLoading }) => {
  const isEditMode = !!user;

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'user',
    isActive: true
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Initialize form with user data if editing
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Never pre-fill password
        confirmPassword: '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    }
  }, [user]);

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

    // Username
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập: 3-20 ký tự, chỉ chữ, số và dấu gạch dưới';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Password (required for new users)
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu không khớp';
      }
    }

    // Password (optional for edit, but validate if provided)
    if (isEditMode && formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu không khớp';
      }
    }

    // Full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
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

    // Prepare data
    const submitData = { ...formData };
    
    // Remove password fields if editing and password is empty
    if (isEditMode && !submitData.password) {
      delete submitData.password;
      delete submitData.confirmPassword;
    }
    
    // Always remove confirmPassword
    delete submitData.confirmPassword;

    onSubmit(submitData);
  };

  return (
    <div className="user-form">
      <div className="form-header">
        <h2>{isEditMode ? '✏️ Chỉnh sửa người dùng' : '➕ Thêm người dùng mới'}</h2>
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
        {/* Username */}
        <div className="form-group">
          <label htmlFor="username" className="required">
            👤 Tên đăng nhập
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="VD: john_doe"
            className={errors.username ? 'input-error' : ''}
            disabled={isLoading || isEditMode} // Username cannot be changed
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
          {isEditMode && <small className="form-hint">Tên đăng nhập không thể thay đổi</small>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="required">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="VD: john@example.com"
            className={errors.email ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName" className="required">
            Họ và tên
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="VD: Nguyễn Văn A"
            className={errors.fullName ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.fullName && <span className="error-message">{errors.fullName}</span>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone">
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="VD: 0912345678"
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className={!isEditMode ? 'required' : ''}>
            Mật khẩu {isEditMode && '(để trống nếu không đổi)'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ít nhất 6 ký tự"
            className={errors.password ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className={!isEditMode ? 'required' : ''}>
            🔒 Xác nhận mật khẩu
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            className={errors.confirmPassword ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        {/* Role */}
        <div className="form-group">
          <label htmlFor="role">
            👑 Vai trò
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="user">👤 Người dùng</option>
            <option value="admin">👑 Quản trị viên</option>
            <option value="moderator">👮 Điều hành viên</option>
          </select>
        </div>

        {/* Active Status */}
        <div className="form-group form-group-checkbox">
          <label htmlFor="isActive">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={isLoading}
            />
            <span>Tài khoản đang hoạt động</span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : (isEditMode ? 'Lưu thay đổi' : 'Thêm người dùng')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
