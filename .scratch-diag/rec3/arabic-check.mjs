import { RECITER_STYLE_FILTERS } from "../../src/data/reciters.js";

// Expected codepoints copied from the escapes the JSX used before the move.
const expected = {
  all: "\u0627\u0644\u0643\u0644",
  murattal: "\u0645\u0631\u062a\u0644",
  mujawwad: "\u0645\u062c\u0648\u062f",
  muallim: "\u0645\u0639\u0644\u0645",
  favorites: "\u0627\u0644\u0645\u0641\u0636\u0644\u0629",
};
let bad = 0;
for (const f of RECITER_STYLE_FILTERS) {
  const got = f.label.ar;
  const want = expected[f.id];
  if (got === want) {
    console.log(f.id, "OK");
  } else {
    bad++;
    console.log(
      f.id,
      "MISMATCH",
      JSON.stringify([...got].map((c) => c.codePointAt(0).toString(16))),
      JSON.stringify([...want].map((c) => c.codePointAt(0).toString(16))),
    );
  }
}
process.exit(bad ? 1 : 0);
