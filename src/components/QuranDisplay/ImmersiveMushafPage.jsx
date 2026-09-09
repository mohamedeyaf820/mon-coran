import React, { memo, useLayoutEffect, useRef, useState } from "react";
import CleanPageView from "../Quran/CleanPageView";

// Presentation adapter only: Quran text and interaction still belong to the
// same CleanPageView renderer used by the ordinary Mushaf.
export default memo(function ImmersiveMushafPage({ composition, scale, page, ...props }) {
  const sheetRef = useRef(null);
  const [height, setHeight] = useState(0);
  const width = composition.pageWidth || composition.width + 24;
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const text = sheet?.querySelector('.mushaf-text-block');
    if (!text) return;
    [text, ...text.querySelectorAll('*')].forEach((node) => {
      const normalClass = String(node.className).replace(/ cpv-verse--playing| cpv-verse--active/g, '');
      const styles = composition.styles[`${node.tagName}.${node.className}`] || composition.styles[`${node.tagName}.${normalClass}`] || {};
      for (const [key, value] of Object.entries(styles)) node.style.setProperty(key, value, 'important');
    });
    const observer = new ResizeObserver(() => setHeight(sheet.offsetHeight));
    observer.observe(sheet);
    setHeight(sheet.offsetHeight);
    return () => observer.disconnect();
  }, [composition, props.ayahs, props.currentPlayingAyah, props.showTajwid]);
  return <div className="mfp-page-bounds" data-immersive-page={page} style={{ width: width * scale, height: height * scale }}>
    <div ref={sheetRef} className="mfp-shared-page" style={{ width, transform: `scale(${scale})` }}>
      <CleanPageView {...props} currentPage={page} fontSize={composition.fontSize} />
    </div>
  </div>;
});
