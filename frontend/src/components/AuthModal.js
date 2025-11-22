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
import './AuthModal.css';

/**
 * Auth Modal Component
 * Modal for Login and Register
 */
const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Register mode validations
    if (mode === 'register') {
      // Username validation
      if (!formData.username) {
        newErrors.username = 'Tên người dùng là bắt buộc';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
      } else if (formData.username.length > 20) {
        newErrors.username = 'Tên người dùng không được quá 20 ký tự';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu không khớp';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      // Import usersService dynamically to avoid circular dependencies
      const { login, signup } = await import('../services/api/usersService');

      if (mode === 'login') {
        // Login
        const result = await login({
          email: formData.email,
          password: formData.password
        });

        console.log('[AuthModal] Login result:', result);

        if (result.success) {
          // Call parent callback with user data
          onLoginSuccess(result.user);
          handleClose();
        } else {
          setServerError(result.error || 'Đăng nhập thất bại');
        }
      } else {
        // Register
        const result = await signup({
          email: formData.email,
          password: formData.password,
          name: formData.username // Backend expects 'name' field
        });

        console.log('[AuthModal] Signup result:', result);

        if (result.success) {
          // Show success message and switch to login
          alert(result.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
          setMode('login');
          setFormData(prev => ({
            ...prev,
            password: '', // Clear password for security
            username: '',
            confirmPassword: ''
          }));
        } else {
          setServerError(result.error || 'Đăng ký thất bại');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setServerError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    });
    setErrors({});
    setServerError('');
    setMode('login');
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
    setServerError('');
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>×</button>
        
        <div className="modal-header">
          <h2>{mode === 'login' ? '🔐 Đăng nhập' : '📝 Đăng ký'}</h2>
          <p className="modal-subtitle">
            {mode === 'login' 
              ? 'Đăng nhập để truy cập quản lý thiết bị và người dùng' 
              : 'Tạo tài khoản mới để sử dụng SmartAir City'}
          </p>
        </div>

        {serverError && (
          <div className="auth-error">
            ❌ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username">
                Tên người dùng <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
                placeholder="Nhập tên người dùng"
                disabled={isLoading}
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Nhập email"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Mật khẩu <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <span className="eye-slash">👁</span>
                ) : (
                  <span>👁</span>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Xác nhận mật khẩu <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Nhập lại mật khẩu"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? (
                    <span className="eye-slash">👁</span>
                  ) : (
                    <span>👁</span>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-submit"
            disabled={isLoading}
          >
            {isLoading 
              ? '⏳ Đang xử lý...' 
              : mode === 'login' ? '🔓 Đăng nhập' : '✅ Đăng ký'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' 
              ? 'Chưa có tài khoản? ' 
              : 'Đã có tài khoản? '}
            <button 
              className="btn-switch" 
              onClick={switchMode}
              disabled={isLoading}
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
