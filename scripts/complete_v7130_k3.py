from pathlib import Path
import re
p=Path('courses/little-learners.html')
s=p.read_text(encoding='utf-8')
if 'id="ila-v7130-final-dashboard"' in s: print('Already applied'); raise SystemExit
assert 'id="ila-k3-dashboard-integration"' in s
css='''<style id="ila-v7130-final-dashboard">
.grade-list,.shell>.header,.ila-scene-open,.ila-scene-modal{display:none!important}
#workspace[hidden]{display:none!important}
.ila-k3-hero{height:auto!important;min-height:0!important;background:#2b124e!important;display:flex!important;flex-direction:column!important;overflow:hidden}
.ila-k3-hero::before{content:""!important;display:block!important;position:static!important;order:-1!important;width:100%!important;aspect-ratio:2400/633!important;background-image:var(--ila-scene)!important;background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important}
.ila-k3-copy{width:100%!important;max-width:none!important;position:relative!important;background:linear-gradient(110deg,#361356,#66247b)!important;padding:16px 22px!important}
.ila-grade-nav{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:10px 0 16px;padding:10px 13px;background:linear-gradient(100deg,#3a175f,#61268a);border:1px solid #e6c77b;border-radius:16px;color:white}
.ila-grade-nav a,.ila-grade-nav button{background:#55257a;color:#fff;text-decoration:none;border:1px solid #e8ce8b;border-radius:11px;min-height:44px;padding:9px 12px;font-weight:800}
.ila-grade-nav .ila-grade-label{font-weight:900;flex:1;min-width:105px}
.ila-grade-nav .ila-grade-score{font-weight:850;white-space:nowrap}
@media(max-width:590px){.ila-grade-nav{padding:8px;gap:6px}.ila-grade-nav a,.ila-grade-nav button{padding:8px;font-size:12px}.ila-k3-copy{padding:12px 14px!important}}
</style>'''
s=s.replace('</head>',css+'</head>',1)
s,n=re.subn(r'hero\.style\.backgroundImage\s*=\s*([^;]+);',lambda m:'hero.style.setProperty("--ila-scene",'+m.group(1)+');',s,count=1)
assert n==1,'Missing hero background assignment'
js='''<script id="ila-v7130-final-dashboard">
(()=>{'use strict';
const main=document.getElementById('main'),workspace=document.getElementById('workspace');
if(!main||!workspace)return;
const nav=document.createElement('nav');nav.className='ila-grade-nav';nav.setAttribute('aria-label','Grade dashboard navigation');
nav.innerHTML='<button type="button" id="ila-grade-home">⌂ Home</button><span class="ila-grade-label" id="ila-grade-name"></span><span class="ila-grade-score" id="ila-grade-score"></span><a href="../index.html">← Back to Academy</a>';
main.parentNode.insertBefore(nav,main);
function grade(){return window.ILA_K3_DASHBOARD_BRIDGE?.getGrade()||new URLSearchParams(location.search).get('grade')||'K'}
function refresh(){
const g=grade();nav.querySelector('#ila-grade-name').textContent=g==='K'?'Kindergarten':'Grade '+g;
let points=0;try{const saved=JSON.parse(localStorage.getItem('izzy-academy-v1')||'{}');points=Math.max(0,Math.floor(Number(saved.points)||0))}catch(e){}
nav.querySelector('#ila-grade-score').textContent='⭐ '+points+' · Level '+(1+Math.floor(points/100));
}
function gate(){workspace.hidden=!!workspace.querySelector('.subject-grid');}
new MutationObserver(()=>{gate();refresh()}).observe(workspace,{childList:true,subtree:false});
nav.querySelector('#ila-grade-home').addEventListener('click',()=>{
const b=window.ILA_K3_DASHBOARD_BRIDGE;
if(b?.selectGrade)b.selectGrade(grade());
else location.href='little-learners.html?grade='+encodeURIComponent(grade());
document.querySelector('.ila-k3-hero')?.scrollIntoView({block:'start'});
});
document.getElementById('ila-k3-grid')?.addEventListener('click',e=>{
if(e.target.closest('button:not(:disabled)'))queueMicrotask(gate);
});
document.addEventListener('ila-k3-grade-ready',()=>{refresh();gate()});
window.addEventListener('pageshow',refresh);
window.addEventListener('storage',refresh);
refresh();gate();
})();
</script>'''
s=s.replace('<script id="ila-k3-dashboard-integration">',js+'\n<script id="ila-k3-dashboard-integration">',1)
p.write_text(s,encoding='utf-8')
print('Patched grade dashboards, navigation, real Academy rewards, scene and coursework gating')
