import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
const dist='dist';
const html=fs.readFileSync(dist+'/index.html','utf8');
const refs=[...html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g)].map(m=>m[1]);
console.log('ENTRY REFS:',JSON.stringify(refs));
function sz(f){const b=fs.readFileSync(f);return{raw:b.length,gz:zlib.gzipSync(b).length}}
let tot={raw:0,gz:0};
for(const r of refs){const s=sz(dist+r);tot.raw+=s.raw;tot.gz+=s.gz;console.log('ENTRY',r,s.raw,'gz',s.gz);}
console.log('ENTRY TOTAL',tot.raw,'gz',tot.gz);
const files=fs.readdirSync(dist+'/assets');
const js=files.filter(f=>f.endsWith('.js')), css=files.filter(f=>f.endsWith('.css'));
console.log('chunks js',js.length,'css',css.length);
const sized=files.map(f=>({f,...sz(path.join(dist,'assets',f))})).sort((a,b)=>b.raw-a.raw);
console.log('TOP 12 assets:'); sized.slice(0,12).forEach(s=>console.log(' ',s.f,s.raw,'gz',s.gz));
// deferred vs entry set
const entrySet=new Set(refs.map(r=>path.basename(r)));
let dynJs=0; for(const s of sized){ if(s.f.endsWith('.js') && !entrySet.has(s.f)) dynJs+=s.gz; }
console.log('non-entry JS gz total',dynJs);
// data dir
if(fs.existsSync(dist+'/data')){let t=0;for(const f of fs.readdirSync(dist+'/data')){const s=sz(path.join(dist,'data',f));t+=s.gz;console.log('data',f,s.raw,'gz',s.gz);}console.log('data gz total',t);}
// fonts
let ft=0; for(const f of fs.readdirSync(dist+'/fonts')){ft+=fs.statSync(path.join(dist,'fonts',f)).size;}
console.log('fonts total',ft);
// shell-assets.json
if(fs.existsSync(dist+'/shell-assets.json')){const j=JSON.parse(fs.readFileSync(dist+'/shell-assets.json','utf8'));console.log('shell-assets count',j.length,j.slice(0,12));}
else console.log('NO shell-assets.json');
// service worker registered where? index.html has no sw register; check main
