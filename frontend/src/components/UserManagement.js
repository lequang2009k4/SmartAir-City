import React, { useState, useEffect } from 'react';
import { usersService } from '../services';
import UserList from './UserList';
import UserForm from './UserForm';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './UserManagement.css';

/**
 * User Management Container (Admin Only)
 * Main page for CRUD operations on users
 */
const UserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, admin, user

  /**
   * Fetch all users
   */
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await usersService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'all' || 
      user.role?.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  // Statistics
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role?.toLowerCase() === 'admin').length,
    regularUsers: users.filter(u => u.role?.toLowerCase() === 'user').length,
    active: users.filter(u => u.isActive).length
  };

  /**
   * Handle Add User
   */
  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  /**
   * Handle Edit User
   */
  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  /**
   * Handle Delete User
   */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      setIsLoading(true);
      await usersService.deleteUser(userId);
      
      // Remove from UI
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      
      alert('Đã xóa người dùng thành công!');
    } catch (err) {
      alert(`Lỗi khi xóa người dùng: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Form Submit (Create or Update)
   */
  const handleFormSubmit = async (userData) => {
    try {
      setIsLoading(true);
      
      if (editingUser) {
        // Update existing user
        const updatedUser = await usersService.updateUser(editingUser.id, userData);
        
        // Update UI
        setUsers(prevUsers =>
          prevUsers.map(u => u.id === editingUser.id ? updatedUser : u)
        );
        
        alert('Đã cập nhật người dùng thành công!');
      } else {
        // Create new user via signup
        const newUser = await usersService.signup(userData);
        
        // Add to UI
        setUsers(prevUsers => [...prevUsers, newUser]);
        
        alert('Đã thêm người dùng mới thành công!');
      }
      
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Form Cancel
   */
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  /**
   * Handle Refresh
   */
  const handleRefresh = () => {
    fetchUsers();
  };

  return (
    <div className="user-management">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-left">
          <h1>👥 Quản lý Người dùng</h1>
          <p className="subtitle">Quản lý tài khoản và phân quyền người dùng</p>
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
            onClick={handleAddUser}
            disabled={isLoading}
          >
            ➕ Thêm người dùng
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng người dùng</div>
          </div>
        </div>
        <div className="stat-card stat-admin">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Quản trị viên</div>
          </div>
        </div>
        <div className="stat-card stat-user">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <div className="stat-value">{stats.regularUsers}</div>
            <div className="stat-label">Người dùng</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="user-filters">
        <div className="filter-group">
          <label htmlFor="search">🔍 Tìm kiếm:</label>
          <input
            id="search"
            type="text"
            placeholder="Tên, email, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="role-filter">👤 Vai trò:</label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả ({stats.total})</option>
            <option value="admin">Quản trị ({stats.admins})</option>
            <option value="user">Người dùng ({stats.regularUsers})</option>
          </select>
        </div>

        <div className="filter-results">
          Hiển thị <strong>{filteredUsers.length}</strong> / {stats.total} người dùng
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

      {/* User List */}
      {!isLoading && !error && (
        <UserList
          users={filteredUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />
      )}

      {/* User Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={handleFormCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <UserForm
              user={editingUser}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
