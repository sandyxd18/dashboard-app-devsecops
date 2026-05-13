import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import { useAdminStore } from '../store/useAdminStore';
import { useLoginRateLimit } from '../hooks/useLoginRateLimit';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAdminStore();

  // Anti-brute-force: key unik agar tidak konflik dengan frontend
  const {
    isLocked,
    isPermanent,
    remainingLabel,
    attempts,
    recordFailure,
    resetAttempts,
  } = useLoginRateLimit('login_rl_dashboard');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Tolak submit jika sedang dalam status locked
    if (isLocked) return;

    setLoading(true);
    try {
      const response = await authApi.post('/auth/login', { username, password });
      const { user, token } = response.data?.data || {};

      if (!user) throw new Error('Invalid response from server.');
      if (user.role !== 'admin') throw new Error('Incorrect username or password.');

      // Login sukses — reset counter brute-force
      resetAttempts();
      login(user, token);
      navigate('/');

    } catch (err) {
      // Catat kegagalan dan perbarui lock state
      const { isPermanent: nowPermanent } = recordFailure();

      if (nowPermanent) {
        setError('Account locked due to too many failed login attempts.');
      } else {
        setError('Incorrect username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Banner lockout
  const lockBanner = () => {
    if (isPermanent) {
      return (
        <div style={{
          padding: '12px 14px',
          backgroundColor: '#fee2e2',
          border: '1px solid #b91c1c',
          color: '#7f1d1d',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          <strong>🚫 Access Denied</strong><br />
          Too many failed login attempts ({attempts}×). This session cannot be used
          to login again. Please close the browser and try again, or contact the administrator.
        </div>
      );
    }
    if (isLocked) {
      return (
        <div style={{
          padding: '12px 14px',
          backgroundColor: '#fef3c7',
          border: '1px solid #d97706',
          color: '#78350f',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          <strong>⏳ Temporary Login Locked</strong><br />
          Failed attempts: <strong>{attempts}×</strong>. Please wait{' '}
          <strong>{remainingLabel()}</strong> before trying again.
        </div>
      );
    }
    // Peringatan ringan setelah ≥ 3 kali gagal
    if (attempts >= 3 && attempts < 5) {
      return (
        <div style={{
          padding: '10px 12px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fbbf24',
          color: '#92400e',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '12px',
        }}>
          ⚠️ Warning: {5 - attempts} attempts before temporary login lock.
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center" style={{ marginTop: '100px' }}>
      <div className="card" style={{ width: '380px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', textAlign: 'center' }}>Bookstore Admin Login</h2>

        {/* Lockout / warning banner */}
        {lockBanner()}

        {/* Error dari server (hanya tampil jika belum locked oleh threshold) */}
        {error && !isPermanent && !isLocked && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLocked}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: isLocked ? '#f3f4f6' : '#fff',
                cursor: isLocked ? 'not-allowed' : 'text',
              }}
            />
          </div>

          <div className="flex flex-col">
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLocked}
                style={{
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  width: '100%',
                  paddingRight: '40px',
                  backgroundColor: isLocked ? '#f3f4f6' : '#fff',
                  cursor: isLocked ? 'not-allowed' : 'text',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '10px' }}
            disabled={loading || isLocked}
          >
            {loading
              ? 'Authenticating...'
              : isPermanent
                ? '🚫 Access Denied'
                : isLocked
                  ? `⏳ Wait ${remainingLabel()}`
                  : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
