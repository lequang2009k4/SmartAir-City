// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ 
  title = 'Đã xảy ra lỗi', 
  message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.', 
  onRetry,
  type = 'error' // 'error', 'warning', 'info'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-message ${type}`}>
      <div className="error-icon">{getIcon()}</div>
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-text">{message}</p>
        {onRetry && (
          <button className="retry-button" onClick={onRetry}>
            🔄 Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
