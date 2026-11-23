// App logic: state, saving, backup, screens, events, rest timer
// ---------- state ----------
const MAX=7,TARGET=6;
const dname=d=>(d.name[0]+" "+d.name[1]).trim();
const HABITS=[["steps","Walk 8–10k steps","--orange",G.walk],["protein","Hit your protein target","--pink",G.fork],["water","Drink 2.5–3 L water","--cyan",G.drop],["sleep","Sleep 7–8 hours","--indigo",G.moon],["food","No fried food or sugary drinks","--green",G.leaf]];
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today=()=>ymd(new Date());
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
function weekStart(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d);}
const $=id=>document.getElementById(id);
const $$=sel=>[...document.querySelectorAll(sel)];
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const fmtD=(d,o={weekday:"short",day:"numeric",month:"short"})=>new Date(d+"T00:00").toLocaleDateString(undefined,o);
const num=v=>v===""||v==null||isNaN(+v)?null:+v;
const r1=v=>Math.round(v*10)/10;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

const KEY="split4v3";
let LOADWARN="";
let S=load();
// Safe load: a copy that fails to load is never overwritten; fall back to the last good copy
function readKey(k){try{const r=localStorage.getItem(k);if(!r)return null;const o=JSON.parse(r);return o&&typeof o==="object"?o:null}catch(e){return null}}
function load(){let s=null,raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}
  if(raw){s=readKey(KEY);
    if(!s){try{localStorage.setItem(KEY+"_failed_"+Date.now(),raw)}catch(e){}
      s=readKey(KEY+"_lastgood");LOADWARN=s?"Your data couldn't be read, so the last good copy was restored":"Your data couldn't be read. A copy was kept safe — export a backup from Settings";}
    else{try{localStorage.setItem(KEY+"_lastgood",raw)}catch(e){}}}
  if(!s){let old=null;try{old=JSON.parse(localStorage.getItem("split4v2"))}catch(e){}
    s={day:old?.day||0,plans:JSON.parse(JSON.stringify(DEFAULT)),sets:{},wts:{},checks:{},last:old?.last||null,count:old?.count||0,log:old?.log||[],filter:"All"};}
  return s;}
function norm(){S.edit=false;S.view=null;S.look=S.look==="glass"?"dark":(S.look||"auto");S.rest=S.rest||{main:90,other:60};
  for(const k of ["sets","wts","checks","act","meals","protein","profile","plans"])S[k]=S[k]||{};
  for(const k of ["log","sessions","checkups","body"])S[k]=S[k]||[];
  S.tab=S.tab||"workout";S.hseg=S.hseg||"checkups";S.filter=S.filter||"All";
  if(S.planVer!==2){S.plans=JSON.parse(JSON.stringify(DEFAULT));S.sets={};S.checks={};S.planVer=2;}
  S.swaps=S.swaps||{};S.vids=S.vids||{};S.phx=S.phx||{};S.prog=PROGRAMS[S.prog]?S.prog:"split4";S.nextBy=S.nextBy||{split4:S.day||0};
  DAYS=PROGRAMS[S.prog].days;S.day=Math.min(S.nextBy[S.prog]||0,DAYS.length-1);}
function setProg(p){S.nextBy[S.prog]=S.day;S.prog=p;DAYS=PROGRAMS[p].days;S.day=Math.min(S.nextBy[p]||0,DAYS.length-1);S.view=null;S.edit=false;}
const dayByKey=k=>ALLDAYS.find(d=>d.key===k);
norm();
// Protected save: verify the write, warn once if it fails
let saveWarned=false;
function save(){try{const {edit,view,...keep}=S;const j=JSON.stringify(keep);localStorage.setItem(KEY,j);
    if(localStorage.getItem(KEY)!==j)throw new Error("verify");saveWarned=false;}
  catch(e){if(!saveWarned){saveWarned=true;toast("Couldn't save — export a backup from Settings now");}}}
// Ask the browser not to clear this app's storage
let PERSIST=false;try{navigator.storage?.persist?.().then(ok=>{PERSIST=!!ok}).catch(()=>{})}catch(e){}

// ---------- backup: export / import ----------
function exportData(){const {edit,view,...keep}=S;const j=JSON.stringify({app:"workout",key:KEY,ver:1,saved:new Date().toISOString(),data:keep,photos:PHD,health:HD},null,1);
  const name=`workout-backup-${today()}.json`,file=new File([j],name,{type:"application/json"});
  if(navigator.canShare?.({files:[file]})){navigator.share({files:[file],title:name}).catch(()=>{});return;}
  const a=document.createElement("a");a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);toast("Backup saved");}
function importData(f){if(!f)return;const r=new FileReader();
  r.onload=()=>{let o=null;try{o=JSON.parse(r.result)}catch(e){}
    const d=o&&o.app==="workout"&&o.data&&typeof o.data==="object"?o.data:(o&&o.plans&&typeof o==="object"?o:null);
    if(!d){toast("That file isn't a Workout backup");return;}
    try{const {edit,view,...keep}=S;localStorage.setItem(KEY+"_preimport",JSON.stringify(keep))}catch(e){}
    S=d;norm();save();applyLook();applyAccent();closeSheets();renderAll();scrollTo({top:0});toast("Backup restored");
    if(o.health&&typeof o.health==="object"&&o.health.days){const h=o.health;HD.days={...h.days,...HD.days};["sleep","ex","weight"].forEach(k=>{const m=new Map([...(h[k]||[]),...HD[k]].map(x=>[Array.isArray(x)?x[0]:x.start,x]));HD[k]=[...m.values()];});HD.sleep.sort((a,b)=>b.start.localeCompare(a.start));HD.ex.sort((a,b)=>b.start.localeCompare(a.start));HD.weight.sort((a,b)=>b[0].localeCompare(a[0]));HD.at=HD.at||h.at;hdSave();renderAll();}
    if(o.photos&&typeof o.photos==="object")Promise.all(Object.entries(o.photos).filter(([k,v])=>PH[k]&&/^data:image\//.test(v)).map(([k,v])=>phSave(k,v))).then(renderAll).catch(()=>toast("Some photos couldn't be restored"));};
  r.onerror=()=>toast("Couldn't read that file");r.readAsText(f);}
let resetArm=false;

// ---------- workout helpers ----------
const D=()=>DAYS[S.view??S.day];
const find=n=>D().lib.find(e=>e[0]===n);
const nSets=e=>parseInt(e[3])||3;
function rankIn(d,n){const sw=S.swaps[d.key]||{},o=Object.keys(sw).find(x=>sw[x]===n);if(o)n=o;const def=DEFAULT[d.key],i=def.indexOf(n);if(i>=0)return i;
  const e=d.lib.find(x=>x[0]===n),g=e?e[1]:"";let pos=-1;def.forEach((m,j)=>{const f=d.lib.find(x=>x[0]===m);if(f&&f[1]===g)pos=j;});
  return (pos>=0?pos:def.length)+0.5+d.lib.findIndex(x=>x[0]===n)/1000;}
function planFor(d){const k=d.key;let p=S.plans[k]||(S.plans[k]=[...DEFAULT[k]]);
  const sw=S.swaps[k]||{},ess=ESS[k].map(n=>sw[n]||n),valid=p.filter(n=>d.lib.some(e=>e[0]===n));
  const extras=valid.filter(n=>!ess.includes(n)).slice(0,MAX-ess.length);
  const fixed=[...ess,...extras].sort((a,b)=>rankIn(d,a)-rankIn(d,b));
  if(fixed.join("|")!==p.join("|")){p.length=0;p.push(...fixed);}
  return p;}
// superset partner that follows n in today's plan (rest only after the last one)
function nextInSuper(k,n,p){for(const g of SUPER[k]||[]){const inP=g.filter(x=>p.includes(x));const i=inP.indexOf(n);if(i>=0&&inP.length>1)return i<inP.length-1?inP[i+1]:null;}return null;}
function superLabel(k,n,p){for(const g of SUPER[k]||[]){const inP=g.filter(x=>p.includes(x));if(inP.length>1&&inP.includes(n)){const i=inP.indexOf(n);return i<inP.length-1?`Superset → ${inP[i+1]}`:"Superset · rest after this";}}return "";}
G.swap=sv('<path d="M4.5 8.5h14.5l-3.5-3.5M19.5 15.5H5l3.5 3.5"/>',{w:2.2});
function exNotes(k,n,p){const out=[];if(isStrong(k,n))out.push("Strength lift · rest 2–3 min");const nt=NOTE[k]&&NOTE[k][n];if(nt)out.push(nt);const sl=superLabel(k,n,p);if(sl)out.push(sl);
  return out.map(t=>`<span class="ss">${esc(t)}</span>`).join("");}
// ---------- alternatives ----------
let ALTFOR=null;
function altsFor(k,n){const d=dayByKey(k),p=planFor(d),sw=S.swaps[k]||{},o=Object.keys(sw).find(x=>sw[x]===n),orig=o&&!p.includes(o)?o:null;
  const ok=x=>x!==n&&x!==orig&&!p.includes(x)&&d.lib.some(e=>e[0]===x);
  const best=(ALT[orig||n]||ALT[n]||[]).filter(ok),area=areaOf(k,n),same=(AREAS[k][area]||[]).filter(x=>ok(x)&&!best.includes(x)).slice(0,8);
  return {best,same,area,orig};}
function openAlts(n){ALTFOR=n;const k=D().key,{best,same,area,orig}=altsFor(k,n);
  const row=x=>{const f=find(x);return `<div class="cell lib"><div class="ct"><span class="t1">${esc(x)}</span><span class="t2">${esc(areaOf(k,x))} · ${esc(f[2])} · ${esc(f[3])}</span></div>${play(x,"proper form",true)}<button class="swapb" data-swapto="${esc(x)}" aria-label="Swap to ${esc(x)}">Swap</button></div>`;};
  $("altSub").textContent=n;
  $("altBody").innerHTML=(orig?`<div class="lh">Back to your plan</div><div class="group">${row(orig)}</div>`:"")
    +(best.length?`<div class="lh">Best swaps</div><div class="group">${best.map(row).join("")}</div><p class="lf">Same movement and muscles. Use one when the equipment is taken or something doesn't feel right.</p>`:"")
    +(same.length?`<div class="lh">Also trains ${esc(area||"this muscle")}</div><div class="group">${same.map(row).join("")}</div>`:"")
    +(!best.length&&!same.length&&!orig?`<div class="group">${emptyCell("No alternatives","Everything that trains this muscle is already in your workout.")}</div>`:"")
    +`<p class="lf">A swap keeps this exercise's place in your workout. If it was a must-do, the swap becomes the must-do.</p>`;
  $("altBody").scrollTop=0;openSheet("alts");}
function swapEx(k,from,to){const d=dayByKey(k),p=planFor(d),i=p.indexOf(from);if(i<0)return;
  const sw=S.swaps[k]||(S.swaps[k]={}),orig=Object.keys(sw).find(o=>sw[o]===from)||from;
  if(to===orig)delete sw[orig];else sw[orig]=to;
  p[i]=to;delete S.sets[k+"|"+from];planFor(d);}
const plan=()=>planFor(D());
const missing=()=>{const k=D().key,p=plan();return Object.keys(AREAS[k]).filter(a=>!AREAS[k][a].some(n=>p.includes(n)))};
function fillGaps(){const k=D().key,p=plan();let added=0;
  missing().forEach(a=>{if(p.length<MAX){const opts=shuffle(AREAS[k][a]);p.push(opts.find(n=>tierOf(k,n)==="r")||opts[0]);added++}});return added;}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function autoPick(){const d=D();S.plans[d.key]=[];const p=plan();fillGaps();
  const left=shuffle(d.lib.map(e=>e[0]).filter(n=>!p.includes(n)));
  const rest=[...left.filter(n=>tierOf(d.key,n)==="r"),...left.filter(n=>tierOf(d.key,n)==="o")];while(p.length<TARGET&&rest.length)p.push(rest.shift());p.sort((a,b)=>rankIn(d,a)-rankIn(d,b));
  clearProgress(d.key);renderAll();toast("New workout, every area covered");}
function clearProgress(k){Object.keys(S.sets).forEach(x=>x.startsWith(k+"|")&&delete S.sets[x]);Object.keys(S.checks).forEach(x=>x.startsWith(k)&&delete S.checks[x]);}
const minsOf=x=>parseInt(x[2])||0;
function cardioPending(k){let m=S.checks[k+"w0"]?minsOf(WARM[k][0]):0;FIN[k].forEach((f,i)=>{if(S.checks[k+"f"+i]&&f[4]!=="s")m+=minsOf(f)});return m;}
const cardioGoal=k=>minsOf(WARM[k][0])+FIN[k].filter(f=>f[3]==="m"&&f[4]!=="s").reduce((a,f)=>a+minsOf(f),0);
const weekCardio=()=>{const ws=weekStart();return S.log.filter(x=>x.d>=ws).reduce((a,x)=>a+x.m,0)+DAYS.reduce((a,d)=>a+cardioPending(d.key),0);};
const weekSessions=()=>{const ws=weekStart();return S.sessions.filter(x=>x.d>=ws).length;};
function dayStats(d){const p=planFor(d);let total=0,done=0;p.forEach(n=>{const e=d.lib.find(x=>x[0]===n);if(!e)return;const ns=nSets(e);total+=ns;done+=Math.min(S.sets[d.key+"|"+n]||0,ns);});
  const mm=l=>l.filter(x=>x[3]==="m").reduce((a,x)=>a+minsOf(x),0);
  const strong=p.reduce((a,n)=>{const e=d.lib.find(x=>x[0]===n);return a+(e&&isStrong(d.key,n)?nSets(e):0);},0),lift=Math.round(total*2+strong);
  return {p,total,done,lift,warm:mm(WARM[d.key]),cardio:mm(FIN[d.key]),mins:p.length?mm(WARM[d.key])+lift+mm(FIN[d.key]):0};}

// ---------- shared UI ----------
function rings(items){const R=[54,39,24];
  const svg=`<svg viewBox="0 0 122 122" aria-hidden="true">${items.map((it,i)=>{const r=R[i],C=2*Math.PI*r,f=Math.max(0,Math.min(1,it[2]?it[1]/it[2]:0));
    return `<circle cx="61" cy="61" r="${r}" style="stroke:color-mix(in srgb,var(${it[4]}) 22%,transparent)"/><circle class="val" cx="61" cy="61" r="${r}" style="stroke:var(${it[4]})" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C*(1-f)).toFixed(2)}"/>`}).join("")}</svg>`;
  return `<div class="sumrow"><div class="rings">${svg}</div><div class="legend">${items.map(it=>`<div class="lg"><div class="k">${it[0]}</div><div class="v" style="color:var(${it[4]})">${it[1]}<small>/${it[2]} ${it[3]}</small></div></div>`).join("")}</div></div>`;}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),2000)}
