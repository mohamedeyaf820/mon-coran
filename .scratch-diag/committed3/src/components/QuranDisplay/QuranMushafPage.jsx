import React from "react";
import HafsPageRenderer from "./HafsPageRenderer";
import WarshPageRenderer from "./WarshPageRenderer";

/**
 * QuranMushafPage — the 15-line Madani sheet, dispatched per riwaya. Both
 * renderers compose their page through MushafPageShell + MushafPageLines so
 * the immersive overlay and the inline stream share one printed-page
 * contract; only word sourcing, font loading and line fitting differ.
 */
export default function QuranMushafPage(props) {
  const { riwaya } = props;
  return riwaya === "warsh"
    ? <WarshPageRenderer {...props} />
    : <HafsPageRenderer {...props} />;
}
