import { buildCspPolicy } from "./cspPolicy.mjs";

const modeArg = String(process.argv[2] || "production").toLowerCase();
const mode = modeArg === "dev" || modeArg === "development" ? "development" : "production";

console.log(`[csp] mode=${mode}`);
console.log(buildCspPolicy(mode));