const emptyCell=(title,text)=>`<div class="empty"><b>${title}</b>${text}</div>`;

// bar chart: vals (null = no data), labels, optional goal line
function barChart(vals,labels,goal,c,fmt=v=>v){const W=320,H=136,T=16,B=22,L=4,Rr=34;
  const data=vals.filter(v=>v!=null);const max=Math.max(goal||0,...data,1)*1.12;const ih=H-T-B,bw=(W-L-Rr)/vals.length;
  const y=v=>T+ih-(v/max)*ih;
  let s=`<svg class="cv" viewBox="0 0 ${W} ${H}" role="img">`;
  s+=`<line x1="${L}" x2="${W-Rr}" y1="${T+ih}" y2="${T+ih}" style="stroke:var(--sep)" stroke-width="1"/>`;
  if(goal){s+=`<line x1="${L}" x2="${W-Rr}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}" style="stroke:var(--label3)" stroke-width="1" stroke-dasharray="3 3"/><text x="${W-Rr+5}" y="${(y(goal)+4).toFixed(1)}">${fmt(goal)}</text>`;}
  vals.forEach((v,i)=>{const x=L+i*bw+bw*.2,w=bw*.6;
    if(v!=null&&v>0){const h=Math.max(3,(v/max)*ih);s+=`<rect x="${x.toFixed(1)}" y="${(T+ih-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(5,w/2).toFixed(1)}" style="fill:${goal&&v>=goal?`var(${c})`:`color-mix(in srgb,var(${c}) 62%,transparent)`}"/>`;}
    else s+=`<rect x="${x.toFixed(1)}" y="${T+ih-3}" width="${w.toFixed(1)}" height="3" rx="1.5" style="fill:var(--fill2)"/>`;
    s+=`<text x="${(x+w/2).toFixed(1)}" y="${H-6}" text-anchor="middle">${labels[i]}</text>`;});
  return s+`</svg>`;}
