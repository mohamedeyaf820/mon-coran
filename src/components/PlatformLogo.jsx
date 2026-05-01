import React, { useState } from "react";

const PRIMARY_LOGO_SRC = "/logo.png";
const FALLBACK_LOGO_SRC = "/favicon.svg";

export default function PlatformLogo({
  className = "",
  imgClassName = "",
  alt = "MushafPlus",
  decorative = false,
  priority = false,
  loading = "lazy",
  fetchPriority = "auto",
  width = 64,
  height = 64,
}) {
  const [src, setSrc] = useState(PRIMARY_LOGO_SRC);
  const [loadFailed, setLoadFailed] = useState(false);

  if (loadFailed) {
    return (
      <span className={className} aria-hidden={decorative ? "true" : undefined}>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--theme-primary)_18%,transparent_82%)] text-xs font-semibold text-[color-mix(in_srgb,var(--theme-primary)_85%,var(--theme-text)_15%)] shadow-sm">
          MP
        </span>
      </span>
    );
  }

  return (
    <span className={className} aria-hidden={decorative ? "true" : undefined}>
      <img
        src={src}
        alt={decorative ? "" : alt}
        className={imgClassName}
        loading={priority ? "eager" : loading}
        fetchpriority={priority ? "high" : fetchPriority}
        decoding={priority ? "sync" : "async"}
        width={width}
        height={height}
        onError={() => {
          if (src !== FALLBACK_LOGO_SRC) setSrc(FALLBACK_LOGO_SRC);
          else setLoadFailed(true);
        }}
      />
    </span>
  );
}
