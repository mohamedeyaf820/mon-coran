const fs = require('fs');
const path = 'e:/mon coran/src/components/HomePage.jsx';
const src = fs.readFileSync(path, 'utf8');

const badRe = /Ã|Â|Ø|Ù|â|Å|ï/;
const scoreBad = (s) => (s.match(/Ã|Â|Ø|Ù|â|Å|ï|/g) || []).length;

function decodeMaybe(str) {
  if (!badRe.test(str)) return str;
  const decoded = Buffer.from(str, 'latin1').toString('utf8');
  return scoreBad(decoded) < scoreBad(str) ? decoded : str;
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

  const fixed = decodeMaybe(lit);
  out += quote + fixed + quote;
  i = j;
}

if (out !== src) {
  fs.writeFileSync(path, out, 'utf8');
  console.log('Decoded mojibake string literals in HomePage.jsx');
} else {
  console.log('No mojibake string literals changed');
}