// line chart: points [{x:index,v}], n = slots, first/last labels
function lineChart(pts,n,labels,c,fmt=v=>v){const W=320,H=136,T=16,B=22,L=4,Rr=40;
  if(!pts.length)return"";const vs=pts.map(p=>p.v);let lo=Math.min(...vs),hi=Math.max(...vs);if(hi-lo<1){lo-=1;hi+=1;}const pad=(hi-lo)*.15;lo-=pad;hi+=pad;
  const ih=H-T-B,X=i=>L+(n<=1?0.5:(i/(n-1)))*(W-L-Rr),Y=v=>T+ih-((v-lo)/(hi-lo))*ih;
  const mx=Math.max(...vs),mn=Math.min(...vs);
  let s=`<svg class="cv" viewBox="0 0 ${W} ${H}" role="img">`;
  [mx,mn].filter((v,i,a)=>a.indexOf(v)===i).forEach(v=>{s+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" style="stroke:var(--sep)" stroke-width="1" stroke-dasharray="2 3"/><text x="${W-Rr+5}" y="${(Y(v)+4).toFixed(1)}">${fmt(v)}</text>`;});
  if(pts.length>1){const d=pts.map((p,i)=>`${i?"L":"M"}${X(p.x).toFixed(1)} ${Y(p.v).toFixed(1)}`).join("");
    const area=d+`L${X(pts[pts.length-1].x).toFixed(1)} ${T+ih}L${X(pts[0].x).toFixed(1)} ${T+ih}Z`;
    s+=`<path d="${area}" style="fill:color-mix(in srgb,var(${c}) 14%,transparent)"/><path d="${d}" style="fill:none;stroke:var(${c})" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;}
  pts.forEach((p,i)=>{const last=i===pts.length-1;s+=`<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${last?4.5:2.6}" style="fill:${last?`var(${c})`:"var(--cell)"};stroke:var(${c})" stroke-width="${last?2.5:1.8}"/>`;});
  s+=`<text x="${L}" y="${H-6}">${labels[0]}</text><text x="${W-Rr}" y="${H-6}" text-anchor="end">${labels[1]}</text>`;
  return s+`</svg>`;}

// ---------- appearance + menu + sheets ----------
const sysDark=()=>{const h=document.documentElement.getAttribute("data-theme");return h?h==="dark":matchMedia("(prefers-color-scheme: dark)").matches;};
function applyLook(){const L=S.look||"auto",root=document.documentElement;
  if(L==="auto")root.removeAttribute("data-look");else root.setAttribute("data-look",L);
  const col={light:"#f2f2f7",dark:"#000000"};
  $$('meta[name="theme-color"]').forEach((m,i)=>m.setAttribute("content",L==="auto"?(i===0?"#f2f2f7":"#000000"):col[L]));}
// accent colour: S.accent={c:[[h,l],[h,l]],fade,sel}; no S.accent = default red
const hsl=([h,l])=>`hsl(${Math.round(h)} 100% ${Math.round(l)}%)`;
function hex([h,l]){l/=100;const a=Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0");};return ("#"+f(0)+f(8)+f(4)).toUpperCase();}
function applyAccent(){const r=document.documentElement.style,A=S.accent;
  if(!A){r.removeProperty("--accent");r.removeProperty("--accent-fill");return;}
  r.setProperty("--accent",hsl(A.c[0]));
  if(A.fade)r.setProperty("--accent-fill",`linear-gradient(135deg,${hsl(A.c[0])},${hsl(A.c[1])})`);else r.removeProperty("--accent-fill");}
const PHOK={};let phT=0;
Object.values(PH).forEach(u=>{const i=new Image();i.onload=()=>{PHOK[u]=1;clearTimeout(phT);phT=setTimeout(renderAll,60);};i.src=u;});
// ===== In-app video player (Phase 3) =====
let VID=null;
const ytId=x=>{x=(x||"").trim();const m=x.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live|v)\/)([\w-]{11})/);if(m)return {id:m[1],sh:/\/shorts\//.test(x)};return /^[\w-]{11}$/.test(x)?{id:x,sh:false}:null;};
const vidOf=n=>S.vids[n]||(S.defVids?DEFVID[n]:null)||null;
function openVid(n,q){VID={n,q};renderVid();openSheet("vid");}
function renderVid(){const {n,q}=VID,v=vidOf(n),own=!!S.vids[n],def=S.defVids&&DEFVID[n];
  $("vidBody").innerHTML=(v?`<div class="vframe${v.sh?" sh":""}"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?playsinline=1&autoplay=1&rel=0" title="${esc(n)} video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    <button type="button" class="vmore" id="vidMore" aria-label="Video options" aria-expanded="false"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18.5" cy="12" r="2"/></svg></button>`:"")
  +`<div class="vopts${v?"":" show"}" id="vidOpts"><div class="vhd"><b>${esc(n)}</b><span>${v?(own?"Your video":"Default video"):"No video chosen yet"}</span></div>
    <div class="group"><a class="cell vlink" href="https://www.youtube.com/results?search_query=${encodeURIComponent(n+" "+q)}" target="_blank" rel="noopener"><span class="ct"><span class="t1">1. Find on YouTube</span><span class="t2">On the video you like, tap Share → Copy Link</span></span>${G.out}</a>
    <div class="cell vin"><input id="vidUrl" type="url" inputmode="url" placeholder="2. Paste the link here" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" class="vpaste" id="vidPaste">Paste</button></div></div>
    <div class="vbtn"><button type="button" class="big" id="vidSave">Use This Video</button></div>
    ${own?`<div class="group vbtn"><button type="button" class="cell danger" id="vidDel">${def?"Back to Default Video":"Remove My Video"}</button></div>`:""}
    <div class="group vbtn"><button type="button" class="cell" id="vidClose" style="justify-content:center">Close</button></div></div>`;}
function openSheet(id){closeMenu();$(id).classList.add("open");$("scrim").classList.add("open");document.body.style.overflow="hidden";}
function closeSheets(){["sheet","settings","form","alts","vid"].forEach(id=>$(id).classList.remove("open"));$("vidBody").innerHTML="";$("scrim").classList.remove("open");document.body.style.overflow="";}
const openLib=()=>openSheet("sheet");
const G_BOOKS=sv('<path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h1A1.5 1.5 0 0 1 9 5.5V20M9 20V8.5A1.5 1.5 0 0 1 10.5 7h1A1.5 1.5 0 0 1 13 8.5V20M14.6 8.6l1.5-.4a1.5 1.5 0 0 1 1.8 1l2.8 10M3.5 20h17"/>');
const G_GEAR=sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',{w:1.8});
function openMenu(btn){const scr=screenName();
  const items=scr==="day"?[["lib","Exercise Library",G_BOOKS],["shuffle","Shuffle Workout",G.shuffle],["mine","Reset to My Plan",G.reset]]
    :[["logact","Log Activity",G.band],["checkup","Add Checkup Results",G.flask],["weight","Log Weight",G.scale],["report","Copy Report for Claude",G.sparkle]];
  $("menu").innerHTML=items.map(([k,n,ic])=>`<button role="menuitem" data-menu="${k}">${n}${ic}</button>`).join("")+`<div class="gap" role="separator"></div><button role="menuitem" data-menu="settings">Settings${G_GEAR}</button>`;
  const r=btn.getBoundingClientRect(),m=$("menu");m.style.top=(r.bottom+8)+"px";m.style.right=Math.max(16,innerWidth-r.right)+"px";m.classList.add("open");$("mscrim").classList.add("open");}
function closeMenu(){$("menu").classList.remove("open");$("mscrim").classList.remove("open");}

// ---------- generic form sheet ----------
let FORM=null;
function openForm(cfg){FORM=cfg;$("formTitle").textContent=cfg.title;
  const v=cfg.values||{};
  const row=f=>f.type==="note"?`<textarea class="note" id="f_${f.k}" aria-label="${f.label}" placeholder="${esc(f.ph||"")}">${esc(v[f.k]??"")}</textarea>`
    :`<label class="cell field"><span class="t1">${f.label}</span><input id="f_${f.k}" type="${f.type||"number"}" ${f.type==="date"?`max="${today()}"`:`inputmode="decimal" step="any" placeholder="${esc(f.ph||"—")}"`} value="${esc(v[f.k]??"")}">${f.unit!=null?`<span class="u">${f.unit}</span>`:""}</label>`;
  let html="";(cfg.groups||[{fields:cfg.fields}]).forEach(g=>{html+=`${g.title?`<div class="lh">${g.title}</div>`:'<div style="height:14px"></div>'}<div class="group">${g.fields.map(row).join("")}</div>${g.foot?`<p class="lf">${g.foot}</p>`:""}`;});
  if(cfg.onDelete)html+=`<div style="height:26px"></div><div class="group"><button class="cell delrow" id="formDel">Delete</button></div>`;
  $("formBody").innerHTML=html;openSheet("form");}
function readForm(){const out={};$$("#formBody [id^=f_]").forEach(el=>{const k=el.id.slice(2);out[k]=el.type==="date"||el.tagName==="TEXTAREA"?el.value.trim():num(el.value);});return out;}

// ---------- routing ----------
const screenName=()=>S.tab==="workout"?(S.view!=null?"day":"workout"):S.tab;
const TABS=[["workout","Workout",G.dumbbell],["activity","Activity",G.run],["health","Health",G.pulse],["insights","Insights",G.sparkle]];
const TAB_TINT={activity:"--green",health:"--pink",insights:"--indigo"};
function renderAll(){
  const scr=screenName();
  ["workout","day","activity","health","insights"].forEach(n=>{$("scr-"+n).hidden=n!==scr;});
  const tint=scr==="day"?D().color:scr==="workout"?DAYS[S.day].color:TAB_TINT[scr],root=document.documentElement;
  root.style.setProperty("--day",`var(${tint})`);root.dataset.scr=scr;
  const hero=ph(scr==="day"?DAYPH[D().key]:SCRPH[scr]);
  if(hero){$("hero").style.setProperty("--hero",`url(${hero})`);root.dataset.hero="";}else root.removeAttribute("data-hero");
  const dateTxt=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
  $$("[data-date]").forEach(e=>e.textContent=dateTxt);
  $$("[data-streak]").forEach(e=>{e.innerHTML=`${G.flame}<b>${S.count}</b>`;e.setAttribute("aria-label",`${S.count} workouts completed`);});
  $("navTitle").textContent=scr==="day"?`${dname(D())}`:$("scr-"+scr).dataset.title;
  $$(".bback").forEach(b=>b.hidden=scr!=="day");
  $("nav").innerHTML=TABS.map(([k,n,ic])=>`<button class="${S.tab===k?"on":""}" data-tab="${k}" style="--c:var(--tint)" ${S.tab===k?'aria-current="page"':""}>${ic}${n}</button>`).join("");
  ({workout:renderHome,day:renderDay,activity:renderActivity,health:renderHealth,insights:renderInsights})[scr]();
  onScroll();save();
}

// ---------- 1 · workout home ----------
function renderHome(){
  const n=HABITS.filter(h=>S.daily?.d===today()&&S.daily.h[h[0]]).length;
  $("homeSum").innerHTML=rings([["Workouts",weekSessions(),4,"THIS WEEK","--tint"],["Cardio",weekCardio(),150,"MIN","--ring2"],["Habits",n,HABITS.length,"TODAY","--ring3"]])
    +`<div class="sumfoot"><span>Up next</span><span><b>Day ${S.day+1} · ${dname(DAYS[S.day])}</b></span></div>`;
  $("progName").textContent=PROGRAMS[S.prog].name;$("days").classList.toggle("n3",DAYS.length===3);
  $("days").innerHTML=DAYS.map((d,i)=>{const st=dayStats(d),last=[...S.sessions].reverse().find(x=>x.k===d.key),prog=st.done&&st.done<st.total?` · ${st.done}/${st.total} done`:"";
    const im=ph(DAYPH[d.key],true);
    return `<button class="dcard ${i===S.day?"next":""} ${im?"ph":""}" data-open="${i}" style="--c:var(${d.color})${im?`;--img:url(${im})`:""}" aria-label="Day ${i+1}, ${dname(d)}${i===S.day?", up next":""}">
      ${i===S.day?'<span class="badge">Up next</span>':""}<span class="dic">${G.tab[d.icon]}</span><span class="dn">Day ${i+1}</span><span class="dt">${dname(d)}</span>
      <span class="dm">${st.p.length} exercises · ~${st.mins} min${prog}<br>${last?`Last done ${fmtD(last.d)}`:"Not done yet"}</span></button>`;}).join("");
  const rec=[...S.sessions].reverse().slice(0,6);
  $("recent").innerHTML=rec.length?rec.map(x=>{const d=dayByKey(x.k);if(!d)return"";return `<div class="cell" style="--inset:58px"><span class="itile" style="--ic:var(${d.color})">${G.tab[d.icon]}</span><span class="ct"><span class="t1">${dname(d)}</span><span class="t2">${x.done}/${x.total} sets${x.cm?` · ${x.cm} min cardio`:""}</span></span><span class="acc">${fmtD(x.d,{day:"numeric",month:"short"})}</span></div>`}).join("")
    :emptyCell("No workouts yet","Finished workouts will show here.");
}

// ---------- 1b · day detail ----------
function renderDay(){
  const d=D(),p=plan(),k=d.key;
  $("title").textContent=`${dname(d)}`;
  $("dayno").textContent=`Day ${S.view+1} of ${DAYS.length} · ${d.tag}${S.view===S.day?" · Up next":""}`;
  const rows=(id,list)=>list.map((w,i)=>{const ck=k+id+i;return `<label class="cell chk"><input type="checkbox" class="circ" id="c-${ck}" data-ck="${ck}" ${S.checks[ck]?"checked":""}><span class="ct"><span class="t1">${esc(w[0])}</span><span class="t2">${tierTag(w[3])}${esc(w[1])}</span></span><span class="acc">${esc(w[2])}</span>${play(w[0],id==="w"?"warm up how to":"workout",true)}</label>`}).join("");
  $("warm").innerHTML=rows("w",WARM[k]);$("fin").innerHTML=rows("f",FIN[k]);
  let total=0,done=0;
  $("plan").innerHTML=p.length?p.map((n,i)=>{const e=find(n);if(!e)return"";const ns=nSets(e),sk=k+"|"+n,dn=Math.min(S.sets[sk]||0,ns);total+=ns;done+=dn;
    const ess=isEss(k,n),tr=tierOf(k,n),complete=dn===ns;
    const lead=S.edit?(ess?`<span class="lockg" title="Must-do exercises stay in your plan">${G.lock}</span>`:`<button class="del" data-rm="${esc(n)}" aria-label="Remove ${esc(n)}">${G.minus}</button>`):"";
    return `<article class="ex ${complete?"done":""}"><div class="exh">${lead}<span class="tile" aria-hidden="true">${complete?G.check:i+1}</span>
      <div class="ct"><span class="t1">${esc(n)}</span><span class="t2">${tierTag(tr)}${esc(e[3])} · ${esc(areaOf(k,n))}</span>${exNotes(k,n,p)}</div><button class="altb" data-alt="${esc(n)}" aria-label="Alternatives for ${esc(n)}">${G.swap}</button>${play(n,undefined,false,ph(GRPPH[e[1]]||DAYPH[k],true))}</div>
      <div class="sets">${Array.from({length:ns},(_,j)=>`<button class="set ${j<dn?"on":""}" data-set="${esc(n)}" data-i="${j}" aria-label="Set ${j+1}${j<dn?", done":""}">${j+1}</button>`).join("")}
      <label class="kg"><input id="w-${k}-${i}" inputmode="decimal" placeholder="0" data-wt="${esc(n)}" value="${esc(S.wts[sk]||"")}" aria-label="Weight for ${esc(n)}"><span>kg</span></label></div></article>`}).join("")
    :`<div class="group">${emptyCell("No Exercises","Tap Shuffle Workout or Add Exercise.")}</div>`;
  const miss=missing(),areas=Object.keys(AREAS[k]),cnt=t=>p.filter(n=>tierOf(k,n)===t).length;
  $("cover").innerHTML=`<div class="cell"><div class="ct"><span class="t1">Muscle Coverage</span><span class="t2">${cnt("m")} must-do · ${cnt("r")} recommended · ${cnt("o")} optional</span></div>
      ${miss.length?`<span class="acc">${areas.length-miss.length} of ${areas.length}</span>`:`<span class="acc ok">${G.check}All ${areas.length}</span>`}</div>
    <div class="areas">${areas.map(a=>`<span class="chip ${miss.includes(a)?"miss":"hit"}">${miss.includes(a)?"":G.check}${esc(a)}</span>`).join("")}</div>
    ${miss.length?(p.length<MAX?`<button class="cell action" id="fill">${G.addRow}<span class="lbl">Fill Gaps</span></button>`:`<div class="cell"><span class="t2">Remove an extra exercise to cover the missing area.</span></div>`):""}`;
  $("actions").innerHTML=`<button class="cell action" id="addBtn">${G.addRow}<span class="lbl">Add Exercise</span><span class="acc">${p.length} of ${MAX}</span></button>
    <button class="cell action" id="auto">${G.shuffle}<span class="lbl">Shuffle Workout</span></button>
    <button class="cell action" id="mine">${G.reset}<span class="lbl">Reset to My Plan</span></button>`;
  $("edit").textContent=S.edit?"Done":"Edit";$("edit").style.fontWeight=S.edit?"600":"400";
  const warmDone=WARM[k].filter((_,i)=>S.checks[k+"w"+i]).length;
  const ds0=dayStats(d),mins=ds0.mins;
  $("daySum").innerHTML=rings([["Sets",done,total,"SETS","--tint"],["Cardio",cardioPending(k),cardioGoal(k),"MIN","--ring2"],["Warm-up",warmDone,WARM[k].length,"DONE","--ring3"]])
    +`<div class="sumfoot"><span>Warm-up <b>${ds0.warm}</b></span><span>Lifting <b>~${ds0.lift}</b></span><span>Cardio <b>${ds0.cardio}</b></span><span style="${mins>65?"color:var(--orange)":""}">= <b>${mins}</b> min</span></div>${mins>65?`<p class="gf" style="padding:0;color:var(--orange)">Longer than an hour. Short on time? Skip an optional exercise or cut the walk to 10 minutes.</p>`:""}`;
  $("warmMin").textContent=ds0.warm+" min";$("cardMin").textContent=ds0.cardio+" min";
  $("cardNote").textContent=(S.prog==="ul"?"After every session: a steady incline walk. On rest days, a 30-minute brisk walk. ":"Intervals and steady Zone 2 walking both help heart health and fat loss. ")+"Keep any intervals at 70–80% effort until your doctor clears you for harder work. Stop if you feel chest pain, dizziness or unusual breathlessness.";
  const last=[...S.sessions].reverse().find(x=>x.k===k);
  $("last").textContent=last?`Last time: ${fmtD(last.d)}, ${last.done}/${last.total} sets.`:"Completing saves your sets, weights and cardio.";
  renderLib();
}

function renderLib(){
  if(S.view==null)return;
  const d=D(),p=plan(),q=($("q").value||"").toLowerCase().trim();
  const groups=["All",...d.groups];if(!groups.includes(S.filter))S.filter="All";
  $("libSub").textContent=`${p.length} of ${MAX} selected`;
  $("filters").innerHTML=groups.map(g=>`<button class="${g===S.filter?"on":""}" data-f="${esc(g)}" role="tab" aria-selected="${g===S.filter}">${esc(g)}</button>`).join("");
  const pool=d.lib.filter(e=>(S.filter==="All"||e[1]===S.filter)&&(!q||e[0].toLowerCase().includes(q)||e[2].toLowerCase().includes(q)||areaOf(d.key,e[0]).toLowerCase().includes(q)));
  const note={m:"Always in your workout. These can't be removed.",r:"The best picks for your free slots.",o:"Extra variety when you want it."};
  $("lib").innerHTML=["m","r","o"].map(t=>{const items=pool.filter(e=>tierOf(d.key,e[0])===t);if(!items.length)return"";
    return `<div class="lh">${t==="m"?G.star:""}${TIERS[t]} · ${items.length}</div><div class="group">${items.map(e=>{const inn=p.includes(e[0]),ess=t==="m";
      return `<div class="cell lib"><div class="ct"><span class="t1">${esc(e[0])}</span><span class="t2">${esc(areaOf(d.key,e[0]))} · ${esc(e[2])} · ${esc(e[3])}</span></div>${play(e[0],"proper form",true)}${ess?`<span class="lockg" aria-label="Locked in">${G.lock}</span>`:`<button class="addc ${inn?"in":""}" data-add="${esc(e[0])}" aria-label="${inn?"Remove":"Add"} ${esc(e[0])}">${inn?G.checkc:G.plusc}</button>`}</div>`}).join("")}</div><p class="lf">${note[t]}</p>`}).join("")
    ||emptyCell("No Results","Try a different name, muscle or equipment.");
}

function completeWorkout(){
  const d=D(),k=d.key,p=plan();let done=0,total=0;const w={};
  p.forEach(n=>{const e=find(n);if(!e)return;const ns=nSets(e);total+=ns;done+=Math.min(S.sets[k+"|"+n]||0,ns);const kg=num(S.wts[k+"|"+n]);if(kg)w[n]=kg;});
  const cm=cardioPending(k);
  if(cm){S.log=S.log.filter(x=>x.d>=daysAgo(60));S.log.push({d:today(),m:cm});}
  const st=S.started&&S.started.k===k&&Date.now()-S.started.t<6*36e5?Math.round((Date.now()-S.started.t)/6e4):null;S.started=null;
  S.sessions.push({d:today(),k,done,total,cm,w,...(st?{mins:st}:{})});if(S.sessions.length>500)S.sessions=S.sessions.slice(-500);
  S.last=`${dname(d)}, ${fmtD(today())}`;S.count++;clearProgress(k);S.day=(S.view+1)%DAYS.length;S.nextBy[S.prog]=S.day;S.view=null;S.edit=false;stopRest();
  renderAll();scrollTo({top:0});toast(`Workout saved. Next: ${DAYS[S.day].name[0]}`);}

// ---------- 2 · activity ----------
const MET=[
  {k:"steps",n:"Steps",u:"",goal:10000,c:"--orange",ic:G.walk,f:v=>Math.round(v).toLocaleString()},
  {k:"azm",n:"Zone Minutes",u:"min",goal:22,c:"--green",ic:G.bolt,f:v=>Math.round(v)},
  {k:"rhr",n:"Resting Heart Rate",u:"bpm",c:"--red",ic:G.heart,f:v=>Math.round(v)},
  {k:"sleep",n:"Sleep",u:"h",goal:7.5,c:"--indigo",ic:G.moon,f:v=>r1(v)},
  {k:"hrv",n:"HRV",u:"ms",c:"--cyan",ic:G.wave,f:v=>Math.round(v)},
  {k:"kcal",n:"Calories",u:"kcal",c:"--pink",ic:G.flame,f:v=>Math.round(v).toLocaleString()}];
const actDay=d=>({...(S.act[d]||{}),...ghAct(d)}); // Google values win; your manual entries are kept and fill any gaps
function lastN(k,n){return Array.from({length:n},(_,i)=>{const d=daysAgo(n-1-i);return {d,v:num(actDay(d)[k])};});}
const avg=a=>{const v=a.filter(x=>x!=null);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null;};
function openActForm(date=today()){
  const fields=[{k:"date",label:"Date",type:"date"},...MET.map(m=>({k:m.k,label:m.n,unit:m.u||"steps"}))];
  openForm({title:"Log Activity",groups:[{fields,foot:"Copy these from the Today screen of the Google Health app. Leave anything blank you don't have."}],values:{date,...actDay(date)},
    onSave(v){const d=v.date||today();const rec={};MET.forEach(m=>{if(v[m.k]!=null)rec[m.k]=v[m.k];});if(Object.keys(rec).length)S.act[d]=rec;else delete S.act[d];toast("Activity saved");},
    onDate(d){MET.forEach(m=>{$("f_"+m.k).value=actDay(d)[m.k]??"";});}});}
function renderActivity(){
  const t=actDay(today()),hasToday=Object.keys(t).length>0,latestD=[...Object.keys(S.act),...Object.keys(HD.days)].sort().pop();
  const lab7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return "SMTWTFS"[d.getDay()];});
  const steps7=lastN("steps",7),sleep7=lastN("sleep",7),rhr30=lastN("rhr",30).map((p,i)=>({x:i,v:p.v})).filter(p=>p.v!=null);
  const n=HABITS.filter(h=>S.daily?.d===today()&&S.daily.h[h[0]]).length;
  if(!S.daily||S.daily.d!==today())S.daily={d:today(),h:{}};
  $("actBody").innerHTML=`
  <section class="summary" aria-label="Today's activity">${rings([["Move",num(t.azm)||0,22,"ZONE MIN","--tint"],["Cardio",weekCardio(),150,"MIN","--ring2"],["Steps",num(t.steps)||0,10000,"STEPS","--orange"]])}<div class="sumfoot"><span>Fitbit Air</span><span>${hdFoot()||`<b>${latestD?`Last logged ${fmtD(latestD)}`:"Not logged yet"}</b>`}</span></div></section>
  ${hdActivity()}
  <div class="group"><div class="cell" style="--inset:58px"><span class="itile" style="--ic:var(--label2)">${G.band}</span><span class="ct"><span class="t1">Fitbit Air</span><span class="t2">${latestD?`Last logged ${fmtD(latestD)}`:"Not logged yet"}</span></span><span class="st info">${HD.at?"Google":"Manual"}</span></div>
    <button class="cell action" data-logact>${G.addRow}<span class="lbl">${hasToday?"Edit Today's Numbers":"Log Today's Numbers"}</span></button></div>
  <section class="sec"><div class="sh"><h2>Cardio Log</h2><span class="hacc">${weekCardio()} of 150 min this week</span></div>
    <div class="group">${(()=>{const c=[...S.sessions].reverse().filter(x=>x.cm).slice(0,5);return c.length?c.map(x=>{const d=dayByKey(x.k);return `<div class="cell" style="--inset:58px"><span class="itile" style="--ic:var(--ring2)">${G.run}</span><span class="ct"><span class="t1">${x.cm} min cardio</span><span class="t2">After ${d?dname(d):"workout"}</span></span><span class="acc">${fmtD(x.d,{day:"numeric",month:"short"})}</span></div>`}).join(""):emptyCell("No cardio yet","Cardio you finish after a workout shows here.");})()}</div></section>
  <section class="sec"><div class="sh"><h2>Trends</h2></div>
    ${steps7.some(p=>p.v!=null)?`<div class="chart"><div class="chh"><b>Steps</b><span>avg ${Math.round(avg(steps7.map(p=>p.v))).toLocaleString()}</span></div>${barChart(steps7.map(p=>p.v),lab7,10000,"--orange",v=>v>=1000?Math.round(v/1000)+"k":v)}</div>`:""}
    ${rhr30.length?`<div class="chart"><div class="chh"><b>Resting Heart Rate</b><span>${rhr30.length>1?`${rhr30[rhr30.length-1].v-rhr30[0].v>0?"+":""}${rhr30[rhr30.length-1].v-rhr30[0].v} bpm in 30 days`:`${rhr30[0].v} bpm`}</span></div>${lineChart(rhr30,30,["30 days ago","Today"],"--red",v=>Math.round(v))}</div>`:""}
    ${sleep7.some(p=>p.v!=null)?`<div class="chart"><div class="chh"><b>Sleep</b><span>avg ${r1(avg(sleep7.map(p=>p.v)))} h</span></div>${barChart(sleep7.map(p=>p.v),lab7,7.5,"--indigo",v=>r1(v)+"h")}</div>`:""}
    ${!steps7.some(p=>p.v!=null)&&!rhr30.length&&!sleep7.some(p=>p.v!=null)?`<div class="group">${emptyCell("No trends yet","Log your Fitbit Air numbers for a few days to see steps, resting heart rate and sleep charts.")}</div>`:""}
    <p class="gf">Resting heart rate slowly dropping over weeks is one of the clearest signs your heart health is improving.</p></section>
  <section class="sec"><div class="sh"><h2>Daily Habits</h2><span class="hacc">${n} of ${HABITS.length}</span></div>
    <div class="habchips">${HABITS.map(h=>{const on=!!S.daily.h[h[0]];return `<button class="hchip ${on?"on":""}" data-habit="${h[0]}" role="checkbox" aria-checked="${on}" style="--ic:var(${h[2]})">${on?G.check:h[3]}${esc(h[1])}</button>`}).join("")}</div>
    <p class="gf">These reset every morning. Fat loss comes mostly from food, steps and sleep.</p></section>`;
}

// ---------- 3 · health ----------
const MARK=[
  {k:"tc",n:"Total cholesterol",u:"mmol/L",t:"Target under 5.5",s:v=>v<5.5?"ok":v<=6.5?"watch":"high"},
  {k:"ldl",n:"LDL cholesterol",u:"mmol/L",t:"Target under 3.0",s:v=>v<3?"ok":v<=4?"watch":"high"},
  {k:"hdl",n:"HDL cholesterol",u:"mmol/L",t:"Target 1.0 or higher",s:v=>v>=1?"ok":"watch"},
  {k:"tg",n:"Triglycerides",u:"mmol/L",t:"Target under 1.7",s:v=>v<1.7?"ok":v<=2.3?"watch":"high"},
  {k:"glu",n:"Fasting glucose",u:"mmol/L",t:"Target under 5.6",s:v=>v<5.6?"ok":v<7?"watch":"high"},
  {k:"a1c",n:"HbA1c",u:"%",t:"Target under 5.7",s:v=>v<5.7?"ok":v<6.5?"watch":"high"}];
const bpStatus=(s,d)=>s>=140||d>=90?"high":s>=120||d>=80?"watch":"ok";
const STL={ok:"In range",watch:"Borderline",high:"High"};
const sortD=a=>[...a].sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:0);
function openCheckupForm(rec){
  openForm({title:rec?"Checkup":"Add Checkup",values:rec||{d:today()},
    groups:[{fields:[{k:"d",label:"Test date",type:"date"}]},
      {title:"Cholesterol",fields:[{k:"tc",label:"Total",unit:"mmol/L"},{k:"ldl",label:"LDL",unit:"mmol/L"},{k:"hdl",label:"HDL",unit:"mmol/L"},{k:"tg",label:"Triglycerides",unit:"mmol/L"}]},
      {title:"Blood sugar",fields:[{k:"glu",label:"Fasting glucose",unit:"mmol/L"},{k:"a1c",label:"HbA1c",unit:"%"}]},
      {title:"Blood pressure",fields:[{k:"sys",label:"Systolic (top)",unit:"mmHg"},{k:"dia",label:"Diastolic (bottom)",unit:"mmHg"}],foot:"Fill in only what's on your report. Australian labs report cholesterol in mmol/L."},
      {title:"Notes",fields:[{k:"note",label:"Notes",type:"note",ph:"Doctor's comments, medication changes…"}]}],
    onSave(v){const r={id:rec?.id||uid(),d:v.d||today()};["tc","ldl","hdl","tg","glu","a1c","sys","dia"].forEach(k=>{if(v[k]!=null)r[k]=v[k];});if(v.note)r.note=v.note;
      S.checkups=S.checkups.filter(x=>x.id!==r.id);S.checkups.push(r);toast("Checkup saved");},
    onDelete:rec?()=>{S.checkups=S.checkups.filter(x=>x.id!==rec.id);toast("Checkup deleted");}:null});}
