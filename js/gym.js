// Gym: arrival check (gym location), readiness, 4-box picker, and (Phase 4d-1) the gym workout list: tap-to-time exercises, background total timer, reps/kg per set, leave-gym auto close, mode button
// Data: S.gym={lat,lon,r,ask,lastAsk} · S.started={k,t,p?} · S.gyT["key|ex"]={a:ms,on:ts} · S.reps["key|ex"]=[reps per set] · S.rpc["key|ex"]=reps picked · S.nsx["key|ex"]=set count · S.gyLast=last tap · S.mode
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
    <p class="lf">Easiest: in Google Maps, open your gym → Share → Copy, then paste the link here. Or tap “Set” while you're at the gym. For a reminder even when the app is closed: Shortcuts → Automation → + → Arrive → pick your gym on the map → Show Notification “Gym time – open Workout”. To be reminded to finish: a second automation with Leave → Show Notification “Finish your workout”. If you forget, opening the app away from the gym ends the workout at your last tap.</p>`;}
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

// ---------- Phase 4d-1 · gym workout list ----------
// Times are kept as timestamps, so they keep counting while the app is in the background (YouTube, Music…).
const gyLive=()=>!!S.started&&gyEl()<6*36e5&&DAYS.some(d=>d.key===S.started.k);
const gxMs=g=>!g?0:g.a!=null?g.a+(g.on?Date.now()-g.on:0):g.e&&g.s?g.e-g.s:0; // old 4c entries {s,e} still count
const gyDayI=()=>DAYS.findIndex(d=>d.key===S.started?.k);
function gyStart(k,quiet){if(S.started&&S.started.k===k&&gyEl()<6*36e5){if(S.started.p){S.started.t+=Date.now()-S.started.p;delete S.started.p;if(!quiet)toast("Timer resumed");}return;}
  S.started={k,t:Date.now()};S.gyLast=Date.now();if(!quiet)toast("Workout timer started");}
function gyStopAll(at){const t=at||Date.now();for(const sk in S.gyT||{}){const g=S.gyT[sk];if(g&&g.on){g.a=(g.a||0)+Math.max(0,t-g.on);g.on=null;}}}
function gyTap(n){const k=D().key,sk=k+"|"+n;S.gyT=S.gyT||{};const g=S.gyT[sk]=S.gyT[sk]&&S.gyT[sk].a!=null?S.gyT[sk]:{a:gxMs(S.gyT[sk]),on:null};
  if(g.on){gyStopAll();}else{gyStopAll();gyStart(k);g.on=Date.now();}S.gyLast=Date.now();renderAll();}
