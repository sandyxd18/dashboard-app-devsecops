import React, { useState, useEffect, useRef } from 'react';
import { paymentApi, orderApi, blockApi, authApi } from '../services/api';

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatDateTime = (s) => {
  if (!s) return '-';
  const d = new Date(s);
  return isNaN(d) ? '-' : d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_BADGE = {
  PAID:      'badge-success',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  EXPIRED:   'badge-danger',
  PENDING:   'badge-warning',
};



export default function OrdersApp() {
  const [orders, setOrders]         = useState([]);
  const [userMap, setUserMap]       = useState({}); // { user_id: username }
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying]             = useState(false);

  // Fetch & merge orders + payments, then enrich userMap
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [orderRes, paymentRes] = await Promise.all([
        orderApi.get('/orders'),
        paymentApi.get('/payments'),
      ]);

      const allOrders   = orderRes.data?.data?.orders   || [];
      const allPayments = paymentRes.data?.data?.payments || [];

      // Merge payment info into orders
      const merged = allOrders.map(order => {
        const payment = allPayments.find(p => p.order_id === order.id);
        return { ...order, payment_id: payment ? payment.payment_id : null };
      });

      setOrders(merged);

      // Collect unique user IDs that we don't have yet
      const knownIds = Object.keys(userMap);
      const unknownIds = [...new Set(merged.map(o => o.user_id))].filter(id => id && !knownIds.includes(id));

      if (unknownIds.length > 0) {
        // Try to get usernames from the admin users list
        try {
          const usersRes = await authApi.get('/auth/admin/users');
          const users = usersRes.data?.data || [];
          const map = {};
          users.forEach(u => { map[u.id] = u.username; });
          setUserMap(prev => ({ ...prev, ...map }));
        } catch {
          // If not accessible, keep what we have
        }
      }

      // Update selectedOrder if it's open, so status reflects latest
      if (selectedOrder) {
        const updated = merged.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load only — manual refresh via F5 or page navigation
  useEffect(() => { fetchData(); }, []);


  const handleVerify = async (orderId) => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await blockApi.get(`/blockchain/verify/order/${orderId}`);
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({
        found: false,
        status: 'ERROR',
        message: err.response?.data?.detail || err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setVerificationResult(null);
  };

  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.payment_id && o.payment_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h3>Orders Tracking</h3>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <input
            type="text"
            placeholder="Search Order ID or Payment ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minWidth: '300px' }}
          />
          {/* Refresh button */}
          <button
            onClick={() => fetchData()}
            title="Refresh"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', color: '#6b7280' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>refresh</span>
          </button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Created At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td>
                  <a
                    href="#!"
                    onClick={e => { e.preventDefault(); setSelectedOrder(o); setVerificationResult(null); }}
                    style={{ fontFamily: 'monospace', fontSize: '11px', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {o.id}
                  </a>
                </td>
                <td style={{ fontSize: '12px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>{o.user_id}</div>
                  {userMap[o.user_id] && (
                    <div style={{ color: '#6b7280', fontSize: '11px' }}>({userMap[o.user_id]})</div>
                  )}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: o.payment_id ? 'inherit' : '#888' }}>
                  {o.payment_id || 'N/A'}
                </td>
                <td style={{ fontWeight: 'bold' }}>{formatIDR(o.total_price)}</td>
                <td style={{ fontSize: '12px', color: '#6b7280' }}>{formatDateTime(o.created_at)}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[o.status] || 'badge-warning'}`}>
                    {o.status === 'EXPIRED' ? 'CANCELLED' : o.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={closeModal}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '8px',
            width: '520px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h4 style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Order Details</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Order ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{selectedOrder.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Created At</div>
                <div style={{ fontSize: '13px' }}>{formatDateTime(selectedOrder.created_at)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>User ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                  {selectedOrder.user_id}
                  {userMap[selectedOrder.user_id] && (
                    <span style={{ color: '#374151', fontFamily: 'sans-serif', fontWeight: 600 }}> ({userMap[selectedOrder.user_id]})</span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Payment ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>{selectedOrder.payment_id || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Amount</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{formatIDR(selectedOrder.total_price)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Status</div>
                <span className={`badge ${STATUS_BADGE[selectedOrder.status] || 'badge-warning'}`}>
                  {selectedOrder.status === 'EXPIRED' ? 'CANCELLED' : selectedOrder.status}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' }}>
              <h5 style={{ marginBottom: '10px' }}>Blockchain Verification</h5>
              <button
                className="btn btn-primary"
                onClick={() => handleVerify(selectedOrder.id)}
                disabled={verifying}
              >
                {verifying ? 'Verifying...' : 'Verify on Blockchain'}
              </button>

              {verificationResult && (
                <div style={{
                  marginTop: '12px', padding: '12px', borderRadius: '4px',
                  backgroundColor: verificationResult.status === 'VALID' ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${verificationResult.status === 'VALID' ? '#c3e6cb' : '#f5c6cb'}`,
                  color: verificationResult.status === 'VALID' ? '#155724' : '#721c24',
                }}>
                  <strong>Result:</strong> {verificationResult.message}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="btn" style={{ backgroundColor: '#e5e7eb', color: 'black' }} onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
