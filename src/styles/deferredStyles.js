// Keep the deferred cascade in one module so Vite preserves this exact order.
// Independent dynamic imports made equal-specificity selectors depend on timing.
import "./domains/premium-platform.css";
import "./domains/premium-plus.css";
import "./expert-overhaul.css";
import "./home-audio-ux-refonte.css";
import "./device-responsive.css";
// Final shared constraints always win after the legacy/polish cascade.
import "./app-system.css";

