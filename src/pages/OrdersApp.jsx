import React, { useState, useEffect } from 'react';
import { paymentApi, orderApi, blockApi } from '../services/api';

export default function OrdersApp() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, paymentRes] = await Promise.all([
        orderApi.get('/orders'),
        paymentApi.get('/payments')
      ]);

      const allOrders = orderRes.data?.data?.orders || [];
      const allPayments = paymentRes.data?.data?.payments || [];

      // Merge payment info into orders
      const merged = allOrders.map(order => {
        // Find the most recent payment for this order
        const payment = allPayments.find(p => p.order_id === order.id);
        return {
          ...order,
          payment_id: payment ? payment.payment_id : null
        };
      });

      setOrders(merged);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        message: err.response?.data?.detail || err.message
      });
    } finally {
      setVerifying(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setVerificationResult(null);
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{marginBottom: '20px'}}>
        <h3>Orders Tracking</h3>
        <input 
          type="text" 
          placeholder="Search Order ID or Payment ID..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minWidth: '300px'}}
        />
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || (o.payment_id && o.payment_id.toLowerCase().includes(searchTerm.toLowerCase()))).map(o => (
              <tr key={o.id}>
                <td>
                  <a 
                    href="#!" 
                    onClick={(e) => { e.preventDefault(); setSelectedOrder(o); }}
                    style={{fontFamily: 'monospace', fontSize: '11px', color: '#007bff', cursor: 'pointer', textDecoration: 'underline'}}
                  >
                    {o.id}
                  </a>
                </td>
                <td style={{fontFamily: 'monospace', fontSize: '11px', color: o.payment_id ? 'inherit' : '#888'}}>
                  {o.payment_id || 'N/A'}
                </td>
                <td style={{fontWeight: 'bold'}}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(o.total_price)}
                </td>
                <td>
                  <span className={`badge ${
                    (o.status === 'CANCELLED' || o.status === 'EXPIRED') ? 'badge-danger' : 
                    o.status === 'PAID' ? 'badge-success' : 
                    'badge-warning'
                  }`}>
                    {o.status === 'EXPIRED' ? 'CANCELLED' : o.status}
                  </span>
                </td>
              </tr>
            ))}
            {orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || (o.payment_id && o.payment_id.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No orders found.</td></tr>}
          </tbody>
        </table>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '8px', 
            width: '500px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>Order Details</h4>
            
            <div style={{marginBottom: '8px'}}><strong>Order ID:</strong> <span style={{fontFamily: 'monospace'}}>{selectedOrder.id}</span></div>
            <div style={{marginBottom: '8px'}}><strong>User ID:</strong> <span style={{fontFamily: 'monospace'}}>{selectedOrder.user_id}</span></div>
            <div style={{marginBottom: '8px'}}><strong>Payment ID:</strong> <span style={{fontFamily: 'monospace'}}>{selectedOrder.payment_id || 'N/A'}</span></div>
            <div style={{marginBottom: '8px'}}><strong>Amount:</strong> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedOrder.total_price)}</div>
            <div style={{marginBottom: '16px'}}>
              <strong>Status:</strong> 
              <span className={`badge ${
                    (selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'EXPIRED') ? 'badge-danger' : 
                    selectedOrder.status === 'PAID' ? 'badge-success' : 
                    'badge-warning'
                  }`} style={{marginLeft: '8px'}}>
                {selectedOrder.status === 'EXPIRED' ? 'CANCELLED' : selectedOrder.status}
              </span>
            </div>

            <div style={{borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px'}}>
              <h5 style={{marginBottom: '10px'}}>Blockchain Verification</h5>
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
                  color: verificationResult.status === 'VALID' ? '#155724' : '#721c24'
                }}>
                  <strong>Result:</strong> {verificationResult.message}
                </div>
              )}
            </div>

            <div style={{textAlign: 'right'}}>
              <button className="btn" style={{backgroundColor: '#e5e7eb', color: 'black'}} onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
