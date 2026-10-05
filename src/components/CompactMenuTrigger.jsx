import { Menu } from "lucide-react";
import { useAppActions, useAppLocale, useAppSelector } from "../context/AppContext";
import { t } from "../i18n";

/**
 * Compact-shell menu trigger.
 *
 * The header is display:none below 1024px (shell-calm.css), so the
 * recitation-page hamburger is unreachable on exactly the viewports it
 * serves. This trigger mounts beside the bottom bar and opens the same
 * Sidebar via TOGGLE_SIDEBAR — a second entry point to the existing
 * menu, not a parallel navigation.
 *
 * It is deliberately self-styled rather than reusing mp-header__icon-btn:
 * responsive-all.css forces a 2.15rem !important size on
 * .app-root .mp-header__icon-btn below 1024px, which would shrink the
 * trigger to ~34px and break the 44px touch-target contract. Blocking
 * modals need no local guard — this node lives inside .app-root, which
 * goes inert under them (the same contract MobileNavigation relies on).
 */
export default function CompactMenuTrigger({ immersiveHidden = false }) {
  const { dispatch } = useAppActions();
  const { lang } = useAppLocale();
  const sidebarOpen = useAppSelector((current) => current.sidebarOpen);

  // Immersive reading owns the whole screen; a floating trigger would be
  // an unreachable control over the reader.
  if (immersiveHidden) return null;

  // While the Sidebar is open the click-out overlay owns the screen. The
  // trigger stays mounted but inert so the drawer can return focus to it
  // on close — the same contract the header hamburger keeps on the
  // recitation pages (Header.jsx).
  return (
    <button
      type="button"
      className="compact-menu-trigger"
      onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
      aria-label={t("nav.menu", lang)}
      aria-expanded={sidebarOpen}
      aria-controls="sidebar"
      aria-haspopup="dialog"
      aria-hidden={sidebarOpen ? "true" : undefined}
      inert={sidebarOpen ? "" : undefined}
    >
      <Menu size={18} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
