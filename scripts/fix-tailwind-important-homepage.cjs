const fs = require('fs');
const path = 'e:/mon coran/src/components/HomePage.jsx';
let src = fs.readFileSync(path, 'utf8');

function transformClassToken(token) {
  let t = token;
  if (t.includes(':!')) {
    t = t.replace(/:!/g, ':');
    if (!t.endsWith('!')) t += '!';
  }
  if (t.startsWith('!') && t.length > 1) {
    t = t.slice(1);
    if (!t.endsWith('!')) t += '!';
  }
  return t;
}

function transformStringContent(content) {
  if (!content.includes('!') && !content.includes('[background-')) return content;

  let out = content
    .replace(/\[background-image:([^\]]+)\]/g, 'bg-[$1]')
    .replace(/\[background-size:([^\]]+)\]/g, 'bg-size-[$1]');

  if (out.includes('!')) {
    out = out.replace(/\S+/g, (token) => transformClassToken(token));
  }
  return out;
}

let result = '';
for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  if (ch !== '"' && ch !== "'") {
    result += ch;
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
    result += ch + lit;
    break;
  }

  const transformed = transformStringContent(lit);
  result += quote + transformed + quote;
  i = j;
}

if (result !== src) {
  fs.writeFileSync(path, result, 'utf8');
  console.log('HomePage.jsx transformed');
} else {
  console.log('No changes needed');
}
