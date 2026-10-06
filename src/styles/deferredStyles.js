// Keep the deferred cascade in one module so Vite preserves this exact order.
// Independent dynamic imports made equal-specificity selectors depend on timing.
import "./responsive-all.css";
import "./domains/premium-platform.css";
import "./domains/premium-plus.css";
import "./expert-overhaul.css";
import "./home-audio-ux-refonte.css";
import "./device-responsive.css";
// Home-only responsive polish is non-critical to the first frame and follows
// the same post-paint path as the rest of the optional refinement layer.
import "./home-resume-refinement.css";
// The resume card: next reading as the centre, one big action.
import "./home-hero-refine.css";
// The Explore section: a plain heading, a tidy toolbar, rows that keep their room.
import "./home-content-refine.css";

