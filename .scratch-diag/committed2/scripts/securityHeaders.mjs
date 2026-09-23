import { buildCspPolicy } from "./cspPolicy.mjs";

export function buildRootSecurityHeaders(mode = "production") {
  return {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), bluetooth=(), serial=(), hid=(), screen-wake-lock=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": buildCspPolicy(mode),
  };
}
