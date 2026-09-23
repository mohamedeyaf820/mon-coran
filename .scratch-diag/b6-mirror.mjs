// scratch: mirror my batch-6 edits into the export build
import { readFileSync, writeFileSync } from "node:fs";

const E = ".scratch-diag/committed3";
const edits = [
  {
    file: `${E}/src/styles/mushaf-page-polish.css`,
    reps: [
      [
        "  color: #d8c9a7 !important;\n  font-size: 0.54rem;\n",
        "  color: #d8c9a7 !important;\n  /* Rem-only scales fell to 8.1px on a phone (root is 15px while reading). */\n  font-size: clamp(max(0.62rem, 10px), 0.6rem + 0.12vw, 0.72rem);\n",
      ],
      [
        "  font-size: clamp(0.48rem, 0.4rem + 0.15vw, 0.6rem) !important;\n",
        "  /* Measured 7.2px on a phone: the reading root font-size is 15px, so this\n     rem-only clamp fell under the app's 10px legibility floor. */\n  font-size: clamp(max(0.62rem, 10px), 0.6rem + 0.12vw, 0.72rem) !important;\n",
      ],
    ],
  },
  {
    file: `${E}/src/styles/settings-enhanced.css`,
    reps: [
      [
        "    text-align: center !important;\n  }\n}\n",
        "    text-align: center !important;\n  }\n}\n\n/* Four columns leave ~56-66px per tab on a narrow phone, which is shorter than\n   \"Confidentialité\" at the 10px floor: the label ellipsised and the tab became\n   unreadable. Two rows give every label its natural width; the sheet already\n   scrolls its body, so the extra strip height costs nothing reachable. */\n@media (max-width: 340px) {\n  .settings-qurancom .settings-drawer__tabs {\n    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;\n    min-height: 0 !important;\n    max-height: none !important;\n  }\n}\n",
      ],
    ],
  },
];

for (const e of edits) {
  let s = readFileSync(e.file, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [from, to] of e.reps) {
    const f = from.replaceAll("\n", nl);
    const t = to.replaceAll("\n", nl);
    const n = s.split(f).length - 1;
    if (n !== 1) throw new Error(`count ${n} in ${e.file} for ${from.slice(0, 40)}`);
    s = s.replace(f, t);
  }
  writeFileSync(e.file, s);
  console.log("ok", e.file);
}

// sanity: worktree must contain the same three strings
for (const [file, needles] of [
  ["src/styles/mushaf-page-polish.css", ["clamp(max(0.62rem, 10px), 0.6rem + 0.12vw, 0.72rem)", "clamp(max(0.62rem, 10px), 0.6rem + 0.12vw, 0.72rem) !important"]],
  ["src/styles/settings-enhanced.css", ["@media (max-width: 340px) {"]],
]) {
  const w = readFileSync(file, "utf8");
  for (const n of needles) if (!w.includes(n)) throw new Error(`worktree missing: ${n} in ${file}`);
}
console.log("worktree consistent");
