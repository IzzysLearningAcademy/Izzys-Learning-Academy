from pathlib import Path
p=Path("courses/little-learners.html")
s=p.read_text(encoding="utf-8")
assert 'ila-k3-dashboard-integration' in s
assert 'ila-k3-final-scenes' not in s
css="""<style id="ila-k3-final-scenes">
.ila-k3-hero{display:flex!important;flex-direction:column!important;position:relative!important;min-height:0!important;height:auto!important;overflow:hidden!important;background:#291048!important;border:2px solid #e7c46c!important;border-radius:18px!important}
.ila-k3-hero::before{content:""!important;display:block!important;position:static!important;inset:auto!important;width:100%!important;height:auto!important;aspect-ratio:2400/633!important;background:var(--ila-k3-scene) center/contain no-repeat!important;order:-1!important}
.ila-k3-copy{position:relative!important;width:100%!important;max-width:none!important;background:linear-gradient(110deg,#291048,#602480)!important;padding:15px 20px!important}
.ila-k3-copy h2{font-size:clamp(1.5rem,4vw,2.3rem)!important}
#workspace[hidden]{display:none!important}
.ila-scene-open{position:absolute;top:8px;right:8px;z-index:5;background:#291048e8;color:#fff;border:1px solid #f0d18a;border-radius:24px;padding:7px 12px;font-weight:800}
.ila-scene-modal{width:min(98vw,1200px);max-width:1200px;max-height:95vh;background:#261043;border:2px solid #e9c879;border-radius:16px;color:white;padding:12px}
.ila-scene-modal::backdrop{background:#120725d9}
.ila-scene-modal img{width:100%;height:auto;max-height:80vh;object-fit:contain}
.ila-scene-modal button{float:right;padding:8px 14px;margin-bottom:8px;background:#522582;color:#fff;border:1px solid #f2d58c;border-radius:9px}
</style>"""
s=s.replace("</head>",css+"</head>",1)
needle='hero.style.backgroundImage=`url("../assets/k3/${g[0]}-banner.webp")`;'
assert s.count(needle)==1
s=s.replace(needle,'hero.style.setProperty("--ila-k3-scene",`url("../assets/k3/${g[0]}-banner.webp")`);',1)
needle='if(state.gameMode)renderGames();else if(state.stemLab)renderStemLab();else if(state.lessonId)renderLesson();else if(state.subject && lessonsOf(state.subject).length)renderSubject();else renderDashboard();'
assert s.count(needle)==1
s=s.replace(needle,'const activityOpen=!!(state.gameMode||state.stemLab||state.lessonId||(state.subject&&lessonsOf(state.subject).length));els.workspace.hidden=!activityOpen;\n  '+needle,1)
# The dashboard overview is not an activity: its duplicate coursework stays hidden.
# When a subject is selected render() reveals its workspace.
viewer="""<script id="ila-k3-scene-viewer">
(()=>{'use strict';
const hero=document.querySelector('.ila-k3-hero');
if(!hero||!window.HTMLDialogElement)return;
const btn=document.createElement('button');btn.type='button';btn.className='ila-scene-open';btn.textContent='View full scene';
const dlg=document.createElement('dialog');dlg.className='ila-scene-modal';
const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dlg.close();
const img=document.createElement('img');img.alt='Complete illustrated adventure scene';dlg.append(close,img);
hero.append(btn);document.body.append(dlg);
btn.onclick=()=>{const g=window.ILA_K3_DASHBOARD_BRIDGE?.getGrade()||'K';const code=({K:'k',1:'g1',2:'g2',3:'g3'})[g]||'k';img.src='../assets/k3/'+code+'-banner.webp';dlg.showModal();};
dlg.onclick=e=>{if(e.target===dlg)dlg.close();};
})();
</script>"""
assert '<script id="ila-k3-dashboard-integration">' in s
s=s.replace('<script id="ila-k3-dashboard-integration">',viewer+'\n<script id="ila-k3-dashboard-integration">',1)
p.write_text(s,encoding="utf-8")
print("Patched K-3 banner display and dashboard visibility")
