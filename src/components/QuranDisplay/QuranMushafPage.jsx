import React from "react";
import HafsPageRenderer from "./HafsPageRenderer";
import WarshPageRenderer from "./WarshPageRenderer";
import { MushafSurfaceContext } from "./mushafSurface";

/**
 * QuranMushafPage — the 15-line Madani sheet, dispatched per riwaya. Both
 * renderers compose their page through MushafPageShell + MushafPageLines so
 * the immersive overlay and the inline stream share one printed-page
 * contract; only word sourcing, font loading and line fitting differ.
 *
 * `surface` says which of the two is drawing: the immersive book ("book",
 * the default — it is the printed page) or the reader's own page ("pane"),
 * whose furniture is localised with it.
 */
export default function QuranMushafPage({ surface = "book", ...props }) {
  const { riwaya } = props;
  const Page = riwaya === "warsh" ? WarshPageRenderer : HafsPageRenderer;
  return (
    <MushafSurfaceContext.Provider value={surface}>
      <Page {...props} />
    </MushafSurfaceContext.Provider>
  );
}
