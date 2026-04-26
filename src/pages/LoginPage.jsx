import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import { useAdminStore } from '../store/useAdminStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAdminStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.post('/auth/login', { username, password });
      const { user, token } = response.data?.data || {};

      if (!user) throw new Error('Invalid response from server.');
      if (user.role !== 'admin') throw new Error('Access Denied: You do not have admin privileges.');

      // user in memory, token in memory (not localStorage) for injecting into other services
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className="flex flex-col items-center" style={{marginTop: '100px'}}>
      <div className="card" style={{width: '380px'}}>
        <h2 style={{marginBottom: '20px', fontSize: '24px', textAlign: 'center'}}>Bookstore Admin Login</h2>
        
        {error && <div style={{padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '20px', fontSize:'14px'}}>{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label style={{fontSize: '13px', fontWeight: 'bold', marginBottom: '5px'}}>Admin Username</label>
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} required 
              style={{padding: '10px', border: '1px solid #d1d5db', borderRadius:'4px'}}
            />
          </div>
          <div className="flex flex-col">
            <label style={{fontSize: '13px', fontWeight: 'bold', marginBottom: '5px'}}>Password</label>
            <div style={{position: 'relative', width: '100%'}}>
              <input 
                type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required 
                style={{padding: '10px', border: '1px solid #d1d5db', borderRadius:'4px', width: '100%', paddingRight: '40px'}}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center'}}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{marginTop:'10px'}} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
