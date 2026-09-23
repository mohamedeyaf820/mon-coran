import { getRecitersByRiwaya } from "../../src/data/reciters.js";

for (const riwaya of ["hafs", "warsh"]) {
  const counts = {};
  for (const r of getRecitersByRiwaya(riwaya)) counts[r.style] = (counts[r.style] || 0) + 1;
  console.log(riwaya, getRecitersByRiwaya(riwaya).length, JSON.stringify(counts));
}
