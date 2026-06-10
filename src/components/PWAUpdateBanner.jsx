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
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, background: 'var(--bg-card,#fff)', border: '1px solid var(--border,#e5e7eb)',
        borderRadius: '0.75rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center',
        gap: '0.75rem', boxShadow: '0 4px 24px rgba(0,0,0,.15)', maxWidth: '92vw',
        fontFamily: 'var(--font-ui,sans-serif)', fontSize: '0.85rem',
      }}
    >
      <span style={{ color: 'var(--text-primary,#111)' }}>{t('pwa.updateAvailable', lang)}</span>
      <button
        onClick={reload}
        style={{
          background: 'var(--primary,#2563eb)', color: '#fff', border: 'none',
          borderRadius: '0.5rem', padding: '0.35rem 0.9rem', fontWeight: 700,
          cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
        }}
      >
        {t('pwa.update', lang)}
      </button>
      <button
        onClick={() => setWaiting(false)}
        aria-label={t('pwa.dismiss', lang)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted,#6b7280)', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.15rem',
        }}
      >×</button>
    </div>
  );
}
