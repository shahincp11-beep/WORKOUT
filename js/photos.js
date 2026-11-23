// ===== Your own photos + look options (Phase 2b) =====
// S.phStyle: "clean" | "bg" | "full" (default full)
// S.phx[slot]: "c" = your photo (kept in IndexedDB), "x" = removed; missing = default photo
// S.matchPh: false turns off photo-matched accent (default on)
const PHSLOTS=[["cable","Workout page","Header"],["bench","Upper A","Day card · chest & triceps photos"],["squat","Lower A","Day card · quads & calves photos"],
  ["pullup","Upper B","Day card · back & biceps photos"],["rdl","Lower B","Day card · hamstrings & glutes photos"],
  ["treadmill","Activity page","Header"],["dumbbells","Health page","Header"],["press","Insights page","Header · shoulders photos"]];
const PHD={},PHC={};// PHD: slot → JPEG data URL (for backups); PHC: slot → blob URL (for showing)
const phDB=()=>new Promise((ok,no)=>{const r=indexedDB.open("workout-photos",1);r.onupgradeneeded=()=>r.result.createObjectStore("p");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
async function phIdb(mode,fn){const db=await phDB();return new Promise((ok,no)=>{const tx=db.transaction("p",mode),st=tx.objectStore("p"),r=fn(st);
  tx.oncomplete=()=>ok(r&&r.result);tx.onerror=tx.onabort=()=>no(tx.error);});}
async function phSet(k,d){PHD[k]=d;if(PHC[k])URL.revokeObjectURL(PHC[k]);PHC[k]=URL.createObjectURL(await (await fetch(d)).blob());}
async function phLoad(){try{const db=await phDB();await new Promise(ok=>{const tx=db.transaction("p"),st=tx.objectStore("p"),c=st.openCursor(),list=[];
    c.onsuccess=()=>{const x=c.result;if(x){list.push([x.key,x.value]);x.continue();}else Promise.all(list.map(([k,v])=>phSet(k,v))).then(ok,ok);};c.onerror=ok;});}catch(e){}}
async function phSave(k,d){await phIdb("readwrite",st=>st.put(d,k));await phSet(k,d);}
// resize + compress on the device
function phRead(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{const m=1400,s=Math.min(1,m/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");
    c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    URL.revokeObjectURL(u);ok({d:c.toDataURL("image/jpeg",.8),hue:phHue(im)});};
  im.onerror=()=>{URL.revokeObjectURL(u);no();};im.src=u;});}
// main colour tone → [hue, lightness] readable on black, or null for grey photos
function phHue(im){const n=40,c=document.createElement("canvas");c.width=c.height=n;const x=c.getContext("2d");x.drawImage(im,0,0,n,n);
  const px=x.getImageData(0,0,n,n).data,bins=new Array(36).fill(0),hs=new Array(36).fill(0);let tot=0;
  for(let i=0;i<px.length;i+=4){const r=px[i]/255,g=px[i+1]/255,b=px[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),ch=mx-mn;if(ch<.12||mx<.12)continue;
    let h=mx===r?((g-b)/ch+6)%6:mx===g?(b-r)/ch+2:(r-g)/ch+4;h*=60;const w=ch*ch,j=Math.min(35,Math.floor(h/10));bins[j]+=w;hs[j]+=h*w;tot+=w;}
  if(tot<n*n*.004)return null;let best=0;bins.forEach((v,j)=>{const s=v+bins[(j+1)%36]*.5+bins[(j+35)%36]*.5;if(s>bins[best]+bins[(best+1)%36]*.5+bins[(best+35)%36]*.5)best=j;});
  const h=hs[best]/bins[best];return [h,h>45&&h<195?48:60];}
function phMatch(hue){if(S.matchPh===false||!hue)return false;
  S.accent={c:[hue,[(hue[0]+30)%360,hue[1]]],fade:!!S.accent?.fade,sel:0,ph:1};applyAccent();return true;}
// Settings → Look
let PHOPEN=null;
function lookUI(){const st=S.phStyle||"full";
  const row=([k,n,sub])=>{const o=S.phx?.[k],u=phSrc(k),open=PHOPEN===k;
    return `<button class="cell phrow" data-phopen="${k}" aria-expanded="${open}"><span class="phth" style="${u?`--img:url(${u})`:""}">${u?"":G.minus}</span><span class="ct"><span class="t1">${n}</span><span class="t2">${o==="c"?"Your photo":o==="x"?"No photo":"Default photo"} · ${sub}</span></span></button>
    ${open?`<div class="cell phact"><label class="phb">Choose Photo<input type="file" accept="image/*" data-phf="${k}" hidden></label>${o!=="x"?`<button class="phb" data-phrm="${k}">Remove</button>`:""}${o?`<button class="phb" data-phdef="${k}">Back to Default</button>`:""}</div>`:""}`;};
  return `<div class="lh">Look</div>
    <div class="group"><div class="cell"><div class="seg" style="flex:1" role="radiogroup" aria-label="Photo style">${[["clean","Clean"],["bg","Background only"],["full","Full"]].map(([k,n])=>`<button class="${st===k?"on":""}" data-phst="${k}" role="radio" aria-checked="${st===k}">${n}</button>`).join("")}</div></div>
      <label class="cell"><span class="ct"><span class="t1">Match Photo Colours</span><span class="t2">A new photo sets the accent colour to its main tone</span></span><input type="checkbox" class="sw" id="matchPh" ${S.matchPh!==false?"checked":""}></label></div>
    <p class="lf">${{clean:"Clean: no photos anywhere.",bg:"Background only: faded photos behind each page, none on cards or exercises.",full:"Full: photos behind each page, on day cards and on exercises."}[st]}</p>
    <div class="lh">Photos</div>
    <div class="group">${PHSLOTS.map(row).join("")}</div>
    <p class="lf">Tap a photo to change or remove it. Your photos stay on this device and are included in backups.</p>`;}
function phSrc(k){const o=S.phx?.[k];if(o==="x")return"";if(o==="c"&&PHC[k])return PHC[k];return PHOK[PH[k]]?new URL(PH[k],location.href).href:"";}
// card=true → day cards and exercise thumbnails (Full only)
const ph=(k,card)=>{const st=S.phStyle||"full";if(!k||st==="clean"||(card&&st!=="full"))return"";return phSrc(k);};
async function phPick(k,file){if(!file)return;toast("Adding photo…");
  try{const r=await phRead(file);await phSave(k,r.d);S.phx[k]="c";const m=phMatch(r.hue);save();renderAll();renderSettings();toast(m?"Photo added · accent matched":"Photo added");}
  catch(e){toast("Couldn't use that photo");}}
document.addEventListener("click",ev=>{const t=ev.target.closest("[data-phopen],[data-phrm],[data-phdef],[data-phst]");if(!t)return;const ds=t.dataset;ev.stopImmediatePropagation();
  if(ds.phst){S.phStyle=ds.phst;save();renderAll();renderSettings();return;}
  if(ds.phopen){PHOPEN=PHOPEN===ds.phopen?null:ds.phopen;renderSettings();return;}
  if(ds.phrm){S.phx[ds.phrm]="x";save();renderAll();renderSettings();toast("Photo removed");return;}
  if(ds.phdef){delete S.phx[ds.phdef];save();renderAll();renderSettings();toast("Default photo back");return;}},true);
document.addEventListener("change",ev=>{const el=ev.target;
  if(el.dataset?.phf){phPick(el.dataset.phf,el.files[0]);el.value="";ev.stopImmediatePropagation();return;}
  if(el.id==="matchPh"){S.matchPh=el.checked;save();ev.stopImmediatePropagation();}},true);
