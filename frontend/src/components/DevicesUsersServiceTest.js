// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Devices & Users Service Test Component
 * Test Devices and Users API Services với MSW mock data
 */

import React, { useState } from 'react';
import devicesService from '../services/api/devicesService';
import usersService from '../services/api/usersService';

const DevicesUsersServiceTest = () => {
  const [devices, setDevices] = useState(null);
  const [users, setUsers] = useState(null);
  const [loginResult, setLoginResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================================
  // DEVICES TESTS
  // ============================================

  const testGetDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing devicesService.getAll()...');
      const data = await devicesService.getAll();
      console.log('✅ Devices data:', data);
      
      const stats = devicesService.getStatistics(data);
      console.log('📊 Devices statistics:', stats);
      
      setDevices(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateDevice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing devicesService.update()...');
      
      // Update first device
      const updatedDevice = await devicesService.update('device-001', {
        name: 'Updated Sensor',
        type: 'sensor',
        status: 'maintenance',
        location: {
          lat: 21.0285,
          lng: 105.8542,
          address: 'Updated Address',
        },
      });
      
      console.log('✅ Updated device:', updatedDevice);
      alert('Device updated successfully! Check console for details.');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // USERS TESTS
  // ============================================

  const testGetUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing usersService.getAll()...');
      const data = await usersService.getAll();
      console.log('✅ Users data:', data);
      
      const stats = usersService.getStatistics(data);
      console.log('📊 Users statistics:', stats);
      
      setUsers(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing usersService.login()...');
      
      const result = await usersService.login({
        email: 'admin@smartair.com',
        password: 'Admin123!',
      });
      
      console.log('✅ Login result:', result);
      console.log('🔑 Token saved:', usersService.getToken());
      console.log('👤 User saved:', usersService.getUser());
      console.log('🔒 Is authenticated:', usersService.isAuthenticated());
      console.log('👑 Is admin:', usersService.isAdmin());
      
      setLoginResult(result);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = () => {
    console.log('🧪 Testing usersService.logout()...');
    usersService.logout();
    
    console.log('✅ Logged out');
    console.log('🔑 Token after logout:', usersService.getToken());
    console.log('👤 User after logout:', usersService.getUser());
    console.log('🔒 Is authenticated:', usersService.isAuthenticated());
    
    setLoginResult(null);
    alert('Logged out! Check console for details.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>🧪 Devices & Users Service Test (Phase 4)</h2>
      <p>Test Devices and Users API Services với transformed data</p>

      {/* DEVICES SECTION */}
      <div style={{
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <h3>🔌 Devices Service Tests</h3>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testGetDevices}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Test getAll()
          </button>

          <button 
            onClick={testUpdateDevice}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Test update()
          </button>
        </div>

        {devices && (
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
            <h4>✅ Devices ({devices.length})</h4>
            
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, index) => {
                    const statusInfo = devicesService.getStatusInfo(device.status);
                    const typeInfo = devicesService.getTypeInfo(device.type);
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{device.name}</td>
                        <td style={{ padding: '10px' }}>{typeInfo.icon} {typeInfo.label}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '3px',
                            backgroundColor: statusInfo.color,
                            color: 'white',
                            fontSize: '12px',
                          }}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>
                          {device.location.lat.toFixed(4)}, {device.location.lng.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* USERS SECTION */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f3e5f5',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <h3>👥 Users Service Tests</h3>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testGetUsers}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Test getAll()
          </button>

          <button 
            onClick={testLogin}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Test login()
          </button>

          <button 
            onClick={testLogout}
            disabled={!loginResult}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !loginResult ? 'not-allowed' : 'pointer',
            }}
          >
            Test logout()
          </button>
        </div>

        {loginResult && (
          <div style={{
            padding: '15px',
            backgroundColor: '#c8e6c9',
            borderRadius: '4px',
            marginBottom: '15px',
          }}>
            <h4>✅ Login Successful</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><strong>Email:</strong> {loginResult.user.email}</div>
              <div><strong>Role:</strong> {usersService.getRoleInfo(loginResult.user.role).icon} {usersService.getRoleInfo(loginResult.user.role).label}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Token:</strong> {loginResult.token.substring(0, 50)}...</div>
            </div>
          </div>
        )}

        {users && (
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
            <h4>✅ Users ({users.length})</h4>
            
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#9C27B0', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const roleInfo = usersService.getRoleInfo(user.role);
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{user.email}</td>
                        <td style={{ padding: '10px' }}>{user.username}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '3px',
                            backgroundColor: roleInfo.color,
                            color: 'white',
                            fontSize: '12px',
                          }}>
                            {roleInfo.icon} {roleInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {user.isEmailVerified ? '✅' : '❌'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {loading && <p>⏳ Loading...</p>}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
      }}>
        <h4>📝 Service Methods Tested:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <strong>Devices Service:</strong>
            <ul>
              <li>✅ <code>devicesService.getAll()</code></li>
              <li>✅ <code>devicesService.update(id, data)</code></li>
              <li>✅ <code>getStatusInfo(status)</code></li>
              <li>✅ <code>getTypeInfo(type)</code></li>
              <li>✅ <code>getStatistics(devices)</code></li>
            </ul>
          </div>
          <div>
            <strong>Users Service:</strong>
            <ul>
              <li>✅ <code>usersService.getAll()</code></li>
              <li>✅ <code>usersService.login(credentials)</code></li>
              <li>✅ <code>usersService.logout()</code></li>
              <li>✅ <code>saveToken() / getToken()</code></li>
              <li>✅ <code>isAuthenticated() / isAdmin()</code></li>
              <li>✅ <code>getRoleInfo(role)</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesUsersServiceTest;
