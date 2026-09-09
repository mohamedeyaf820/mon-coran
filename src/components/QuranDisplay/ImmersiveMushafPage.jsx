import React, { memo, useLayoutEffect, useRef, useState } from "react";
import CleanPageView from "../Quran/CleanPageView";

// Presentation adapter only: Quran text and interaction still belong to the
// same CleanPageView renderer used by the ordinary Mushaf.
export default memo(function ImmersiveMushafPage({ composition, scale, page, onMeasure, ...props }) {
  const sheetRef = useRef(null);
  const [height, setHeight] = useState(0);
  const width = composition.pageWidth || composition.width + 24;
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const text = sheet?.querySelector('.mushaf-text-block');
    if (!text) return;
    [text, ...text.querySelectorAll('.cpv-verse, .cpv-verse *')].forEach((node) => {
      const normalClass = String(node.className).replace(/ cpv-verse--playing| cpv-verse--active/g, '');
      const styles = composition.styles[`${node.tagName}.${node.className}`] || composition.styles[`${node.tagName}.${normalClass}`] || {};
      for (const [key, value] of Object.entries(styles)) node.style.setProperty(key, value, 'important');
    });
    const measure = () => {
      setHeight(sheet.offsetHeight);
      onMeasure?.(page, sheet.offsetHeight);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    measure();
    return () => observer.disconnect();
  }, [composition, props.ayahs, props.currentPlayingAyah, props.showTajwid, onMeasure, page]);
  return <div className="mfp-page-bounds" data-immersive-page={page} style={{ width: width * scale, height: height * scale }}>
    <div ref={sheetRef} className="mfp-shared-page" style={{ width, transform: `scale(${scale})` }}>
      <CleanPageView {...props} currentPage={page} fontSize={composition.fontSize} />
    </div>
  </div>;
});
