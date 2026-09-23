// scratch: insert the Kalbani profile record, preserving the file's exact shape
import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../../public/data/reciter-profiles.json", import.meta.url);
const raw = readFileSync(FILE, "utf8");
const profiles = JSON.parse(raw);

if (profiles.adel_al_kalbani) {
  console.log("already present, nothing to do");
  process.exit(0);
}

const kalbani = {
  bio: {
    fr: "Adel Al-Kalbani (né à Riyad en 1959) est un récitateur et imam saoudien. Il a dirigé la prière à la mosquée du Roi Khaled de Riyad pendant une vingtaine d'années et a été invité à mener les tarawih du Haram de La Mecque au Ramadan 1429 H. Titulaire d'une ijazah dans plusieurs lectures canoniques, il s'est formé auprès de Ahmad Mustafa, Muhammad ibn Nabhan et Abdullah ibn Jibrin.",
    en: "Adel Al-Kalbani (born in Riyadh in 1959) is a Saudi reciter and imam. He led prayer at King Khalid Mosque in Riyadh for around twenty years and was invited to lead the Tarawih prayers at the Sacred Mosque in Mecca during Ramadan 1429 AH. Holding an ijazah in several canonical readings, he studied under Ahmad Mustafa, Muhammad ibn Nabhan and Abdullah ibn Jibrin.",
    ar: "عادل الكلباني (مواليد الرياض 1959م) قارئ وإمام سعودي. أمّ المصلين في جامع الملك خالد بالرياض نحو عشرين عاماً، ودعي لإمامة المصلين في الحرم المكي في تراويح رمضان عام 1429هـ. حاصل على إجازة في بعض القراءات، وتلقّى عن الشيخ أحمد مصطفى والشيخ محمد بن نبهان والشيخ عبدالله بن جبرين.",
  },
  bioSource: {
    provider: "Wikipedia",
    url: "https://ar.wikipedia.org/wiki/%D8%B9%D8%A7%D8%AF%D9%84_%D8%A7%D9%84%D9%83%D9%84%D8%A8%D8%A7%D9%86%D9%8A",
  },
  reviewedAt: "2026-09-22",
};

// Keep the catalogue's reading order: right after the other MP3Quran voice.
const out = {};
for (const [id, value] of Object.entries(profiles)) {
  out[id] = value;
  if (id === "abdulbar_althubaity") out.adel_al_kalbani = kalbani;
}
if (Object.keys(out).length !== Object.keys(profiles).length + 1) {
  throw new Error("anchor id not found; record was not inserted");
}

const next = JSON.stringify(out, null, 2) + "\n";
writeFileSync(FILE, next);
console.log("records:", Object.keys(out).length, "| fr length:", kalbani.bio.fr.length);
