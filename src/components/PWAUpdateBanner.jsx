import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { useAppSelector } from '../context/AppContext';

export default function PWAUpdateBanner() {
  const lang = useAppSelector((s) => s.lang);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      if (reg.waiting) { setWaiting(true); return; }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(true);
        });
      });
    });
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
      style={{
        position: 'fixed', bottom: 'var(--space-5)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--space-2) var(--space-4)', display: 'flex',
        alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'var(--shadow-md)',
        maxWidth: '92vw', fontFamily: 'var(--font-ui,sans-serif)', fontSize: 'var(--ts-sm, 0.875rem)',
      }}
    >
      <span style={{ color: 'var(--text-primary)' }}>{t('pwa.updateAvailable', lang)}</span>
      <button
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
        onClick={() => setWaiting(false)}
        aria-label={t('pwa.dismiss', lang)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.15rem',
        }}
      >×</button>
    </div>
  );
}
