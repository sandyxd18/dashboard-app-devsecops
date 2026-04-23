import React, { useState, useEffect } from 'react';
import { blockApi, orderApi, paymentApi } from '../services/api';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function BlockchainApp() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState({});
  const [verificationResult, setVerificationResult] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await paymentApi.get('/payments');
        const paymentsArray = res.data?.data?.payments || [];
        const completed = paymentsArray.filter(p => p.status === 'PAID');
        setOrders(completed || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleVerify = async (orderId) => {
    setVerifying(prev => ({...prev, [orderId]: true}));
    try {
      const res = await blockApi.get(`/blockchain/verify/order/${orderId}`);
      if (res.data?.status === 'VALID') {
         setVerificationResult(prev => ({...prev, [orderId]: { status: 'secure', msg: 'Hash Validated on Chain' }}));
      } else {
         setVerificationResult(prev => ({...prev, [orderId]: { status: 'compromised', msg: 'Integrity Failure' }}));
      }
    } catch (err) {
      if (err.response?.status === 404) {
         setVerificationResult(prev => ({...prev, [orderId]: { status: 'missing', msg: 'Not Found on Chain' }}));
      } else {
         setVerificationResult(prev => ({...prev, [orderId]: { status: 'error', msg: 'Verification Error' }}));
      }
    } finally {
      setVerifying(prev => ({...prev, [orderId]: false}));
    }
  };

  return (
    <div className="flex-col gap-4">
      <div className="card" style={{backgroundColor: '#111827', color: 'white'}}>
         <h3 className="flex items-center gap-2"><ShieldCheck color="#10b981"/> Blockchain Integrity Audit</h3>
         <p style={{color: '#9ca3af', fontSize: '14px', marginTop: '10px'}}>
           This tool cryptographically verifies the immutable block history of completed orders directly against the isolated Blockchain Microservice (port 3004).
         </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center" style={{marginBottom: '20px'}}>
          <h3 style={{margin: 0}}>Verified Blocks</h3>
          <input 
            type="text" 
            placeholder="Search Order ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minWidth: '300px'}}
          />
        </div>
        {loading ? <p>Loading completed transactions...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Amount</th>
                <th>Cryptographic Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.filter(o => o.order_id.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
                <tr key={o.order_id}>
                  <td style={{fontFamily: 'monospace', fontSize: '12px'}}>{o.order_id}</td>
                  <td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(o.amount)}</td>
                  <td>
                    {verificationResult[o.order_id] ? (
                      <div className="flex items-center gap-2">
                         {verificationResult[o.order_id].status === 'secure' ? <ShieldCheck size={16} color="#10b981"/> : <ShieldAlert size={16} color="#ef4444"/>}
                         <span style={{fontSize: '12px', color: verificationResult[o.order_id].status === 'secure' ? '#10b981' : '#ef4444', fontWeight: 600}}>
                           {verificationResult[o.order_id].msg}
                         </span>
                      </div>
                    ) : <span style={{fontSize: '12px', color: '#6b7280'}}>Untested</span>}
                  </td>
                  <td>
                    <button 
                      className="btn" 
                      style={{backgroundColor: '#e5e7eb', color: 'black', fontSize: '11px', padding: '4px 8px'}}
                      onClick={() => handleVerify(o.order_id)}
                      disabled={verifying[o.order_id]}
                    >
                      {verifying[o.order_id] ? 'Auditing...' : 'Verify Block'}
                    </button>
                  </td>
                </tr>
              ))}
              {orders.filter(o => o.order_id.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No completed orders found to audit.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
