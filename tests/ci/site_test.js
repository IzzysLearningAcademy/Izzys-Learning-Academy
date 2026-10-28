// Izzy's Learning Academy: browser checks for the Welcome page, the K-3 dashboards and the Grade 4-8 dashboards.
// V7.13.2: K-3 dashboards are the Grade 5 page (academy.html?grade=K|1|2|3); no grade switching from a dashboard.
// V7.13.8: Back to Academy button by Settings; K-3 unit and lesson taps bring what opened into view; Grades 4-8 Math/ELA offer only that subject's activities.
// V7.13.6: K-3 and Grades 4-8 subject pages and lessons use the Grade 5 look; Castle Catapult's full pull reaches the far side.
// V7.13.5: after Languages, Art Studio or Rewards the grade's own tabs open that grade; subject welcomes with a time; Crown Cascade and Castle Catapult.
// V7.13.4: royal-crest grade badges with a drawn crown (no picture box); every grade's Game Center has its own Brain Lab.
// V7.13.3: every grade's Game Center has the Grade 5 games, set for that grade, and pays Academy stars once per grade, game and level.
// Runs in a real Chromium against the files in this repository, served over HTTP, with throwaway saved data.
// It checks layout, navigation and saves, and fails on the defects found on V7.13.0 (ILA-001..005, the empty My Achievements tile).
// It does NOT check real iPhone/iPad Safari, Apple Pencil or VoiceOver; those stay manual.
// Usage: node tests/ci/site_test.js [site dir, default: repo root]   (PW=/path/to/playwright to use a local install)
const {chromium}=require(process.env.PW||'playwright');const http=require('http'),fs=require('fs'),path=require('path');
const SITE=path.resolve(process.argv[2]||path.join(__dirname,'..','..'));
const TYPES={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript','.json':'application/json'};
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('PASS',m)}else{fail++;console.log('FAIL',m)}};
const server=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0].split('#')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(SITE,u);
 if(!f.startsWith(SITE)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const SAVE={points:300,done:{}};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const U=`http://127.0.0.1:${server.address().port}/`;const b=await chromium.launch();
 const src=fs.readFileSync(path.join(SITE,'courses/little-learners.html'),'utf8');
 ok(!/MutationObserver/.test(src)&&/id="ila-k3-v7132-embed"/.test(src),'K-3 page: no MutationObserver repair layer; it has the embed mode the Academy uses');
 ok(!fs.existsSync(path.join(SITE,'assets/grade5-parity.css'))&&!/grade5-parity\.css/.test(fs.readFileSync(path.join(SITE,'academy.html'),'utf8')),'Grades 4-8 use the Grade 5 dashboard rules (no separate parity sheet)');
 // ---- column parity at the widths in ILA-001, plus phone, iPad and laptop ----
 for(const w of [390,820,1000,1001,1020,1021,1366]){const ctx=await b.newContext({viewport:{width:w,height:900}});const p=await ctx.newPage();
  await p.goto(U+'academy.html');await p.evaluate(s=>{localStorage.clear();localStorage.setItem('izzy-academy-v1',JSON.stringify(s))},SAVE);
  const geo=async url=>{await p.goto(U+url);await p.waitForTimeout(1200);return p.evaluate(()=>{const v=document.getElementById('ilaGradeExplorerView');const root=v&&!v.hidden?v:document.getElementById('academyDashboard');
   const g=root.querySelector('.izd-grid');const cs=getComputedStyle(g);const t=[...g.querySelectorAll('.izd-tile')].map(x=>x.getBoundingClientRect());
   const img=root.querySelector('.izd-banner-art');const r=img.getBoundingClientRect();
   return{cols:cs.gridTemplateColumns.split(' ').length,gap:cs.columnGap,tw:Math.round(t[0].width),n:t.length,ratio:+(r.width/r.height).toFixed(2),nat:+(img.naturalWidth/img.naturalHeight).toFixed(2),fit:getComputedStyle(img).objectFit}})};
  const g5=await geo('academy.html');
  for(const g of ['K','1','2','3','4','6','7','8']){const x=await geo('academy.html?grade='+g);
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
   return{n:cards.length,badges:cards.filter(c=>c.querySelector('.medal .num')&&c.querySelector('svg.crest-crown use')&&c.querySelector('.name')).length,faces:document.querySelectorAll('a.gradecard img').length,
    jump:document.querySelectorAll('a[href="#choose"]').length,h2:document.querySelectorAll('h2').length,hero:+(r.width/r.height).toFixed(2),heroNat:+(h.naturalWidth/h.naturalHeight).toFixed(2),
    hrefs:cards.map(c=>c.getAttribute('href')).join(' '),wide:document.documentElement.scrollWidth>innerWidth+1,fine:/not an accredited school/.test(document.body.textContent)}});
  ok(W.n===9&&W.badges===9&&W.faces===0,tag+'Welcome: nine royal-crest grade badges with a drawn crown, medal and ribbon; no pictures inside the badges (so no picture box or file name)');
  ok(W.jump===0&&W.h2===1,tag+'Welcome: one "Choose your grade", no extra jump buttons');
  ok(Math.abs(W.hero-W.heroNat)<0.03,tag+`Welcome: the whole Izzy scene at its own shape (${W.hero} vs ${W.heroNat})`);
  ok(W.hrefs==='academy.html?grade=K academy.html?grade=1 academy.html?grade=2 academy.html?grade=3 academy.html?grade=4 academy.html academy.html?grade=6 academy.html?grade=7 academy.html?grade=8'&&!W.wide&&W.fine,tag+'Welcome: each badge goes to its grade; no sideways scroll; "not an accredited school" shown');
  // K-3: the Grade 5 page itself (same header, tabs, banner and tiles); activities open in a frame under the tabs
  const chrome=()=>p.evaluate(()=>{const vis=e=>!!e&&e.getClientRects().length>0;const v=document.getElementById('ilaGradeExplorerView');const img=v?.querySelector('.izd-banner-art');const r=img?.getBoundingClientRect();
   return{view:!!v&&!v.hidden,src:img?.getAttribute('src')||'',ratio:r?+(r.width/r.height).toFixed(2):0,nat:img?+(img.naturalWidth/img.naturalHeight).toFixed(2):0,tiles:v?v.querySelectorAll('.izd-gx-home .izd-tile').length:0,
    stars:document.getElementById('points')?.textContent,tabs:document.querySelectorAll('#academyNav [data-academy-tab]').length,head:v?.querySelector('.izd-badge')?.textContent||'',
    switcher:vis(document.querySelector('.ila-gx-grade-switch')),change:vis(document.getElementById('ilaChangeGrade')),logo:document.querySelector('header h1 a')?.getAttribute('href'),back:(()=>{const a=document.getElementById('izdBackAcademy');return !!a&&a.getClientRects().length>0&&a.getAttribute('href')==='index.html'&&a.nextElementSibling?.id==='izdSettings'})(),
    frame:!!v?.querySelector('iframe.izk3-frame'),purple:vis(document.querySelector('.ila-grade-nav')),wide:document.documentElement.scrollWidth>innerWidth+1}});
  const frameView=async()=>{const fh=await p.waitForSelector('iframe.izk3-frame',{timeout:15000});const f=await fh.contentFrame();await f.waitForLoadState('load');await p.waitForTimeout(700);
   return {f,v:await f.evaluate(()=>{const vis=e=>!!e&&e.getClientRects().length>0;const sb=document.querySelector('.sidebar');return{units:document.querySelectorAll('#workspace .unit-button').length,game:!!document.querySelector('#workspace .game-panel'),
    journey:vis(sb)&&/My practice journey/.test(sb.innerText)&&/Family Backup/.test(sb.innerText),k3chrome:vis(document.querySelector('.ila-k3-hero'))||vis(document.querySelector('.ila-k3-adventures'))||vis(document.querySelector('.ila-grade-nav'))}})}};
  for(const g of ['K','1','2','3']){const name=g==='K'?'Kindergarten':'Grade '+g;await p.goto(U+'index.html');await Promise.all([p.waitForNavigation(),p.click(`a.gradecard[href="academy.html?grade=${g}"]`)]);await p.waitForTimeout(1500);
   const c=await chrome();const file={K:'k',1:'g1',2:'g2',3:'g3'}[g];
   ok(c.view&&c.src.includes(`assets/k3/${file}-banner.webp`)&&Math.abs(c.ratio-c.nat)<0.03&&c.head.includes(name+' Dashboard'),tag+`${name}: the Grade 5 banner layout with its own whole scene (${c.ratio} vs ${c.nat})`);
   ok(c.tiles===8&&c.stars==='300'&&c.tabs>=8&&!c.purple&&!c.frame&&!c.wide,tag+`${name}: Grade 5 header (300 stars), tab bar and 8 tiles; no purple nav box; nothing under the tiles`);
   ok(!c.switcher&&!c.change&&c.logo==='index.html'&&c.back,tag+`${name}: no way to other grades on the dashboard; a Back to Academy button (next to Settings) and the logo go to the Welcome page`);
   if(g==='K'||g==='3'){
    for(const [art,what,check] of [['math','Math',v=>v.units>0],['ela','ELA',v=>v.units>0],['stem','STEM',v=>v.units>0],['achievements','My Achievements',v=>v.journey]]){
     await p.click('#ilaGxTile-'+art);const {f:ff,v}=await frameView();const tilesGone=(await chrome()).tiles===0;
     if(art!=='achievements'){const look=await ff.evaluate(()=>{const cs=e=>e?getComputedStyle(e):null;const body=cs(document.body),u=cs(document.querySelector('.unit-button')),sp=cs(document.querySelector('.subject-page')),sb=cs(document.querySelector('.session-button'));
      return{body:body.backgroundColor+' '+body.backgroundImage,unit:u?.backgroundImage||'',panel:sp?.backgroundImage||'',card:sb?.backgroundColor||''}});
      ok(/rgba\(0, 0, 0, 0\)/.test(look.body)&&!/gradient/.test(look.body.split(' ').slice(4).join(' '))&&/radial-gradient/.test(look.unit)&&/radial-gradient/.test(look.panel)&&look.card==='rgb(255, 250, 243)',tag+`${name}: ${what} uses the Grade 5 look (no white page; unit chicklets; purple panel; cream lesson cards)`)}
     ok(check(v)&&!v.k3chrome&&tilesGone,tag+`${name}: the ${what} tile opens ${what==='My Achievements'?'the practice journey and Family Backup note':'its own view'} under the tab bar`);
     await p.click('[data-academy-tab="home"]');await p.waitForTimeout(500);const h=await chrome();ok(h.tiles===8&&!h.frame&&h.view,tag+`${name}: the Home tab after ${what} brings back the dashboard`);}
    for(const [tab,what,check] of [['math','Math',v=>v.units>0],['creative','Discover',v=>v.units>0]]){
     await p.click(`[data-academy-tab="${tab}"]`);const {v}=await frameView();ok(check(v),tag+`${name}: the ${what} tab opens ${name}'s ${what}`);
     await p.click('[data-academy-tab="home"]');await p.waitForTimeout(400);}
    {await p.click('#ilaGxTile-math');const {f:fk}=await frameView();await fk.evaluate(()=>document.querySelectorAll('.unit-button')[5].click());await p.waitForTimeout(1200);
     const u=await p.evaluate(()=>{const f=document.querySelector('iframe.izk3-frame'),h=f.contentDocument.querySelector('.unit-heading');const t=f.getBoundingClientRect().top+h.getBoundingClientRect().top;return{t:Math.round(t),vh:innerHeight}});
     ok(u.t>=0&&u.t<u.vh-80,tag+`${name}: tapping a unit chicklet brings its lessons into view (heading at ${u.t}px of ${u.vh})`);
     await fk.evaluate(()=>document.querySelectorAll('.session-button')[2].click());await p.waitForTimeout(1200);
     const l=await p.evaluate(()=>{const f=document.querySelector('iframe.izk3-frame');const t=Math.round(f.getBoundingClientRect().top);return{t,lesson:!!f.contentDocument.querySelector('.lesson')}});
     ok(l.lesson&&l.t>=-5&&l.t<260,tag+`${name}: tapping a lesson opens it at the top of the screen (frame top ${l.t}px)`);await p.click('[data-academy-tab="home"]');await p.waitForTimeout(400)}
    for(const [shared,tab,view,subj] of [['languages','ela','ELA','ela'],['rewards','math','MATH','math'],['languages','creative','STEM','stem']]){await p.click(`[data-academy-tab="${shared}"]`);await p.waitForTimeout(500);await p.click(`[data-academy-tab="${tab}"]`);await p.waitForTimeout(900);
     const x=await p.evaluate(()=>{const v=document.getElementById('ilaGradeExplorerView');const w=v?.querySelector('.izd-welcome');return{gx:!!v&&!v.hidden,src:v?.querySelector('iframe.izk3-frame')?.getAttribute('src')||'',g5:[...document.querySelectorAll('.academy-view')].some(e=>e.getClientRects().length>0),subj:w?.dataset.subject,time:w?.querySelector('.izd-welcome-time')?.textContent||''}});
     ok(x.gx&&x.src.includes('grade='+g)&&x.src.includes('view='+view)&&!x.g5,tag+`${name}: ${shared} then the ${tab==='creative'?'Discover':tab.toUpperCase()} tab opens ${name}'s own ${view}, not Grade 5's`);
     ok(x.subj===subj&&/Plan for \d+–\d+ minutes/.test(x.time),tag+`${name}: the ${view} page starts with a welcome and a time ("${x.time}")`);
     await p.click('[data-academy-tab="home"]');await p.waitForTimeout(400)}
    // inside the frame: leaving the subject returns to the dashboard; a lesson saves to the K-3 key
    await p.click('#ilaGxTile-math');let {f}=await frameView();await f.click('#subject-back');await p.waitForTimeout(700);ok((await chrome()).tiles===8,tag+`${name}: "All subjects" inside Math returns to the ${name} dashboard`);
    await p.click('#ilaGxTile-math');({f}=await frameView());await f.locator('.unit-button').first().click();await f.locator('.session-button').first().click();await p.waitForTimeout(200);
    await f.locator('#workspace .choice[data-option]').first().click();await p.waitForTimeout(300);
    const keys=await p.evaluate(()=>Object.keys(localStorage));ok(keys.some(x=>x.startsWith('ila_k3_sandbox_v1:'))&&keys.every(x=>/^(izzy[-_]|ila_)/.test(x)),tag+`${name}: a lesson saves to the existing K-3 key (every key is one Family Backup copies)`);
    await p.click('[data-academy-tab="home"]');await p.waitForTimeout(400);}
  }
  await p.goto(U+'courses/little-learners.html?grade=2');await p.waitForURL(/academy\.html\?grade=2/,{timeout:15000});await p.waitForTimeout(1200);
  ok((await chrome()).head.includes('Grade 2 Dashboard'),tag+'an old Little Learners link opens the Grade 2 dashboard in the Academy');
  // Grades 4-8: Discover and shared tabs keep the grade (ILA-003, ILA-004)
  for(const g of ['4','6','7','8']){await p.goto(U+'academy.html?grade='+g);await p.waitForTimeout(1500);
   const inGrade=()=>p.evaluate(G=>{const v=document.getElementById('ilaGradeExplorerView');return !!v&&!v.hidden&&new RegExp('Grade '+G).test(v.innerText.slice(0,1500))},g);
   {const c=await chrome();ok(!c.switcher&&!c.change&&c.logo==='index.html',tag+`Grade ${g}: no grade switcher; the logo goes to the Welcome page`)}
   await p.click('[data-academy-tab="creative"]');await p.waitForTimeout(700);
   ok(await inGrade()&&await p.locator('#ilaGradeExplorerView .ila-stem-card').count()===4,tag+`Grade ${g}: Discover opens this grade's STEM center`);
   for(const t of ['languages','rewards']){await p.click(`[data-academy-tab="${t}"]`);await p.waitForTimeout(600);await p.click('[data-academy-tab="home"]');await p.waitForTimeout(800);
    ok(await inGrade()&&await p.locator('#ilaGradeExplorerView .izd-gx-home').count()===1,tag+`Grade ${g}: ${t==='rewards'?'Rewards':'Languages'} then Home returns to the Grade ${g} dashboard`);}
   await p.locator('#ilaGxTile-stem').click();await p.waitForTimeout(500);ok(await p.locator('#ilaGradeExplorerView .ila-stem-card').count()===4,tag+`Grade ${g}: the STEM tile opens this grade's STEM center`);
   await p.click('[data-academy-tab="math"]');await p.waitForTimeout(600);
   {const x=await p.evaluate(()=>{const v=document.getElementById('ilaGradeExplorerView'),fr=v.querySelector('.ila-gx-frame');return{chips:[...v.querySelectorAll('.izd-chip')].map(c=>c.dataset.izd).join(),cards:v.querySelectorAll('.izd-lessons .izl-lcard').length,frameBg:getComputedStyle(fr).backgroundImage+' '+getComputedStyle(fr).backgroundColor,old:!!v.querySelector('[class*="-game-link"],[class*="ila-gx-g4-"],[class*="ila-gx-g6-"],[class*="ila-gx-g7-"],[class*="ila-gx-g8-"]'),icon:!!v.querySelector('.izd-chip use[href="#izi-book"]')&&!!document.getElementById('izi-book')}});
    ok(x.chips==='lesson,course,practice,puzzles'&&x.cards===4&&x.icon&&/^none rgba\(0, 0, 0, 0\)/.test(x.frameBg)&&!x.old,tag+`Grade ${g}: Math opens like Grade 5: four Math chicklets (${x.chips}), no STEM or Game Center there and the lesson panel with 4 lesson cards; no old grade page or game links`)}
   await p.locator('#ilaGradeExplorerView .izl-lcard').first().click();await p.waitForTimeout(300);
   for(let q=0;q<4;q++){await p.locator('#ilaGradeExplorerView .izl-opt').first().click();await p.locator('#ilaGradeExplorerView .izl-btn.primary',{hasText:'Check my answer'}).click();await p.waitForTimeout(80);
    if(q===0)ok(await p.locator('#ilaGradeExplorerView .izd-feedback').count()===1&&await p.locator('#ilaGradeExplorerView .izl-card-main').count()===1,tag+`Grade ${g}: a lesson plays in the Grade 5 lesson card and explains the answer`);
    await p.locator('#ilaGradeExplorerView .izl-btn.primary').last().click();await p.waitForTimeout(80)}
   {const d=await p.evaluate(G=>{const s=JSON.parse(localStorage.getItem('ila_grade_explorer_demo_v1')||'{}');const recs=Object.values(s.grades?.[G]||{});return{done:recs.filter(r=>r.completed).length,txt:document.querySelector('#ilaGradeExplorerView .izl-card-main')?.innerText||''}},g);
    ok(d.done>=1&&/Lesson complete/.test(d.txt),tag+`Grade ${g}: finishing the lesson saves it as completed, as before (${d.done} completed)`)}
   await p.click('[data-academy-tab="math"]');await p.waitForTimeout(400);await p.click('.izd-chip[data-izd="practice"]');await p.waitForTimeout(400);
   ok(await p.evaluate(()=>window.ilaGamePacks.current()?.id==='dash'&&!!document.querySelector('#ilaGamePackHub .eg-stage:not([hidden])')),tag+`Grade ${g}: Math Practice opens the grade's math rocket`);
   await p.click('[data-academy-tab="ela"]');await p.waitForTimeout(400);ok(await p.evaluate(()=>[...document.querySelectorAll('#ilaGradeExplorerView .izd-chip')].map(c=>c.dataset.izd).join())==='lesson,course,practice,puzzles',tag+`Grade ${g}: ELA has only ELA chicklets`);
   await p.click('.izd-chip[data-izd="practice"]');await p.waitForTimeout(400);ok(await p.evaluate(()=>window.ilaGamePacks.current()?.id==='reading'),tag+`Grade ${g}: Reading Practice opens Reading Detective`);
   await p.click('[data-academy-tab="home"]');await p.waitForTimeout(300);
   for(const [shared,tab,subj] of [['languages','math','math'],['rewards','ela','ela'],['languages','creative','stem'],['rewards','games','games']]){await p.click(`[data-academy-tab="${shared}"]`);await p.waitForTimeout(500);await p.click(`[data-academy-tab="${tab}"]`);await p.waitForTimeout(800);
    const x=await p.evaluate(()=>{const v=document.getElementById('ilaGradeExplorerView');const w=v?.querySelector('.izd-welcome');return{subj:w?.dataset.subject||'',time:w?.querySelector('.izd-welcome-time')?.textContent||'',stem:v?.querySelectorAll('.ila-stem-card').length||0,games:v?.querySelector('#ilaGamePackHub')?.dataset.grade||'',g5:[...document.querySelectorAll('.academy-view')].some(e=>e.getClientRects().length>0)}});
    const right=subj==='games'?x.games===g:subj==='stem'?x.stem===4&&x.subj==='stem':x.subj===subj;
    ok(await inGrade()&&right&&!x.g5,tag+`Grade ${g}: ${shared} then the ${tab} tab opens Grade ${g}'s own ${subj}, not Grade 5's`);
    if(subj!=='games')ok(/Plan for \d+–\d+ minutes/.test(x.time),tag+`Grade ${g}: the ${subj} page starts with a welcome and a time ("${x.time}")`);
    await p.click('[data-academy-tab="home"]');await p.waitForTimeout(400)}}
  if(vp.width===390){const px=await p.evaluate(async()=>{const out={};for(const f of ['crown-logo.png','tip-bulb.png','footer-crown.png']){const i=new Image();i.src='assets/dash/'+f;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data;let vis=0,faint=0;for(let k=3;k<d.length;k+=4){if(d[k]>0){vis++;if(d[k]<80)faint++}}out[f]=+(faint/vis).toFixed(2)}return out}); // the old pictures were about half faint grey box (0.47-0.58)
   ok(Object.values(px).every(v=>v<0.35),tag+'crown, bulb and footer-crown pictures have no grey box or file name around them '+JSON.stringify(px))}
  // Grade 5 still opens its own home and keeps the stars
  await p.goto(U+'academy.html');await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>document.getElementById('points')?.textContent==='300'&&!!document.querySelector('#academyDashboard .izd-banner')),tag+'Grade 5: its own dashboard, with the same 300 stars');
  {const c=await chrome();ok(!c.change&&c.logo==='index.html'&&c.back,tag+'Grade 5: no Change grade link; Back to Academy and the logo go to the Welcome page')}
  ok(JSON.parse(await p.evaluate(()=>localStorage.getItem('izzy-academy-v1'))).points===300,tag+'Academy stars unchanged after all the flows');
  ok(errs.length===0,tag+'no page errors '+errs.slice(0,3).join(' | '));ok(missing.length===0,tag+'no missing files '+missing.slice(0,5).join(' '));
  await ctx.close()}

 // ---- V7.13.3 Game Centers: every grade gets the Grade 5 games, set for its age; stars once per grade, game and level ----
 {const EXPECT={K:{n:8,cells:16,title:'Kindergarten Game Center',dash:'Counting Rocket',read:true},'1':{n:8,cells:16,title:'Grade 1 Game Center',dash:'Number Rocket',read:true},'2':{n:8,cells:16,title:'Grade 2 Game Center',dash:'Place-Value Rocket',read:true},
   '3':{n:8,cells:16,title:'Grade 3 Game Center',dash:'Times-Table Rocket',read:false},'4':{n:8,cells:36,title:'Grade 4 Game Center',dash:'Fraction Rocket',read:false},'6':{n:8,cells:36,title:'Grade 6 Game Center',dash:'Ratio Rocket',read:false},
   '7':{n:8,cells:36,title:'Grade 7 Game Center',dash:'Integer Rocket',read:false},'8':{n:8,cells:81,title:'Grade 8 Game Center',dash:'Equation Rocket',read:false}};
  const OLD={'ila_grade_games_demo_v1':'{"keep":"old grade games save"}','ila_k3_games_v1':'{"keep":"old K-3 trails save"}','izzy_enchanted_game_center_v1':'{"best":{},"wins":{},"awards":{"sudoku:4":10}}'};
  for(const vp of [{width:390,height:844},{width:1366,height:1024}]){const tag=vp.width+'px: ';const ctx=await b.newContext({viewport:vp,hasTouch:true});const p=await ctx.newPage();const errs=[],missing=[];
   p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url().replace(U,''))});p.on('dialog',d=>d.dismiss());
   await p.goto(U+'academy.html');await p.evaluate(([s,o])=>{localStorage.clear();localStorage.setItem('izzy-academy-v1',JSON.stringify(s));for(const [k,v] of Object.entries(o))localStorage.setItem(k,v)},[SAVE,OLD]);
   let stars=300;const deep=vp.width===1366;
   const hub=()=>p.evaluate(async()=>{const h=document.getElementById('ilaGamePackHub');const vis=e=>!!e&&e.getClientRects().length>0;
    return{vis:vis(h),grade:h?.dataset.grade,title:h?.querySelector('.eg-title')?.textContent||'',cards:h?[...h.querySelectorAll('.eg-card')].filter(vis).map(c=>c.dataset.game):[],names:h?[...h.querySelectorAll('.eg-card h3')].map(x=>x.textContent):[],
     imgs:h?(await Promise.all([...h.querySelectorAll('.eg-card img')].map(i=>{i.loading='eager';return i.decode().then(()=>i.naturalWidth>0,()=>false)}))).every(Boolean):false,old:!!document.querySelector('#ilaGradeExplorerView .ila-gg-panel, #ilaGradeExplorerView [class^="ila-gg"], #ilaGradeExplorerView iframe'),
     games:document.querySelector('[data-academy-tab="games"]')?.getAttribute('aria-current'),pts:document.getElementById('points')?.textContent,wide:document.documentElement.scrollWidth>innerWidth+1,arcade:!!h?.querySelector('[data-eg="arcade"]')}});
   const solveSudoku=async()=>{const m=await p.evaluate(()=>{const x=window.ilaGamePacks._test.model();return{board:x.board,solved:x.solved}});
    for(let i=0;i<m.board.length;i++)if(!m.board[i]){await p.click(`#ilaGamePackHub [data-eg="cell"][data-i="${i}"]`);await p.click(`#ilaGamePackHub [data-eg="number"][data-num="${m.solved[i]}"]`)}
    await p.click('#ilaGamePackHub [data-eg="check"]');await p.waitForTimeout(150)};
   for(const g of ['K','1','2','3','4','6','7','8']){const E=EXPECT[g];
    await p.goto(U+'academy.html?grade='+g);await p.waitForTimeout(1300);await p.click('#ilaGxTile-arcade');await p.waitForTimeout(500);let h=await hub();
    const want=['sudoku','brainlab','memory','tictac','wordsearch','wordguess','dash','cascade','catapult','reading'];
    ok(h.vis&&h.grade===g&&h.title.includes(E.title)&&h.cards.join()===want.join()&&h.names.includes(E.dash)&&h.imgs,tag+`Grade ${g}: the Game Center tile opens "${E.title}" with 10 games including its own Brain Lab, its own ${E.dash}, Crown Cascade and Castle Catapult; every card picture loads`+(h.imgs&&h.vis?'':' '+JSON.stringify(h)));
    ok(!h.old&&h.games==='page'&&!h.wide,tag+`Grade ${g}: the old grade games are not shown; the Games tab is lit; no sideways scroll`);
    ok(!h.arcade,tag+`Grade ${g}: the old Royal Arcade button is gone (its games are replaced by the two new ones)`);
    // Sudoku at the grade's first level, won through the buttons: 10 stars the first time, none the second time
    await p.click('#ilaGamePackHub [data-id="sudoku"]');await p.waitForTimeout(200);
    const cells=await p.locator('#ilaGamePackHub [data-eg="cell"]').count();ok(cells===E.cells,tag+`Grade ${g}: Sudoku starts at the grade's level (${cells} squares, want ${E.cells})`);
    if(deep||g==='K'||g==='8'){
     await solveSudoku();stars+=10;let x=await p.evaluate(()=>({t:document.querySelector('#ilaGamePackHub .eg-finish')?.textContent||'',pts:document.getElementById('points').textContent,saved:JSON.parse(localStorage.getItem('izzy-academy-v1')).points}));
     ok(/Plus 10 Academy stars/.test(x.t)&&x.pts===String(stars)&&x.saved===stars,tag+`Grade ${g}: solving Sudoku pays 10 Academy stars (header and save show ${stars})`);
     await p.click('#ilaGamePackHub .eg-finish [data-eg="restart"]');await p.waitForTimeout(200);await solveSudoku();
     x=await p.evaluate(()=>({t:document.querySelector('#ilaGamePackHub .eg-finish')?.textContent||'',saved:JSON.parse(localStorage.getItem('izzy-academy-v1')).points}));
     ok(!/Academy stars!/.test(x.t)&&x.saved===stars,tag+`Grade ${g}: solving the same level again pays nothing more (still ${stars})`);}
    await p.click('#ilaGamePackHub [data-eg="back"]');await p.waitForTimeout(150);
    // each game opens with levels for this grade and returns to the cards
    for(const id of want.filter(x=>x!=='cascade'&&x!=='catapult')){await p.click(`#ilaGamePackHub [data-id="${id}"]`);await p.waitForTimeout(id==='brainlab'?400:150);
     const s=await p.evaluate(id=>{const h=document.getElementById('ilaGamePackHub');const st=h.querySelector('.eg-stage');const vis=e=>!!e&&e.getClientRects().length>0;
      return{stage:vis(st),cardsHidden:!vis(h.querySelector('.eg-cards')),modes:[...st.querySelectorAll('[data-eg="mode"]')].map(b=>b.textContent),brain:vis(h.querySelector('#ilaGradeBrainLab'))&&!h.querySelector('#izBrainLab'),say:!!st.querySelector('[data-eg="say"],[data-eg="sayq"],[data-eg="sayread"],[data-eg="sayclue"]'),
       wide:document.documentElement.scrollWidth>innerWidth+1}},id);
     const fine=id==='brainlab'?s.brain:id==='reading'?true:s.modes.length>=2;
     ok(s.stage&&s.cardsHidden&&fine&&!s.wide,tag+`Grade ${g}: ${id} opens${id==='brainlab'?' its own Brain Lab (not the Grade 5 one)':' with levels: '+s.modes.join(' / ')}; no sideways scroll`);
     if(['dash','reading','wordguess'].includes(id))ok(s.say===E.read,tag+`Grade ${g}: ${id} ${E.read?'has':'does not need'} a read-aloud button`);
     if(id==='brainlab'){await p.locator('#ilaGradeBrainLab button').filter({hasText:/back|games|exit|leave/i}).first().click().catch(()=>{});await p.waitForTimeout(200);if(!(await p.evaluate(()=>!document.querySelector('#ilaGamePackHub .eg-stage').hidden?false:true)))await p.evaluate(()=>window.ilaGamePacks.back())}
     else await p.click('#ilaGamePackHub [data-eg="back"]');await p.waitForTimeout(120)}
    if(deep&&(g==='K'||g==='6')){ // Reading Detective won by choosing the right answers: 15 stars, once
     await p.click('#ilaGamePackHub [data-id="reading"]');for(let k=0;k<5;k++){const c=await p.evaluate(()=>{const m=window.ilaGamePacks._test.model();return m.deck[m.index].c});await p.click(`#ilaGamePackHub [data-eg="readingchoice"][data-i="${c}"]`);await p.click('#ilaGamePackHub [data-eg="readingcheck"]');await p.click('#ilaGamePackHub [data-eg="readingnext"]')}
     stars+=15;ok(await p.evaluate(()=>/Plus 15 Academy stars/.test(document.querySelector('#ilaGamePackHub .eg-finish')?.textContent||''))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points)===stars,tag+`Grade ${g}: a full Reading Detective case file pays 15 stars`);
     await p.click('#ilaGamePackHub [data-eg="back"]')}
    if(deep&&(g==='K'||g==='8')){ // the new arcade games, played
     await p.click('#ilaGamePackHub [data-id="cascade"]');await p.waitForTimeout(400);ok(await p.locator('.iap-overlay canvas.iap-canvas').isVisible(),tag+`Grade ${g}: Crown Cascade opens`);
     for(let k=0;k<4;k++){await p.click('.iap-key-drop');await p.waitForTimeout(80)}const cs=await p.evaluate(()=>window.ilaArcadePlus.current.test.state);
     ok(cs.score>0&&cs.board.flat().filter(Boolean).length>=12&&!cs.over,tag+`Grade ${g}: dropping four gem shapes stacks them on the board (score ${cs.score})`);
     await p.evaluate(()=>{const t=window.ilaArcadePlus.current.test;const rows=Array.from({length:20},(_,y)=>Array(10).fill(y>=18?'T':0));rows[18][0]=0;rows[19][0]=0;t.setBoard(rows)});
     let tries=0;while(tries++<30){const pc=await p.evaluate(()=>window.ilaArcadePlus.current.test.state.piece);if(pc&&pc.type==='I')break;await p.click('.iap-key-drop');await p.waitForTimeout(60);await p.evaluate(()=>{const t=window.ilaArcadePlus.current.test;const rows=Array.from({length:20},(_,y)=>Array(10).fill(y>=18?'T':0));rows[18][0]=0;rows[19][0]=0;t.setBoard(rows)})}
     await p.click('.iap-key-rotate');for(let k=0;k<6;k++)await p.click('.iap-key-left');await p.click('.iap-key-drop');await p.waitForTimeout(500);
     const cl=await p.evaluate(()=>window.ilaArcadePlus.current.test.state);ok(cl.lines===2,tag+`Grade ${g}: filling two rows clears them (lines ${cl.lines})`);
     await p.click('.iap-bar .iap-ghost');await p.click('.iap-card-catapult');await p.click('.iap-level[data-level="0"]');await p.waitForTimeout(1800);
     const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points);
     await p.evaluate(()=>window.ilaArcadePlus.current.test.shoot(91.9,-91.9));let far=0;for(let t=0;t<16;t++){await p.waitForTimeout(200);const o=await p.evaluate(()=>window.ilaArcadePlus.current.test.state.orb);if(o&&!o.st)far=Math.max(far,o.x)}
     ok(far>1300,tag+`Grade ${g}: a full pull of the catapult carries the orb past the far castles (reached x=${Math.round(far)} of 1400)`);
     await p.click('.iap-hud .iap-chip:nth-child(5)');await p.waitForTimeout(1800);
     await p.evaluate(()=>window.ilaArcadePlus.current.test.shoot(125.6,-33.6));await p.waitForTimeout(6000);const ct=await p.evaluate(()=>window.ilaArcadePlus.current.test.state);
     const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points);stars=after;
     ok(ct.ended&&ct.blobs===0&&await p.locator('.iap-result').isVisible(),tag+`Grade ${g}: one well-aimed orb clears Castle 1 with real physics (score ${ct.score})`);
     ok(after-before===(g==='K'?2:0),tag+`Grade ${g}: clearing Castle 1 pays 2 Academy stars the first time only (${after-before})`);
     await p.click('#iapClose');await p.waitForTimeout(200);ok(!(await p.locator('.iap-overlay').count()),tag+`Grade ${g}: Close returns to the Game Center`)}
    if(deep||g==='K'){ // the grade's Brain Lab: right puzzles for the grade; a world pays 3 per first-try puzzle + 5, once
     await p.click('#ilaGamePackHub [data-id="brainlab"]');await p.waitForTimeout(200);
     const per=['K','1','2'].includes(g)?6:9;const info=await p.evaluate(()=>{const r=document.getElementById('ilaGradeBrainLab');return{title:r.querySelector('.bl-intro h3').textContent,worlds:r.querySelectorAll('.bl-tile').length,total:r.querySelector('.bl-total').textContent}});
     ok(info.title.includes(E.title.replace(' Game Center',' Brain Lab'))&&info.worlds===4&&info.total.includes('of '+per*4+' puzzles'),tag+`Grade ${g}: Brain Lab is "${info.title.replace('🧠 ','')}" with 4 worlds and ${per*4} puzzles`);
     const first=await p.evaluate(()=>window.ilaGamePacks._test.bpuzzles('patterns')[0].prompt);const g5=await p.evaluate(()=>JSON.stringify(window.izBrainLab&&window.izBrainLab.puzzleCount));
     ok(!/3, 6, 12, 24/.test(first),tag+`Grade ${g}: its first pattern is its own ("${first}"), not Grade 5's`);
     const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points),g5save=await p.evaluate(()=>localStorage.getItem('izzy_brainlab_v1'));
     await p.click('#ilaGradeBrainLab [data-world="patterns"]');
     for(let k=0;k<per;k++){await p.click('#ilaGradeBrainLab .bl-opt[data-correct="1"]');await p.click('#ilaGradeBrainLab .bl-next')}
     let pts=await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points);stars=before+per*3+5;
     ok(pts===stars&&await p.locator('#ilaGradeBrainLab .bl-done').isVisible(),tag+`Grade ${g}: finishing Pattern world on the first try pays ${per}×3 + 5 = ${per*3+5} stars`);
     await p.click('#ilaGradeBrainLab .bl-done .bl-primary');for(let k=0;k<per;k++){await p.click('#ilaGradeBrainLab .bl-opt[data-correct="1"]');await p.click('#ilaGradeBrainLab .bl-next')}
     pts=await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points);ok(pts===stars,tag+`Grade ${g}: playing the world again pays nothing more`);
     ok(await p.evaluate(()=>localStorage.getItem('izzy_brainlab_v1'))===g5save,tag+`Grade ${g}: Grade 5's Royal Brain Lab save is untouched`);
     await p.click('#ilaGradeBrainLab .bl-done .bl-ghost');await p.click('#ilaGradeBrainLab .bl-acts .bl-ghost');await p.waitForTimeout(150)}
    // back to the dashboard
    await p.click('.gp-back');await p.waitForTimeout(400);ok(await p.locator('#ilaGradeExplorerView .izd-gx-home .izd-tile').count()===8&&!(await hub()).vis,tag+`Grade ${g}: "Choose another activity" returns to the Grade ${g} dashboard`);
    if(['K','3'].includes(g)){await p.click('[data-academy-tab="games"]');await p.waitForTimeout(400);h=await hub();ok(h.vis&&h.grade===g&&!h.old,tag+`Grade ${g}: the Games tab opens the same Game Center`);
     await p.click('[data-academy-tab="home"]');await p.waitForTimeout(400);ok(await p.locator('#ilaGradeExplorerView .izd-gx-home .izd-tile').count()===8,tag+`Grade ${g}: Home after Games shows the dashboard`)}}
   const st=await p.evaluate(()=>({gp:JSON.parse(localStorage.getItem('ila_grade_game_center_v1')||'null'),old:['ila_grade_games_demo_v1','ila_k3_games_v1','izzy_enchanted_game_center_v1'].map(k=>localStorage.getItem(k)),keys:Object.keys(localStorage)}));
   ok(st.gp&&st.gp.version===1&&st.gp.grades.K.awards['sudoku:4s']===10&&st.gp.grades['8'].awards['sudoku:9s']===10,tag+'stars are recorded per grade, game and level in the new key ila_grade_game_center_v1');
   ok(JSON.stringify(st.old)===JSON.stringify(Object.values(OLD))&&st.keys.every(k=>/^(izzy[-_]|ila_)/.test(k)),tag+'old game saves (Grades 4-8 games, K-3 trails, Grade 5 games) are left exactly as they were; every key is one Family Backup copies');
   // Grade 5 still has its own Enchanted Game Center
   await p.goto(U+'academy.html');await p.waitForTimeout(1500);await p.click('[data-academy-tab="games"]');await p.waitForTimeout(1800);
   ok(await p.evaluate(()=>document.querySelectorAll('#izEnchantedHub .eg-card').length===8&&!document.getElementById('ilaGamePackHub')),tag+'Grade 5: its own Enchanted Game Center (8 games), unchanged');
   await p.click('#izEnchantedHub [data-eg="royal"]');await p.waitForTimeout(900);const nb=p.locator('.ila-ra-native-button');
   ok(await nb.count()===1&&/Crown Cascade/.test(await nb.textContent()),tag+"Grade 5: the Royal Arcade's new-games button now offers Crown Cascade and Castle Catapult");
   await nb.click();await p.waitForTimeout(400);ok(await p.locator('.iap-overlay .iap-card').count()===2&&!(await p.locator('.ila-ra-overlay').count()),tag+'Grade 5: it opens the two new games (not the old three)');await p.click('#iapClose');
   // a damaged game save is left alone; play works but pays no stars
   await p.evaluate(()=>localStorage.setItem('ila_grade_game_center_v1','{damaged'));await p.goto(U+'academy.html?grade=K');await p.waitForTimeout(1200);await p.click('#ilaGxTile-arcade');await p.waitForTimeout(300);
   const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points);ok(await p.locator('#ilaGamePackHub .gp-warn').isVisible(),tag+'a damaged game save shows a plain warning');
   await p.click('#ilaGamePackHub [data-id="sudoku"]');await solveSudoku();
   ok(await p.evaluate(()=>localStorage.getItem('ila_grade_game_center_v1'))==='{damaged'&&await p.evaluate(()=>JSON.parse(localStorage.getItem('izzy-academy-v1')).points)===before,tag+'the damaged save is not overwritten and no stars are paid');
   ok(errs.length===0,tag+'Game Centers: no page errors '+errs.slice(0,3).join(' | '));ok(missing.length===0,tag+'Game Centers: no missing files '+missing.slice(0,5).join(' '));
   await ctx.close()}}
 await b.close();server.close();console.log(`\n${pass} passed, ${fail} failed (browser checks only; real-device checks are manual)`);process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(2)});
