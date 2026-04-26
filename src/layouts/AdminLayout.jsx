import React, { useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ShoppingBag, ShieldCheck, LogOut, UserCircle, Key, Lock } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { authApi } from '../services/api';
import '../index.css';

export default function AdminLayout() {
  const { user, isChecking, setUser, clearUser } = useAdminStore();
  const navigate = useNavigate();

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileRef = useRef(null);

  // Change Password modal states
  const [showChangePwStep, setShowChangePwStep] = useState(null);
  const [hasRecoveryKey, setHasRecoveryKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [keyGenPassword, setKeyGenPassword] = useState('');
  const [keyGenError, setKeyGenError] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changePwError, setChangePwError] = useState('');
  const [changePwSuccess, setChangePwSuccess] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // On mount: restore admin session from admin_auth_token cookie via GET /auth/admin/me
  useEffect(() => {
    if (user) return;
    authApi.get('/auth/admin/me')
      .then(res => {
        const data = res.data?.data;
        if (data?.role === 'admin') {
          setUser(data, data.token);
        } else {
          clearUser();
        }
      })
      .catch(() => clearUser());
  }, []);


  // While checking session, show loader
  if (isChecking && !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Verifying session…</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    try { await authApi.post('/auth/logout?role=admin'); } catch {}
    clearUser();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    if (hasRecoveryKey === null) {
      authApi.get('/auth/profile')
        .then(res => setHasRecoveryKey(res.data?.data?.has_recovery_key ?? false))
        .catch(() => setHasRecoveryKey(false));
    }
  };

  const handleChangePasswordClick = () => {
    setShowProfileModal(false);
    if (hasRecoveryKey === false) {
      setShowChangePwStep('generate-key');
      setGeneratedKey(null); setKeyGenPassword(''); setKeyGenError('');
    } else if (hasRecoveryKey === null) {
      authApi.get('/auth/profile').then(res => {
        const has = res.data?.data?.has_recovery_key ?? false;
        setHasRecoveryKey(has);
        if (!has) {
          setShowChangePwStep('generate-key');
          setGeneratedKey(null); setKeyGenPassword(''); setKeyGenError('');
        } else {
          setShowChangePwStep('change-pw');
          setCurrentPw(''); setNewPw(''); setChangePwError(''); setChangePwSuccess('');
        }
      }).catch(() => { setHasRecoveryKey(false); setShowChangePwStep('generate-key'); });
    } else {
      setShowChangePwStep('change-pw');
      setCurrentPw(''); setNewPw(''); setChangePwError(''); setChangePwSuccess('');
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault(); setKeyGenError(''); setKeyLoading(true);
    try {
      const res = await authApi.post('/auth/recovery-key/regenerate', { password: keyGenPassword });
      setGeneratedKey(res.data?.data?.recovery_key || '(no key returned)');
      setHasRecoveryKey(true);
    } catch (err) { setKeyGenError(err.response?.data?.message || 'Failed to generate key.'); }
    finally { setKeyLoading(false); }
  };

  const handleKeyGenDone = () => {
    setShowChangePwStep('change-pw');
    setCurrentPw(''); setNewPw(''); setChangePwError(''); setChangePwSuccess('');
    setGeneratedKey(null); setKeyGenPassword('');
  };

  const handleChangePw = async (e) => {
    e.preventDefault(); setChangePwError(''); setChangePwSuccess('');
    if (!currentPw || !newPw) { setChangePwError('Please fill all fields.'); return; }
    setChangingPw(true);
    try {
      await authApi.patch('/auth/password', { current_password: currentPw, new_password: newPw });
      setChangePwSuccess('Password changed successfully!');
      setCurrentPw(''); setNewPw('');
      setTimeout(() => { setShowChangePwStep(null); setChangePwSuccess(''); }, 1800);
    } catch (err) { setChangePwError(err.response?.data?.message || 'Failed to change password.'); }
    finally { setChangingPw(false); }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey).then(() => {
      setCopyToast(true); setTimeout(() => setCopyToast(false), 2000);
    });
  };

  const handleDownloadKey = () => {
    const txt = `Admin Recovery Key\n==================\nUsername: ${user?.username}\nRecovery Key: ${generatedKey}\n\nStore this file safely.`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'admin-recovery-key.txt'; a.click();
  };

  const accent = '#8b5cf6';

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <aside style={{ width: '260px', backgroundColor: 'var(--admin-sidebar)', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Bookstore Admin</h2>
        </div>

        <nav style={{ padding: '20px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" end className="sidebar-link"><LayoutDashboard size={18}/> Overview</NavLink>
          <NavLink to="/books" className="sidebar-link"><BookOpen size={18}/> Books</NavLink>
          <NavLink to="/users" className="sidebar-link"><Users size={18}/> Users</NavLink>
          <NavLink to="/orders" className="sidebar-link"><ShoppingBag size={18}/> Orders &amp; Payments</NavLink>
          <NavLink to="/blockchain" className="sidebar-link"><ShieldCheck size={18} color="#8b5cf6"/> Blockchain Verify</NavLink>
        </nav>

        {/* Bottom: profile row + sign out */}
        <div style={{ padding: '16px 10px', borderTop: '1px solid #374151' }}>

          {/* Profile row — click opens modal, hover uses sidebar-link CSS highlight */}
          <div
            ref={profileRef}
            className="sidebar-link"
            style={{ gap: '12px', cursor: 'pointer' }}
            onClick={handleProfileClick}
          >
            <UserCircle size={18} color="#9ca3af" style={{ flexShrink: 0 }} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.username}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.id}</div>
            </div>
          </div>

          {/* Sign Out button */}
          <button
            onClick={handleLogout}
            className="btn w-full btn-danger"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', padding: '10px', borderRadius: '6px', marginTop: '8px' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>


      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '70px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Management Console</h2>
        </header>
        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          <Outlet />
        </div>
      </main>

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{ position: 'relative', background: '#fff', borderRadius: '12px', padding: '28px 30px', width: '380px', maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.15s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #111827, #374151)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>{user.username?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>{user.username}</div>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>{user.role?.toUpperCase()}</div>
              </div>
            </div>

            {/* User ID */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>User ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#374151', background: '#f9fafb', padding: '8px 10px', borderRadius: '6px', wordBreak: 'break-all' }}>{user.id}</div>
            </div>

            {/* Actions — Sign Out is in the sidebar, not here */}
            <button
              onClick={handleChangePasswordClick}
              style={{ width: '100%', padding: '10px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}
            >
              <Lock size={16} color="#111827" /> Change Password
            </button>

            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '20px', lineHeight: 1, padding: '4px' }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Generate Key Modal ── */}
      {showChangePwStep === 'generate-key' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setShowChangePwStep(null); setGeneratedKey(null); }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '28px 30px', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
              <Key size={18} color={accent} /> Save Recovery Key First
            </h3>
            {!generatedKey ? (
              <>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
                  You haven't generated a recovery key yet. You must save a recovery key before changing your password.
                </p>
                {keyGenError && <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px 10px', background: '#fef0ef', borderRadius: '4px' }}>{keyGenError}</div>}
                <form onSubmit={handleGenerateKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}>Current Password</label>
                    <input type="password" value={keyGenPassword} onChange={e => setKeyGenPassword(e.target.value)} required autoFocus
                      style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%', fontSize: '14px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowChangePwStep(null)} style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={keyLoading} style={{ padding: '9px 18px', borderRadius: '6px', background: accent, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      {keyLoading ? 'Generating…' : 'Generate Key'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>Recovery key generated. Save it — shown <strong>only once</strong>.</p>
                <div style={{ background: '#fffbe6', border: '2px dashed #f5c518', borderRadius: '4px', padding: '14px', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, wordBreak: 'break-all', textAlign: 'center', marginBottom: '12px' }}>
                  {generatedKey}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button onClick={handleCopyKey} style={{ flex: 1, padding: '8px', background: '#f5c518', border: '1px solid #e2b100', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>📋 Copy</button>
                  <button onClick={handleDownloadKey} style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>⬇️ Download</button>
                </div>
                <button onClick={handleKeyGenDone} style={{ width: '100%', padding: '10px', background: accent, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
                  Done — Change Password →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showChangePwStep === 'change-pw' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowChangePwStep(null)}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '28px 30px', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
              <Lock size={18} color={accent} /> Change Password
            </h3>
            {changePwError && <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px 10px', background: '#fef0ef', borderRadius: '4px' }}>{changePwError}</div>}
            {changePwSuccess && <div style={{ color: '#065f46', fontSize: '13px', marginBottom: '10px', padding: '8px 10px', background: '#d1fae5', borderRadius: '4px' }}>{changePwSuccess}</div>}
            <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}>Current Password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required autoFocus
                  style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '4px' }}>New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required
                  style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowChangePwStep(null)} style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={changingPw} style={{ padding: '9px 18px', borderRadius: '6px', background: accent, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {changingPw ? 'Saving…' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy toast */}
      {copyToast && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#8b5cf6', padding: '10px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap' }}>
          ✓ Recovery key copied!
        </div>
      )}
    </div>
  );
}
