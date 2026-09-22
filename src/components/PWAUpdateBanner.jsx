import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { useAppSelector } from '../context/AppContext';

export default function PWAUpdateBanner() {
  const lang = useAppSelector((s) => s.lang);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;
    let registration;
    let installingWorker = null;
    let onStateChange = null;

    const detachStateChange = () => {
      if (installingWorker && onStateChange) {
        installingWorker.removeEventListener('statechange', onStateChange);
      }
      installingWorker = null;
      onStateChange = null;
    };

    const handleUpdateFound = () => {
      const sw = registration?.installing;
      if (!sw) return;
      detachStateChange();
      installingWorker = sw;
      onStateChange = () => {
        if (sw.state !== 'installed') return;
        detachStateChange();
        if (!cancelled && navigator.serviceWorker.controller && registration?.waiting === sw) {
          setWaiting(true);
        }
      };
      sw.addEventListener('statechange', onStateChange);
    };

    navigator.serviceWorker.getRegistration().then((existing) => (
      existing || navigator.serviceWorker.ready
    )).then((reg) => {
      if (cancelled || !reg) return;
      registration = reg;
      if (reg.waiting) {
        setWaiting(true);
        return;
      }
      reg.addEventListener('updatefound', handleUpdateFound);
    }).catch(() => {});

    return () => {
      cancelled = true;
      registration?.removeEventListener('updatefound', handleUpdateFound);
      detachStateChange();
    };
  }, []);

  if (!waiting) return null;

  const reload = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg?.waiting) return;
      // Attach listener before postMessage to avoid missing the controllerchange event
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    });
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="pwa-update-banner"
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--space-2) var(--space-4)', display: 'flex',
        alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'var(--shadow-md)',
        maxWidth: '92vw', fontFamily: 'var(--font-ui,sans-serif)', fontSize: 'var(--ts-sm, 0.875rem)',
      }}
    >
      <span style={{ color: 'var(--text-primary)' }}>{t('pwa.updateAvailable', lang)}</span>
      <button
        type="button"
        onClick={reload}
        style={{
          background: 'var(--primary)', color: '#fff', border: 'none',
          borderRadius: 'var(--r-sm)', padding: 'var(--space-1) var(--space-3)', fontWeight: 700,
          cursor: 'pointer', fontSize: 'var(--ts-xs, 0.75rem)', whiteSpace: 'nowrap',
        }}
      >
        {t('pwa.update', lang)}
      </button>
      <button
        type="button"
        onClick={() => setWaiting(false)}
        aria-label={t('pwa.dismiss', lang)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.15rem',
          minWidth: 44, minHeight: 44,
        }}
      >×</button>
    </div>
  );
}
