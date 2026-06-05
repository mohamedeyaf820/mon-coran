/**
 * purge-legacy-themes.mjs
 * Supprime les blocs CSS des thèmes legacy jamais utilisés dans l'app.
 * Thèmes à supprimer : ocean, forest, night-blue, oled, premium-beige, quran-night
 * Thèmes à garder : light, sepia, dark (les seuls exposés dans THEMES)
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(__dirname, "../src/styles/tailwind.css");

const LEGACY_SELECTORS = [
  '[data-theme="ocean"]',
  '[data-theme="forest"]',
  '[data-theme="night-blue"]',
  '[data-theme="oled"]',
  '[data-theme="premium-beige"]',
  '[data-theme="quran-night"]',
];

function removeLegacyBlocks(css) {
  let result = css;
  let totalRemoved = 0;

  for (const selector of LEGACY_SELECTORS) {
    // Regex pour trouver le sélecteur suivi d'un bloc CSS { ... }
    // Gère les sélecteurs combinés comme [data-theme="ocean"] .hp2-hero
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Pattern : le sélecteur (potentiellement en combinaison) suivi de { ... }
    // On cherche toutes les lignes commençant par ce sélecteur
    const lines = result.split("\n");
    const outLines = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Vérifie si cette ligne contient notre sélecteur legacy
      const isLegacyLine = LEGACY_SELECTORS.some(sel => trimmed.includes(sel));

      if (isLegacyLine && trimmed.endsWith("{")) {
        // Sauter tout le bloc
        let depth = 1;
        i++;
        while (i < lines.length && depth > 0) {
          const c = lines[i];
          for (const ch of c) {
            if (ch === "{") depth++;
            if (ch === "}") depth--;
          }
          i++;
        }
        totalRemoved++;
        continue;
      }

      // Sélecteur sur plusieurs lignes (ex: "[data-theme='ocean']\n.hp2-hero {")
      // On vérifie si la ligne précédente était un sélecteur legacy
      outLines.push(line);
      i++;
    }

    result = outLines.join("\n");
  }

  console.log(`✓ ${totalRemoved} blocs CSS legacy supprimés`);
  return result;
}

// Suppression des lignes contenant uniquement des sélecteurs legacy (sans bloc inline)
function removeLegacySelectorLines(css) {
  const lines = css.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Ligne qui ne contient QUE des sélecteurs legacy (pas de propriété CSS)
    const onlyLegacySelectors = LEGACY_SELECTORS.some(sel => {
      if (!trimmed.includes(sel)) return false;
      // Vérifier que c'est bien un sélecteur et pas une propriété
      return !trimmed.includes(":") || trimmed.endsWith(",") || trimmed.endsWith("{");
    });

    if (onlyLegacySelectors && (trimmed.endsWith(",") || trimmed.endsWith("{"))) {
      if (trimmed.endsWith("{")) {
        // Sauter le bloc entier
        let depth = 1;
        i++;
        while (i < lines.length && depth > 0) {
          for (const ch of lines[i]) {
            if (ch === "{") depth++;
            if (ch === "}") depth--;
          }
          i++;
        }
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

try {
  const original = readFileSync(CSS_PATH, "utf-8");
  const originalSize = Buffer.byteLength(original, "utf-8");
  const originalLines = original.split("\n").length;

  console.log(`📁 CSS original : ${originalLines} lignes, ${(originalSize / 1024).toFixed(0)} KB`);

  let cleaned = removeLegacyBlocks(original);

  // Supprimer les lignes vides excessives (3+ lignes vides → 2 max)
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");

  const cleanedSize = Buffer.byteLength(cleaned, "utf-8");
  const cleanedLines = cleaned.split("\n").length;
  const reduction = (((originalSize - cleanedSize) / originalSize) * 100).toFixed(1);

  writeFileSync(CSS_PATH, cleaned, "utf-8");

  console.log(`✅ CSS nettoyé : ${cleanedLines} lignes, ${(cleanedSize / 1024).toFixed(0)} KB`);
  console.log(`📉 Réduction : -${reduction}% (${((originalSize - cleanedSize) / 1024).toFixed(0)} KB économisés)`);
} catch (err) {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
}
