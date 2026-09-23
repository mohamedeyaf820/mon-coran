import fs from 'fs'; import path from 'path'; import zlib from 'zlib';
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
let ft=0,fl=[];for(const f of walk('dist/fonts')){const s=fs.statSync(f).size;ft+=s;fl.push([f,s]);}
console.log('fonts files',fl.length,'total',ft); fl.forEach(x=>console.log(' ',...x));
console.log(fs.existsSync('dist/shell-assets.json')?'shell-assets.json exists, entries: '+JSON.parse(fs.readFileSync('dist/shell-assets.json','utf8')).length:'NO shell-assets.json');
console.log('sw.js size',fs.statSync('dist/sw.js')?.size);
// images
let it=0; for(const f of walk('dist/images')) it+=fs.statSync(f).size; console.log('images total',it, 'count', walk('dist/images').length);
// brotli of entry
const html=fs.readFileSync('dist/index.html','utf8');
const refs=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map(m=>m[1]);
let br=0,gz=0,raw=0;for(const r of refs){const b=fs.readFileSync('dist'+r);raw+=b.length;gz+=zlib.gzipSync(b).length;br+=zlib.brotliCompressSync(b).length;}
console.log('entry raw',raw,'gz',gz,'br',br);
// modulepreload?
console.log([...html.matchAll(/<link rel="modulepreload"[^>]*>/g)].map(m=>m[0]).join('\n'));
