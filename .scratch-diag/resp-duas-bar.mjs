import { chromium } from "@playwright/test";
const KEY="mushaf-plus-settings";
function seed(a){localStorage.setItem(a.key,JSON.stringify({skipSplashAnimation:true,showHome:false,showDuas:true,sidebarOpen:false,lang:"fr",theme:"light",riwaya:"hafs",displayMode:"surah",mushafLayout:"list",quranFontSize:34,fontFamily:"qpc-hafs",lastPosition:{surah:2,ayah:1,page:2,juz:1}}));}
const b=await chromium.launch();
for(const w of [280,320,360,390,414,768,1024]){
  const ctx=await b.newContext({serviceWorkers:"block",viewport:{width:w,height:800},deviceScaleFactor:2});
  await ctx.addInitScript(seed,{key:KEY});
  const p=await ctx.newPage();
  await p.goto("http://127.0.0.1:4187/duas",{waitUntil:"domcontentloaded"});
  await p.waitForSelector(".duas-page",{timeout:25000});
  await p.waitForSelector('html[data-deferred-styles="ready"]',{timeout:15000}).catch(()=>{});
  await p.waitForTimeout(1400);
  const geo=await p.evaluate(()=>{
    const bar=document.querySelector(".mp-header__bar");
    const parts=[...bar.querySelectorAll("button,[role=button]")].filter(e=>e.getClientRects().length).map(e=>{
      const r=e.getBoundingClientRect();
      return {c:e.className.split(" ").slice(0,2).join("."),x:+r.x.toFixed(1),r:+r.right.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),txt:(e.innerText||"").trim().slice(0,14)};
    });
    let overlaps=[];
    for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
      const a=parts[i],c=parts[j];
      if(a.c===c.c&&a.txt===c.txt)continue;
      const ox=Math.min(a.r,c.r)-Math.max(a.x,c.x);
      if(ox>0.5)overlaps.push(`${a.c}“${a.txt}” x ${c.c}“${c.txt}” (${ox.toFixed(1)}px)`);
    }
    return {barW:+bar.getBoundingClientRect().width.toFixed(1),parts,overlaps};
  });
  console.log(`\n@${w} bar=${geo.barW}`);
  console.log(geo.parts.map(x=>`   ${x.c.padEnd(30)} ${String(x.w).padStart(6)}x${String(x.h).padStart(5)} x=${x.x}..${x.r} “${x.txt}”`).join("\n"));
  if(geo.overlaps.length)console.log("   CHEVAUCHEMENTS: "+geo.overlaps.join(" | "));
  await p.locator(".mp-header__bar").screenshot({path:`.scratch-diag/resp/shots/duasbar-${w}.png`});
  await ctx.close();
}
await b.close();
