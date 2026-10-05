import React, { memo } from "react";
import CleanPageView from "../Quran/CleanPageView";

/**
 * ImmersiveMushafPage:
 * Directly renders CleanPageView inside a dedicated page bound of exact physical dimensions
 * computed for the viewport. Preserves Medina Mushaf proportions (~1:1.42), crisp typography,
 * illuminated borders, and rosettes with zero CSS scaling distortion.
 */
export default memo(function ImmersiveMushafPage({
  composition,
  page,
  pageWidth,
  pageHeight,
  fontSize,
  lineHeight,
  isLeftPage = false,
  isRightPage = false,
  ...props
}) {
  const isOpening = page <= 2;
  const w = composition?.pageWidth ?? pageWidth;
  const h = composition?.pageHeight ?? pageHeight;
  const fs = composition?.fontSize ?? fontSize;
  const lh = composition?.lineHeight ?? lineHeight ?? "1.5";

  return (
    <div
      className={`mfp-page-bounds${isLeftPage ? " mfp-page-bounds--left" : ""}${isRightPage ? " mfp-page-bounds--right" : ""}`}
      data-immersive-page={page}
      data-opening={isOpening ? "true" : undefined}
      style={{
        width: `${w}px`,
        height: `${h}px`,
        "--mfp-font-size": `${fs}px`,
        "--mfp-line-height": lh,
      }}
    >
      <div className="mfp-shared-page" style={{ width: "100%", height: "100%" }}>
        <CleanPageView {...props} currentPage={page} fontSize={fs} isOpeningPage={isOpening} />
      </div>
    </div>
  );
});
