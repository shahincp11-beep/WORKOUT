// Phase 4c – Gym Mode: arrival check (gym location), 4-box picker, full-screen one-exercise-at-a-time mode
// Data: S.gym={lat,lon,r,ask,lastAsk} · S.reps["key|exercise"]=[reps per set] · duration from S.started (saved as session.mins)
const GX='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const GUP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
const GPIN='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
let GY=null; // {i: day index, tm: interval}
const gyEl=()=>S.started?(S.started.p||Date.now())-S.started.t:0; // workout time; S.started.p = paused at
const gyMin=e=>{const t=String(e[3]);const m=t.match(/×\s*(\d+)/);return m?+m[1]:/AMRAP/i.test(t)?10:parseInt(t)||10;};
const gyClock=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0");};
function gyLastReps(n){for(let i=S.sessions.length-1;i>=0;i--){const r=S.sessions[i].r?.[n];if(r&&r.length)return r;}return null;}
function gyRep(k,n,e,j){const cur=S.reps?.[k+"|"+n]||[];if(cur[j-1])return cur[j-1];const l=gyLastReps(n);return (l&&(l[j]||l[0]))||gyMin(e);}

// ---------- readiness (Fitbit data via Google Health) ----------
// Sleep score 40 · HRV vs your 30-day average 30 · resting HR vs 30-day average 20 · recent training 10 (missing parts are left out and the rest scaled)
function gymReady(){const td=today(),D0=HD?.days||{},avg=k=>{const v=[];for(let i=1;i<=30;i++){const x=D0[daysAgo(i)]?.[k];if(x!=null)v.push(+x);}return v.length>=3?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const parts=[],why=[];const sl=hdMain(td)||hdMain(daysAgo(1)),ss=typeof hdScore==="function"?hdScore(sl):null;
  if(ss!=null){parts.push([ss/100,40]);why.push(`Sleep ${hdHMt(sl.asleep)}`);}
  const hv=D0[td]?.hrv??D0[daysAgo(1)]?.hrv,ha=avg("hrv");if(hv!=null&&ha){parts.push([Math.max(0,Math.min(1,(hv/ha-.85)/.2)),30]);why.push(`HRV ${Math.round(hv)} (avg ${Math.round(ha)})`);}
  const rh=D0[td]?.rhr??D0[daysAgo(1)]?.rhr,ra=avg("rhr");if(rh!=null&&ra){parts.push([Math.max(0,Math.min(1,(ra+5-rh)/7)),20]);why.push(`Resting HR ${Math.round(rh)} (avg ${Math.round(ra)})`);}
  if(!parts.length)return null;const n2=S.sessions.filter(x=>x.d>=daysAgo(2)&&x.d<td).length;parts.push([[1,.6,.2][Math.min(n2,2)],10]);why.push(n2?`${n2} workout${n2>1?"s":""} in the last 2 days`:"Rested yesterday");
  const sc=Math.round(parts.reduce((a,[v,w])=>a+v*w,0)/parts.reduce((a,[,w])=>a+w,0)*100);
  const lv=sc>=75?["Heavy","--green","Go for your top weights. Add a set on your main lift if it feels good."]:sc>=50?["Medium","--orange","Normal weights. Stop each set 1–2 reps before failure."]:["Light","--red","Drop weights by about 20% and skip optional exercises. Keep the walk easy."];
  return {sc,lv:lv[0],c:lv[1],tip:lv[2],why:why.join(" · ")};}
function gyReadyUI(){const r=gymReady();if(!r)return `<div class="gyrd none"><span>Readiness</span><p>Sync your Fitbit data (Health tab) to get a readiness score and a suggested load.</p></div>`;
  return `<div class="gyrd" style="--rc:var(${r.c})"><div class="gyrs" style="--p:${r.sc}"><b>${r.sc}</b><span>ready</span></div><div class="gyrt"><span>Suggested load</span><b>${r.lv}</b><p>${esc(r.tip)}</p><i>${esc(r.why)}</i></div></div>`;}
function gymHello(){if($("ghpop"))return;const el=document.createElement("div");el.className="ghpop";el.id="ghpop";
  el.innerHTML=`<div class="gpc" role="dialog" aria-modal="true" aria-label="You're at the gym"><b>You're at the gym</b><p>Ready to train?</p>
    <button class="gyplay" data-gyhello="1" aria-label="Start workout">${G.play}</button><span class="gyplab">Start Workout</span><button class="btn2" id="hdLater" style="width:100%">Not Now</button></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("open"));}

// ---------- picker: the four workout boxes ----------
function gymPick(){
  if($("ghpop"))return;const el=document.createElement("div");el.className="ghpop";el.id="ghpop";
  el.innerHTML=`<div class="gpc gpk" role="dialog" aria-modal="true" aria-label="Start workout">${gyReadyUI()}<b>Which workout?</b><p>Up next: ${esc(dname(DAYS[S.day]))}</p>
    <div class="gpg">${DAYS.map((d,i)=>{const im=ph(DAYPH[d.key],true);return `<button class="gpb ${i===S.day?"next":""}" data-gygo="${i}" style="--c:var(${d.color})${im?`;--img:url(${im})`:""}">${i===S.day?'<span class="badge">Up next</span>':""}<span class="dn">Day ${i+1}</span><span class="dt">${esc(dname(d))}</span></button>`}).join("")}</div>
    <button class="btn2" id="hdLater">Not Now</button></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("open"));
}