function openBodyForm(rec){
  const lastB=sortD(S.body).pop();
  openForm({title:rec?"Body Measurement":"Log Weight",values:rec||{d:today()},
    groups:[{fields:[{k:"d",label:"Date",type:"date"},{k:"kg",label:"Weight",unit:"kg",ph:lastB?.kg??"—"},{k:"waist",label:"Waist",unit:"cm",ph:lastB?.waist??"—"},{k:"bf",label:"Body fat",unit:"%",ph:lastB?.bf??"—"}],foot:"Weigh in the morning after the toilet, before eating, for the most consistent numbers."}],
    onSave(v){if(v.kg==null&&v.waist==null&&v.bf==null)return;const r={id:rec?.id||uid(),d:v.d||today()};["kg","waist","bf"].forEach(k=>{if(v[k]!=null)r[k]=v[k];});
      S.body=S.body.filter(x=>x.id!==r.id&&!(x.d===r.d&&!rec));S.body.push(r);toast("Saved");},
    onDelete:rec?()=>{S.body=S.body.filter(x=>x.id!==rec.id);toast("Deleted");}:null});}
function latestVal(list,k){const r=sortD(list).filter(x=>x[k]!=null);return r.length?{v:r[r.length-1][k],d:r[r.length-1].d,prev:r.length>1?r[r.length-2][k]:null,all:r}:null;}
function targets(){const w=latestVal(S.body,"kg")?.v,a=num(S.profile.age),h=num(S.profile.height);
  if(!w)return null;const bmr=h&&a?10*w+6.25*h-5*a+5:w*22;const kcal=Math.round((bmr*1.55-400)/50)*50;
  return {kcal,protein:Math.round(w*2/5)*5,fibre:30,water:r1(Math.min(3.5,Math.max(2.5,w*0.035))),w,estimated:!(h&&a)};}
