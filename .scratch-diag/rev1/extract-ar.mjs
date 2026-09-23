import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("src/components/AyahActions.jsx", "utf8");
const panel = readFileSync("src/components/audioPlayer/PlaybackSettingsPanel.jsx", "utf8");

function grab(hay, re, label) {
  const m = hay.match(re);
  if (!m) throw new Error("missing " + label);
  return m[1];
}
const close = grab(src, /"Fermer" : lang === "ar" \? "([^"]+)" : "Close"/, "close");
const addBm = grab(src, /"Ajouter aux favoris" : lang === "ar" \? "([^"]+)" : "Add bookmark"/, "addBookmark");
const rmBm = grab(src, /"Retirer le favori" : lang === "ar" \? "([^"]+)" : "Remove bookmark"/, "removeBookmark");
const addNote = grab(src, /"Ajouter une note" : lang === "ar" \? "([^"]+)" : "Add note"/, "addNote");
const on = grab(panel, /"Activé" : lang === "ar" \? "([^"]+)" : "On"/, "stateOn");
const off = grab(panel, /"Désactivé" : lang === "ar" \? "([^"]+)" : "Off"/, "stateOff");
const out = { close, addBm, rmBm, addNote, on, off };
writeFileSync(".scratch-diag/rev1/ar-extracted.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v].map((c) => c.codePointAt(0).toString(16)).join(" ")])), null, 1));
