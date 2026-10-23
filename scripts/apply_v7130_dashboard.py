from pathlib import Path
p=Path("courses/little-learners.html")
s=p.read_text(encoding="utf-8")
if 'id="ila-k3-grade-dashboard-v7130"' in s:
    print("Already applied"); raise SystemExit(0)
assert 'id="ila-k3-dashboard-integration"' in s
assert 'id="workspace"' in s
css='''<style id="ila-k3-grade-dashboard-v7130">
/* Grade is chosen on the Academy homepage; do not show a second grade chooser. */
.grade-list{display:none!important}
.ila-scene-open,.ila-scene-modal{display:none!important}
/* Remove duplicate Academy brand banner above the illustrated grade scene. */
body>.shell>.header,.shell>.header{display:none!important}
.ila-k3-hero{margin-top:10px!important}
.ila-k3-hero::before{background-size:contain!important;background-position:center!important}
.ila-k3-adventures{margin-top:14px}
.ila-k3-grid{scroll-margin-top:12px}
.ila-grade-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#361451;color:#fff;border:1px solid #e4bc6d;border-radius:16px;padding:10px 14px;margin:10px 0}
.ila-grade-nav a,.ila-grade-nav button{background:#5a247b;color:#fff;border:1px solid #f0d48d;border-radius:11px;padding:9px 13px;font-weight:800;text-decoration:none;min-height:42px}
.ila-grade-nav .ila-grade-name{font-weight:900;flex:1;min-width:95px}
@media(max-width:590px){.ila-grade-nav{gap:6px;padding:8px}.ila-grade-nav a,.ila-grade-nav button{font-size:12px;padding:7px 9px}.ila-k3-hero::before{aspect-ratio:2400/633!important}}
</style>'''
s=s.replace('</head>',css+'</head>',1)
js='''<script id="ila-k3-grade-nav-v7130">
(()=>{
'use strict';
const main=document.querySelector('#main');
if(!main)return;
const nav=document.createElement('nav');
nav.className='ila-grade-nav';
nav.setAttribute('aria-label','Grade dashboard navigation');
nav.innerHTML='<button type="button" id="ila-grade-home">⌂ Home</button><span class="ila-grade-name" id="ila-grade-name"></span><span id="ila-grade-rewards" aria-label="Learner stars and level"></span><a href="../index.html">← Back to Academy</a>';
main.parentElement.insertBefore(nav,main);
const home=nav.querySelector('#ila-grade-home');
function update(){
 const bridge=window.ILA_K3_DASHBOARD_BRIDGE;
 const g=bridge?.getGrade()||new URLSearchParams(location.search).get('grade')||'K';
 nav.querySelector('#ila-grade-name').textContent=g==='K'?'Kindergarten':'Grade '+g;
 // No invented stars: rewards are shown only when the existing Academy exposes them.
 const reward=nav.querySelector('#ila-grade-rewards');
 const existing=document.querySelector('[data-academy-stars],[data-stars-total]');
 if(existing&&existing!==reward)reward.textContent=existing.textContent;
}
home.onclick=()=>{
 const bridge=window.ILA_K3_DASHBOARD_BRIDGE;
 if(bridge?.gradeSelect){bridge.gradeSelect(bridge.getGrade());}
 else location.href='little-learners.html?grade='+encodeURIComponent(new URLSearchParams(location.search).get('grade')||'K');
 document.querySelector('.ila-k3-hero')?.scrollIntoView({behavior:'smooth',block:'start'});
};
document.addEventListener('ila-k3-grade-ready',update);
update();
})();
</script>'''
s=s.replace('<script id="ila-k3-dashboard-integration">',js+'\n<script id="ila-k3-dashboard-integration">',1)
p.write_text(s,encoding="utf-8")
print("Applied K-3 navigation and visual cleanup; learner reward wiring pending")