// ---------- full-screen gym mode ----------
function gymOpen(i){
  S.tab="workout";S.view=i;S.edit=false;S.reps=S.reps||{};const k=DAYS[i].key;
  if(!(S.started&&S.started.k===k&&gyEl()<6*36e5))S.started={k,t:Date.now()};
  if(S.started.p){S.started.t+=Date.now()-S.started.p;delete S.started.p;toast("Timer resumed");}
  save();renderAll();GY={i};let el=$("gym");if(!el){el=document.createElement("div");el.id="gym";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");document.body.appendChild(el);}
  gymRender();gymGoCur();document.body.classList.add("gymon");const v=gyVid();v.play().catch(()=>{});requestAnimationFrame(()=>el.classList.add("open"));$("gymini")?.remove();
  clearInterval(GY.tm);GY.tm=setInterval(gymTick,1000);gymTick();gymWake(true);
}
function gymGoCur(){const p=plan(),k=D().key;const i=p.findIndex(n=>{const e=find(n);return e&&(S.sets[k+"|"+n]||0)<nSets(e);});const any=p.some(n=>S.sets[k+"|"+n]);if(!any&&!S.checks[k+"w0"])return;
  const ps=$("gym").querySelector(".gyps");ps.scrollTop=ps.clientHeight*(i<0?p.length+1:i+1);}
function gymLeave(){const el=document.createElement("div");el.className="ghpop";el.id="ghpop";el.style.zIndex=60;
  el.innerHTML=`<div class="gpc" role="dialog" aria-modal="true" aria-label="Leave Gym Mode"><b>Leave Gym Mode?</b><p>Your sets so far are kept either way.</p>
    <button class="big" data-gyl="pause">Pause Timer</button><button class="btn2" style="width:100%" data-gyl="run">Keep Timer Running</button>
    <button class="btn2" style="width:100%;color:var(--red)" data-gyl="stop">Stop Timer – Don't Save Time</button><button class="btn2" style="width:100%" id="hdLater">Back to Workout</button></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("open"));}
function gymClose(){clearInterval(GY?.tm);GY=null;setTimeout(gymMini,0);$("gym")?.classList.remove("open");document.body.classList.remove("gymon");gymWake(false);renderAll();}
const gyX0=()=>S.gyLast&&S.started&&S.gyLast>S.started.t?S.gyLast:S.started?.t||Date.now();
function gymTick(){const t=$("gyT");if(t&&S.started)t.textContent=gyClock(gyEl());
  document.querySelectorAll(".gyxt").forEach(b=>{const g=S.gyT?.[b.dataset.gyxk],e=find(b.dataset.gyxk.split("|")[1]),fin=e&&(S.sets[b.dataset.gyxk]||0)>=nSets(e);b.textContent=gyClock(fin&&g?.e?g.e-g.s:Date.now()-(g?.s||gyX0()));});}
let GWL=null;async function gymWake(on){try{if(on){GWL=await navigator.wakeLock?.request("screen");}else{GWL?.release();GWL=null;}}catch(e){}}

function gymPage(n,idx,cnt){
  const d=D(),k=d.key,e=find(n);if(!e)return"";const sk=k+"|"+n,ns=nSets(e),dn=Math.min(S.sets[sk]||0,ns),reps=S.reps[sk]||[],all=dn>=ns;
  const im=ph(GRPPH[e[1]]||DAYPH[k],true),rep=gyRep(k,n,e,dn),wt=S.wts[sk]||"";
  return `<section class="gyp" data-gyn="${esc(n)}" style="${im?`--img:url(${im})`:""}"><div class="gyin">
    <div class="gyno">${idx} of ${cnt} · ${esc(e[1])}${isStrong(k,n)?" · Strength":""}</div>
    <div class="gyttl"><h2>${esc(n)}</h2>${play(n)}</div>
    <div class="gytg">${tierTag(tierOf(k,n))}${esc(e[3])} · ${esc(e[2])}</div>
    <div class="gysets">${Array.from({length:ns},(_,j)=>`<button class="gys ${j<dn?"on":""} ${j===dn?"cur":""}" data-gyset="${j}"><b>${j<dn?(reps[j]||"✓"):j+1}</b><span>${j<dn?"reps":"set"}</span></button>`).join("")}</div>
    ${all?`<div class="gydone">${G.check}<b>All ${ns} sets done</b><span>Swipe up for the next exercise</span></div>`:`
    <div class="gylab">Reps · set ${dn+1}</div>
    <div class="gyw" data-gyrep="${rep}">${Array.from({length:40},(_,r)=>`<button class="${r+1===rep?"on":""}" data-gyr="${r+1}">${r+1}</button>`).join("")}</div>
    <div class="gykg"><button data-gykg="-2.5">−</button><label><input inputmode="decimal" placeholder="0" value="${esc(wt)}" data-gywt="${esc(n)}"><span>kg</span></label><button data-gykg="2.5">+</button></div>
    <button class="big gylog" data-gylog="1">Log Set ${dn+1} · ${rep} reps</button>`}
    <div class="gyex"><span>${all?"Exercise time":"This exercise"}</span><b class="gyxt" data-gyxk="${esc(sk)}">0:00</b></div>
    <div class="gyhint">${GUP}<span>Swipe up · next</span></div></div></section>`;
}
function gymRender(keepScroll){
  const el=$("gym"),d=D(),k=d.key,p=plan(),st=dayStats(d),pg=el.querySelector(".gyps"),top=pg?pg.scrollTop:0;
  const chk=(id,list)=>list.map((w,i)=>{const ck=k+id+i;return `<label class="cell chk"><input type="checkbox" class="circ" data-ck="${ck}" ${S.checks[ck]?"checked":""}><span class="ct"><span class="t1">${esc(w[0])}</span><span class="t2">${esc(w[1])}</span></span><span class="acc">${esc(w[2])}</span></label>`}).join("");
  el.innerHTML=`<header class="gyh"><button class="gyx" id="gyX" aria-label="Leave Gym Mode">${GX}</button><div class="gyc"><span>${esc(dname(d))}</span><b id="gyT">0:00</b></div><div class="gyhr"><button class="gyx" id="gyPip" aria-label="Float timer over other apps">${GPIP}</button><button class="gyfin" id="gyFin">Finish</button></div></header>
    <div class="gybar">${p.map(n=>{const e=find(n);const ns=e?nSets(e):1,dn=Math.min(S.sets[k+"|"+n]||0,ns);return `<i style="--p:${dn/ns}"></i>`}).join("")}</div>
    <div class="gyps">
      <section class="gyp gywu"><div class="gyin"><div class="gyno">Warm-up · ${st.warm} min</div><h2>Get ready</h2><div class="group">${chk("w",WARM[k])}</div><div class="gyhint">${GUP}<span>Swipe up · first exercise</span></div></div></section>
      ${p.map((n,i)=>gymPage(n,i+1,p.length)).join("")}
      <section class="gyp gyend"><div class="gyin"><div class="gyno">Cardio & finish</div><h2>Finish strong</h2><div class="group">${chk("f",FIN[k])}</div>
        <div class="gysum"><div><b id="gyT2">—</b><span>time</span></div><div><b>${st.done}/${st.total}</b><span>sets</span></div><div><b>${cardioPending(k)}</b><span>cardio min</span></div></div>
        <button class="big" id="gyFin2">Finish & Save Workout</button><p class="gyft">The time on screen is saved as your workout duration.</p></div></section>
    </div>`;
  const ps=el.querySelector(".gyps");if(keepScroll)ps.scrollTop=top;
  ps.addEventListener("scroll",()=>{if(ps.scrollTop>ps.clientHeight*.6&&S.started&&!(S.gyLast>S.started.t)){S.gyLast=Date.now();save();}const t2=$("gyT2");if(t2&&S.started)t2.textContent=gyClock(gyEl());},{passive:true});
  const t2=$("gyT2");if(t2&&S.started)t2.textContent=gyClock(gyEl());
  el.querySelectorAll(".gyw").forEach(w=>{const on=w.querySelector(".on");if(on)w.scrollLeft=on.offsetLeft-(w.clientWidth-on.offsetWidth)/2;let to;
    w.addEventListener("scroll",()=>{clearTimeout(to);to=setTimeout(()=>gymWheel(w),90);},{passive:true});});
  gymTick();
}
function gymWheel(w){const c=w.scrollLeft+w.clientWidth/2;let best=null,bd=1e9;w.querySelectorAll("button").forEach(b=>{const m=b.offsetLeft+b.offsetWidth/2,dd=Math.abs(m-c);if(dd<bd){bd=dd;best=b;}});
  if(!best)return;w.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===best));w.dataset.gyrep=best.dataset.gyr;
  const lg=w.closest(".gyp").querySelector(".gylog");if(lg)lg.textContent=lg.textContent.replace(/· \d+ reps/,`· ${best.dataset.gyr} reps`);}
function gymLog(sec){const n=sec.dataset.gyn,k=D().key,sk=k+"|"+n,e=find(n),ns=nSets(e),dn=Math.min(S.sets[sk]||0,ns);if(dn>=ns)return;
  const rep=+sec.querySelector(".gyw").dataset.gyrep||gyMin(e);const now=Date.now();S.gyT=S.gyT||{};(S.gyT[sk]=S.gyT[sk]||{s:gyX0()}).e=now;S.gyLast=now;(S.reps[sk]=S.reps[sk]||[])[dn]=rep;S.reps[sk].length=dn+1;S.sets[sk]=dn+1;save();
  const nx=nextInSuper(k,n,plan());if(nx)toast(`Now ${nx}, then rest`);else startRest(isStrong(k,n)?Math.max(150,S.rest.main):isEss(k,n)?S.rest.main:S.rest.other);
  gymRender(true);}
function gymFinish(){const mins=S.started?Math.round(gyEl()/6e4):0;clearInterval(GY?.tm);GY=null;$("gym")?.classList.remove("open");document.body.classList.remove("gymon");gymWake(false);
  S.gyFloat=false;completeWorkout();S.gyRd=null;const v=$("gyv");if(v){if(gyInPip())(document.exitPictureInPicture?.()||v.webkitSetPresentationMode?.("inline"));v.pause();}gymMini();toast(`Workout saved · ${mins} min`);}

document.addEventListener("click",ev=>{
  const b=ev.target.closest("button");if(!b)return;const ds=b.dataset;
  if(ds.gyl){$("ghpop")?.remove();const v=$("gyv");
    if(ds.gyl==="pause"){S.started.p=Date.now();S.gyFloat=false;save();v?.pause();gymClose();toast("Timer paused · tap the box to carry on");}
    else if(ds.gyl==="stop"){S.started=null;S.gyFloat=false;save();v?.pause();gymClose();toast("Timer stopped · your sets are kept");}
    else{gymClose();toast("Timer still running");}
    return;}
  if(ds.gyhello){$("ghpop")?.remove();gymPick();return;}
  if(ds.gygo!=null){$("ghpop")?.remove();const r=gymReady();S.gyRd=r?{sc:r.sc,lv:r.lv}:null;gymOpen(+ds.gygo);return;}
  if(b.id==="gymStart"){gymPick();return;}
  if(b.id==="gymHere"){gymOpen(S.view??S.day);return;}
  if(!GY||!b.closest("#gym"))return;
  if(b.id==="gyX"){gymLeave();return;}
  if(b.id==="gyFin"){const ps=$("gym").querySelector(".gyps");ps.scrollTo({top:ps.scrollHeight,behavior:"smooth"});return;}
  if(b.id==="gyFin2"){gymFinish();return;}
  if(ds.gyr){const w=b.parentElement;w.scrollTo({left:b.offsetLeft-(w.clientWidth-b.offsetWidth)/2,behavior:"smooth"});return;}
  if(ds.gylog){gymLog(b.closest(".gyp"));return;}
  if(ds.gykg){const i=b.parentElement.querySelector("input"),v=Math.max(0,r1((num(i.value)||0)+ +ds.gykg));i.value=v||"";S.wts[D().key+"|"+i.dataset.gywt]=i.value;save();return;}
  if(ds.gyset!=null){const sec=b.closest(".gyp"),n=sec.dataset.gyn,sk=D().key+"|"+n,j=+ds.gyset,dn=S.sets[sk]||0;if(j<dn){S.sets[sk]=j;if(S.reps[sk])S.reps[sk].length=j;save();gymRender(true);toast(`Set ${j+1} undone`);}return;}
},true);
document.addEventListener("input",ev=>{const i=ev.target;if(i.dataset?.gywt!=null){S.wts[D().key+"|"+i.dataset.gywt]=i.value;save();}});
document.addEventListener("change",ev=>{if(GY&&ev.target.dataset?.ck!=null)setTimeout(()=>gymRender(true),0);});

// ---------- gym location (set once) + arrival check ----------
const gyDist=(a,b,c,d)=>{const R=6371e3,t=Math.PI/180,x=(c-a)*t,y=(d-b)*t,h=Math.sin(x/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const gyPos=()=>new Promise((ok,no)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>ok(p.coords),no,{enableHighAccuracy:true,timeout:12000,maximumAge:120000}):no(new Error("no gps")));
function gymSetUI(){const g=S.gym;const m=g&&g.lat!=null;
  const bb=m?`${g.lon-.004},${g.lat-.0025},${g.lon+.004},${g.lat+.0025}`:"";
  return `<div class="lh">Gym Mode</div><div class="group">
    <div class="cell"><span class="itile" style="--ic:var(--tint)">${GPIN}</span><span class="ct"><span class="t1">Gym Location</span><span class="t2">${m?`${g.name?esc(g.name)+" · ":""}within ${g.r||150} m`:"Not set"}</span></span></div>
    ${m?`<div class="gymap"><iframe loading="lazy" title="Gym on the map" src="https://www.openstreetmap.org/export/embed.html?bbox=${bb}&layer=mapnik&marker=${g.lat},${g.lon}"></iframe></div>
    <div class="cell"><span class="ct"><span class="t1">Distance</span></span><div class="seg sm" role="radiogroup" aria-label="Distance">${[100,150,300].map(v=>`<button class="${(g.r||150)===v?"on":""}" data-gyrad="${v}">${v} m</button>`).join("")}</div></div>
    <label class="cell"><span class="ct"><span class="t1">Ask When I Arrive</span><span class="t2">Opening the app at the gym shows your four workouts</span></span><input type="checkbox" class="sw" id="gyAsk" ${g.ask!==false?"checked":""}></label>`:""}
    <div class="cell gylink"><input id="gyLink" type="url" inputmode="url" placeholder="Paste a Google Maps link" autocomplete="off"><button class="gylb" id="gyLinkGo">Use Link</button></div>
    <button class="cell action" id="gyHereSet">${GPIN}<span class="lbl">${m?"Move to Where I Am Now":"Set to Where I Am Now"}</span></button>
    ${m?`<button class="cell action" id="gyDel" style="color:var(--red)"><span class="lbl">Remove Gym Location</span></button>`:""}</div>
    <p class="lf">Easiest: in Google Maps, open your gym → Share → Copy, then paste the link here. Or tap “Set” while you're at the gym. For a reminder even when the app is closed: Shortcuts → Automation → + → Arrive → pick your gym on the map → Show Notification “Gym time – open Workout”.</p>`;}
function gyCoords(t){try{t=decodeURIComponent(t||"");}catch(e){}const m=t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||t.match(/[?&](?:q|ll|query|center|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||t.match(/^\s*[(\[]?\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*[)\]]?\s*$/);return m?{lat:+m[1],lon:+m[2]}:null;}
async function gymLink(){const t=($("gyLink")?.value||"").trim();if(!t)return toast("Paste a Google Maps link first");
  let c=!/goo\.gl|g\.co\//.test(t)&&gyCoords(t),name=(t.match(/\/place\/([^/]+)/)||[])[1];
  if(!c){if(!GH?.url)return toast("Set up Google Health sync first (Settings → Google Health)");toast("Reading the link…");
    try{const j=await ghCall("/api/maplink?u="+encodeURIComponent(t));if(j.error||j.lat==null)return toast(j.error||"No location in that link");c=j;name=j.name||name;}
    catch(e){return toast(/404|Not found|Server error/i.test(e.message)?"Update the sync server code in Cloudflare first":e.message);}}
  try{name=name&&decodeURIComponent(name.replace(/\+/g," "));}catch(e){}
  S.gym={...(S.gym||{}),lat:Math.round(c.lat*1e5)/1e5,lon:Math.round(c.lon*1e5)/1e5,name:name||"",r:S.gym?.r||150,ask:S.gym?.ask!==false,lastAsk:Date.now()};save();renderSettings();toast(c.approx?"Gym found by name – check the pin on the map":"Gym location saved");}
document.addEventListener("click",async ev=>{const b=ev.target.closest("button");if(!b)return;
  if(b.id==="gyLinkGo")return gymLink();
  if(b.id==="gyHereSet"){toast("Finding your location…");try{const c=await gyPos();S.gym={...(S.gym||{}),name:"",lat:Math.round(c.latitude*1e5)/1e5,lon:Math.round(c.longitude*1e5)/1e5,r:S.gym?.r||150,ask:S.gym?.ask!==false,lastAsk:Date.now()};save();renderSettings();toast("Gym location saved");}catch(e){toast("Location not available – allow it in Settings → Privacy → Location");}}
  if(b.id==="gyDel"){delete S.gym;save();renderSettings();toast("Gym location removed");}
  if(b.dataset.gyrad){S.gym.r=+b.dataset.gyrad;save();renderSettings();}
});
document.addEventListener("change",ev=>{if(ev.target.id==="gyAsk"){S.gym.ask=ev.target.checked;save();}});
async function gymArrive(){const g=S.gym;if(!g||g.lat==null||g.ask===false||GY||$("ghpop")||document.hidden)return;
  if(Date.now()-(g.lastAsk||0)<3*36e5||S.sessions.some(x=>x.d===today()))return;
  try{const c=await gyPos();if(gyDist(g.lat,g.lon,c.latitude,c.longitude)<=(g.r||150)+Math.min(c.accuracy||0,100)){g.lastAsk=Date.now();save();gymHello();}}catch(e){}}
addEventListener("load",()=>{setTimeout(gymArrive,1500);gymMini();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(gymArrive,800);});

// ---------- floating timer: over other apps (iOS Picture in Picture) + mini box inside the app ----------
// gymclock.mp4 = a silent 2-hour clock video; it is started at the elapsed time so iOS keeps it running natively in PiP.
const GPIP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><rect x="12" y="11" width="7" height="6" rx="1.2" fill="currentColor"/></svg>';
const GARR=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d==="l"?"M15 5l-7 7 7 7":"M9 5l7 7-7 7"}"/></svg>`;
const gyLive=()=>S.started&&gyEl()<6*36e5&&DAYS.some(d=>d.key===S.started.k);
function gyVid(){let v=$("gyv");if(!v){v=document.createElement("video");v.id="gyv";v.src="img/gymclock.mp4";v.muted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("autopictureinpicture","");v.preload="auto";
  v.addEventListener("enterpictureinpicture",()=>{S.gyFloat=true;save();});v.addEventListener("leavepictureinpicture",()=>{if(!GY)v.pause();});v.addEventListener("webkitpresentationmodechanged",()=>{if(v.webkitPresentationMode==="picture-in-picture"){S.gyFloat=true;save();}else if(!GY)v.pause();});document.body.appendChild(v);}return v;}
const gySync=v=>{if(S.started)try{v.currentTime=Math.min(7199,gyEl()/1000);}catch(e){}};
function gymFloat(){if(!gyLive())return toast("Start a workout first");S.gyFloat=true;save();const v=gyVid();gySync(v);
  if(!v.paused&&gyInPip())return toast("Timer is already floating");
  let asked=false;
  try{if(v.webkitSupportsPresentationMode&&v.webkitSupportsPresentationMode("picture-in-picture")){v.webkitSetPresentationMode("picture-in-picture");asked=true;}
    else if(document.pictureInPictureEnabled&&!v.disablePictureInPicture){v.requestPictureInPicture().catch(e=>toast("Floating timer blocked: "+(e.message||e.name)));asked=true;}}catch(e){toast("Floating timer blocked: "+(e.message||e.name));return;}
  v.play().catch(()=>{});
  if(!asked)return toast("This iPhone doesn't allow a floating timer from a Home Screen app");
  toast("Opening floating timer…");setTimeout(()=>{if(gyInPip())toast("Timer is floating · swipe it to the edge to hide");else toast("iPhone didn't open the floating timer here");},1500);}
const gyInPip=()=>{const v=$("gyv");return !!v&&(document.pictureInPictureElement===v||v.webkitPresentationMode==="picture-in-picture");};
document.addEventListener("visibilitychange",()=>{const v=$("gyv");if(!v)return;if(!gyLive()){if(gyInPip())(document.exitPictureInPicture?.()||v.webkitSetPresentationMode?.("inline"));v.pause();return;}gySync(v);if(S.gyFloat&&!GY&&!S.started.p){const i=DAYS.findIndex(d=>d.key===S.started.k);if(i>=0)gymOpen(i);}});

function gymMini(){let m=$("gymini");const show=gyLive()&&!GY;if(!show){m?.remove();return;}
  const d=DAYS.find(x=>x.key===S.started.k),p=planFor(d);let nx="";for(const n of p){const e=d.lib.find(x=>x[0]===n);if(!e)continue;const ns=nSets(e),dn=Math.min(S.sets[d.key+"|"+n]||0,ns);if(dn<ns){nx=`${n} · set ${dn+1}/${ns}`;break;}}
  const pos=S.gymPos||{side:"r",y:.74,hide:false};
  if(!m){m=document.createElement("div");m.id="gymini";document.body.appendChild(m);gyDrag(m);}
  m.className=`gymini ${pos.side} ${pos.hide?"hid":""}`;m.style.top=`calc(${(pos.y*100).toFixed(1)}% - 32px)`;
  m.innerHTML=pos.hide?`<button class="gmtab" data-gmshow="1" aria-label="Show workout timer">${GARR(pos.side==="r"?"l":"r")}</button>`
    :`<button class="gmhide" data-gmhide="1" aria-label="Hide workout timer">${GARR(pos.side)}</button><button class="gmbox" data-gmopen="1" aria-label="Back to Gym Mode"><b id="gmT">${gyClock(gyEl())}</b><span>${S.started.p?"Paused · ":""}${esc(dname(d))}</span>${nx?`<i>${esc(nx)}</i>`:'<i>Ready to finish</i>'}</button>`;}
function gyDrag(m){let sy=0,sx=0,y0=0,mv=false;
  m.addEventListener("touchstart",e=>{const t=e.touches[0];sy=t.clientY;sx=t.clientX;y0=m.getBoundingClientRect().top;mv=false;},{passive:true});
  m.addEventListener("touchmove",e=>{const t=e.touches[0];if(Math.abs(t.clientY-sy)+Math.abs(t.clientX-sx)>8)mv=true;if(mv){e.preventDefault();m.style.top=Math.max(60,Math.min(innerHeight-130,y0+t.clientY-sy))+"px";m.style.transform=`translateX(${t.clientX-sx}px)`;}},{passive:false});
  m.addEventListener("touchend",e=>{if(!mv)return;const t=e.changedTouches[0],r=m.getBoundingClientRect();m.style.transform="";
    S.gymPos={side:t.clientX<innerWidth/2?"l":"r",y:Math.max(.1,Math.min(.85,(r.top+32)/innerHeight)),hide:!!S.gymPos?.hide};save();gymMini();m._skip=Date.now();});}
setInterval(()=>{const t=$("gmT");if(t&&S.started)t.textContent=gyClock(gyEl());if(!!$("gymini")!==(gyLive()&&!GY))gymMini();},1000);
document.addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;const ds=b.dataset;
  if($("gymini")?._skip>Date.now()-400&&b.closest("#gymini"))return;
  if(b.id==="gyPip"){gymFloat();return;}
  if(ds.gmopen){gymOpen(DAYS.findIndex(d=>d.key===S.started.k));return;}
  if(ds.gmhide||ds.gmshow){S.gymPos={side:"r",y:.74,...(S.gymPos||{}),hide:!!ds.gmhide};save();gymMini();}
});
