/**
 * useLoginRateLimit — hook anti-brute-force untuk halaman login.
 *
 * Logika timeout bertingkat (per-session, disimpan di sessionStorage):
 *  - 5 kali gagal   → timeout 10 menit
 *  - 10 kali gagal  → timeout 30 menit
 *  - 15 kali gagal  → BLOKIR PERMANEN (session tidak bisa mencoba lagi)
 *
 * State disimpan di sessionStorage dengan key unik per `storageKey`.
 * Otomatis di-clear jika berhasil login (panggil resetAttempts()).
 */

import { useState, useEffect, useCallback } from 'react';

const THRESHOLDS = [
  { failCount: 5,  durationMs: 10 * 60 * 1000 }, // setelah 5x gagal  → 10 menit
  { failCount: 10, durationMs: 30 * 60 * 1000 }, // setelah 10x gagal → 30 menit
  { failCount: 15, durationMs: Infinity },         // setelah 15x gagal → blokir permanen
];

function getStorageState(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return { attempts: 0, lockedUntil: null, permanent: false };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null, permanent: false };
  }
}

function saveStorageState(storageKey, state) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearStorageState(storageKey) {
  try {
    sessionStorage.removeItem(storageKey);
  } catch { /* ignore */ }
}

/**
 * @param {string} storageKey - Kunci unik di sessionStorage (misalnya 'login_rl_dashboard')
 * @returns {{ isLocked, isPermanent, remainingMs, remainingLabel, attempts, recordFailure, resetAttempts }}
 */
export function useLoginRateLimit(storageKey = 'login_rate_limit') {
  const [state, setState] = useState(() => getStorageState(storageKey));
  const [now, setNow] = useState(() => Date.now());

  // Tick setiap detik untuk update countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hitung sisa waktu lock
  const lockedUntilMs = state.lockedUntil || 0;
  const remainingMs   = state.permanent ? Infinity : Math.max(0, lockedUntilMs - now);
  const isLocked      = state.permanent || remainingMs > 0;
  const isPermanent   = state.permanent;

  // Format label countdown "MM:SS" atau "mm menit ss detik"
  const remainingLabel = useCallback(() => {
    if (state.permanent) return 'Sesi ini telah diblokir permanen.';
    if (remainingMs <= 0)  return '';
    const totalSec = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [state.permanent, remainingMs]);

/**
 * Cari threshold yang cocok dan terapkan ke state.
 * Dipisah dari recordFailure untuk mengurangi cognitive complexity.
 */
function applyThreshold(currentState, newAttempts) {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (newAttempts < THRESHOLDS[i].failCount) continue;
    if (THRESHOLDS[i].durationMs === Infinity) {
      return { ...currentState, attempts: newAttempts, permanent: true, lockedUntil: null };
    }
    return {
      ...currentState,
      attempts:    newAttempts,
      permanent:   false,
      lockedUntil: Date.now() + THRESHOLDS[i].durationMs,
    };
  }
  return { ...currentState, attempts: newAttempts };
}

  /**
   * Dipanggil setiap kali login gagal.
   * Mengembalikan { isLocked, isPermanent } setelah update.
   */
  const recordFailure = useCallback(() => {
    const current = getStorageState(storageKey);
    if (current.permanent) return { isLocked: true, isPermanent: true };

    const newAttempts = current.attempts + 1;
    const newState    = applyThreshold(current, newAttempts);

    saveStorageState(storageKey, newState);
    setState(newState);
    return { isLocked: newState.permanent || (newState.lockedUntil > Date.now()), isPermanent: newState.permanent };
  }, [storageKey]);

  /**
   * Dipanggil saat login BERHASIL untuk mereset counter.
   */
  const resetAttempts = useCallback(() => {
    clearStorageState(storageKey);
    setState({ attempts: 0, lockedUntil: null, permanent: false });
  }, [storageKey]);

  return {
    isLocked,
    isPermanent,
    remainingMs,
    remainingLabel,
    attempts: state.attempts,
    recordFailure,
    resetAttempts,
  };
}
