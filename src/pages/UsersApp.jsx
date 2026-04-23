import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';

export default function UsersApp() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await authApi.delete(`/auth/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{marginBottom: '20px'}}>
        <h3>User Management</h3>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search username or ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minWidth: '250px'}}
          />
          <button className="btn btn-primary" onClick={fetchUsers}>Refresh</button>
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
                    <button className="btn btn-danger flex items-center justify-center p-1" style={{fontSize: '12px', padding: '4px 8px'}} onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No users found.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
