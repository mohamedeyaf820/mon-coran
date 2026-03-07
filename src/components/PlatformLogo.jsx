import React, { useState } from "react";

const PRIMARY_LOGO_SRC = "/logo.png";
const FALLBACK_LOGO_SRC = "/favicon.svg";

export default function PlatformLogo({
  className = "",
  imgClassName = "",
  alt = "MushafPlus",
  decorative = false,
}) {
  const [src, setSrc] = useState(PRIMARY_LOGO_SRC);

  return (
    <span className={className} aria-hidden={decorative ? "true" : undefined}>
      <img
        src={src}
        alt={decorative ? "" : alt}
        className={imgClassName}
        loading="eager"
        decoding="async"
        onError={() => {
          if (src !== FALLBACK_LOGO_SRC) setSrc(FALLBACK_LOGO_SRC);
        }}
      />
    </span>
  );
}