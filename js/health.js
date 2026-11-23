// Phase 4b – Google Health data in the app (sync, store, show).
// Stored on this device in localStorage "workout_health" (HD), separate from your workout data S.
// Included in Export Backup as "health". Re-syncing never deletes older days.
const HDK = "workout_health";
let HD = (() => { try { return JSON.parse(localStorage.getItem(HDK)) || {}; } catch { return {}; } })();
HD.days = HD.days || {}; HD.sleep = HD.sleep || []; HD.ex = HD.ex || []; HD.weight = HD.weight || [];
const hdSave = () => { try { localStorage.setItem(HDK, JSON.stringify(HD)); } catch { toast("Couldn't save health data – storage full?"); } };
let hdBusy = false, hdPopShown = false;

// ---------- reading Google's roll-up values (field names vary, so pick by pattern) ----------
const pk = (o, re, not) => { if (!o) return null; const k = Object.keys(o).find(k => re.test(k) && (!not || !not.test(k)) && typeof o[k] === "number"); return k ? o[k] : null; };
const ZN = /FAT_BURN|CARDIO|PEAK|LIGHT|MODERATE|VIGOROUS|SEDENTARY|LIGHTLY|VERY|ZONE_\d|fatBurn|cardio|peak/i;
const perTag = (o, re) => { const r = {}; if (!o) return r; for (const [k, v] of Object.entries(o)) if (typeof v === "number" && re.test(k)) { const m = k.match(ZN); if (m) r[m[0].toUpperCase()] = (r[m[0].toUpperCase()] || 0) + v; } return r; };
const toMin = (o, v) => v == null ? null : Object.keys(o || {}).some(k => /millis/i.test(k)) ? v / 6e4 : v / 60;
const sumv = o => { const v = Object.values(o); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
function hdDerive(d) {
  const x = {}, set = (k, v) => { if (v != null && !isNaN(v)) x[k] = Math.round(v * 100) / 100; };
  set("steps", pk(d.r_steps, /sum/i) ?? pk(d.r_steps, /count/i));
  const mm = pk(d.r_distance, /sum/i) ?? pk(d.r_distance, /millimeters/i); set("km", mm != null ? mm / 1e6 : null);
  set("kcal", pk(d.r_totalCalories, /sum/i) ?? pk(d.r_totalCalories, /kcal/i));
  set("akcal", pk(d.r_activeEnergyBurned, /sum/i) ?? pk(d.r_activeEnergyBurned, /kcal/i));
  const az = d.r_activeZoneMinutes; if (az) { const z = perTag(az, /sum|minutes/i), t = pk(az, /sum/i, ZN); set("azm", t ?? sumv(z)); if (Object.keys(z).length) x.azmZ = z; }
  const am = d.r_activeMinutes; if (am) { const z = perTag(am, /sum|minutes/i); set("amin", sumv(z) ?? pk(am, /sum/i)); if (Object.keys(z).length) x.aminL = z; }
  const hr = d.r_heartRate; if (hr) { set("hrAvg", pk(hr, /(avg|average|mean)$/i) ?? pk(hr, /avg|mean/i)); set("hrMin", pk(hr, /(min|minimum)$/i)); set("hrMax", pk(hr, /(max|maximum)$/i)); }
  const sd = d.r_sedentaryPeriod; if (sd) set("sed", toMin(sd, pk(sd, /sum|duration/i)));
  const hz = d.r_timeInHeartRateZone; if (hz) { const z = perTag(hz, /./); for (const k in z) z[k] = Math.round(toMin(hz, z[k])); if (Object.keys(z).length) x.hz = z; }
  for (const k of ["rhr", "hrv", "hrvDeep", "nremHr", "spo2", "spo2Lo", "spo2Hi", "br", "temp", "tempBase", "zones"]) if (d[k] != null) x[k] = d[k];
  return x;
}
function hdMerge(r) {
  const raw = {};
  for (const [d, v] of Object.entries(r.days || {})) { HD.days[d] = { ...(HD.days[d] || {}), ...hdDerive(v) }; if (d === r.to) Object.assign(raw, v); }
  const upd = (old, nw, f, keep) => { const m = new Map(old.map(o => [f(o), o])); nw.forEach(o => m.set(f(o), o)); return [...m.values()].sort((a, b) => String(f(b)).localeCompare(String(f(a)))).slice(0, keep); };
  HD.sleep = upd(HD.sleep, r.sleep || [], s => s.start, 400).map((s, i) => i < 21 ? s : { ...s, tl: undefined });
  HD.ex = upd(HD.ex, r.ex || [], e => e.start, 400);
  HD.weight = upd(HD.weight.map(w => ({ d: w[0], kg: w[1] })), (r.weight || []).map(w => ({ d: w[0], kg: w[1] })), w => w.d, 400).map(w => [w.d, w.kg]);
  if (r.heightCm) HD.heightCm = r.heightCm;
  if (r.hrToday) HD.hrToday = { d: r.to, pts: r.hrToday.map(([t, v]) => [t, pk(v, /(avg|average|mean)$/i) ?? pk(v, /avg|mean/i), pk(v, /(min|minimum)$/i), pk(v, /(max|maximum)$/i)]).filter(p => p[1] != null) };
  if (r.stepsToday) HD.stepsToday = { d: r.to, pts: r.stepsToday.map(([t, v]) => [t, pk(v, /sum|count/i) || 0]) };
  HD.devices = r.devices || HD.devices; HD.errs = r.errs || {}; HD.raw = raw; HD.at = r.at || Date.now();
}

// ---------- sync ----------
async function hdSync(manual) {
  if (!GH.url || !GH.key) { if (manual) { toast("Set up Google Health in Settings first"); openSettings(); } return; }
  if (hdBusy) return; hdBusy = true; hdRe();
  try {
    const days = HD.at ? Math.max(3, Math.min(30, Math.ceil((Date.now() - HD.at) / 864e5) + 2)) : 30;
    const r = await ghCall("/api/sync?days=" + days);
    hdMerge(r); hdSave(); GH.st = { ...(GH.st || {}), connected: true, expired: false }; ghSave();
    if (manual) toast(Object.keys(HD.errs).length ? "Synced (some data types failed – see Settings)" : "Synced with Google Health");
  } catch (e) {
    if (e.reconnect) { GH.st = { connected: false, expired: true }; ghSave(); hdPop(); }
    else if (manual) toast(e.message.length > 60 ? "Could not reach the server" : e.message);
  }
  hdBusy = false; hdRe();
}
const hdRe = () => { try { renderAll(); ghRe(); } catch {} };
const hdDue = () => GH.url && GH.key && !GH.st?.expired && (!HD.at || Date.now() - HD.at > 55 * 6e4);
const hdAuto = () => { if (GH.st?.expired) hdPop(); else if (hdDue()) hdSync(false); };
addEventListener("load", () => {
  const q = new URLSearchParams(location.search);
  if (q.has("sync")) { history.replaceState(null, "", location.pathname); setTimeout(() => hdSync(true), 400); }
  else setTimeout(hdAuto, 1200);
  if (q.has("start")) { history.replaceState(null, "", location.pathname); setTimeout(hdStartPick, 500); }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) hdAuto(); });
