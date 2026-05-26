const fs = require('fs');
const p = 'e:/mon coran/src/components/HomePage.jsx';
let s = fs.readFileSync(p,'utf8');
const replacement = `const DAILY_VERSES = [
  {
    text: "إن مع العسر يسرا",
    ref: "Al-Inshirah  94:6",
    trans_fr: "Certes, avec la difficulté vient la facilité",
  },
  {
    text: "ومن يتق الله يجعل له مخرجا",
    ref: "At-Talaq  65:2",
    trans_fr: "Qui craint Allah, Il lui accordera une issue",
  },
  {
    text: "ألا بذكر الله تطمئن القلوب",
    ref: "Ar-Ra'd  13:28",
    trans_fr: "C'est par le rappel d'Allah que les coeurs trouvent la quiétude",
  },
  {
    text: "إن الله مع الصابرين",
    ref: "Al-Baqara  2:153",
    trans_fr: "Certes, Allah est avec ceux qui endurent",
  },
  {
    text: "إن الله لطيف بعباده",
    ref: "Ash-Shura  42:19",
    trans_fr: "Allah est plein de mansuétude envers Ses serviteurs",
  },
  {
    text: "قل هو الله أحد",
    ref: "Al-Ikhlas  112:1",
    trans_fr: "Dis : Il est Allah, Unique",
  },
];`;

s = s.replace(/const DAILY_VERSES = \[[\s\S]*?\n\];/, replacement);
fs.writeFileSync(p,s,'utf8');
console.log('DAILY_VERSES replaced');
