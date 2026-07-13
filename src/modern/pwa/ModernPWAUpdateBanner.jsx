import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ModernPWAUpdateBanner() {
  const [registration, setRegistration] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    let active = true;
    const inspect = (next) => {
      if (!active || !next) return;
      if (next.waiting && navigator.serviceWorker.controller) setRegistration(next);
      next.addEventListener("updatefound", () => next.installing?.addEventListener("statechange", () => {
        if (next.installing?.state === "installed" && navigator.serviceWorker.controller) setRegistration(next);
      }));
    };
    navigator.serviceWorker.getRegistration().then(inspect).catch(() => {});
    const onReady = (event) => inspect(event.detail);
    window.addEventListener("modern-pwa-update", onReady);
    return () => { active = false; window.removeEventListener("modern-pwa-update", onReady); };
  }, []);
  if (!registration || dismissed) return null;
  const update = () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  };
  return <aside className="modern-pwa-update" role="status"><span><strong>Mise a jour disponible</strong><small>La nouvelle version est prete.</small></span><button onClick={update} type="button"><RefreshCw size={16} />Mettre a jour</button><button aria-label="Fermer" onClick={() => setDismissed(true)} type="button"><X size={17} /></button></aside>;
}
