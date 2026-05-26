import React from "react";

export default function ArabicText({
  children,
  className = "",
  text,
  tajweedHtml,
}) {
  const arabicStyle = {
    fontFamily: "var(--quran-font-family)",
    fontSize: "var(--quran-font-size)",
    lineHeight: "var(--quran-line-height)",
  };

  if (tajweedHtml) {
    return (
      <span
        className={`verse-text quran-arabic-text inline ${className}`.trim()}
        style={arabicStyle}
        dir="rtl"
        lang="ar"
        dangerouslySetInnerHTML={{ __html: tajweedHtml }}
      />
    );
  }

  return (
    <span
      className={`verse-text quran-arabic-text inline ${className}`.trim()}
      style={arabicStyle}
      dir="rtl"
      lang="ar"
    >
      {children ?? text}
    </span>
  );
}

export { ArabicText };
