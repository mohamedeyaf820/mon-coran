import React, { memo, useLayoutEffect, useRef } from "react";
import CleanPageView from "../Quran/CleanPageView";

// Presentation adapter only: Quran text and interaction still belong to the
// same CleanPageView renderer used by the ordinary Mushaf.
export default memo(function ImmersiveMushafPage({ composition, scale, page, onMeasure, paperHeight, ...props }) {
  const sheetRef = useRef(null);
  const width = composition.pageWidth || composition.width + 50;
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const text = sheet?.querySelector('.mushaf-text-block');
    if (!text) return;
    [text, ...text.querySelectorAll('.cpv-verse, .cpv-verse *')].forEach((node) => {
      const normalClass = String(node.className).replace(/ cpv-verse--playing| cpv-verse--active/g, '');
      const styles = composition.styles[`${node.tagName}.${node.className}`] || composition.styles[`${node.tagName}.${normalClass}`] || {};
      for (const [key, value] of Object.entries(styles)) node.style.setProperty(key, value, 'important');
    });
    if (page <= 2) text.style.setProperty('margin-block', 'auto', 'important');
    const measure = () => {
      // Measure intrinsic content, not the shared paper height. This keeps
      // both sheets equal without a ResizeObserver feedback loop.
      const contentHeight = ['.mushaf-page-header', '.mushaf-text-block']
        .reduce((total, selector) => total + (sheet.querySelector(selector)?.offsetHeight || 0), 0);
      onMeasure?.(page, contentHeight + 104);
    };
    const observer = new ResizeObserver(measure);
    for (const child of sheet.querySelectorAll('.mushaf-page-header, .mushaf-text-block, .mushaf-page-footer')) observer.observe(child);
    measure();
    return () => observer.disconnect();
  }, [composition, props.ayahs, props.currentPlayingAyah, props.showTajwid, onMeasure, page]);
  return <div className="mfp-page-bounds" data-immersive-page={page} data-opening={page <= 2 || undefined} style={{ width: width * scale, height: paperHeight * scale }}>
    <div ref={sheetRef} className="mfp-shared-page" style={{ width, height: paperHeight, transform: `scale(${scale})` }}>
      <CleanPageView {...props} currentPage={page} fontSize={composition.fontSize} />
    </div>
  </div>;
});