const MEALS=[
  ["Breakfast",["Oats with Greek yoghurt, berries and chia seeds","Omelette (1 egg + 3 whites), spinach, wholegrain toast","Protein smoothie: milk, banana, oats, whey"],"25–35 g protein"],
  ["Lunch",["Grilled chicken, brown rice, big salad with olive oil","Tuna and bean salad with a wholegrain wrap","Lentil dal with chicken and vegetables"],"35–45 g protein"],
  ["Pre-workout snack",["Apple and 30 g almonds","Greek yoghurt and a banana","Hummus with carrots and 2 boiled eggs"],"10–20 g protein"],
  ["Dinner",["Baked salmon, sweet potato and broccoli","Lean beef stir-fry with vegetables and a little rice","Chicken tikka (yoghurt marinade), cauliflower rice, salad"],"35–45 g protein"],
  ["Evening (optional)",["Cottage cheese or a casein shake","Handful of walnuts and herbal tea","Skim milk with a spoon of peanut butter"],"10–25 g protein"]];
function renderHealth(){
  const t=actDay(today()),hasToday=Object.keys(t).length>0,sl=num(t.sleep);
  $("healthTop").innerHTML=`${hdSleepCard()||`<div class="card"><div class="chh"><b>Sleep</b><span>${sl!=null?`${r1(sl)} h`:"Not logged"}</span></div>
    <div class="stages" aria-hidden="true">${sl!=null?`<i style="flex:${sl};background:var(--indigo)"></i>`:""}</div>
    <span class="t2">${GH.url?"Sleep stages (deep, light, REM, awake) appear after your next Google Health sync.":"Connect Google Health in Settings to see sleep stages (deep, light, REM, awake)."}</span></div>`}
  <section class="sec"><div class="sh"><h2>Today</h2><span class="hacc">${hdFoot()||(hasToday?"From Fitbit Air":"Tap a tile to log")}</span></div>
    <div class="tiles">${MET.map(m=>{const v=num(t[m.k]);return `<button class="mt" data-logact style="--c:var(${m.c})"><span class="mk">${m.ic}${m.n}</span><span class="mv ${v==null?"none":""}">${v==null?"—":m.f(v)}${v!=null&&m.u?`<small>${m.u}</small>`:""}</span>${m.goal?`<span class="mg">Goal ${m.f(m.goal)}${m.u?" "+m.u:""}</span><span class="mbar"><i style="width:${v==null?0:Math.min(100,v/m.goal*100)}%"></i></span>`:`<span class="mg">${m.k==="rhr"?"Lower is fitter":m.k==="kcal"?"Burned today":"Higher means better recovery"}</span>`}</button>`}).join("")}${HD.at?hdTiles():""}</div></section>
  ${hdHeart()}`;
  $("hseg").innerHTML=[["vitals","Vitals"],["checkups","Checkups"],["diet","Diet"]].map(([k,n])=>`<button class="${S.hseg===k?"on":""}" data-hseg="${k}" role="tab" aria-selected="${S.hseg===k}">${n}</button>`).join("");
  S.hseg==="diet"?renderDiet():S.hseg==="vitals"?hdVitals():renderCheckups();}
