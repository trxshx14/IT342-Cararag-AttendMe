import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'TEACHER', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      if (response && response.success) setUsers(response.data || []);
      else setError('Failed to load users');
    } catch { setError('Error loading users'); }
    finally { setLoading(false); }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = !searchTerm ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || user.role === filterRole;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'inactive' && !user.active);
    return matchSearch && matchRole && matchStatus;
  });

  const clearFilters = () => { setSearchTerm(''); setFilterRole('all'); setFilterStatus('all'); };
  const hasFilters = searchTerm || filterRole !== 'all' || filterStatus !== 'all';

  const totalAdmins   = users.filter(u => u.role === 'ADMIN').length;
  const totalTeachers = users.filter(u => u.role === 'TEACHER').length;
  const totalActive   = users.filter(u => u.active).length;

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ fullName: user.fullName, email: user.email, role: user.role, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ fullName: '', email: '', role: 'TEACHER', password: '' });
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingUser(null); setFormData({ fullName: '', email: '', role: 'TEACHER', password: '' }); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let response;
      if (editingUser) {
        response = await userService.updateUser(editingUser.userId, { fullName: formData.fullName, email: formData.email, role: formData.role, ...(formData.password && { password: formData.password }) });
      } else {
        response = await userService.createUser(formData);
      }
      if (response && response.success) { handleCloseModal(); await fetchUsers(); }
      else setError(response?.message || 'Failed to save user');
    } catch (err) { setError(err.message || 'An error occurred'); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    setLoading(true);
    try {
      const response = await userService.deleteUser(userId);
      if (response && response.success) fetchUsers();
      else setError('Failed to delete user');
    } catch { setError('Error deleting user'); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = currentStatus ? await userService.deactivateUser(userId) : await userService.activateUser(userId);
      if (response && response.success) fetchUsers();
      else setError('Error updating user status');
    } catch { setError('Error updating user status'); }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Reset password for this user? They will receive a temporary password.')) return;
    try {
      const response = await userService.resetPassword(userId);
      if (response && response.success) alert(`Password reset!\n\nTemporary Password: ${response.tempPassword}`);
      else setError('Error resetting password');
    } catch { setError('Error resetting password'); }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  if (loading && users.length === 0) return <div className="mu-loading">Loading users...</div>;

  return (
    <div className="manage-users">

      {/* Header */}
      <div className="mu-page-header">
        <div className="mu-header-left">
          <h1>Manage Teachers</h1>
          <p className="mu-page-description">Add and manage teacher and administrator accounts</p>
        </div>
        <button className="mu-btn-primary" onClick={() => handleOpenModal()}>
          <span>+</span> New Teacher/Admin
        </button>
      </div>

      {error && <div className="mu-error">{error}</div>}

      {/* Stats */}
      <div className="mu-stats-row">
        <div className="mu-stat-card">
          <div className="mu-stat-icon blue">👥</div>
          <div>
            <div className="mu-stat-value">{users.length}</div>
            <div className="mu-stat-label">Total Users</div>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon purple">🛡️</div>
          <div>
            <div className="mu-stat-value">{totalAdmins}</div>
            <div className="mu-stat-label">Admins</div>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon blue">👨‍🏫</div>
          <div>
            <div className="mu-stat-value">{totalTeachers}</div>
            <div className="mu-stat-label">Teachers</div>
          </div>
        </div>
        <div className="mu-stat-card">
          <div className="mu-stat-icon green">✅</div>
          <div>
            <div className="mu-stat-value">{totalActive}</div>
            <div className="mu-stat-label">Active</div>
          </div>
        </div>
      </div>

      {/* Compact Toolbar */}
      <div className="mu-toolbar">
        <div className="mu-search-wrap">
          <span className="mu-search-icon">🔍</span>
          <input
            type="text"
            className="mu-search-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="mu-clear-btn" onClick={() => setSearchTerm('')}>✕</button>}
        </div>
        <div className="mu-toolbar-divider" />
        <select className="mu-filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
        </select>
        <div className="mu-toolbar-divider" />
        <select className="mu-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasFilters && <button className="mu-clear-filters" onClick={clearFilters}>Clear</button>}
      </div>

      <p className="mu-results-count">
        Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
      </p>

      {/* Table */}
      <div className="mu-table-wrap">
        <table className="mu-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.userId}>
                <td>
                  <div className="mu-user-cell">
                    <div className="mu-avatar">{getInitials(user.fullName)}</div>
                    <span className="mu-user-name">{user.fullName}</span>
                  </div>
                </td>
                <td className="mu-email">{user.email}</td>
                <td>
                  <span className={`mu-role-badge mu-role-${user.role?.toLowerCase()}`}>
                    {user.role === 'ADMIN' ? '🛡️ Admin' : '👨‍🏫 Teacher'}
                  </span>
                </td>
                <td>
                  <span className={`mu-status-badge ${user.active ? 'mu-active' : 'mu-inactive'}`}>
                    {user.active ? '● Active' : '● Inactive'}
                  </span>
                </td>
                <td className="mu-last-login">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td>
                  <div className="mu-actions">
                    <button className="mu-btn-icon" onClick={() => handleOpenModal(user)} title="Edit">✏️</button>
                    <button className="mu-btn-icon" onClick={() => handleToggleActive(user.userId, user.active)} title={user.active ? 'Deactivate' : 'Activate'}>
                      {user.active ? '🔴' : '🟢'}
                    </button>
                    <button className="mu-btn-icon" onClick={() => handleResetPassword(user.userId)} title="Reset Password">🔑</button>
                    <button className="mu-btn-icon mu-delete" onClick={() => handleDeleteUser(user.userId, user.fullName)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6">
                  <div className="mu-empty">
                    <p>{hasFilters ? 'No users match your filters.' : 'No users found. Click "+ New User" to add one.'}</p>
                    {hasFilters && <button className="mu-btn-outline" onClick={clearFilters}>Clear Filters</button>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="mu-modal-overlay" onClick={handleCloseModal}>
          <div className="mu-modal" onClick={e => e.stopPropagation()}>
            <div className="mu-modal-header">
              <h2>{editingUser ? 'Edit User' : 'Register New User'}</h2>
              <button className="mu-modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mu-modal-body">
                <div className="mu-form-group">
                  <label className="mu-form-label">Full Name *</label>
                  <input type="text" name="fullName" className="mu-form-input" value={formData.fullName} onChange={handleInputChange} required placeholder="Enter full name" />
                </div>
                <div className="mu-form-group">
                  <label className="mu-form-label">Email Address *</label>
                  <input type="email" name="email" className="mu-form-input" value={formData.email} onChange={handleInputChange} required placeholder="user@school.edu" />
                  {!editingUser && <small className="mu-form-hint">Login credentials will be sent to this email</small>}
                </div>
                <div className="mu-form-group">
                  <label className="mu-form-label">Role *</label>
                  <select name="role" className="mu-form-input" value={formData.role} onChange={handleInputChange} required>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {!editingUser ? (
                  <div className="mu-form-group">
                    <label className="mu-form-label">Temporary Password</label>
                    <div className="mu-password-row">
                      <input type={showPassword ? 'text' : 'password'} name="password" className="mu-form-input" value={formData.password} onChange={handleInputChange} placeholder="Leave empty for auto-generated" />
                      <button type="button" className="mu-btn-icon" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide' : 'Show'}>
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    <small className="mu-form-hint">If left empty, a random password will be generated</small>
                  </div>
                ) : (
                  <div className="mu-form-group">
                    <label className="mu-form-label">New Password (optional)</label>
                    <input type="password" name="password" className="mu-form-input" value={formData.password} onChange={handleInputChange} placeholder="Leave empty to keep current" />
                  </div>
                )}
              </div>
              <div className="mu-modal-footer">
                <button type="button" className="mu-btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="mu-btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;