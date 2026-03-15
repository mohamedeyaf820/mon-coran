const fs = require('fs');
const path = 'e:/mon coran/src/components/HomePage.jsx';
const src = fs.readFileSync(path, 'utf8');

const mojibakeRe = /Ã|Â|Ø|Ù|â|Å|ï/;
const badScore = (s) => (s.match(/Ã|Â|Ø|Ù|â|Å|ï|/g) || []).length;
const hasArabic = (s) => /[\u0600-\u06FF]/.test(s);

function decodeMaybe(str) {
  if (!mojibakeRe.test(str)) return str;
  const decoded = Buffer.from(str, 'latin1').toString('utf8');
  const before = badScore(str);
  const after = badScore(decoded);
  if (after < before) return decoded;
  if (/[ØÙ]/.test(str) && hasArabic(decoded) && after <= before + 2) return decoded;
  return str;
}

let out = '';
for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  if (ch !== '"' && ch !== "'") {
    out += ch;
    continue;
  }

  const quote = ch;
  let j = i + 1;
  let lit = '';
  let escaped = false;

  while (j < src.length) {
    const c = src[j];
    if (escaped) {
      lit += c;
      escaped = false;
      j++;
      continue;
    }
    if (c === '\\') {
      lit += c;
      escaped = true;
      j++;
      continue;
    }
    if (c === quote) break;
    lit += c;
    j++;
  }

  if (j >= src.length) {
    out += ch + lit;
    break;
  }

  out += quote + decodeMaybe(lit) + quote;
  i = j;
}

if (out !== src) {
  fs.writeFileSync(path, out, 'utf8');
  console.log('Second-pass mojibake repair applied');
} else {
  console.log('No second-pass changes');
}
