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

/**
 * Error Handler Utilities
 * Chuẩn hóa error messages từ API responses
 */

// ============================================
// ERROR TYPES
// ============================================
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// ============================================
// ERROR MESSAGES (Vietnamese)
// ============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
  SERVER_ERROR: 'Lỗi server. Vui lòng thử lại sau.',
  CLIENT_ERROR: 'Yêu cầu không hợp lệ.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này.',
  FORBIDDEN: 'Bạn không có quyền truy cập.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  UNKNOWN_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
};

// ============================================
// NORMALIZE ERROR
// ============================================

/**
 * Chuẩn hóa error object từ Axios
 * @param {Error} error - Axios error object
 * @returns {object} Normalized error với type, message, status
 */
export const normalizeError = (error) => {
  // Network error (không có response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        type: ERROR_TYPES.TIMEOUT_ERROR,
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        status: null,
        originalError: error,
      };
    }
    
    return {
      type: ERROR_TYPES.NETWORK_ERROR,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      status: null,
      originalError: error,
    };
  }

  // Server có response
  const { status, data } = error.response;

  // Xác định error type dựa vào status code
  let errorType = ERROR_TYPES.UNKNOWN_ERROR;
  let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;

  if (status === 400) {
    errorType = ERROR_TYPES.VALIDATION_ERROR;
    errorMessage = data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
  } else if (status === 401) {
    errorType = ERROR_TYPES.UNAUTHORIZED;
    errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
  } else if (status === 403) {
    errorType = ERROR_TYPES.FORBIDDEN;
    errorMessage = ERROR_MESSAGES.FORBIDDEN;
  } else if (status === 404) {
    errorType = ERROR_TYPES.NOT_FOUND;
    errorMessage = data?.message || ERROR_MESSAGES.NOT_FOUND;
  } else if (status >= 400 && status < 500) {
    errorType = ERROR_TYPES.CLIENT_ERROR;
    errorMessage = data?.message || ERROR_MESSAGES.CLIENT_ERROR;
  } else if (status >= 500) {
    errorType = ERROR_TYPES.SERVER_ERROR;
    errorMessage = ERROR_MESSAGES.SERVER_ERROR;
  }

  return {
    type: errorType,
    message: errorMessage,
    status,
    data: data || null,
    originalError: error,
  };
};

// ============================================
// ERROR LOGGER
// ============================================

/**
 * Log error chi tiết (chỉ trong development)
 * @param {object} normalizedError - Normalized error object
 * @param {string} context - Context info (endpoint, method)
 */
export const logError = (normalizedError, context = '') => {
  if (process.env.REACT_APP_DEBUG_MODE === 'true') {
    console.group(`API Error${context ? `: ${context}` : ''}`);
    console.error('Type:', normalizedError.type);
    console.error('Message:', normalizedError.message);
    console.error('Status:', normalizedError.status);
    if (normalizedError.data) {
      console.error('Data:', normalizedError.data);
    }
    console.error('Original Error:', normalizedError.originalError);
    console.groupEnd();
  }
};

// ============================================
// ERROR HANDLER (for React components)
// ============================================

/**
 * Handle error và set state cho React component
 * @param {Error} error - Axios error
 * @param {Function} setErrorState - setState function
 * @param {string} context - Context info
 */
export const handleApiError = (error, setErrorState, context = '') => {
  const normalizedError = normalizeError(error);
  logError(normalizedError, context);
  
  if (setErrorState) {
    setErrorState(normalizedError.message);
  }
  
  return normalizedError;
};

// ============================================
// HELPER: Check if error is specific type
// ============================================

export const isNetworkError = (error) => error?.type === ERROR_TYPES.NETWORK_ERROR;
export const isTimeoutError = (error) => error?.type === ERROR_TYPES.TIMEOUT_ERROR;
export const isServerError = (error) => error?.type === ERROR_TYPES.SERVER_ERROR;
export const isUnauthorized = (error) => error?.type === ERROR_TYPES.UNAUTHORIZED;
export const isNotFound = (error) => error?.type === ERROR_TYPES.NOT_FOUND;

// Default export
const errorHandler = {
  ERROR_TYPES,
  ERROR_MESSAGES,
  normalizeError,
  logError,
  handleApiError,
  isNetworkError,
  isTimeoutError,
  isServerError,
  isUnauthorized,
  isNotFound,
};

export default errorHandler;