function renderCheckups(){
  const cs=sortD(S.checkups),last=cs[cs.length-1];
  const rowM=(m,v,prev)=>{const s=m.s(v),ch=prev!=null?r1(v-prev):null;return `<div class="cell"><span class="ct"><span class="t1">${m.n}</span><span class="t2">${m.t}${ch?` · ${ch>0?"+":""}${ch} since last`:""}</span></span><span class="rv"><span class="val">${v}<small>${m.u}</small></span><span class="st ${s}">${STL[s]}</span></span></div>`;};
  let latest="";
  if(last){const prev=k=>{const r=cs.slice(0,-1).filter(x=>x[k]!=null);return r.length?r[r.length-1][k]:null;};
    latest=MARK.filter(m=>last[m.k]!=null).map(m=>rowM(m,last[m.k],prev(m.k))).join("")
      +(last.sys!=null&&last.dia!=null?(()=>{const s=bpStatus(last.sys,last.dia);return `<div class="cell"><span class="ct"><span class="t1">Blood pressure</span><span class="t2">Target under 120/80</span></span><span class="rv"><span class="val">${last.sys}/${last.dia}<small>mmHg</small></span><span class="st ${s}">${STL[s]}</span></span></div>`})():"")
      +(last.note?`<div class="cell"><span class="t2">${esc(last.note)}</span></div>`:"");}
  const ldl=cs.filter(x=>x.ldl!=null);
  const kg=latestVal(S.body,"kg"),wa=latestVal(S.body,"waist"),bf=latestVal(S.body,"bf");
  const bodyRow=(n,o,u)=>o?`<div class="cell"><span class="ct"><span class="t1">${n}</span><span class="t2">${fmtD(o.d)}${o.prev!=null?` · ${r1(o.v-o.prev)>0?"+":""}${r1(o.v-o.prev)} ${u} since last`:""}</span></span><span class="val">${o.v}<small>${u}</small></span></div>`:"";
  const kgPts=(kg?.all||[]).slice(-20);
  $("healthBody").innerHTML=`
  <section class="sec"><div class="sh"><h2>Latest Results</h2><span class="hacc">${last?fmtD(last.d,{day:"numeric",month:"short",year:"numeric"}):""}</span></div>
    <div class="group">${latest||emptyCell("No checkups yet","Add the numbers from your blood test and they'll be tracked here.")}<button class="cell action" data-checkup>${G.addRow}<span class="lbl">Add Checkup Results</span></button></div>
    <p class="gf">General targets for adults. Your doctor may set different ones based on your overall heart risk.</p></section>
  ${ldl.length>1?`<div class="chart"><div class="chh"><b>LDL Cholesterol</b><span>${r1(ldl[ldl.length-1].ldl-ldl[0].ldl)>0?"+":""}${r1(ldl[ldl.length-1].ldl-ldl[0].ldl)} mmol/L since ${fmtD(ldl[0].d,{month:"short",year:"numeric"})}</span></div>${lineChart(ldl.map((x,i)=>({x:i,v:x.ldl})),ldl.length,[fmtD(ldl[0].d,{month:"short",year:"2-digit"}),fmtD(ldl[ldl.length-1].d,{month:"short",year:"2-digit"})],"--pink",v=>r1(v))}</div>`:""}
  <section class="sec"><div class="sh"><h2>Body</h2></div>
    <div class="group">${bodyRow("Weight",kg,"kg")+bodyRow("Waist",wa,"cm")+bodyRow("Body fat",bf,"%")||emptyCell("No measurements yet","Log your weight once or twice a week.")}<button class="cell action" data-weight>${G.addRow}<span class="lbl">Log Weight</span></button></div>
    <p class="gf">Waist size is the best sign of chest and belly fat going down, even when weight changes slowly.</p></section>
  ${kgPts.length>1?`<div class="chart"><div class="chh"><b>Weight</b><span>${r1(kgPts[kgPts.length-1].kg-kgPts[0].kg)>0?"+":""}${r1(kgPts[kgPts.length-1].kg-kgPts[0].kg)} kg</span></div>${lineChart(kgPts.map((x,i)=>({x:i,v:x.kg})),kgPts.length,[fmtD(kgPts[0].d,{day:"numeric",month:"short"}),fmtD(kgPts[kgPts.length-1].d,{day:"numeric",month:"short"})],"--tint",v=>r1(v))}</div>`:""}
  ${cs.length?`<section class="sec"><div class="sh"><h2>History</h2></div><div class="group">${[...cs].reverse().map(x=>`<button class="cell" data-editcheck="${x.id}"><span class="ct"><span class="t1">${fmtD(x.d,{day:"numeric",month:"long",year:"numeric"})}</span><span class="t2">${[x.ldl!=null?`LDL ${x.ldl}`:"",x.tc!=null?`Total ${x.tc}`:"",x.sys!=null?`BP ${x.sys}/${x.dia??"–"}`:""].filter(Boolean).join(" · ")||"No values"}</span></span><span class="chev">${G.chevR}</span></button>`).join("")}</div></section>`:""}
  ${S.body.length?`<section class="sec"><div class="sh"><h2>Measurements</h2></div><div class="group">${sortD(S.body).reverse().slice(0,12).map(x=>`<button class="cell" data-editbody="${x.id}"><span class="ct"><span class="t1">${fmtD(x.d)}</span><span class="t2">${[x.kg!=null?x.kg+" kg":"",x.waist!=null?x.waist+" cm waist":"",x.bf!=null?x.bf+"% fat":""].filter(Boolean).join(" · ")}</span></span><span class="chev">${G.chevR}</span></button>`).join("")}</div></section>`:""}`;
}
function renderDiet(){
  const T=targets(),td=today(),pr=S.protein[td]||0,meals=S.meals[td]||{};
  const doy=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/864e5);
  const tile=(n,v,u,c,ic,g)=>`<div class="mt" style="--c:var(${c})"><span class="mk">${ic}${n}</span><span class="mv ${v==null?"none":""}">${v==null?"—":v}${v!=null?`<small>${u}</small>`:""}</span><span class="mg">${g}</span></div>`;
  $("healthBody").innerHTML=`
  <section class="sec"><div class="sh"><h2>Daily Targets</h2><span class="hacc">${T?`for ${T.w} kg`:""}</span></div>
    <div class="tiles">${tile("Calories",T?.kcal.toLocaleString(),"kcal","--orange",G.flame,"Small deficit for fat loss")}${tile("Protein",T?.protein,"g","--pink",G.fork,"Keeps muscle while cutting")}${tile("Fibre",30,"g","--green",G.leaf,"Helps lower LDL")}${tile("Water",T?.water??"2.5–3","L","--cyan",G.drop,"More on gym days")}</div>
    <p class="gf">${T?(T.estimated?"Add your age and height in ••• → Settings for a more accurate calorie target. ":"Based on your weight, height and age. ")+"Recalculated each time you log your weight.":"Log your weight in Checkups to personalise these targets."}</p></section>
  <section class="sec"><div class="sh"><h2>Protein Today</h2><span class="hacc">${pr} of ${T?.protein??"—"} g</span></div>
    <div class="card pcard"><div class="pbar"><i style="width:${T?Math.min(100,pr/T.protein*100):0}%"></i></div>
      <div class="qadd">${[10,20,30].map(g=>`<button data-prot="${g}">+${g} g</button>`).join("")}<button class="undo" data-prot="-10" aria-label="Remove 10 grams">−10</button></div></div>
    <p class="gf">Rough guide: 1 egg 6 g · 100 g chicken 31 g · 170 g Greek yoghurt 17 g · 1 scoop whey 24 g · 1 cup lentils 18 g.</p></section>
  <section class="sec"><div class="sh"><h2>Today's Meals</h2><span class="hacc">${Object.values(meals).filter(Boolean).length} of ${MEALS.length}</span></div>
    <div class="group">${MEALS.map((m,i)=>`<label class="cell chk"><input type="checkbox" class="circ" id="meal-${i}" data-meal="${i}" ${meals[i]?"checked":""}><span class="ct"><span class="t1">${m[0]}</span><span class="t2">${m[1][(doy+i)%m[1].length]}</span></span><span class="acc">${m[2].split(" ")[0]}</span></label>`).join("")}</div>
    <p class="gf">Suggestions change every day. Swap in any similar meal with the same protein.</p></section>
  <section class="sec"><div class="sh"><h2>For Your Cholesterol</h2></div>
    <div class="group"><div class="lh" style="margin:14px 16px 0;color:var(--green)">Eat more</div><ul class="list2"><li>Oats and barley</li><li>Beans, lentils and chickpeas</li><li>Nuts, especially almonds and walnuts</li><li>Oily fish like salmon or sardines, twice a week</li><li>Olive oil and avocado instead of butter</li><li>Vegetables and fruit at every meal</li></ul></div>
    <div class="group"><div class="lh" style="margin:14px 16px 0;color:var(--red)">Limit</div><ul class="list2"><li>Fried and fast food</li><li>Processed meat like sausages, bacon and salami</li><li>Butter, ghee, cream and coconut oil</li><li>Pastries, biscuits and sweets</li><li>Sugary drinks and alcohol</li></ul></div>
    <p class="gf">General guidance only. A dietitian can tailor a plan to your blood results.</p></section>`;
}

// ---------- 4 · insights ----------
function insights(){const out=[];const add=(ic,c,t,d,s)=>out.push({ic,c,t,d,s});
  const ws=weekSessions();add(G.dumbbell,"--red","Workouts this week",`${ws} of 4 done.${ws<4?` ${4-ws} to go.`:" Full week complete."}`,ws>=4?"ok":ws>=2?"info":"watch");
  const wc=weekCardio();add(G.heart,"--mint","Cardio this week",`${wc} of 150 minutes for heart health.`,wc>=150?"ok":wc>=90?"info":"watch");
  const st=avg(lastN("steps",7).map(p=>p.v));if(st!=null)add(G.walk,"--orange","Steps",`7-day average ${Math.round(st).toLocaleString()}. ${st>=8000?"Great for fat loss.":"Aim for 8,000–10,000 a day."}`,st>=8000?"ok":"watch");
  const rh=lastN("rhr",30).filter(p=>p.v!=null);if(rh.length>=2){const ch=rh[rh.length-1].v-rh[0].v;add(G.pulse,"--red","Resting heart rate",`${rh[rh.length-1].v} bpm, ${ch<0?`down ${-ch}`:ch>0?`up ${ch}`:"no change"} over ${rh.length} logged days.${ch<0?" Your heart is getting fitter.":""}`,ch<=0?"ok":"watch");}
  const sl=avg(lastN("sleep",7).map(p=>p.v));if(sl!=null)add(G.moon,"--indigo","Sleep",`7-day average ${r1(sl)} h. ${sl>=7?"Good for recovery and appetite control.":"Under 7 h makes fat loss harder."}`,sl>=7?"ok":"watch");
  const kg=sortD(S.body).filter(x=>x.kg!=null);if(kg.length>=2){const a=kg.find(x=>x.d>=daysAgo(60))||kg[0],b=kg[kg.length-1],ch=r1(b.kg-a.kg);add(G.scale,"--tint","Weight",`${b.kg} kg, ${ch<0?`down ${-ch}`:ch>0?`up ${ch}`:"no change"} kg since ${fmtD(a.d,{day:"numeric",month:"short"})}.`,ch<0?"ok":"info");}
  const wa=sortD(S.body).filter(x=>x.waist!=null);if(wa.length>=2){const ch=r1(wa[wa.length-1].waist-wa[0].waist);add(G.scale,"--orange","Waist",`${ch<0?`Down ${-ch}`:ch>0?`Up ${ch}`:"No change"} cm since you started measuring.`,ch<0?"ok":"info");}
  const cs=sortD(S.checkups).filter(x=>x.ldl!=null);if(cs.length){const l=cs[cs.length-1],s=MARK[1].s(l.ldl);add(G.flask,"--pink","LDL cholesterol",`${l.ldl} mmol/L on ${fmtD(l.d,{day:"numeric",month:"short",year:"numeric"})}${cs.length>1?`, ${r1(l.ldl-cs[cs.length-2].ldl)>0?"up":"down"} ${Math.abs(r1(l.ldl-cs[cs.length-2].ldl))} since the previous test`:""}.`,s);}
  const T=targets();if(T){const hit=Array.from({length:7},(_,i)=>(S.protein[daysAgo(i)]||0)>=T.protein).filter(Boolean).length;add(G.fork,"--pink","Protein",`Target hit on ${hit} of the last 7 days.`,hit>=5?"ok":"watch");}
  const firsts={},lasts={};S.sessions.forEach(x=>Object.entries(x.w||{}).forEach(([n,v])=>{if(firsts[n]==null)firsts[n]=v;lasts[n]=v;}));
  const gains=Object.keys(lasts).map(n=>({n,g:r1(lasts[n]-firsts[n])})).filter(x=>x.g>0).sort((a,b)=>b.g-a.g).slice(0,3);
  add(G.trend,"--green","Strength",gains.length?gains.map(x=>`${x.n} +${x.g} kg`).join(" · "):"Enter the kg you lift in each workout to track strength gains.",gains.length?"ok":"info");
  hdInsights(add);
  return out;}
