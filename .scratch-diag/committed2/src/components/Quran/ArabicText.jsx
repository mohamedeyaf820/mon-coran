import React from "react";
import { sanitizeHtml } from "../../lib/security";

function parseHtmlSafely(html, keyPrefix = "") {
  if (!html) return [];
  if (typeof DOMParser === "undefined") return [];
  
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    const walk = (node, key) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        // Only allow span and font tags
        if (tagName === "span" || tagName === "font") {
          const className = node.getAttribute("class") || "";
          const color = node.getAttribute("color") || "";
          const style = {};
          if (color) style.color = color;
          
          const children = Array.from(node.childNodes).map((child, idx) =>
            walk(child, `${key}-${idx}`)
          );
          
          return (
            <span key={key} className={className} style={style}>
              {children}
            </span>
          );
        }
      }
      return null;
    };
    
    return Array.from(doc.body.childNodes).map((node, idx) =>
      walk(node, `${keyPrefix}-${idx}`)
    );
  } catch (e) {
    console.error("HTML parsing failed:", e);
    return [];
  }
}

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
      >
        {parseHtmlSafely(sanitizeHtml(tajweedHtml), "arabic-text")}
      </span>
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
