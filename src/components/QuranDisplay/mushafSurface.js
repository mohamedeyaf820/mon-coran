import { createContext, useContext } from "react";

/**
 * MushafSurfaceContext — which surface is drawing the sheet.
 *
 * The reading pane and the immersive book render the same components on
 * purpose, but they are different objects: the book is the Madani printed page,
 * whose furniture stays Arabic, while the pane is a reader's page that carries
 * its labels in the interface language. The surface is what tells them apart
 * without threading a prop through every renderer.
 */
export const MushafSurfaceContext = createContext("book");

export function useMushafSurface() {
  return useContext(MushafSurfaceContext);
}