setInterval(() => { if (!document.hidden && hdDue()) hdSync(false); }, 10 * 6e4);

// One-tap reconnect pop-up (Google testing mode signs you out about weekly)
function hdPop() {
  if (hdPopShown || !GH.url || !GH.key) return; hdPopShown = true;
  const el = document.createElement("div"); el.className = "ghpop"; el.id = "ghpop";
  el.innerHTML = `<div class="gpc" role="dialog" aria-modal="true" aria-label="Reconnect Google"><span class="itile" style="--ic:var(--pink)">${G.pulse}</span>
    <b>Reconnect Google Health</b><p>Google signs you out about once a week while the app is in testing. One tap signs you back in – nothing is lost.</p>
    <button class="big" id="hdRe">Reconnect Google</button><button class="btn2" id="hdLater">Not Now</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("open"));
}
// Gym arrival / widget: ?start=1 asks which workout, then opens it
function hdStartPick() {
  const el = document.createElement("div"); el.className = "ghpop"; el.id = "ghpop";
  el.innerHTML = `<div class="gpc" role="dialog" aria-modal="true" aria-label="Start workout"><span class="itile" style="--ic:var(--tint)">${G.dumbbell}</span>
    <b>Which workout?</b><p>Up next: ${esc(dname(DAYS[S.day]))}</p>
    ${DAYS.map((d, i) => `<button class="${i === S.day ? "big" : "btn2"}" data-hdgo="${i}">${esc(dname(d))}</button>`).join("")}<button class="btn2" id="hdLater">Not Now</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("open"));
}
const hdPopClose = () => $("ghpop")?.remove();
document.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (e.target.id === "ghpop") return hdPopClose();
  if (!b) return;
  if (b.id === "hdLater") hdPopClose();
  if (b.id === "hdRe") { hdPopClose(); ghRun("connect", async () => { const { url } = await ghCall("/auth/start", "POST"); location.assign(url); }); }
  if (b.dataset.hdgo != null) { hdPopClose(); S.tab = "workout"; S.view = +b.dataset.hdgo; S.started = { k: DAYS[S.view].key, t: Date.now() }; save(); renderAll(); scrollTo({ top: 0 }); toast("Workout started"); }
  if (b.dataset.hdsync != null) hdSync(true);
});

