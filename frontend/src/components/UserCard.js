import React from 'react';
import './UserCard.css';

/**
 * User Card Component
 * Displays individual user information
 */
const UserCard = ({ user, onEdit, onDelete }) => {
  // Get role badge
  const getRoleBadge = (role) => {
    const roleMap = {
      'admin': { label: 'Quản trị viên', className: 'role-admin', icon: '👑' },
      'Admin': { label: 'Quản trị viên', className: 'role-admin', icon: '👑' },
      'user': { label: 'Người dùng', className: 'role-user', icon: '👤' },
      'User': { label: 'Người dùng', className: 'role-user', icon: '👤' },
      'moderator': { label: 'Điều hành viên', className: 'role-moderator', icon: '👮' }
    };
    
    return roleMap[role] || { label: role || 'N/A', className: 'role-unknown', icon: '❓' };
  };

  // Get active status
  const getActiveStatus = (isActive) => {
    return isActive 
      ? { label: 'Hoạt động', className: 'active-yes', icon: '✅' }
      : { label: 'Vô hiệu hóa', className: 'active-no', icon: '⛔' };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const roleBadge = getRoleBadge(user.role);
  const activeStatus = getActiveStatus(user.isActive);

  return (
    <div className={`user-card ${user.isActive ? 'user-active' : 'user-inactive'}`}>
      {/* Card Header */}
      <div className="user-card-header">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {(user.username || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="user-title">
          <h3>{user.fullName || user.username || 'Unknown User'}</h3>
          <span className="user-username">@{user.username || 'N/A'}</span>
        </div>
        <div className={`active-indicator ${activeStatus.className}`} title={activeStatus.label}>
          {activeStatus.icon}
        </div>
      </div>

      {/* Card Body */}
      <div className="user-card-body">
        {/* Role */}
        <div className="user-field">
          <span className="field-label">Vai trò:</span>
          <span className={`role-badge ${roleBadge.className}`}>
            {roleBadge.icon} {roleBadge.label}
          </span>
        </div>

        {/* Email */}
        <div className="user-field">
          <span className="field-label">📧 Email:</span>
          <span className="field-value">{user.email || 'N/A'}</span>
        </div>

        {/* Phone */}
        {user.phone && (
          <div className="user-field">
            <span className="field-label">📱 Điện thoại:</span>
            <span className="field-value">{user.phone}</span>
          </div>
        )}

        {/* Created Date */}
        <div className="user-field">
          <span className="field-label">📅 Ngày tạo:</span>
          <span className="field-value">{formatDate(user.createdAt)}</span>
        </div>

        {/* Last Login */}
        {user.lastLogin && (
          <div className="user-field">
            <span className="field-label">🕐 Đăng nhập:</span>
            <span className="field-value">{formatDate(user.lastLogin)}</span>
          </div>
        )}

        {/* Status */}
        <div className="user-field">
          <span className="field-label">Trạng thái:</span>
          <span className={`status-badge ${activeStatus.className}`}>
            {activeStatus.icon} {activeStatus.label}
          </span>
        </div>
      </div>

      {/* Card Footer - Actions */}
      <div className="user-card-footer">
        <button 
          className="btn btn-edit"
          onClick={onEdit}
          title="Chỉnh sửa người dùng"
        >
          ✏️ Sửa
        </button>
        <button 
          className="btn btn-delete"
          onClick={onDelete}
          title="Xóa người dùng"
        >
          🗑️ Xóa
        </button>
      </div>
    </div>
  );
};

export default UserCard;
