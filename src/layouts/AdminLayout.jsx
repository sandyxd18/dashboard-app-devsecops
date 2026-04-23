import React, { useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ShoppingBag, ShieldCheck, LogOut, UserCircle } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export default function AdminLayout() {
  const { user, token, logout } = useAdminStore();
  const navigate = useNavigate();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Route protection - if no token or role is not admin, redirect!
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex" style={{minHeight: '100vh'}}>
      <aside style={{width: '260px', backgroundColor: 'var(--admin-sidebar)', color: 'white', display: 'flex', flexDirection: 'column'}}>
        <div style={{padding: '24px', borderBottom: '1px solid #374151'}}>
          <h2 style={{fontSize: '20px', fontWeight: 'bold'}}>Bookstore Admin</h2>
        </div>
        <nav style={{padding: '20px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <NavLink to="/" end className="sidebar-link"><LayoutDashboard size={18}/> Overview</NavLink>
          <NavLink to="/books" className="sidebar-link"><BookOpen size={18}/> Books</NavLink>
          <NavLink to="/users" className="sidebar-link"><Users size={18}/> Users</NavLink>
          <NavLink to="/orders" className="sidebar-link"><ShoppingBag size={18}/> Orders & Payments</NavLink>
          <NavLink to="/blockchain" className="sidebar-link"><ShieldCheck size={18} color="#8b5cf6"/> Blockchain Verify</NavLink>
        </nav>
        <div style={{padding: '20px', borderTop: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative'}}>
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowProfileDialog(!showProfileDialog)}
            style={{ padding: '8px', borderRadius: '8px', backgroundColor: showProfileDialog ? '#374151' : 'transparent', transition: 'background-color 0.2s', margin: '-8px' }}
          >
            <UserCircle size={36} color="#9ca3af" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{fontWeight: 'bold', fontSize: '14px', color: 'white'}}>{user.username}</div>
              <div style={{fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{user.id}</div>
            </div>
          </div>

          {showProfileDialog && (
            <div style={{
              position: 'absolute', bottom: '115px', left: '10px', width: '240px',
              backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb', zIndex: 50, padding: '16px', color: '#111827'
            }}>
              <div className="flex items-center gap-3" style={{marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px'}}>
                <UserCircle size={40} color="#6b7280" />
                <div>
                  <div style={{fontWeight: 'bold', fontSize: '16px'}}>{user.username}</div>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>Administrator</div>
                </div>
              </div>
              <div style={{fontSize: '13px', color: '#374151', marginBottom: '16px'}}>
                <div style={{marginBottom: '8px'}}><strong>User ID:</strong> <br/><span style={{fontFamily: 'monospace', fontSize: '11px', color: '#6b7280'}}>{user.id}</span></div>
              </div>
              <button onClick={() => alert("Please use the Recovery Key feature on the login screen to reset your password.")} className="btn w-full" style={{backgroundColor: '#f3f4f6', color: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px solid #d1d5db'}}>
                Change Password
              </button>
            </div>
          )}

          <button onClick={handleLogout} className="btn w-full btn-danger" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', padding: '10px', borderRadius: '6px'}}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      
      <main style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        <header style={{height: '70px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h2 style={{fontSize: '20px', fontWeight: 600}}>Management Console</h2>
        </header>
        <div style={{padding: '32px', overflowY: 'auto', flex: 1}}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
