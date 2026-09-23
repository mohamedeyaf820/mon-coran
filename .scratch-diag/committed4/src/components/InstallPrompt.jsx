import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../context/AppContext';
import { t } from '../i18n';

// One-shot install guidance. Android/Chrome gets the native
// beforeinstallprompt flow; iOS Safari exposes no such event, so the card
// explains the Share → Home Screen path instead. A dismissal is persisted so
// the hint never interrupts reading twice.
const DISMISS_KEY = 'mushaf-plus-install-hint-dismissed';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== 'undefined' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches === true
    || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const lang = useAppSelector((s) => s.lang);
  const deferredRef = useRef(null);
  const [mode, setMode] = useState(null); // 'android' | 'ios'

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return undefined;
    if (isStandalone()) return undefined;
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch {}
    if (dismissed) return undefined;

    const onBeforeInstall = (event) => {
      event.preventDefault();
      deferredRef.current = event;
      setMode('android');
    };
    const onInstalled = () => {
      deferredRef.current = null;
      setMode(null);
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    };

    let supportsPrompt = 'BeforeInstallPromptEvent' in window;
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    if (!supportsPrompt && isIOS()) setMode('ios');

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setMode(null);
  };

  const install = async () => {
    const deferred = deferredRef.current;
    if (!deferred) { dismiss(); return; }
    deferred.prompt();
    const { outcome } = await deferred.userChoice.catch(() => ({ outcome: 'unknown' }));
    deferredRef.current = null;
    if (outcome !== 'accepted') dismiss();
    else setMode(null);
  };

  if (!mode) return null;

  const title = t('install.title', lang);
  const body = t(mode === 'ios' ? 'install.iosBody' : 'install.androidBody', lang);
  const cta = t(mode === 'ios' ? 'install.understood' : 'install.cta', lang);

  return (
    <div
      role="note"
      className="install-prompt"
      style={{
        position: 'fixed',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 9998, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--space-3) var(--space-4)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        boxShadow: 'var(--shadow-md)', maxWidth: '92vw',
        fontFamily: 'var(--font-ui,sans-serif)',
      }}
    >
      <img src="/logo-192.png" alt="" width={36} height={36} style={{ borderRadius: 'var(--r-sm)', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--ts-sm, 0.875rem)' }}>{title}</strong>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--ts-xs, 0.75rem)', lineHeight: 1.35 }}>{body}</span>
      </div>
      {mode === 'android' ? (
        <button
          type="button"
          onClick={install}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--r-sm)', padding: 'var(--space-2) var(--space-3)', fontWeight: 700,
            cursor: 'pointer', fontSize: 'var(--ts-xs, 0.75rem)', whiteSpace: 'nowrap',
            minWidth: 44, minHeight: 44,
          }}
        >
          {cta}
        </button>
      ) : (
        <button
          type="button"
          onClick={dismiss}
          style={{
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            padding: 'var(--space-2) var(--space-3)', fontWeight: 700, cursor: 'pointer',
            fontSize: 'var(--ts-xs, 0.75rem)', whiteSpace: 'nowrap', minWidth: 44, minHeight: 44,
          }}
        >
          {cta}
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('install.ignore', lang)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.15rem',
          minWidth: 44, minHeight: 44, alignSelf: 'stretch',
        }}
      >×</button>
    </div>
  );
}
