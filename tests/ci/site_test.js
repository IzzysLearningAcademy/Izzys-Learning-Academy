// Izzy's Learning Academy: browser checks for the Welcome page, the K-3 dashboards and the Grade 4-8 dashboards.
// Runs in a real Chromium against the files in this repository, served over HTTP, with throwaway saved data.
// It checks layout, navigation and saves, and fails on the defects found on V7.13.0 (ILA-001..005, the empty My Achievements tile).
// It does NOT check real iPhone/iPad Safari, Apple Pencil or VoiceOver; those stay manual.
// Usage: node tests/ci/site_test.js [site dir, default: repo root]   (PW=/path/to/playwright to use a local install)
const {chromium}=require(process.env.PW||'playwright');const http=require('http'),fs=require('fs'),path=require('path');
const SITE=path.resolve(process.argv[2]||path.join(__dirname,'..','..'));
const TYPES={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.css':'text/css','.js':'text/javascript','.json':'application/json'};
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('PASS',m)}else{fail++;console.log('FAIL',m)}};
const server=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0].split('#')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(SITE,u);
 if(!f.startsWith(SITE)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const SAVE={points:300,done:{}};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const U=`http://127.0.0.1:${server.address().port}/`;const b=await chromium.launch();
 const src=fs.readFileSync(path.join(SITE,'courses/little-learners.html'),'utf8');
 ok(!/MutationObserver/.test(src)&&(src.match(/class="ila-grade-nav"|className='ila-grade-nav'/g)||[]).length===1,'K-3 page: one navigation bar, built without a MutationObserver repair layer');
 ok(!fs.existsSync(path.join(SITE,'assets/grade5-parity.css'))&&!/grade5-parity\.css/.test(fs.readFileSync(path.join(SITE,'academy.html'),'utf8')),'Grades 4-8 use the Grade 5 dashboard rules (no separate parity sheet)');
 // ---- column parity at the widths in ILA-001, plus phone, iPad and laptop ----
 for(const w of [390,820,1000,1001,1020,1021,1366]){const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();
  await p.goto(U+'academy.html');await p.evaluate(s=>{localStorage.clear();localStorage.setItem('izzy-academy-v1',JSON.stringify(s))},SAVE);
  const geo=async url=>{await p.goto(U+url);await p.waitForTimeout(1200);return p.evaluate(()=>{const v=document.getElementById('ilaGradeExplorerView');const root=v&&!v.hidden?v:document.getElementById('academyDashboard');
   const g=root.querySelector('.izd-grid');const cs=getComputedStyle(g);const t=[...g.querySelectorAll('.izd-tile')].map(x=>x.getBoundingClientRect());
   const img=root.querySelector('.izd-banner-art');const r=img.getBoundingClientRect();
   return{cols:cs.gridTemplateColumns.split(' ').length,gap:cs.columnGap,tw:Math.round(t[0].width),n:t.length,ratio:+(r.width/r.height).toFixed(2),nat:+(img.naturalWidth/img.naturalHeight).toFixed(2),fit:getComputedStyle(img).objectFit}})};
  const g5=await geo('academy.html');
  for(const g of ['4','6','7','8']){const x=await geo('academy.html?grade='+g);
   ok(x.n===8&&x.cols===g5.cols&&x.gap===g5.gap&&Math.abs(x.tw-g5.tw)<=2,`${w}px: Grade ${g} dashboard matches Grade 5 (${x.cols} vs ${g5.cols} columns, gap ${x.gap} vs ${g5.gap}, tile ${x.tw} vs ${g5.tw}px)`);
   if(w<700)ok(Math.abs(x.ratio-x.nat)<0.03,`${w}px: Grade ${g} banner shows the whole picture (shape ${x.ratio} vs ${x.nat})`);}
  if(w<700)ok(Math.abs(g5.ratio-g5.nat)<0.03,`${w}px: Grade 5 banner shows the whole picture (shape ${g5.ratio} vs ${g5.nat})`);
  await ctx.close()}
 // ---- flows at phone, iPad and laptop ----
 for(const vp of [{width:390,height:844},{width:820,height:1180},{width:1366,height:1024}]){const tag=vp.width+'px: ';
  const ctx=await b.newContext({viewport:vp,hasTouch:true});const p=await ctx.newPage();const errs=[],missing=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url().replace(U,''))});p.on('dialog',d=>d.dismiss());
  await p.goto(U+'index.html');await p.evaluate(s=>{localStorage.clear();localStorage.setItem('izzy-academy-v1',JSON.stringify(s))},SAVE);await p.reload();await p.waitForTimeout(400);
  // Welcome
  const W=await p.evaluate(()=>{const cards=[...document.querySelectorAll('a.gradecard')];const h=document.querySelector('.hero img');const r=h.getBoundingClientRect();
   return{n:cards.length,badges:cards.filter(c=>c.querySelector('.num')&&c.querySelector('img.crown')?.naturalWidth>0).length,faces:document.querySelectorAll('a.gradecard img:not(.crown)').length,
    jump:document.querySelectorAll('a[href="#choose"]').length,h2:document.querySelectorAll('h2').length,hero:+(r.width/r.height).toFixed(2),heroNat:+(h.naturalWidth/h.naturalHeight).toFixed(2),
    hrefs:cards.map(c=>c.getAttribute('href')).join(' '),wide:document.documentElement.scrollWidth>innerWidth+1,fine:/not an accredited school/.test(document.body.textContent)}});
  ok(W.n===9&&W.badges===9&&W.faces===0,tag+'Welcome: nine gold-crown grade badges, no face pictures');
  ok(W.jump===0&&W.h2===1,tag+'Welcome: one "Choose your grade", no extra jump buttons');
  ok(Math.abs(W.hero-W.heroNat)<0.03,tag+`Welcome: the whole Izzy scene at its own shape (${W.hero} vs ${W.heroNat})`);
  ok(W.hrefs==='courses/little-learners.html?grade=K courses/little-learners.html?grade=1 courses/little-learners.html?grade=2 courses/little-learners.html?grade=3 academy.html?grade=4 academy.html academy.html?grade=6 academy.html?grade=7 academy.html?grade=8'&&!W.wide&&W.fine,tag+'Welcome: each badge goes to its grade; no sideways scroll; "not an accredited school" shown');
  // K-3
  for(const g of ['K','1','2','3']){await p.goto(U+'index.html');await Promise.all([p.waitForNavigation(),p.click(`a.gradecard[href="courses/little-learners.html?grade=${g}"]`)]);await p.waitForTimeout(700);
   const k=await p.evaluate(()=>{const h=document.querySelector('.ila-k3-hero');const be=getComputedStyle(h,'::before');const box=parseFloat(be.width)/parseFloat(be.height);const vis=e=>!!e&&e.getClientRects().length>0;
    return{box:+box.toFixed(3),bg:be.backgroundImage,ws:vis(document.getElementById('workspace')),side:vis(document.querySelector('.sidebar')),tiles:document.querySelectorAll('#ila-k3-grid .ila-k3-tile').length,
     navs:document.querySelectorAll('.ila-grade-nav').length,score:document.getElementById('ila-grade-score')?.textContent||'',name:document.getElementById('ila-grade-name')?.textContent||'',wide:document.documentElement.scrollWidth>innerWidth+1}});
   const file={K:'k',1:'g1',2:'g2',3:'g3'}[g];
   ok(Math.abs(k.box-2400/633)<0.01&&k.bg.includes(`/assets/k3/${file}-banner.webp`),tag+`Grade ${g}: its whole scene, at the picture's exact shape (${k.box})`);
   ok(!k.ws&&!k.side&&k.tiles===8&&k.navs===1&&!k.wide,tag+`Grade ${g}: the dashboard shows only the scene, one nav bar and 8 tiles (no coursework underneath)`);
   ok(/300 stars · Level 4/.test(k.score)&&k.name===(g==='K'?'Kindergarten':'Grade '+g),tag+`Grade ${g}: nav shows the grade and Izzy's real stars (${k.score})`);
   if(g==='K'||g==='3'){
    for(const [i,what,check] of [[0,'Math',v=>v.units>0],[1,'ELA',v=>v.units>0],[3,'STEM',v=>v.units>0],[4,'Games',v=>v.game],[7,'My Achievements',v=>v.journey]]){
     await p.locator('#ila-k3-grid .ila-k3-tile').nth(i).click();await p.waitForTimeout(900);
     const v=await p.evaluate(()=>{const vis=e=>!!e&&e.getClientRects().length>0;return{units:document.querySelectorAll('#workspace .unit-button').length,game:!!document.querySelector('#workspace .game-panel'),
      journey:vis(document.querySelector('.sidebar'))&&/My practice journey/.test(document.querySelector('.sidebar').innerText)&&/Family Backup/.test(document.querySelector('.sidebar').innerText) /* innerText: the words must be visible, not just present */,tilesHidden:!vis(document.getElementById('ila-k3-grid'))}});
     ok(check(v)&&v.tilesHidden,tag+`Grade ${g}: the ${what} tile opens ${what==='My Achievements'?'the practice journey and Family Backup note':'its own view'}, and the tiles step aside`);
     await p.click('#ila-grade-home');await p.waitForTimeout(400);
     const h=await p.evaluate(()=>{const vis=e=>!!e&&e.getClientRects().length>0;return vis(document.getElementById('ila-k3-grid'))&&!vis(document.getElementById('workspace'))&&!vis(document.querySelector('.sidebar'))});
     ok(h,tag+`Grade ${g}: Home after ${what} brings back the dashboard with nothing underneath`);}
    // a lesson still saves to the K-3 key
    await p.locator('#ila-k3-grid .ila-k3-tile').nth(0).click();await p.waitForTimeout(600);await p.locator('.unit-button').first().click();await p.locator('.session-button').first().click();await p.waitForTimeout(150);
    await p.locator('#workspace .choice[data-option]').first().click();await p.waitForTimeout(200);
    const keys=await p.evaluate(()=>Object.keys(localStorage));ok(keys.some(x=>x.startsWith('ila_k3_sandbox_v1:'))&&keys.every(x=>/^(izzy[-_]|ila_)/.test(x)),tag+`Grade ${g}: a lesson saves to the existing K-3 key (every key is one Family Backup copies)`);
    await p.click('#ila-grade-home');}
  }
  // Grades 4-8: Discover and shared tabs keep the grade (ILA-003, ILA-004)
  for(const g of ['4','6','7','8']){await p.goto(U+'academy.html?grade='+g);await p.waitForTimeout(1500);
   const inGrade=()=>p.evaluate(G=>{const v=document.getElementById('ilaGradeExplorerView');return !!v&&!v.hidden&&new RegExp('Grade '+G).test(v.innerText.slice(0,1500))},g);
   await p.click('[data-academy-tab="creative"]');await p.waitForTimeout(700);
   ok(await inGrade()&&await p.locator('#ilaGradeExplorerView .ila-stem-card').count()===4,tag+`Grade ${g}: Discover opens this grade's STEM center`);
   for(const t of ['languages','rewards']){await p.click(`[data-academy-tab="${t}"]`);await p.waitForTimeout(600);await p.click('[data-academy-tab="home"]');await p.waitForTimeout(800);
    ok(await inGrade()&&await p.locator('#ilaGradeExplorerView .izd-gx-home').count()===1,tag+`Grade ${g}: ${t==='rewards'?'Rewards':'Languages'} then Home returns to the Grade ${g} dashboard`);}
   await p.locator('#ilaGxTile-stem').click();await p.waitForTimeout(500);ok(await p.locator('#ilaGradeExplorerView .ila-stem-card').count()===4,tag+`Grade ${g}: the STEM tile opens this grade's STEM center`);}
  // Grade 5 still opens its own home and keeps the stars
  await p.goto(U+'academy.html');await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>document.getElementById('points')?.textContent==='300'&&!!document.querySelector('#academyDashboard .izd-banner')),tag+'Grade 5: its own dashboard, with the same 300 stars');
  ok(JSON.parse(await p.evaluate(()=>localStorage.getItem('izzy-academy-v1'))).points===300,tag+'Academy stars unchanged after all the flows');
  ok(errs.length===0,tag+'no page errors '+errs.slice(0,3).join(' | '));ok(missing.length===0,tag+'no missing files '+missing.slice(0,5).join(' '));
  await ctx.close()}
 await b.close();server.close();console.log(`\n${pass} passed, ${fail} failed (browser checks only; real-device checks are manual)`);process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(2)});
