import React from 'react';
import UserCard from './UserCard';
import './UserList.css';

/**
 * User List Component
 * Displays all users in a grid layout
 */
const UserList = ({ users, onEdit, onDelete }) => {
  if (!users || users.length === 0) {
    return (
      <div className="user-list-empty">
        <div className="empty-icon">👤</div>
        <h3>Không có người dùng nào</h3>
        <p>Nhấn "Thêm người dùng" để tạo tài khoản mới</p>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="user-grid">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={() => onEdit(user)}
            onDelete={() => onDelete(user.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default UserList;
