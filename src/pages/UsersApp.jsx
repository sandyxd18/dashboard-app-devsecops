import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';

export default function UsersApp() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, username }
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authApi.get('/auth/admin/users');
      setUsers(res.data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (u) => {
    setDeleteTarget(u);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await authApi.delete(`/auth/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const overlayStyle = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modalStyle = {
    position: 'relative', background: '#fff', borderRadius: '12px',
    padding: '28px 30px', width: '380px', maxWidth: '90vw',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.15s ease-out',
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{marginBottom: '20px'}}>
        <h3>User Management</h3>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <input
            type="text"
            placeholder="Search username or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minWidth: '250px'}}
          />
          <button
            onClick={fetchUsers}
            title="Refresh"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', color: '#6b7280' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>refresh</span>
          </button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : error ? <p style={{color: 'red'}}>{error}</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
              <tr key={u.id}>
                <td style={{fontFamily: 'monospace', fontSize: '12px'}}>{u.id}</td>
                <td>{u.username}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span></td>
                <td>
                  {u.role !== 'admin' && (
                    <button
                      className="btn btn-danger"
                      style={{fontSize: '12px', padding: '4px 8px'}}
                      onClick={() => handleDeleteClick(u)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <tr><td colSpan="4" style={{textAlign: 'center'}}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div style={overlayStyle} onClick={() => { if (!deleting) setDeleteTarget(null); }}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '20px' }}>🗑️</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Delete User</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>This action cannot be undone</div>
              </div>
            </div>

            {/* Body */}
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete user{' '}
              <strong style={{ color: '#111827' }}>{deleteTarget.username}</strong>?
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.5 }}>
              All data associated with this account will be removed.
            </p>

            {deleteError && (
              <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '14px', padding: '8px 10px', background: '#fef0ef', borderRadius: '6px', border: '1px solid #fbb' }}>
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{ padding: '9px 18px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{ padding: '9px 18px', background: '#dc2626', border: 'none', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, color: '#fff', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>

            <button
              onClick={() => { if (!deleting) setDeleteTarget(null); }}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '20px', lineHeight: 1, padding: '4px' }}
            >✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