function buildReport(question){const L=[],td=today(),p=S.profile;
  L.push("Please analyse my fitness and health data below and give me clear, specific advice.","");
  L.push("## About me",`- Male${p.age?`, ${p.age} years old`:""}${p.height?`, ${p.height} cm tall`:""}`,"- Goals: lose body fat (especially chest fat), build muscle, improve heart health and lower my cholesterol.",`- Report date: ${td}`,"");
  L.push(`## Training plan: ${PROGRAMS[S.prog].name} (run in order; about 1 hour: warm-up, lifting, cardio and stretching)`);
  DAYS.forEach((d,i)=>L.push(`- Day ${i+1} ${dname(d)}: ${planFor(d).map(n=>{const e=d.lib.find(x=>x[0]===n);return `${n} (${e?e[3]:""})`;}).join(", ")}`));
  L.push("","## Workouts completed (last 45 days)");const ss=S.sessions.filter(x=>x.d>=daysAgo(45));
  L.push(ss.length?ss.map(x=>`- ${x.d} ${dname(dayByKey(x.k)||{name:[x.k,""]})}: ${x.done}/${x.total} sets, ${x.cm} min cardio${Object.keys(x.w||{}).length?`; weights: ${Object.entries(x.w).map(([n,v])=>`${n} ${v} kg`).join(", ")}`:""}`).join("\n"):"- None logged yet");
  L.push("","## Fitbit Air activity (last 21 days)");const ad=[...new Set([...Object.keys(S.act),...Object.keys(HD.days)])].filter(d=>d>=daysAgo(21)&&d<=today()).sort();
  L.push(ad.length?["| Date | Steps | Zone min | Resting HR | Sleep h | HRV ms | Calories |","|---|---|---|---|---|---|---|",...ad.map(d=>{const a=actDay(d);return `| ${d} | ${a.steps??""} | ${a.azm??""} | ${a.rhr??""} | ${a.sleep??""} | ${a.hrv??""} | ${a.kcal??""} |`;})].join("\n"):"- None logged yet");
  L.push(...hdReport());
  L.push("","## Body measurements");L.push(S.body.length?sortD(S.body).slice(-15).map(x=>`- ${x.d}: ${[x.kg!=null?x.kg+" kg":"",x.waist!=null?"waist "+x.waist+" cm":"",x.bf!=null?"body fat "+x.bf+"%":""].filter(Boolean).join(", ")}`).join("\n"):"- None logged yet");
  L.push("","## Health checkups (cholesterol in mmol/L)");L.push(S.checkups.length?sortD(S.checkups).map(x=>`- ${x.d}: ${[x.tc!=null?`total ${x.tc}`:"",x.ldl!=null?`LDL ${x.ldl}`:"",x.hdl!=null?`HDL ${x.hdl}`:"",x.tg!=null?`triglycerides ${x.tg}`:"",x.glu!=null?`fasting glucose ${x.glu}`:"",x.a1c!=null?`HbA1c ${x.a1c}%`:"",x.sys!=null?`BP ${x.sys}/${x.dia??"?"}`:""].filter(Boolean).join(", ")}${x.note?` (note: ${x.note})`:""}`).join("\n"):"- None logged yet");
  const T=targets();L.push("","## Diet");if(T)L.push(`- Daily targets in the app: ${T.kcal} kcal, ${T.protein} g protein, 30 g fibre, ${T.water} L water`);
  const pd=Array.from({length:7},(_,i)=>daysAgo(i)).reverse();L.push(`- Protein logged last 7 days (g): ${pd.map(d=>S.protein[d]||0).join(", ")}`);
  L.push(`- Habits ticked today: ${HABITS.filter(h=>S.daily?.d===td&&S.daily.h[h[0]]).map(h=>h[1]).join(", ")||"none"}`);
  L.push("","## What I'd like",question?.trim()?question.trim():"Tell me what's going well, what to change in my training, cardio and diet over the next 4 weeks, and anything in my health numbers I should discuss with my doctor.");
  return L.join("\n");}
function renderInsights(){
  const ins=insights();
  $("insBody").innerHTML=`
  <section class="sec"><div class="sh"><h2>AI Analysis</h2></div>
    <div class="card"><div style="display:flex;gap:12px;align-items:flex-start"><span class="itile" style="--ic:var(--tint);flex:none">${G.sparkle}</span><span class="ct"><span class="t1">Ask Claude about your progress</span><span class="t2">Copy a full report of your workouts, Fitbit Air activity, checkups and diet, then paste it into Claude for a personal analysis.</span></span></div>
      <textarea class="ask" id="askQ" placeholder="Add a question (optional), e.g. Why isn't my chest fat going down?"></textarea>
      <div class="btns"><button class="big" id="copyReport" style="display:flex;align-items:center;justify-content:center;gap:6px">${G.copy}Copy Report</button><a class="btn2" href="https://claude.ai/new" target="_blank" rel="noopener">Open Claude${G.out}</a></div>
      <textarea class="ask" id="reportBox" readonly hidden style="min-height:220px;font-size:13px"></textarea></div>
    <p class="gf">Your data stays on this phone. Nothing is sent anywhere until you paste it yourself.</p></section>
  <section class="sec"><div class="sh"><h2>Quick Checks</h2><span class="hacc">Updated live</span></div>
    <div class="group">${ins.map(x=>`<div class="cell ins" style="--inset:58px"><span class="itile" style="--ic:var(${x.c})">${x.ic}</span><span class="ct"><span class="t1">${x.t}</span><span class="t2">${esc(x.d)}</span></span><span class="dot ${x.s}" aria-label="${x.s==="ok"?"On track":x.s==="watch"?"Needs attention":"Info"}"></span></div>`).join("")}</div>
    <p class="gf">Green is on track, orange needs attention. These are simple checks, not medical advice.</p></section>`;
}
async function copyReport(){const r=buildReport($("askQ")?.value);
  try{await navigator.clipboard.writeText(r);toast("Report copied. Paste it into Claude.");}
  catch(e){if(S.tab!=="insights"){S.tab="insights";S.view=null;renderAll();}const b=$("reportBox");b.hidden=false;b.value=r;b.focus();b.select();toast("Select all and copy the report");}}

// ---------- settings ----------
function accentUI(){const A=S.accent,c=A?A.c[A.sel||0]:[3,61];
  return `<div class="acp"><div class="acprev"><span class="acsw" aria-hidden="true"></span><span class="ct"><span class="t1">Preview</span><span class="achex" id="acHex">${A?hex(A.c[A.sel||0])+(A.ph?" · from photo":""):"Red (default)"}</span></span><span class="big" aria-hidden="true">Start</span></div>
    <div class="acbox" id="acBox" role="slider" aria-label="Accent colour" aria-valuetext="${A?hex(c):"Red"}"><i class="acknob" id="acKnob" style="left:${c[0]/360*100}%;top:${(90-c[1])/70*100}%;--knob:${hsl(c)}"></i></div></div>`;}
function pickAt(ev){const b=$("acBox").getBoundingClientRect(),x=Math.min(1,Math.max(0,(ev.clientX-b.left)/b.width)),y=Math.min(1,Math.max(0,(ev.clientY-b.top)/b.height));
  if(!S.accent)S.accent={c:[[3,61],[35,55]],fade:false,sel:0};const c=[x*360,90-y*70];S.accent.c[S.accent.sel||0]=c;delete S.accent.ph;
  const k=$("acKnob");k.style.left=x*100+"%";k.style.top=y*100+"%";k.style.setProperty("--knob",hsl(c));$("acHex").textContent=hex(c);applyAccent();}
document.addEventListener("pointerdown",ev=>{if(ev.target.id!=="acBox")return;ev.preventDefault();ev.target.setPointerCapture(ev.pointerId);pickAt(ev);});
document.addEventListener("pointermove",ev=>{if(ev.target.id==="acBox"&&ev.target.hasPointerCapture?.(ev.pointerId))pickAt(ev);});
document.addEventListener("pointerup",ev=>{if(ev.target.id==="acBox"){save();renderSettings();}});
function renderSettings(){
  const L=S.look||"auto",shown=L==="auto"?(sysDark()?"dark":"light"):L;
  const segRow=(label,key,vals)=>`<div class="cell"><span class="ct"><span class="t1">${label}</span></span><div class="seg sm" role="radiogroup" aria-label="${label}">${vals.map(v=>`<button class="${S.rest[key]===v?"on":""}" data-rest="${key}:${v}" role="radio" aria-checked="${S.rest[key]===v}">${v>=120?v/60+"m":v+"s"}</button>`).join("")}</div></div>`;
  $("setBody").innerHTML=`<div class="lh">Workout Type</div>
    <div class="group" role="radiogroup" aria-label="Workout type">${Object.entries(PROGRAMS).map(([k,p])=>`<button class="cell prog ${S.prog===k?"on":""}" data-prog="${k}" role="radio" aria-checked="${S.prog===k}"><span class="ct"><span class="t1">${p.name}</span><span class="t2">${p.sub}</span></span><span class="tick">${G.check}</span></button>`).join("")}</div>
    <p class="lf">Each program keeps its own exercises, weights and progress, so you can switch back any time.</p>
    <div class="lh">Appearance</div>
    <div class="group"><div class="looks" role="radiogroup" aria-label="Appearance">${[["light","Light"],["dark","Dark"]].map(([k,n])=>`<button class="look ${shown===k?"on":""}" data-lk="${k}" role="radio" aria-checked="${shown===k}"><span class="mini ${k}" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${n}</span><span class="lk-check" aria-hidden="true">${G.check}</span></button>`).join("")}</div>
    <label class="cell"><span class="ct"><span class="t1">Automatic</span></span><input type="checkbox" class="sw" id="autoLook" ${L==="auto"?"checked":""}></label></div>
    <p class="lf">Automatic switches between Light and Dark with your iPhone.</p>
    ${lookUI()}
    <div class="lh">Accent Colour</div>
    <div class="group">${accentUI()}
      <label class="cell"><span class="ct"><span class="t1">Fade</span><span class="t2">Blend two colours in buttons and fills</span></span><input type="checkbox" class="sw" id="acFade" ${S.accent?.fade?"checked":""}></label>
      ${S.accent?.fade?`<div class="cell"><span class="ct"><span class="t1">Editing</span></span><div class="seg sm" role="radiogroup" aria-label="Fade colour">${["Colour 1","Colour 2"].map((n,i)=>`<button class="${(S.accent.sel||0)===i?"on":""}" data-acsel="${i}" role="radio" aria-checked="${(S.accent.sel||0)===i}">${n}</button>`).join("")}</div></div>`:""}
      <button class="cell action" id="acReset" ${S.accent?"":"disabled style=\"opacity:.4\""}><span class="lbl">Reset to Red</span></button></div>
    <p class="lf">Drag in the box to pick any colour. Buttons, rings and ticks change as you drag.</p>
    <div class="lh">Profile</div>
    <div class="group"><label class="cell field"><span class="t1">Age</span><input type="number" inputmode="numeric" id="pAge" data-prof="age" value="${esc(S.profile.age??"")}" placeholder="—"><span class="u">years</span></label>
      <label class="cell field"><span class="t1">Height</span><input type="number" inputmode="numeric" id="pHeight" data-prof="height" value="${esc(S.profile.height??"")}" placeholder="—"><span class="u">cm</span></label></div>
    <p class="lf">Used for your calorie target and the report for Claude. Weight comes from Health → Body.</p>
    <div class="lh">Exercise Videos</div>
    <div class="group"><label class="cell"><span class="ct"><span class="t1">Default Videos</span><span class="t2">Play a ready-chosen video for must-do exercises you haven't set yourself</span></span><input type="checkbox" class="sw" id="defVids" ${S.defVids?"checked":""}></label></div>
    <p class="lf">Your own videos always come first. Choose one from any play button.</p>
    <div class="lh">Rest Timer</div>
    <div class="group">${segRow("Must-do lifts","main",[60,90,120])}${segRow("Other exercises","other",[45,60,90])}</div>
    <p class="lf">The timer starts by itself when you tick a set. Shorter rest keeps your heart rate up for fat loss.</p>
    ${ghUI()}${hdSettings()}
    <div class="lh">Data</div>
    <div class="group"><button class="cell" id="exportData"><span class="ct"><span class="t1">Export Backup</span><span class="t2">Save all your data as a file</span></span></button>
      <label class="cell"><span class="ct"><span class="t1">Import Backup</span><span class="t2">Restore from a backup file</span></span><input type="file" id="importFile" accept=".json,application/json" hidden></label></div>
    <p class="lf">Export a backup now and then and keep it in Files or iCloud Drive. Importing replaces what's on this device; the current data is kept as a safety copy first.${PERSIST?" Storage is protected on this device.":""}</p>
    <div style="height:14px"></div>
    <div class="group"><button class="cell danger" id="resetAll">${resetArm?"Tap Again to Erase Everything":"Reset All Progress"}</button></div>
    <p class="lf">Erases workouts, weights, activity, checkups and diet logs on this phone. Your plan goes back to the default.</p>
    <p class="ver">Four-Day Split · Version 1.4</p>`;}