function gyPause(){if(!S.started)return;if(S.started.p){gyStart(S.started.k);}else{gyStopAll();S.started.p=Date.now();toast("Timer paused");}renderAll();}
function gyFinishAsk(){if($("ghpop"))return;const d=DAYS[gyDayI()];if(!d)return;const el=document.createElement("div");el.className="ghpop";el.id="ghpop";
  el.innerHTML=`<div class="gpc" role="dialog" aria-modal="true" aria-label="Finish workout"><b>Finish ${esc(dname(d))}?</b><p>${gyClock(gyEl())} · your sets, reps, kg and times are saved. You can correct them later in Recent.</p>
    <button class="big" style="width:100%" data-gyend="save">Finish &amp; Save</button><button class="btn2" style="width:100%;color:var(--red)" data-gyend="stop">Stop Timer – Don't Save Time</button><button class="btn2" style="width:100%" id="hdLater">Keep Going</button></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("open"));}
function gyFinish(at){const i=gyDayI();if(i<0)return;gyStopAll(at);if(at&&S.started&&!S.started.p)S.started.p=Math.max(S.started.t,at);
  const mins=Math.round(gyEl()/6e4);S.tab="workout";S.view=i;completeWorkout();S.gyRd=null;S.gyLast=null;toast(`Workout saved · ${mins} min`);}
// bar above the tab bar while a workout runs (all tabs): time, workout, current exercise, pause, finish
function gyBar(){let b=$("wbar");if(!gyLive()){b?.remove();document.body.classList.remove("wlive");return;}
  const d=DAYS[gyDayI()],p=planFor(d);let cur="";for(const n of p){if(S.gyT?.[d.key+"|"+n]?.on){cur=n;break;}}
  if(!cur)for(const n of p){const e=d.lib.find(x=>x[0]===n);if(e&&(S.sets[d.key+"|"+n]||0)<nSets(e,d.key)){cur="Next: "+n;break;}}
  if(!b){b=document.createElement("div");b.id="wbar";b.className="wbar";document.body.appendChild(b);}document.body.classList.add("wlive");
  const pz=!!S.started.p;b.innerHTML=`<button class="wbt" data-gyopen="1" aria-label="Open ${esc(dname(d))}"><b id="wbT" class="${pz?"pz":""}">${gyClock(gyEl())}</b><span>${pz?"Paused · ":""}${esc(dname(d))}<i>${esc(cur||"Ready to finish")}</i></span></button>
    <button class="wbp" data-gypz="1" aria-label="${pz?"Resume":"Pause"}">${pz?G.play:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>'}</button><button class="wbf" data-gyfin="1">Finish</button>`;}
setInterval(()=>{if(document.hidden)return;if(S.started&&!S.started.p)for(const id of ["wbT","dsT","hsT"]){const t=$(id);if(t)t.textContent=gyClock(gyEl());}
  document.querySelectorAll("[data-xk]").forEach(x=>{x.textContent=gyClock(gxMs(S.gyT?.[x.dataset.xk]));});if(!!$("wbar")!==gyLive())gyBar();},1000);

// mode button (right end of Start): Gym / Walking / Swimming / Running — walk, swim and run come from Fitbit (views in js/cardio.js, 4d-2)
const GMODES={gym:["Gym","Start Gym Mode",G.play],walk:["Walking","Start Walking",G.walk],swim:["Swimming","Start Swimming",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 13l3-4 3 2 3-3"/><circle cx="17" cy="5" r="1.8"/></svg>'],run:["Running","Start Running",G.run]};
const gyFit=m=>cdList(m)[0];
function gyModeHTML(){const m=GMODES[S.mode]?S.mode:"gym",live=gyLive();let last="";
  if(m==="gym"){const x=[...S.sessions].reverse()[0],d=x&&dayByKey(x.k);last=d?`Last: ${dname(d)} · ${fmtD(x.d,{day:"numeric",month:"short"})}${x.mins?` · ${x.mins} min`:""}`:"No gym sessions yet";}
  else{const e=gyFit(m);last=e?`Last: ${fmtD(String(e.start).slice(0,10),{day:"numeric",month:"short"})} · ${Math.round((e.dur||0)/60)} min${e.km?` · ${r1(e.km)} km`:""}`:"No Fitbit sessions yet";}
  const lab=m==="gym"&&live?`${S.started.p?"Resume Workout":"Continue Workout"} · <span id="hsT">${gyClock(gyEl())}</span>`:GMODES[m][1];
  return `<p class="gylast">${esc(last)}</p><div class="gyrow"><button class="big gystart" id="gymStart">${GMODES[m][2]}${lab}</button><button class="gymode" id="gyMode" aria-label="Change mode: ${GMODES[m][0]}" aria-haspopup="menu">${GMODES[m][2]}<svg class="cv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10l5 5 5-5"/></svg></button></div>`;}
function gyModeMenu(){if($("ghpop"))return;const el=document.createElement("div");el.className="ghpop";el.id="ghpop";const cur=GMODES[S.mode]?S.mode:"gym";
  el.innerHTML=`<div class="gpc gmm" role="menu" aria-label="Mode"><b>Mode</b>${Object.entries(GMODES).map(([k,v])=>`<button class="cell action ${k===cur?"on":""}" role="menuitemradio" aria-checked="${k===cur}" data-gymode="${k}">${v[2]}<span class="lbl">${v[0]}</span>${k===cur?G.check:""}</button>`).join("")}<p>Walking, swimming and running come from your Fitbit.</p></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("open"));}

// leaving the gym without tapping Finish: on reopening away from the gym (or 3 h after the last tap) the workout ends at the last tap
let gyAway=false;
async function gyLeftCheck(){if(!gyLive()||S.started.p||$("ghpop")||gyAway)return;const last=S.gyLast||S.started.t,g=S.gym;let away=Date.now()-last>3*36e5;
  if(!away&&g&&g.lat!=null){try{const c=await gyPos();away=gyDist(g.lat,g.lon,c.latitude,c.longitude)>(g.r||150)+200+Math.min(c.accuracy||0,100);}catch(e){}}
  if(!away||!gyLive()||$("ghpop"))return;gyAway=true;const at=Math.max(last,S.started.t),mins=Math.round((at-S.started.t)/6e4),d=DAYS[gyDayI()];
  const el=document.createElement("div");el.className="ghpop";el.id="ghpop";
  el.innerHTML=`<div class="gpc" role="dialog" aria-modal="true" aria-label="Workout still running"><b>You've left the gym</b><p>${esc(dname(d))} is still running. Save it ending at your last tap (${new Date(at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}, ${mins} min)?</p>
    <button class="big" style="width:100%" data-gyaway="${at}">Save Workout</button><button class="btn2" style="width:100%" id="hdLater">Keep Going</button></div>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("open"));}
addEventListener("load",()=>{setTimeout(()=>{gyLeftCheck().then(()=>{if(!$("ghpop"))gymArrive();});},1500);gyBar();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden){gyAway=false;setTimeout(()=>{gyLeftCheck().then(()=>{if(!$("ghpop"))gymArrive();});},800);gyBar();}});

// correct a finished workout (Recent list → tap)
function gyEditSess(i){const x=S.sessions[i];if(!x)return;const d=dayByKey(x.k);const names=[...new Set([...Object.keys(x.w||{}),...Object.keys(x.x||{}),...Object.keys(x.r||{})])];
  const vals={date:x.d,mins:x.mins??"",done:x.done,cm:x.cm||""};names.forEach((n,j)=>{vals["kg"+j]=x.w?.[n]??"";vals["mn"+j]=x.x?.[n]??"";vals["rp"+j]=(x.r?.[n]||[]).join(", ");});
  openForm({title:d?dname(d):"Workout",values:vals,groups:[{title:"Workout",fields:[{k:"date",label:"Date",type:"date"},{k:"mins",label:"Total time",unit:"min"},{k:"done",label:"Sets done",unit:`of ${x.total}`},{k:"cm",label:"Cardio",unit:"min"}]},
    ...names.map((n,j)=>({title:n,fields:[{k:"kg"+j,label:"Weight",unit:"kg"},{k:"rp"+j,label:"Reps per set",type:"text",ph:"e.g. 10, 10, 8"},{k:"mn"+j,label:"Time",unit:"min"}]}))],
    foot:"",onSave:v=>{if(v.date)x.d=v.date;if(v.mins!=null)x.mins=v.mins;else delete x.mins;if(v.done!=null)x.done=Math.min(v.done,x.total);x.cm=v.cm||0;
      names.forEach((n,j)=>{const kg=v["kg"+j],mn=v["mn"+j],rp=String(v["rp"+j]||"").split(/[,\s]+/).map(Number).filter(z=>z>0);
        x.w=x.w||{};if(kg)x.w[n]=kg;else delete x.w[n];x.x=x.x||{};if(mn)x.x[n]=mn;else delete x.x[n];x.r=x.r||{};if(rp.length)x.r[n]=rp;else delete x.r[n];});
      S.sessions.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);toast("Workout updated");},
    onDelete:()=>{S.sessions.splice(S.sessions.indexOf(x),1);S.count=Math.max(0,S.count-1);toast("Workout deleted");}});}

// your own exercise (Add Exercise sheet → Create Your Own)
function gyAddCustom(){const d=D(),k=d.key;openForm({title:"New Exercise",values:{sets:3,reps:"10"},groups:[{fields:[{k:"name",label:"Name",type:"text",ph:"e.g. Cable crunch"},{k:"grp",label:"Muscle group",type:"text",ph:d.groups[0]},{k:"sets",label:"Sets"},{k:"reps",label:"Reps",type:"text",ph:"10–12"}],foot:"It's added to this workout and stays in its exercise list."}],
  onSave:v=>{const n=String(v.name||"").trim();if(!n)return toast("Give it a name first");if(d.lib.some(e=>e[0].toLowerCase()===n.toLowerCase()))return toast("That exercise is already in the list");
    const e=[n,String(v.grp||"").trim()||"Other","Your own",`${Math.max(1,Math.min(10,Math.round(v.sets||3)))} × ${String(v.reps||"10").trim()}`];S.custom=S.custom||{};(S.custom[k]=S.custom[k]||[]).push(e);d.lib.push(e);
    const p=plan();if(p.length<MAX)p.push(n);toast(p.includes(n)?`${n} added`:"Saved in the list · your workout is full (7)");}});}
function gyLoadCustom(){for(const k in S.custom||{}){const d=dayByKey(k);if(d)for(const e of S.custom[k])if(!d.lib.some(x=>x[0]===e[0]))d.lib.push(e);}}
gyLoadCustom();renderAll();

document.addEventListener("click",ev=>{const b=ev.target.closest("button");
  const ex=!b&&ev.target.closest?.(".ex[data-exn] .exh");if(ex&&S.view!=null&&!S.edit){gyTap(ex.closest(".ex").dataset.exn);return;}
  if(!b)return;const ds=b.dataset;
  if(ds.gyhello){$("ghpop")?.remove();gymPick();return;}
  if(ds.gygo!=null){$("ghpop")?.remove();const r=gymReady();S.gyRd=r?{sc:r.sc,lv:r.lv}:null;const i=+ds.gygo;S.tab="workout";S.view=i;S.edit=false;gyStart(DAYS[i].key);renderAll();scrollTo({top:0});return;}
  if(b.id==="gymStart"){const m=GMODES[S.mode]?S.mode:"gym";if(m!=="gym"){S.tab="activity";S.aseg=m;S.view=null;renderAll();scrollTo({top:0});toast(`Start ${GMODES[m][0].toLowerCase()} on your Fitbit · it shows here after sync`);return;}
    if(gyLive()){S.view=gyDayI();renderAll();scrollTo({top:0});return;}gymPick();return;}
  if(b.id==="gyMode"){gyModeMenu();return;}
  if(ds.gymode){$("ghpop")?.remove();S.mode=ds.gymode;renderAll();return;}
  if(b.id==="gymHere"){const k=D().key;if(gyLive()&&S.started.k===k){gyPause();return;}if(gyLive()){toast(`${dname(DAYS[gyDayI()])} is running · finish it first`);return;}gyStart(k);renderAll();return;}
  if(ds.gyopen){S.tab="workout";S.view=gyDayI();S.edit=false;renderAll();scrollTo({top:0});return;}
  if(ds.gypz){gyPause();return;}
  if(ds.gyfin){gyFinishAsk();return;}
  if(ds.gyend){$("ghpop")?.remove();if(ds.gyend==="save")gyFinish();else{gyStopAll();S.started=null;renderAll();toast("Timer stopped · your sets are kept");}return;}
  if(ds.gyaway){$("ghpop")?.remove();gyFinish(+ds.gyaway);return;}
  if(ds.gyrp){const sk=D().key+"|"+ds.gyrp,e=find(ds.gyrp),dn=S.sets[sk]||0;S.rpc=S.rpc||{};S.rpc[sk]=Math.max(1,Math.min(100,(S.rpc[sk]??gyRep(D().key,ds.gyrp,e,dn))+ +ds.gyd));renderAll();return;}
  if(ds.gyns){const sk=D().key+"|"+ds.gyns,e=find(ds.gyns);S.nsx=S.nsx||{};const v=Math.max(1,Math.min(10,nSets(e,D().key)+ +ds.gyd));if(v===(parseInt(e[3])||3))delete S.nsx[sk];else S.nsx[sk]=v;renderAll();return;}
  if(b.id==="gyCustom"){closeSheets();setTimeout(gyAddCustom,250);return;}
  if(ds.sess!=null){gyEditSess(+ds.sess);return;}
});
