/**
 * Builds src/data/rabbanaDuas.js: the forty supplications of the Quran that begin
 * with « Rabbana » (« Notre Seigneur »), in Quran order.
 *
 * The Arabic is never typed: each supplication is a run of words cut out of the
 * Uthmani text of AlQuran.cloud (`quran-uthmani`) by verse and word positions
 * (SEGMENTS below), so it is the Quran text itself, with its own diacritics.
 * The French and English lines are the meaning of the passage written for
 * MushafPlus (not a published translation) and are shown as such.
 *
 * "The forty" is the usual list, not a count of every verse that contains the
 * word: 96 verses do, many of them narration. Surah 2:286 counts for three, one
 * per « Rabbana ». Entries that are not a prayer (a verse that reports a
 * statement) are left out.
 *
 * Usage: node scripts/build-rabbana-data.mjs [--refresh] [--cache dir]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/data/rabbanaDuas.js");
const REFRESH = process.argv.includes("--refresh");
const cacheAt = process.argv.indexOf("--cache");
const CACHE = path.resolve(cacheAt >= 0 ? process.argv[cacheAt + 1] : path.join(os.tmpdir(), "mushafplus-rabbana-cache"));
const QURAN_URL = "https://api.alquran.cloud/v1/quran/quran-uthmani";

// [surah, ayah, first word, last word (inclusive), part of the verse, fr, en]
const SEGMENTS = [
  [2, 127, 7, 14, "", "Notre Seigneur, accepte ceci de notre part. Tu es Celui qui entend et qui sait tout.", "Our Lord, accept this from us. You are the All-Hearing, the All-Knowing."],
  [2, 128, 0, 17, "", "Notre Seigneur, fais de nous deux des soumis à Toi, et de notre descendance une communauté soumise à Toi. Montre-nous nos rites et reviens vers nous. Tu es Celui qui accepte le repentir, le Miséricordieux.", "Our Lord, make us submissive to You, and from our descendants a community submissive to You. Show us our rites and accept our repentance. You are the Accepter of repentance, the Merciful."],
  [2, 129, 0, 16, "", "Notre Seigneur, envoie parmi eux un messager issu d’eux, qui leur récite Tes versets, leur enseigne le Livre et la sagesse et les purifie. Tu es le Puissant, le Sage.", "Our Lord, send among them a messenger from themselves who will recite Your verses to them, teach them the Book and wisdom, and purify them. You are the Almighty, the Wise."],
  [2, 201, 3, 13, "", "Notre Seigneur, accorde-nous une belle part ici-bas et une belle part dans l’au-delà, et protège-nous du châtiment du Feu.", "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire."],
  [2, 250, 5, 14, "", "Notre Seigneur, déverse sur nous la patience, affermis nos pas et donne-nous la victoire sur les gens qui ne croient pas.", "Our Lord, pour out patience upon us, make our feet firm and give us victory over the disbelieving people."],
  [2, 286, 14, 20, "1/3", "Notre Seigneur, ne nous tiens pas rigueur si nous avons oublié ou commis une erreur.", "Our Lord, do not hold us to account if we forget or make a mistake."],
  [2, 286, 22, 32, "2/3", "Notre Seigneur, ne nous charge pas d’un fardeau comme celui dont Tu as chargé ceux d’avant nous.", "Our Lord, do not lay on us a burden like the one You laid on those before us."],
  [2, 286, 34, 54, "3/3", "Notre Seigneur, ne nous impose pas ce que nous ne pouvons supporter. Efface nos fautes, pardonne-nous et fais-nous miséricorde. Tu es notre Protecteur : donne-nous la victoire sur les gens qui ne croient pas.", "Our Lord, do not burden us with more than we can bear. Pardon us, forgive us and have mercy on us. You are our Protector: give us victory over the disbelieving people."],
  [3, 8, 0, 15, "", "Notre Seigneur, ne laisse pas dévier nos cœurs après que Tu nous as guidés, et accorde-nous une miséricorde de Ta part. Tu es Celui qui donne sans cesse.", "Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. You are the Ever-Bestowing."],
  [3, 9, 0, 13, "", "Notre Seigneur, Tu rassembleras les gens pour un jour sur lequel il n’y a aucun doute. Allah ne manque pas à Sa promesse.", "Our Lord, You will gather the people for a Day about which there is no doubt. Allah does not break His promise."],
  [3, 16, 2, 10, "", "Notre Seigneur, nous avons cru : pardonne-nous nos péchés et protège-nous du châtiment du Feu.", "Our Lord, we have believed: forgive us our sins and protect us from the punishment of the Fire."],
  [3, 53, 0, 8, "", "Notre Seigneur, nous avons cru à ce que Tu as révélé et nous avons suivi le Messager : inscris-nous parmi ceux qui témoignent.", "Our Lord, we have believed in what You revealed and followed the Messenger: write us among those who bear witness."],
  [3, 147, 6, 18, "", "Notre Seigneur, pardonne-nous nos péchés et nos excès dans notre affaire, affermis nos pas et donne-nous la victoire sur les gens qui ne croient pas.", "Our Lord, forgive us our sins and our excesses in our affairs, make our feet firm and give us victory over the disbelieving people."],
  [3, 191, 12, 20, "", "Notre Seigneur, Tu n’as pas créé tout cela en vain. Gloire à Toi ! Protège-nous du châtiment du Feu.", "Our Lord, You did not create this in vain. Glory be to You! Protect us from the punishment of the Fire."],
  [3, 192, 0, 11, "", "Notre Seigneur, celui que Tu fais entrer dans le Feu, Tu l’as couvert de honte, et les injustes n’auront aucun secoureur.", "Our Lord, whoever You admit to the Fire, You have disgraced him, and the wrongdoers will have no helpers."],
  [3, 193, 0, 20, "", "Notre Seigneur, nous avons entendu un appelant qui appelait à la foi : « Croyez en votre Seigneur ! », et nous avons cru. Notre Seigneur, pardonne-nous nos péchés, efface nos mauvaises actions et fais-nous mourir avec les gens de bien.", "Our Lord, we heard a caller calling to faith: “Believe in your Lord!”, and we believed. Our Lord, forgive us our sins, remove our misdeeds and take our souls with the righteous."],
  [3, 194, 0, 14, "", "Notre Seigneur, donne-nous ce que Tu nous as promis par Tes messagers et ne nous couvre pas de honte le Jour de la Résurrection. Tu ne manques jamais à Ta promesse.", "Our Lord, grant us what You promised us through Your messengers and do not disgrace us on the Day of Resurrection. You never break Your promise."],
  [4, 75, 14, 30, "", "Notre Seigneur, fais-nous sortir de cette cité dont les habitants sont injustes, et donne-nous de Ta part un protecteur, donne-nous de Ta part un secoureur.", "Our Lord, take us out of this town whose people are oppressors, and appoint for us from Yourself a protector, and appoint for us from Yourself a helper."],
  [5, 83, 17, 21, "", "Notre Seigneur, nous avons cru : inscris-nous parmi ceux qui témoignent.", "Our Lord, we have believed: write us among those who bear witness."],
  [5, 114, 4, 22, "", "Ô Allah, notre Seigneur, fais descendre du ciel sur nous une table servie, qui sera une fête pour nous, pour les premiers comme pour les derniers d’entre nous, et un signe de Ta part. Pourvois à notre subsistance : Tu es le meilleur des pourvoyeurs.", "O Allah, our Lord, send down to us a table spread from heaven, to be a festival for us, for the first of us and the last of us, and a sign from You. Provide for us: You are the best of providers."],
  [7, 23, 1, 11, "", "Notre Seigneur, nous nous sommes fait du tort à nous-mêmes. Si Tu ne nous pardonnes pas et ne nous fais pas miséricorde, nous serons certes parmi les perdants.", "Our Lord, we have wronged ourselves. If You do not forgive us and have mercy on us, we will surely be among the losers."],
  [7, 47, 8, 13, "", "Notre Seigneur, ne nous place pas avec les gens injustes.", "Our Lord, do not place us with the wrongdoing people."],
  [7, 89, 37, 45, "", "Notre Seigneur, tranche entre nous et notre peuple par la vérité ; Tu es le meilleur de ceux qui tranchent.", "Our Lord, decide between us and our people in truth; You are the best of those who decide."],
  [7, 126, 11, 16, "", "Notre Seigneur, déverse sur nous la patience et fais-nous mourir en musulmans.", "Our Lord, pour out patience upon us and take our souls as Muslims."],
  [10, 85, 4, 9, "", "Notre Seigneur, ne fais pas de nous une épreuve pour les gens injustes.", "Our Lord, do not make us a trial for the wrongdoing people."],
  [14, 37, 0, 25, "", "Notre Seigneur, j’ai établi une partie de ma descendance dans une vallée sans culture, près de Ta Maison sacrée. Notre Seigneur, afin qu’ils accomplissent la prière, fais que les cœurs de certains hommes penchent vers eux et accorde-leur des fruits comme nourriture, afin qu’ils soient reconnaissants.", "Our Lord, I have settled some of my descendants in a barren valley near Your Sacred House. Our Lord, that they may establish prayer, make the hearts of some people incline toward them and provide them with fruits, so that they may be grateful."],
  [14, 38, 0, 18, "", "Notre Seigneur, Tu sais ce que nous cachons et ce que nous montrons. Rien n’échappe à Allah, ni sur terre ni dans le ciel.", "Our Lord, You know what we conceal and what we reveal. Nothing is hidden from Allah, on earth or in the heavens."],
  [14, 40, 0, 9, "", "Mon Seigneur, fais de moi un assidu de la prière, ainsi qu’une partie de ma descendance. Notre Seigneur, accepte mon invocation.", "My Lord, make me an establisher of prayer, and some of my descendants too. Our Lord, accept my supplication."],
  [14, 41, 0, 7, "", "Notre Seigneur, pardonne-moi, ainsi qu’à mes parents et aux croyants, le jour où le compte sera établi.", "Our Lord, forgive me, my parents and the believers on the Day when the account is established."],
  [18, 10, 6, 15, "", "Notre Seigneur, accorde-nous de Ta part une miséricorde et facilite-nous la bonne direction dans notre affaire.", "Our Lord, grant us mercy from Yourself and prepare for us right guidance in our affair."],
  [23, 109, 6, 13, "", "Notre Seigneur, nous avons cru : pardonne-nous et fais-nous miséricorde, car Tu es le meilleur des miséricordieux.", "Our Lord, we have believed: forgive us and have mercy on us, for You are the best of the merciful."],
  [25, 65, 2, 11, "", "Notre Seigneur, détourne de nous le châtiment de l’Enfer, car son châtiment est permanent.", "Our Lord, turn away from us the punishment of Hell; its punishment is everlasting."],
  [25, 74, 2, 12, "", "Notre Seigneur, fais que nos épouses et nos descendants soient la joie de nos yeux, et fais de nous un modèle pour les pieux.", "Our Lord, make our spouses and our children a joy to our eyes, and make us a leader for the righteous."],
  [40, 7, 13, 26, "", "Notre Seigneur, Tu embrasses toute chose de miséricorde et de science : pardonne à ceux qui se repentent et suivent Ta voie, et protège-les du châtiment de la Fournaise.", "Our Lord, You encompass all things in mercy and knowledge: forgive those who repent and follow Your way, and protect them from the punishment of the Blaze."],
  [40, 8, 0, 16, "", "Notre Seigneur, fais-les entrer aux jardins d’Éden que Tu leur as promis, ainsi que ceux qui ont été vertueux parmi leurs parents, leurs épouses et leurs descendants. Tu es le Puissant, le Sage.", "Our Lord, admit them to the gardens of Eden that You promised them, and the righteous among their parents, spouses and descendants. You are the Almighty, the Wise."],
  [44, 12, 0, 5, "", "Notre Seigneur, écarte de nous le châtiment ; nous sommes croyants.", "Our Lord, remove the punishment from us; we are believers."],
  [59, 10, 5, 22, "", "Notre Seigneur, pardonne-nous ainsi qu’à nos frères qui nous ont devancés dans la foi, et ne mets dans nos cœurs aucune rancœur envers ceux qui ont cru. Notre Seigneur, Tu es Compatissant et Miséricordieux.", "Our Lord, forgive us and our brothers who preceded us in faith, and do not put in our hearts any resentment toward those who believe. Our Lord, You are Kind and Merciful."],
  [60, 4, 46, 52, "", "Notre Seigneur, c’est en Toi que nous plaçons notre confiance, vers Toi nous revenons repentants, et c’est vers Toi que sera le retour.", "Our Lord, in You we place our trust, to You we turn in repentance, and to You is the final return."],
  [60, 5, 0, 13, "", "Notre Seigneur, ne fais pas de nous une épreuve pour ceux qui ont mécru, et pardonne-nous, notre Seigneur. Tu es le Puissant, le Sage.", "Our Lord, do not make us a trial for those who disbelieve, and forgive us, our Lord. You are the Almighty, the Wise."],
  [66, 8, 35, 46, "", "Notre Seigneur, parfais pour nous notre lumière et pardonne-nous. Tu es capable de toute chose.", "Our Lord, perfect our light for us and forgive us. You have power over all things."],
];

async function quranWords() {
  const file = path.join(CACHE, "quran-uthmani.json");
  let text;
  if (!REFRESH && fs.existsSync(file)) text = fs.readFileSync(file, "utf8");
  else {
    const response = await fetch(QURAN_URL, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Quran text: HTTP ${response.status}`);
    text = await response.text();
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, text);
  }
  return JSON.parse(text).data.surahs;
}

// Pause and section signs stand alone between words; they must not open or close a supplication.
const SIGN_ONLY = new RegExp("^[\\u06D6-\\u06DC\\u06DE\\u06E9]+$");
const trim = (words) => {
  const list = [...words];
  while (list.length && SIGN_ONLY.test(list[0])) list.shift();
  while (list.length && SIGN_ONLY.test(list[list.length - 1])) list.pop();
  return list;
};
const skeleton = (word) => word.replace(new RegExp("[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]", "g"), "").replace(/[ٱأإآ]/g, "ا");

async function main() {
  const surahs = await quranWords();
  const entries = SEGMENTS.map(([surah, ayah, from, to, part, fr, en], index) => {
    const words = surahs[surah - 1].ayahs[ayah - 1].text.split(" ");
    const slice = trim(words.slice(from, to + 1));
    const first = skeleton(slice[0] || "");
    if (!slice.length) throw new Error(`${surah}:${ayah} is empty`);
    // Every supplication but 14:40 and the "Allah, our Lord" opening begins with one of the forms of Rabbana.
    if (!/^(?:ر+بنا|رب)/.test(first) && !(surah === 5 && ayah === 114)) throw new Error(`${surah}:${ayah} does not start with Rabbana: ${first}`);
    return {
      id: `rabbana-${surah}-${ayah}${part ? `-${part.split("/")[0]}` : ""}`,
      n: index + 1,
      surah,
      ayah,
      part,
      arabic: slice.join(" "),
      fr,
      en,
    };
  });
  if (entries.length !== 40) throw new Error(`expected 40 supplications, got ${entries.length}`);
  const lines = [
    "// Generated by scripts/build-rabbana-data.mjs — do not edit by hand.",
    "// Arabic: words cut from the Uthmani Quran text of AlQuran.cloud. fr/en: meaning written for MushafPlus.",
    "const RABBANA_DUAS = [",
    ...entries.map((entry, i) => `  ${JSON.stringify(entry)}${i < entries.length - 1 ? "," : ""}`),
    "];",
    "",
    "export default RABBANA_DUAS;",
    "",
  ];
  fs.writeFileSync(OUT, lines.join("\n"));
  console.log(`[rabbana] wrote ${path.relative(ROOT, OUT)} (${entries.length} supplications)`);
}

main().catch((error) => {
  console.error(`[rabbana] ${error.message}`);
  process.exit(1);
});