function openSettings(){renderSettings();openSheet("settings");ghStatus();}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if($("settings").classList.contains("open"))renderSettings();});
new MutationObserver(()=>{if($("settings").classList.contains("open"))renderSettings();}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

// ---------- events ----------
document.addEventListener("click",ev=>{
  if(ev.target.id==="scrim"||ev.target.id==="vid")return closeSheets();
  if(ev.target.id==="mscrim")return closeMenu();
  const t=ev.target.closest("button");if(!t)return;
  const ds=t.dataset;
  if(ds.tab){if(S.tab===ds.tab&&S.view!=null){S.view=null;}else{S.tab=ds.tab;S.view=null;}S.edit=false;renderAll();scrollTo({top:0});return;}
  if(ds.open!==undefined){S.view=+ds.open;S.edit=false;$("q").value="";renderAll();scrollTo({top:0});return;}
  if(ds.back!==undefined){S.view=null;S.edit=false;stopRest();renderAll();scrollTo({top:0});return;}
  if(ds.more!==undefined){$("menu").classList.contains("open")?closeMenu():openMenu(t);return;}
  if(ds.menu){const m=ds.menu;closeMenu();
    if(m==="lib")openLib();else if(m==="shuffle")autoPick();else if(m==="mine"){S.plans[D().key]=[...DEFAULT[D().key]];delete S.swaps[D().key];clearProgress(D().key);renderAll();toast("Your plan is back");}
    else if(m==="settings")openSettings();else if(m==="logact")openActForm();else if(m==="checkup")openCheckupForm();else if(m==="weight")openBodyForm();else if(m==="report")copyReport();return;}
  if(ds.logact!==undefined)return openActForm();
  if(ds.checkup!==undefined)return openCheckupForm();
  if(ds.weight!==undefined)return openBodyForm();
  if(ds.editcheck)return openCheckupForm(S.checkups.find(x=>x.id===ds.editcheck));
  if(ds.editbody)return openBodyForm(S.body.find(x=>x.id===ds.editbody));
  if(ds.hseg){S.hseg=ds.hseg;renderAll();return;}
  if(ds.prot){const td=today();S.protein[td]=Math.max(0,(S.protein[td]||0)+(+ds.prot));renderAll();return;}
  if(ds.habit){if(!S.daily||S.daily.d!==today())S.daily={d:today(),h:{}};S.daily.h[ds.habit]=!S.daily.h[ds.habit];if(ds.habit==="protein"&&!S.daily.h.protein){}renderAll();return;}
  if(ds.acsel!=null){S.accent.sel=+ds.acsel;renderSettings();save();return;}
  if(t.id==="acReset"&&S.accent){delete S.accent;applyAccent();renderSettings();save();return;}
  if(ds.lk){S.look=ds.lk;applyLook();renderSettings();save();return;}
  if(ds.rest){const [k,v]=ds.rest.split(":");S.rest[k]=+v;renderSettings();save();return;}
  if(ds.f){S.filter=ds.f;renderLib();save();return;}
  if(ds.vid){openVid(ds.vid,ds.vq||"proper form");return;}
  if(t.id==="vidClose"){closeSheets();return;}
  if(t.id==="vidMore"){const o=$("vidOpts").classList.toggle("show");t.setAttribute("aria-expanded",o);t.classList.toggle("on",o);if(o)setTimeout(()=>$("vidOpts").scrollIntoView({behavior:"smooth",block:"nearest"}),50);return;}
  if(t.id==="vidPaste"){(navigator.clipboard?.readText?navigator.clipboard.readText():Promise.reject()).then(x=>{$("vidUrl").value=x.trim();}).catch(()=>toast("Long-press the box and tap Paste"));return;}
  if(t.id==="vidSave"){const r=ytId($("vidUrl").value);if(!r)return toast("That isn't a YouTube link");S.vids[VID.n]=r;save();renderVid();toast("Video saved");return;}
  if(t.id==="vidDel"){delete S.vids[VID.n];save();renderVid();toast(S.defVids&&DEFVID[VID.n]?"Back to default video":"Video removed");return;}
  const p=S.view!=null?plan():null;
  if(ds.add){const n=ds.add,i=p.indexOf(n);if(i>=0)p.splice(i,1);else if(p.length<MAX)p.push(n);else return toast("You have 7. Remove one first.");renderAll();return;}
  if(ds.rm){p.splice(p.indexOf(ds.rm),1);const sw=S.swaps[D().key]||{};Object.keys(sw).forEach(o=>{if(sw[o]===ds.rm)delete sw[o];});renderAll();return;}
  if(ds.alt){openAlts(ds.alt);return;}
  if(ds.swapto){swapEx(D().key,ALTFOR,ds.swapto);closeSheets();renderAll();toast(`Swapped to ${ds.swapto}`);return;}
  if(ds.prog){if(ds.prog!==S.prog){setProg(ds.prog);renderAll();toast(`Switched to ${PROGRAMS[ds.prog].name}`);}renderSettings();return;}
  if(ds.set){const k=D().key+"|"+ds.set,i=+ds.i,was=S.sets[k]||0;S.sets[k]=was>i?i:i+1;renderAll();if(S.sets[k]>was){const nx=nextInSuper(D().key,ds.set,plan());if(nx)toast(`Now ${nx}, then rest`);else startRest(isStrong(D().key,ds.set)?Math.max(150,S.rest.main):isEss(D().key,ds.set)?S.rest.main:S.rest.other);}return;}
  switch(t.id){
    case "edit":S.edit=!S.edit;renderAll();break;
    case "auto":autoPick();break;
    case "mine":S.plans[D().key]=[...DEFAULT[D().key]];delete S.swaps[D().key];clearProgress(D().key);renderAll();toast("Your plan is back");break;
    case "fill":{const n=fillGaps();renderAll();toast(n?`Added ${n} exercise${n>1?"s":""}`:"No room left");break;}
    case "addBtn":openLib();break;
    case "closeAlt":closeSheets();break;
    case "closeLib":case "closeSet":case "formCancel":closeSheets();break;
    case "formSave":{if(FORM){FORM.onSave(readForm());}closeSheets();renderAll();break;}
    case "formDel":{if(FORM?.onDelete){FORM.onDelete();}closeSheets();renderAll();break;}
    case "plus":end+=30000;dur+=30;tick();break;
    case "skip":stopRest();break;
    case "finish":completeWorkout();break;
    case "copyReport":copyReport();break;
    case "exportData":exportData();break;
    case "resetAll":if(!resetArm){resetArm=true;renderSettings();setTimeout(()=>{resetArm=false;if($("settings").classList.contains("open"))renderSettings();},4000);}
      else{resetArm=false;const keep={look:S.look,rest:S.rest,profile:S.profile,accent:S.accent,vids:S.vids,phx:S.phx,phStyle:S.phStyle,matchPh:S.matchPh};S={day:0,plans:JSON.parse(JSON.stringify(DEFAULT)),sets:{},wts:{},checks:{},last:null,count:0,log:[],filter:"All",...keep};norm();stopRest();closeSheets();renderAll();scrollTo({top:0});toast("All progress erased");}
      break;
  }
});
document.addEventListener("change",ev=>{const el=ev.target;
  if(el.id==="importFile"){importData(el.files[0]);el.value="";return;}
  if(el.id==="acFade"){if(!S.accent)S.accent={c:[[3,61],[35,55]],fade:false,sel:0};S.accent.fade=el.checked;S.accent.sel=el.checked?S.accent.sel||0:0;applyAccent();renderSettings();save();return;}
  if(el.id==="defVids"){S.defVids=el.checked;renderSettings();save();return;}
  if(el.id==="autoLook"){S.look=el.checked?"auto":(sysDark()?"dark":"light");applyLook();renderSettings();save();return;}
  if(el.id==="f_date"&&FORM?.onDate){FORM.onDate(el.value||today());return;}
  if(el.dataset.ck!==undefined){S.checks[el.dataset.ck]=el.checked;renderAll();return;}
  if(el.dataset.meal!==undefined){const td=today();S.meals[td]=S.meals[td]||{};S.meals[td][el.dataset.meal]=el.checked;
    Object.keys(S.meals).forEach(d=>{if(d<daysAgo(60))delete S.meals[d];});renderAll();return;}
});
document.addEventListener("input",ev=>{const el=ev.target;
  if(el.id==="q")return renderLib();
  if(el.dataset.wt!==undefined){S.wts[D().key+"|"+el.dataset.wt]=el.value;save();return;}
  if(el.dataset.prof){S.profile[el.dataset.prof]=num(el.value);save();}
});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"){closeMenu();closeSheets();}});
function onScroll(){const scr=$("scr-"+screenName());const lt=scr&&scr.querySelector(".lt");$("bar").classList.toggle("show",!!lt&&scrollY>lt.offsetTop+lt.offsetHeight-8);}
addEventListener("scroll",onScroll,{passive:true});

// ---------- rest timer ----------
let timer=null,end=0,dur=90;
const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
function startRest(sec){clearInterval(timer);dur=sec;end=Date.now()+sec*1000;$("rest").hidden=false;$("rest").classList.remove("done");tick();timer=setInterval(tick,250);}
function tick(){const ms=Math.max(0,end-Date.now()),left=Math.ceil(ms/1000);
  $("clock").textContent=left?fmt(left):"Go";
  $("irv").setAttribute("stroke-dashoffset",(87.96*(1-ms/(dur*1000))).toFixed(2));
  if(!left){clearInterval(timer);$("rest").classList.add("done");$("irv").style.stroke="#30d158";$("irv").setAttribute("stroke-dashoffset","0");setTimeout(()=>{if(Date.now()>=end)stopRest()},3500);}
  else $("irv").style.stroke="var(--tint)";}
function stopRest(){clearInterval(timer);$("rest").hidden=true;}

applyLook();applyAccent();phLoad().then(()=>{if(Object.keys(PHD).length)renderAll();});
renderAll();
if(LOADWARN)setTimeout(()=>toast(LOADWARN),600);
