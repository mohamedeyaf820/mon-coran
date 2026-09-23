// scratch: contact sheet of candidate reciter portraits for visual identity check.
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.cwd().replace(/\\/g, "/");
const items = [
  ["saad_almoqren · Way2Quran", "w2q/almoqren-saad-almqren.jpg"],
  ["warsh_dagous · Way2Quran", "w2q/dagous-abdul-karim-al-daghoush.jpg"],
  ["warsh_rachid_belalaya · Way2Quran", "w2q/belalaya-rasheed-bel-alia.jpg"],
  ["warsh_yassin · Assabile", "../rec/new/v-al-qari-yassen.png"],
  ["warsh_yassin · Way2Quran", "w2q/yassin-yassin-al-jazairi.jpeg"],
  ["warsh_mohamed_abdulkarim · Assabile", "w2q/assabile-abdulkareem.png"],
  ["témoin: default.png Assabile", "../rec/new/v-default.png"],
  ["témoin: Belalia (carte Assabile)", "../rec/new/v-rachid-belalia.png"],
];

const html =
  `<!doctype html><meta charset=utf-8><body style="background:#151515;margin:10px;display:flex;flex-wrap:wrap;gap:10px;font:12px system-ui;color:#eee">` +
  items
    .map(
      ([t, f]) =>
        `<div style="width:212px"><img src="file:///${base}/.scratch-diag/rec/${f}" style="width:212px;height:162px;object-fit:contain;background:#000;display:block"><div>${t}</div></div>`,
    )
    .join("") +
  `</body>`;
writeFileSync(".scratch-diag/rec/w2q/grid.html", html, "utf8");

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 920, height: 560 } });
await p.goto(`file:///${base}/.scratch-diag/rec/w2q/grid.html`);
await p.waitForTimeout(1500);
await p.screenshot({ path: ".scratch-diag/rec/w2q/grid.png" });
await b.close();
console.log("grid écrit");