// ---------- values for the rest of the app ----------
const hdMain = d => HD.sleep.filter(s => s.end === d && !s.nap).sort((a, b) => (b.asleep || 0) - (a.asleep || 0))[0];
// Google values for one day, in the app's own field names (used by actDay)
function ghAct(d) {
  const x = HD.days[d] || {}, o = {}, s = hdMain(d);
  if (x.steps != null) o.steps = x.steps; if (x.azm != null) o.azm = x.azm; if (x.rhr != null) o.rhr = x.rhr;
  if (x.hrv != null) o.hrv = x.hrv; if (x.kcal != null) o.kcal = x.kcal; if (s?.asleep != null) o.sleep = Math.round(s.asleep / 6) / 10;
  return o;
}
const hdAgo = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : fmtD(ymd(new Date(t)), { day: "numeric", month: "short" }); };
const hdFoot = () => GH.url && GH.key ? `<button class="hsync" data-hdsync>${hdBusy ? "Syncing…" : GH.st?.expired ? "Reconnect needed" : HD.at ? "Synced " + hdAgo(HD.at) : "Sync now"}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="${hdBusy ? "spin" : ""}"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 13a8 8 0 0 0 14.3 4.9L20 16M4 4v4h4M20 20v-4h-4"/></svg></button>` : "";
const hdHM = m => m == null ? "—" : `${Math.floor(m / 60)}<small>h</small> ${String(Math.round(m % 60)).padStart(2, "0")}<small>m</small>`;
const hdHMt = m => m == null ? "—" : `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m`;
const hdT = iso => iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
const ST = [["DEEP", "Deep", "--indigo"], ["REM", "REM", "--cyan"], ["LIGHT", "Light", "--blue"], ["AWAKE", "Awake", "--orange"]];
// Simple sleep score (app estimate – Google doesn't share its own score): duration 50, deep+REM 30, restlessness 20
function hdScore(s) {
  if (!s?.asleep) return null; const st = s.stages || {}, tot = s.asleep;
  const dur = Math.min(1, tot / 450) * 50, dr = st.DEEP != null && st.REM != null ? Math.min(1, (st.DEEP + st.REM) / (tot * .4)) * 30 : 20;
  const aw = Math.max(0, 1 - (st.AWAKE ?? s.awake ?? 0) / Math.max(60, tot * .25)) * 20; return Math.round(dur + dr + aw);
}
function hdHyp(s) { // sleep stage timeline
  if (!s.tl?.length) return ""; const W = 320, H = 70, tot = Math.max(...s.tl.map(t => t[1] + t[2]), 1), row = { A: 0, R: 1, L: 2, D: 3 }, col = { A: "--orange", R: "--cyan", L: "--blue", D: "--indigo" };
  return `<svg class="cv hyp" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sleep stages through the night">${s.tl.filter(t => row[t[0]] != null).map(t => `<rect x="${(t[1] / tot * W).toFixed(1)}" y="${row[t[0]] * 16 + 2}" width="${Math.max(1, t[2] / tot * W).toFixed(1)}" height="12" rx="2" style="fill:var(${col[t[0]]})"/>`).join("")}
    <text x="0" y="${H - 1}">${hdT(s.start)}</text><text x="${W}" y="${H - 1}" text-anchor="end">${hdT(s.stop)}</text></svg>`;
}
// Health tab – top sleep card
function hdSleepCard() {
  const s = hdMain(today()) || hdMain(daysAgo(1));
  if (!s) return "";
  const st = s.stages || {}, has = ST.some(([k]) => st[k] != null), sc = hdScore(s), tot = ST.reduce((a, [k]) => a + (st[k] || 0), 0) || 1;
  return `<div class="card slc"><div class="chh"><b>Sleep</b><span>${s.end === today() ? "Last night" : fmtD(s.end, { weekday: "short", day: "numeric", month: "short" })}</span></div>
    <div class="slrow"><div class="slv"><span>${hdHM(s.asleep)}</span><span class="t2">${hdT(s.start)} – ${hdT(s.stop)}</span></div>${sc != null ? `<div class="slsc" style="--p:${sc}"><b>${sc}</b><span>score</span></div>` : ""}</div>
    ${has ? `<div class="stages" aria-hidden="true">${ST.map(([k, , c]) => st[k] ? `<i style="flex:${st[k]};background:var(${c})"></i>` : "").join("")}</div>
    <div class="slleg">${ST.map(([k, n, c]) => `<span style="--c:var(${c})"><i></i>${n}<b>${hdHMt(st[k])}</b><em>${st[k] != null ? Math.round(st[k] / tot * 100) + "%" : ""}</em></span>`).join("")}</div>` : ""}
    ${hdHyp(s)}
    <span class="t2">${[s.inBed ? "In bed " + hdHMt(s.inBed) : "", s.toSleep != null ? `fell asleep in ${s.toSleep} min` : "", s.awake != null ? `awake ${s.awake} min` : ""].filter(Boolean).join(" · ")}. Score is the app's estimate.</span></div>`;
}
// Health tab – extra Google tiles
function hdTiles() {
  const t = HD.days[today()] || {}, y = HD.days[daysAgo(1)] || {}, n = (a, b) => a ?? b;
  const w = HD.weight[0], tdev = t.temp != null && t.tempBase != null ? t.temp - t.tempBase : y.temp != null && y.tempBase != null ? y.temp - y.tempBase : null;
  const T = [[G.heart, "Heart Rate", "--red", t.hrAvg != null ? Math.round(t.hrAvg) : null, "bpm avg", t.hrMin != null ? `Range ${Math.round(t.hrMin)}–${Math.round(t.hrMax)}` : "Today"],
    [G.drop, "SpO₂", "--cyan", n(t.spo2, y.spo2) != null ? r1(n(t.spo2, y.spo2)) : null, "%", n(t.spo2Lo, y.spo2Lo) != null ? `Range ${r1(n(t.spo2Lo, y.spo2Lo))}–${r1(n(t.spo2Hi, y.spo2Hi))}%` : "During sleep"],
    [G.wave, "Breathing Rate", "--mint", n(t.br, y.br) != null ? r1(n(t.br, y.br)) : null, "/min", "During sleep"],
    [G.flame, "Skin Temp", "--orange", tdev != null ? (tdev > 0 ? "+" : "") + tdev.toFixed(1) : null, "°C", "vs your baseline"],
    [G.scale, "Weight", "--purple", w ? r1(w[1]) : null, "kg", w ? fmtD(w[0], { day: "numeric", month: "short" }) : "From Google Health"]];
  return T.map(([ic, nm, c, v, u, g]) => `<div class="mt" style="--c:var(${c})"><span class="mk">${ic}${nm}</span><span class="mv ${v == null ? "none" : ""}">${v ?? "—"}${v != null ? `<small>${u}</small>` : ""}</span><span class="mg">${g}</span></div>`).join("");
}
const ZC = { PEAK: "--red", CARDIO: "--orange", FAT_BURN: "--yellow", LIGHT: "--green", MODERATE: "--orange", VIGOROUS: "--red" };
const ZL = { PEAK: "Peak", CARDIO: "Cardio", FAT_BURN: "Fat burn", LIGHT: "Light", MODERATE: "Moderate", VIGOROUS: "Vigorous", SEDENTARY: "Sedentary", LIGHTLY: "Lightly active", VERY: "Very active" };
const hdBars = o => { const e = Object.entries(o || {}).filter(([, v]) => v > 0), m = Math.max(1, ...e.map(([, v]) => v)); return e.map(([k, v]) => `<div class="zb" style="--c:var(${ZC[k] || "--tint"})"><span>${ZL[k] || k}</span><i><b style="width:${v / m * 100}%"></b></i><em>${Math.round(v)} min</em></div>`).join(""); };
// Health tab – heart section (today)
function hdHeart() {
  const h = HD.hrToday?.d === today() ? HD.hrToday.pts : [], t = HD.days[today()] || {}, z = (HD.days[today()]?.zones || HD.days[daysAgo(1)]?.zones || []);
  if (!h.length && !t.hz && !z.length) return "";
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const pts = h.map(p => ({ x: Math.round((Date.parse(p[0]) - t0) / 9e5), v: Math.round(p[1]) }));
  return `<section class="sec"><div class="sh"><h2>Heart</h2><span class="hacc">Today</span></div>
    ${pts.length ? `<div class="chart"><div class="chh"><b>Heart rate</b><span>${t.hrMin != null ? `${Math.round(t.hrMin)}–${Math.round(t.hrMax)} bpm` : ""}</span></div>${lineChart(pts, 96, ["12 am", "Now"], "--red", v => v)}</div>` : ""}
    ${t.hz ? `<div class="chart"><div class="chh"><b>Time in heart rate zones</b><span>${Math.round(sumv(t.hz) || 0)} min</span></div><div class="zbars">${hdBars(t.hz)}</div></div>` : ""}
    ${t.azmZ ? `<div class="chart"><div class="chh"><b>Active Zone Minutes</b><span>${Math.round(t.azm || 0)} min</span></div><div class="zbars">${hdBars(t.azmZ)}</div></div>` : ""}
    ${z.length ? `<div class="group">${z.filter(x => x[1] != null).map(x => `<div class="cell"><span class="ct"><span class="t1">${ZL[x[0]] || esc(String(x[0]).replace(/_/g, " ").toLowerCase())}</span></span><span class="t2" style="margin-left:auto">${x[1]}–${x[2]} bpm</span></div>`).join("")}</div><p class="gf">Your personal heart rate zones from Google.</p>` : ""}</section>`;
}
// Health tab – "Vitals" segment: 30-day trends
const hdSeries = (k, n = 30) => Array.from({ length: n }, (_, i) => { const d = daysAgo(n - 1 - i); return { x: i, v: HD.days[d]?.[k] ?? null }; }).filter(p => p.v != null);
function hdTrend(title, k, c, fmt, unit, n = 30, tf) {
  const p = hdSeries(k, n).map(q => tf ? { x: q.x, v: tf(q.v, HD.days[daysAgo(n - 1 - q.x)]) } : q).filter(q => q.v != null); if (!p.length) return "";
  const a = p.reduce((s, q) => s + q.v, 0) / p.length;
  return `<div class="chart"><div class="chh"><b>${title}</b><span>avg ${fmt(a)}${unit}</span></div>${lineChart(p, n, ["30 days ago", "Today"], c, fmt)}</div>`;
}
function hdVitals() {
  const nights = Array.from({ length: 14 }, (_, i) => hdMain(daysAgo(13 - i)));
  const has = nights.some(Boolean), mx = Math.max(1, ...nights.map(s => s ? (s.asleep || 0) + (s.stages?.AWAKE || 0) : 0));
  const sleep = has ? `<div class="chart"><div class="chh"><b>Sleep stages</b><span>14 nights</span></div><div class="sbars">${nights.map((s, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i);
    return `<div><span class="sb">${s ? (ST.some(([k]) => s.stages?.[k] != null) ? [...ST].reverse().map(([k, , c]) => s.stages[k] ? `<i style="height:${s.stages[k] / mx * 100}%;background:var(${c})"></i>` : "").join("") : `<i style="height:${(s.asleep || 0) / mx * 100}%;background:var(--indigo)"></i>`) : ""}</span><em>${"SMTWTFS"[d.getDay()]}</em></div>`; }).join("")}</div>
    <div class="slleg">${ST.map(([k, n, c]) => `<span style="--c:var(${c})"><i></i>${n}</span>`).join("")}</div></div>` : "";
  const wt = [...HD.weight].reverse().slice(-30), w = wt.length > 1 ? `<div class="chart"><div class="chh"><b>Weight</b><span>${r1(wt[wt.length - 1][1])} kg</span></div>${lineChart(wt.map((x, i) => ({ x: i, v: x[1] })), wt.length, [fmtD(wt[0][0], { day: "numeric", month: "short" }), fmtD(wt[wt.length - 1][0], { day: "numeric", month: "short" })], "--purple", v => r1(v))}</div>` : "";
  const body = sleep + hdTrend("Resting heart rate", "rhr", "--red", v => Math.round(v), " bpm") + hdTrend("Heart rate variability", "hrv", "--cyan", v => Math.round(v), " ms")
    + hdTrend("Blood oxygen (SpO₂)", "spo2", "--cyan", v => r1(v), "%") + hdTrend("Breathing rate", "br", "--mint", v => r1(v), "/min")
    + hdTrend("Skin temperature", "temp", "--orange", v => (v > 0 ? "+" : "") + v.toFixed(1), "°C", 30, (v, d) => d?.tempBase != null ? v - d.tempBase : null) + w;
  $("healthBody").innerHTML = `<section class="sec"><div class="sh"><h2>Vitals</h2><span class="hacc">From Google Health</span></div>${body ? `<div class="charts">${body}</div>` : `<div class="group">${emptyCell("No vitals yet", GH.url ? "Tap Sync to bring in your Fitbit Air data." : "Connect Google Health in Settings to see sleep, heart and breathing trends.")}</div>`}
    <p class="gf">Skin temperature shows the change from your own baseline. These are trends, not medical advice.</p></section>`;
}
// Activity tab – Google sections
const EXN = t => (t || "Workout").replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase());
function hdActivity() {
  const t = HD.days[today()] || {};
  if (!HD.at) return "";
  const T = [[G.run, "Distance", "--green", t.km != null ? r1(t.km) : null, "km"], [G.flame, "Calories", "--pink", t.kcal != null ? Math.round(t.kcal).toLocaleString() : null, "kcal"],
    [G.bolt, "Active Calories", "--orange", t.akcal != null ? Math.round(t.akcal).toLocaleString() : null, "kcal"], [G.pulse, "Active Minutes", "--mint", t.amin != null ? Math.round(t.amin) : null, "min"],
    [G.moon, "Sedentary", "--indigo", t.sed != null ? hdHMt(t.sed) : null, ""], [G.heart, "Resting HR", "--red", t.rhr ?? null, "bpm"]];
  const sp = HD.stepsToday?.d === today() ? HD.stepsToday.pts : [], hrs = Array(24).fill(null);
  sp.forEach(([iso, v]) => { const h = new Date(iso).getHours(); hrs[h] = (hrs[h] || 0) + v; });
  const nowH = new Date().getHours(), lab = hrs.map((_, i) => i % 6 === 0 ? (i === 0 ? "12a" : i === 12 ? "12p" : (i % 12) + (i < 12 ? "a" : "p")) : "");
  const ex = HD.ex.filter(e => e.start >= daysAgo(14));
  return `<section class="sec"><div class="sh"><h2>Today</h2><span class="hacc">Fitbit Air</span></div>
    <div class="tiles">${T.map(([ic, nm, c, v, u]) => `<div class="mt" style="--c:var(${c})"><span class="mk">${ic}${nm}</span><span class="mv ${v == null ? "none" : ""}">${v ?? "—"}${v != null && u ? `<small>${u}</small>` : ""}</span></div>`).join("")}</div>
    ${sp.length ? `<div class="chart" style="margin-top:10px"><div class="chh"><b>Steps by hour</b><span>${(t.steps ?? 0).toLocaleString()}</span></div>${barChart(hrs.map((v, i) => i <= nowH ? v || 0 : null), lab, 0, "--orange", v => v >= 1000 ? r1(v / 1000) + "k" : v)}</div>` : ""}
    ${t.aminL ? `<div class="chart" style="margin-top:10px"><div class="chh"><b>Active minutes by intensity</b><span>${Math.round(t.amin || 0)} min</span></div><div class="zbars">${hdBars(t.aminL)}</div></div>` : ""}</section>
  <section class="sec"><div class="sh"><h2>Fitbit Workouts</h2><span class="hacc">Last 14 days</span></div>
    <div class="group">${ex.length ? ex.map(e => `<div class="cell ins" style="--inset:58px"><span class="itile" style="--ic:var(--green)">${/WEIGHT|STRENGTH/.test(e.type || "") ? G.dumbbell : G.run}</span><span class="ct"><span class="t1">${esc(e.name || EXN(e.type))}</span><span class="t2">${fmtD(ymd(new Date(e.start)), { weekday: "short", day: "numeric", month: "short" })} · ${hdT(e.start)}${e.hr ? ` · avg ${e.hr} bpm` : ""}${e.km ? ` · ${r1(e.km)} km` : ""}${e.azm ? ` · ${e.azm} zone min` : ""}</span></span><span class="t2" style="margin-left:auto;text-align:right;font-variant-numeric:tabular-nums">${e.dur ? Math.round(e.dur / 60) + " min" : ""}${e.kcal ? `<br>${Math.round(e.kcal)} kcal` : ""}</span></div>`).join("") : emptyCell("No Fitbit workouts", "Workouts you record on your Fitbit Air show up here.")}</div></section>`;
}
// Insights – extra quick checks
function hdInsights(add) {
  const a = k => { const v = hdSeries(k, 7).map(p => p.v); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; }, b = k => { const v = hdSeries(k, 30).map(p => p.v); return v.length >= 10 ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const hv = a("hrv"), hb = b("hrv"); if (hv != null) add(G.wave, "--cyan", "Heart rate variability", `7-day average ${Math.round(hv)} ms${hb ? `, ${hv >= hb ? "at or above" : "below"} your 30-day ${Math.round(hb)} ms` : ""}. ${hb && hv < hb * .9 ? "Recovery is lower – take it easier today." : "Recovery looks normal."}`, hb && hv < hb * .9 ? "watch" : "ok");
  const ns = Array.from({ length: 7 }, (_, i) => hdMain(daysAgo(i))).filter(s => s?.stages?.DEEP != null && s.asleep);
  if (ns.length) { const dp = ns.reduce((s, x) => s + x.stages.DEEP / x.asleep, 0) / ns.length * 100, rp = ns.reduce((s, x) => s + (x.stages.REM || 0) / x.asleep, 0) / ns.length * 100;
    add(G.moon, "--indigo", "Sleep quality", `Deep ${Math.round(dp)}% and REM ${Math.round(rp)}% of sleep over ${ns.length} nights.${dp < 12 ? " Low deep sleep – keep a regular sleep time and avoid late caffeine." : ""}`, dp >= 12 && rp >= 15 ? "ok" : "info"); }
  const o = a("spo2"); if (o != null) add(G.drop, "--cyan", "Blood oxygen", `7-night average ${r1(o)}%. ${o >= 95 ? "Normal range." : "Lower than usual – mention it to your doctor if it stays under 95%."}`, o >= 95 ? "ok" : "watch");
  const br = a("br"), bb = b("br"); if (br != null) add(G.wave, "--mint", "Breathing rate", `${r1(br)} breaths/min during sleep${bb ? ` (30-day ${r1(bb)})` : ""}.`, bb && br > bb + 1.5 ? "watch" : "ok");
  const ex = HD.ex.filter(e => e.start >= daysAgo(6)); if (HD.at) add(G.run, "--green", "Fitbit workouts this week", ex.length ? `${ex.length} recorded, ${Math.round(ex.reduce((s, e) => s + (e.dur || 0), 0) / 60)} min, ${Math.round(ex.reduce((s, e) => s + (e.kcal || 0), 0))} kcal.` : "None recorded on your Fitbit Air.", ex.length ? "ok" : "info");
}
// Report for Claude – Google data block
function hdReport() {
  if (!HD.at) return [];
  const L = ["", "## Google Health – sleep (last 14 nights)"], ns = HD.sleep.filter(s => s.end >= daysAgo(14) && !s.nap);
  L.push(ns.length ? ["| Night ending | Asleep | Deep | REM | Light | Awake | Bed – wake |", "|---|---|---|---|---|---|---|", ...ns.map(s => `| ${s.end} | ${hdHMt(s.asleep)} | ${s.stages?.DEEP ?? ""} | ${s.stages?.REM ?? ""} | ${s.stages?.LIGHT ?? ""} | ${s.stages?.AWAKE ?? s.awake ?? ""} | ${hdT(s.start)} – ${hdT(s.stop)} |`)].join("\n") : "- None");
  const ds = Object.keys(HD.days).filter(d => d >= daysAgo(21)).sort();
  L.push("", "## Google Health – daily vitals (last 21 days)", ["| Date | Distance km | Active min | Avg HR | SpO₂ % | Breathing /min | Skin temp Δ°C |", "|---|---|---|---|---|---|---|",
    ...ds.map(d => { const x = HD.days[d]; return `| ${d} | ${x.km != null ? r1(x.km) : ""} | ${x.amin != null ? Math.round(x.amin) : ""} | ${x.hrAvg != null ? Math.round(x.hrAvg) : ""} | ${x.spo2 ?? ""} | ${x.br ?? ""} | ${x.temp != null && x.tempBase != null ? (x.temp - x.tempBase).toFixed(1) : ""} |`; })].join("\n"));
  const ex = HD.ex.filter(e => e.start >= daysAgo(30));
  L.push("", "## Fitbit workouts (last 30 days)", ex.length ? ex.map(e => `- ${e.start.slice(0, 10)} ${e.name || EXN(e.type)}: ${e.dur ? Math.round(e.dur / 60) + " min" : ""}${e.hr ? `, avg HR ${e.hr}` : ""}${e.kcal ? `, ${Math.round(e.kcal)} kcal` : ""}${e.azm ? `, ${e.azm} zone min` : ""}`).join("\n") : "- None");
  if (HD.weight.length) L.push("", "## Weight from Google Health", HD.weight.slice(0, 10).map(w => `- ${w[0]}: ${r1(w[1])} kg`).join("\n"));
  return L;
}
// Settings – sync part of the Google section
function hdSettings() {
  if (!GH.url || !GH.key) return "";
  const e = Object.entries(HD.errs || {}), nd = Object.keys(HD.days).length;
  return `<div class="lh">Sync</div><div class="group">
    ${ghRow("Last sync", HD.at ? new Date(HD.at).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Never", nd ? `${nd} days, ${HD.sleep.length} nights, ${HD.ex.length} workouts stored` : "")}
    <button class="cell action" data-hdsync><span class="lbl">${hdBusy ? "Syncing…" : "Sync Now"}</span></button>
    ${e.map(([k, m]) => ghRow(`<span style="color:#ff9f0a">!</span> ${ghName(k)}`, "Failed", esc(m))).join("")}</div>
  <p class="lf">Syncs when you open the app and every hour while it's open. Older days are never deleted.</p>
  ${HD.raw && Object.keys(HD.raw).length ? `<details class="lf"><summary>Today's raw values (for checking)</summary><pre style="white-space:pre-wrap;font-size:11px">${esc(JSON.stringify(HD.raw, null, 1))}</pre></details>` : ""}`;
}
