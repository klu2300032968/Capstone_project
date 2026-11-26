import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Shield,
  ShieldAlert,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';
import { usersApi } from '../api/apiClient';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // New user form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAll();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve registered users from MySQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    if (user.username === 'admin') {
      setError('Primary administrator account status cannot be modified.');
      return;
    }
    setActionLoadingId(user.id);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await usersApi.toggleStatus(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      setSuccessMsg(`User '${user.username}' status updated to ${updated.enabled ? 'ACTIVE' : 'DISABLED'}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update user account status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await usersApi.create(formData);
      setUsers(prev => [...prev, created]);
      setSuccessMsg(`User '${created.username}' provisioned successfully with role ${created.role}.`);
      setIsCreateOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'USER' });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setCreateError(err.message || 'Failed to create user. Verify field constraints.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <div className="section-title-group">
            <Users size={22} className="icon-cyan" />
            <h3>Role-Based Identity & Access Governance</h3>
          </div>
          <p className="section-subtitle">
            Manage authenticated identities, assign granular RBAC roles, and control active credentials stored in MySQL
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchUsers} disabled={loading} title="Refresh User List">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn-primary-gradient" onClick={() => setIsCreateOpen(true)}>
            <UserPlus size={15} />
            <span>Provision User</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner">
          <CheckCircle2 size={18} className="icon-emerald" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} className="icon-red" />
          <span>{error}</span>
        </div>
      )}

      <div className="users-card">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={28} className="spin icon-cyan" />
            <div>Querying user credentials from database...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users registered in database.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User Identity</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th>Credential Status</th>
                  <th style={{ textAlign: 'right' }}>Access Control</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdminRole = u.role === 'ROLE_ADMIN' || u.role === 'ADMIN';
                  return (
                    <tr key={u.id}>
                      <td className="mono text-muted">#{u.id}</td>
                      <td>
                        <div className="user-id-cell">
                          <div className={`avatar-pill ${isAdminRole ? 'admin-avatar' : 'user-avatar'}`}>
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="user-text-meta">
                            <span className="user-name-bold">{u.username}</span>
                            {u.username === 'admin' && (
                              <span className="primary-tag">Primary Admin</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="email-span text-muted">
                          <Mail size={13} style={{ display: 'inline', marginRight: '5px' }} />
                          {u.email}
                        </span>
                      </td>
                      <td>
                        <span className={`role-badge ${isAdminRole ? 'role-admin' : 'role-user'}`}>
                          {isAdminRole ? <Shield size={12} /> : <UserCheck size={12} />}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${u.enabled ? 'status-active' : 'status-disabled'}`}>
                          <span className="status-dot"></span>
                          {u.enabled ? 'Active / Permitted' : 'Disabled / Suspended'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.username === 'admin' ? (
                          <span className="text-muted-small">System Protected</span>
                        ) : (
                          <button
                            className={`btn-table-action ${u.enabled ? 'btn-warn' : 'btn-enable'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoadingId === u.id}
                          >
                            {actionLoadingId === u.id ? (
                              <RefreshCw size={12} className="spin" />
                            ) : u.enabled ? (
                              <>
                                <UserX size={13} />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <UserPlus size={18} className="icon-cyan" />
                <h4>Provision New Security Identity</h4>
              </div>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="modal-error-box">
                <AlertCircle size={16} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. sec_analyst"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. analyst@security.local"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Password (Hashed via BCrypt)</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Assigned Authorization Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="USER">ROLE_USER (Standard Business Access)</option>
                  <option value="ADMIN">ROLE_ADMIN (Full Perimeter & ARSA Access)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-gradient"
                  disabled={createLoading}
                >
                  {createLoading ? <RefreshCw size={14} className="spin" /> : <Lock size={14} />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
