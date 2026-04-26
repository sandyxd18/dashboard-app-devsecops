import React, { useState } from 'react';
import { blockApi } from '../services/api';
import { ShieldCheck, ShieldAlert, Search, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'blockchain_verification_results';

function loadStoredResults() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveResults(results) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(results)); } catch {}
}

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const formatDateTime = (s) => {
  if (!s) return '-';
  const d = new Date(s);
  return isNaN(d) ? '-' : d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function BlockchainApp() {
  const [orderId, setOrderId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);       // current displayed result
  const [cache, setCache] = useState(loadStoredResults); // { orderId: resultObj }

  const handleVerify = async (e) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;

    setVerifying(true);
    setResult(null);

    try {
      const res = await blockApi.get(`/blockchain/verify/order/${id}`);
      const data = res.data;

      const newResult = {
        orderId: id,
        status: data?.status === 'VALID' ? 'secure' : 'compromised',
        msg: data?.status === 'VALID' ? 'Hash Validated on Chain' : 'Integrity Failure',
        // Include block details if returned
        blockHash: data?.data?.block_hash || data?.block_hash || null,
        blockIndex: data?.data?.index ?? data?.index ?? null,
        timestamp: data?.data?.timestamp || data?.timestamp || null,
        amount: data?.data?.amount || data?.amount || null,
        verifiedAt: new Date().toISOString(),
      };

      setResult(newResult);
      const updated = { ...cache, [id]: newResult };
      setCache(updated);
      saveResults(updated);
    } catch (err) {
      const newResult = {
        orderId: id,
        status: err.response?.status === 404 ? 'missing' : 'error',
        msg: err.response?.status === 404 ? 'Order not found on Blockchain' : 'Verification Error',
        verifiedAt: new Date().toISOString(),
      };
      setResult(newResult);
      const updated = { ...cache, [id]: newResult };
      setCache(updated);
      saveResults(updated);
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setOrderId('');
    setResult(null);
  };

  const statusColor = result
    ? result.status === 'secure' ? '#10b981'
    : result.status === 'missing' ? '#f59e0b'
    : '#ef4444'
    : '#6b7280';

  const statusBg = result
    ? result.status === 'secure' ? '#f0fdf4'
    : result.status === 'missing' ? '#fffbeb'
    : '#fef2f2'
    : '#f9fafb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>

      {/* Header card */}
      <div className="card" style={{ backgroundColor: '#111827', color: 'white' }}>
        <h3 className="flex items-center gap-2">
          <ShieldCheck color="#10b981" /> Blockchain Integrity Audit
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '10px', lineHeight: 1.6 }}>
          Enter an Order ID to cryptographically verify its block hash against the Blockchain Microservice.
          Results are cached locally — re-submit to re-verify.
        </p>
      </div>

      {/* Verify Form */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Verify Order Block</h3>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>
              Order ID Reference
            </label>
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="e.g. 7a407b5f-dfd5-4457-b3b1-..."
              required
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace',
                outline: 'none', transition: 'border 0.2s',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={verifying || !orderId.trim()}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', flexShrink: 0 }}
          >
            <Search size={15} />
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', flexShrink: 0, backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </form>
      </div>

      {/* Result */}
      {verifying && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
          <div style={{ fontSize: '14px' }}>🔍 Querying blockchain node…</div>
        </div>
      )}

      {!verifying && result && (
        <div className="card" style={{ border: `2px solid ${statusColor}`, backgroundColor: statusBg }}>
          {/* Result header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${statusColor}40` }}>
            {result.status === 'secure'
              ? <ShieldCheck size={28} color={statusColor} />
              : <ShieldAlert size={28} color={statusColor} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: statusColor }}>{result.msg}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Verified at {formatDateTime(result.verifiedAt)}
              </div>
            </div>
            <span style={{
              marginLeft: 'auto', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
              backgroundColor: statusColor, color: 'white',
            }}>
              {result.status.toUpperCase()}
            </span>
          </div>

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Order ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', color: '#111827' }}>{result.orderId}</div>
            </div>
            {result.blockIndex !== null && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Block Index</div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#111827' }}>#{result.blockIndex}</div>
              </div>
            )}
            {result.amount && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Amount</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatIDR(result.amount)}</div>
              </div>
            )}
            {result.timestamp && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Block Timestamp</div>
                <div style={{ fontSize: '13px', color: '#111827' }}>{formatDateTime(result.timestamp)}</div>
              </div>
            )}
            {result.blockHash && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '3px' }}>Block Hash</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', color: '#374151', background: '#f3f4f6', padding: '8px 10px', borderRadius: '4px' }}>
                  {result.blockHash}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent lookups from cache */}
      {Object.keys(cache).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Recent Lookups</h3>
            <button onClick={() => { setCache({}); saveResults({}); }}
              style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cache).slice(-10).reverse().map(([id, r]) => (
                <tr key={id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.status === 'secure'
                        ? <ShieldCheck size={14} color="#10b981" />
                        : <ShieldAlert size={14} color="#ef4444" />}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: r.status === 'secure' ? '#10b981' : '#ef4444' }}>
                        {r.msg}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#e5e7eb', color: '#374151' }}
                      onClick={() => { setOrderId(id); setResult(r); }}
                    >
                      Load
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
