import React, { useState } from 'react';
import { blockApi } from '../services/api';
import { ShieldCheck, ShieldAlert, Search, RotateCcw, Copy, Check } from 'lucide-react';

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
  return isNaN(d) ? s : d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ── Copy-to-clipboard button ──────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        padding: '2px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #d1d5db',
        background: copied ? '#d1fae5' : '#f9fafb', color: copied ? '#065f46' : '#6b7280',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px',
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Hash display row with full value + copy ────────────────────────────────────
function HashRow({ label, value, highlight = false }) {
  if (!value) return null;
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <CopyButton text={value} />
      </div>
      <div style={{
        fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all',
        color: highlight ? '#065f46' : '#374151',
        background: highlight ? '#d1fae5' : '#f3f4f6',
        padding: '8px 12px', borderRadius: '6px',
        border: highlight ? '1px solid #6ee7b7' : '1px solid #e5e7eb',
        lineHeight: 1.6,
      }}>
        {value}
      </div>
    </div>
  );
}

export default function BlockchainApp() {
  const [orderId, setOrderId]   = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult]     = useState(null);
  const [cache, setCache]       = useState(loadStoredResults);

  const handleVerify = async (e) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;

    setVerifying(true);
    setResult(null);

    try {
      const res = await blockApi.get(`/blockchain/verify/order/${id}`);
      const data = res.data;

      // Extract all possible fields from the blockchain API response
      const blockData = data?.block || data?.data || data || {};
      const newResult = {
        orderId:       id,
        status:        data?.status === 'VALID' ? 'secure' : 'compromised',
        apiStatus:     data?.status || 'UNKNOWN',
        msg:           data?.status === 'VALID' ? 'Hash Verified — Integrity Intact' : 'Integrity Failure — Hash Mismatch',
        // Block identification
        blockIndex:    blockData?.index     ?? blockData?.block_index    ?? null,
        blockType:     blockData?.block_type ?? null,
        // Hashes — the core of blockchain verification
        blockHash:     blockData?.hash      ?? blockData?.block_hash     ?? null,
        previousHash:  blockData?.previous_hash                          ?? null,
        // Order/transaction data
        orderId2:      blockData?.order_id  ?? blockData?.orderId        ?? null,
        amount:        blockData?.amount    ?? blockData?.total_amount   ?? null,
        userId:        blockData?.user_id   ?? blockData?.userId         ?? null,
        paymentMethod: blockData?.payment_method                         ?? null,
        // Timestamps
        timestamp:     blockData?.timestamp ?? blockData?.created_at     ?? null,
        // Raw for debugging
        raw:           data,
        verifiedAt:    new Date().toISOString(),
      };

      setResult(newResult);
      const updated = { ...cache, [id]: newResult };
      setCache(updated);
      saveResults(updated);
    } catch (err) {
      const newResult = {
        orderId:    id,
        status:     err.response?.status === 404 ? 'missing' : 'error',
        apiStatus:  err.response?.status === 404 ? 'NOT_FOUND' : 'ERROR',
        msg:        err.response?.status === 404
          ? 'Order not found on Blockchain'
          : (err.response?.data?.message || err.message || 'Verification Error'),
        raw:        err.response?.data || null,
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
    ? result.status === 'secure'    ? '#10b981'
    : result.status === 'missing'   ? '#f59e0b'
    : '#ef4444'
    : '#6b7280';

  const statusBg = result
    ? result.status === 'secure'    ? '#f0fdf4'
    : result.status === 'missing'   ? '#fffbeb'
    : '#fef2f2'
    : '#f9fafb';

  const isVerified = result?.status === 'secure';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '760px', margin: '0 auto' }}>

      {/* Header card */}
      <div className="card" style={{ backgroundColor: '#111827', color: 'white' }}>
        <h3 className="flex items-center gap-2">
          <ShieldCheck color="#10b981" /> Blockchain Integrity Audit
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '10px', lineHeight: 1.6 }}>
          Enter an Order ID to cryptographically verify its block hash against the Blockchain Microservice.
          A <strong style={{ color: '#10b981' }}>VALID</strong> result means the stored hash matches the computed hash — the record has not been tampered with.
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

      {/* Loading state */}
      {verifying && (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>Querying blockchain node…</div>
          <div style={{ fontSize: '12px', marginTop: '6px', color: '#9ca3af' }}>Computing and comparing block hashes</div>
        </div>
      )}

      {/* Result card */}
      {!verifying && result && (
        <div className="card" style={{ border: `2px solid ${statusColor}`, backgroundColor: statusBg, padding: '20px' }}>

          {/* ── Status Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${statusColor}40` }}>
            {isVerified
              ? <ShieldCheck size={32} color={statusColor} />
              : <ShieldAlert size={32} color={statusColor} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '17px', color: statusColor }}>{result.msg}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                Verified at {formatDateTime(result.verifiedAt)}
              </div>
            </div>
            <span style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 700,
              backgroundColor: statusColor, color: 'white', letterSpacing: '0.05em',
            }}>
              {result.apiStatus}
            </span>
          </div>

          {/* ── Hash Match Badge (only for secure/compromised) ── */}
          {result.blockHash && (result.status === 'secure' || result.status === 'compromised') && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
              borderRadius: '8px', marginBottom: '20px',
              backgroundColor: isVerified ? '#dcfce7' : '#fee2e2',
              border: `1px solid ${isVerified ? '#86efac' : '#fca5a5'}`,
            }}>
              <span style={{ fontSize: '20px' }}>{isVerified ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: isVerified ? '#15803d' : '#dc2626' }}>
                  {isVerified ? 'HASH MATCH — Block integrity confirmed' : 'HASH MISMATCH — Data may have been tampered'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                  {isVerified
                    ? 'The stored block hash matches the recomputed hash. This record is authentic.'
                    : 'The stored block hash does not match. This record may have been altered.'}
                </div>
              </div>
            </div>
          )}

          {/* ── Detail Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Order ID */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Order ID</div>
                <CopyButton text={result.orderId} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', color: '#111827', background: '#f3f4f6', padding: '8px 12px', borderRadius: '6px' }}>
                {result.orderId}
              </div>
            </div>

            {/* Block Index */}
            {result.blockIndex !== null && result.blockIndex !== undefined && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Block Index</div>
                <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#111827' }}>#{result.blockIndex}</div>
              </div>
            )}

            {/* Block Type */}
            {result.blockType && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Block Type</div>
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: '#e0e7ff', color: '#3730a3' }}>
                  {result.blockType}
                </div>
              </div>
            )}

            {/* Amount */}
            {result.amount && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Amount</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{formatIDR(result.amount)}</div>
              </div>
            )}

            {/* Payment Method */}
            {result.paymentMethod && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</div>
                <div style={{ fontSize: '13px', color: '#374151' }}>{result.paymentMethod}</div>
              </div>
            )}

            {/* Block Timestamp */}
            {result.timestamp && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Block Timestamp</div>
                <div style={{ fontSize: '13px', color: '#374151' }}>{formatDateTime(result.timestamp)}</div>
              </div>
            )}

            {/* Block Hash (highlighted green if verified) */}
            <HashRow
              label={isVerified ? '✅ Block Hash (Verified Match)' : '❌ Block Hash'}
              value={result.blockHash}
              highlight={isVerified}
            />

            {/* Previous Hash */}
            <HashRow label="Previous Hash" value={result.previousHash} />
          </div>

        </div>
      )}

      {/* Recent lookups */}
      {Object.keys(cache).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Recent Lookups</h3>
            <button onClick={() => { setCache({}); saveResults({}); }}
              style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear All
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Block #</th>
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cache).slice(-10).reverse().map(([id, r]) => (
                <tr key={id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                    {r.blockIndex !== null && r.blockIndex !== undefined ? `#${r.blockIndex}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.status === 'secure'
                        ? <ShieldCheck size={14} color="#10b981" />
                        : <ShieldAlert size={14} color={r.status === 'missing' ? '#f59e0b' : '#ef4444'} />}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: r.status === 'secure' ? '#10b981' : r.status === 'missing' ? '#f59e0b' : '#ef4444' }}>
                        {r.apiStatus || r.status?.toUpperCase()}
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
