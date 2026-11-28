// Phase 4d-2 – Walking, Swimming, Running from your Fitbit (Google Health HD.ex). Read only: nothing is typed in by hand.
// Activity tab segment S.aseg: today / walk / swim / run. Home "Start Walking/Swimming/Running" opens the matching segment.
const CDM = { walk: ["Walking", "walk", "walks", /walk|hik|treadmill/i], swim: ["Swimming", "swim", "swims", /swim/i], run: ["Running", "run", "runs", /run/i] };
const cdIs = (e, m) => { const s = (e.type || "") + " " + (e.name || ""); return m === "walk" ? CDM.walk[3].test(s) && !/run/i.test(s) : CDM[m][3].test(s); };
const cdDay = e => ymd(new Date(e.start));
const cdMon = d => { const x = new Date(d + "T12:00"); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return ymd(x); };
const cdList = m => HD.ex.filter(e => e.start && cdIs(e, m)).sort((a, b) => (a.start < b.start ? 1 : -1));
const cdSwimDay = e => HD.ex.filter(x => cdIs(x, "swim") && cdDay(x) === cdDay(e)).length === 1 ? HD.days[cdDay(e)]?.swimL : null;
const cdLaps = e => e.laps ?? cdSwimDay(e) ?? null;
// pace: seconds per km (walk/run) or per 100 m (swim)
const cdPace = (e, m) => { const per = m === "swim" ? 100 : 1000; if (e.pace) return e.pace * per; return e.km && e.dur ? e.dur / (e.km * 1000) * per : null; };
const cdPF = s => s == null ? "—" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const cdPU = m => m === "swim" ? "/100 m" : "/km";
const cdDist = (km, m) => km == null ? null : m === "swim" ? Math.round(km * 1000).toLocaleString() : km.toFixed(km < 10 ? 2 : 1);
const cdDU = m => m === "swim" ? "m" : "km";
const cdMin = s => s ? Math.round(s / 60) : 0;
const cdZ = [["Light", "--green"], ["Moderate", "--orange"], ["Vigorous", "--pink"], ["Peak", "--red"]];
const cdZones = e => { const z = e.zones || [], m = Math.max(1, ...z.map(v => v || 0)); return z.some(v => v > 0) ? `<div class="zbars">${cdZ.map(([n, c], i) => z[i] > 0 ? `<div class="zb" style="--c:var(${c})"><span>${n}</span><i><b style="width:${z[i] / m * 100}%"></b></i><em>${cdMin(z[i])} min</em></div>` : "").join("")}</div>` : ""; };
const cdIc = m => m === "swim" ? GMODES.swim[2] : m === "run" ? G.run : G.walk;
const cdC = { walk: "--orange", swim: "--cyan", run: "--green" };

function cdSeg() { const s = S.aseg || "today"; return `<div class="seg hseg cdseg" role="tablist">${[["today", "Today"], ["walk", "Walking"], ["swim", "Swimming"], ["run", "Running"]].map(([k, n]) => `<button class="${s === k ? "on" : ""}" data-aseg="${k}" role="tab" aria-selected="${s === k}">${n}</button>`).join("")}</div>`; }

function cdTiles(e, m) {
  const p = cdPace(e, m), l = cdLaps(e);
  const T = [[G.pulse, "Time", "--tint", e.dur ? (e.dur < 3600 ? cdMin(e.dur) : hdHMt(e.dur / 60)) : null, e.dur && e.dur < 3600 ? "min" : ""], [cdIc(m), "Distance", cdC[m], cdDist(e.km, m), cdDU(m)],
    [G.bolt, "Avg Pace", "--mint", p ? cdPF(p) : null, cdPU(m)], m === "swim" ? [G.wave, "Laps", "--cyan", l != null ? Math.round(l) : null, ""] : [G.walk, "Steps", "--orange", e.steps ? Math.round(e.steps).toLocaleString() : null, ""],
    [G.heart, "Avg Heart Rate", "--red", e.hr ? Math.round(e.hr) : null, "bpm"], [G.flame, "Calories", "--pink", e.kcal ? Math.round(e.kcal) : null, "kcal"]];
  return `<div class="tiles">${T.map(([ic, nm, c, v, u]) => `<div class="mt" style="--c:var(${c})"><span class="mk">${ic}${nm}</span><span class="mv ${v == null ? "none" : ""}">${v ?? "—"}${v != null && u ? `<small>${u}</small>` : ""}</span></div>`).join("")}</div>`;
}
// six Monday-start weeks, oldest first
function cdWeeks(L, m) {
  const w0 = cdMon(today()), W = Array.from({ length: 6 }, (_, i) => { const d = new Date(w0 + "T12:00"); d.setDate(d.getDate() - 7 * (5 - i)); return { d: ymd(d), km: 0, s: 0, n: 0 }; });
  L.forEach(e => { const w = W.find(x => x.d === cdMon(cdDay(e))); if (w) { w.km += e.km || 0; w.s += e.dur || 0; w.n++; } });
  return W;
}
function cdInsight(L, W, m) {
  const [nm, one, many] = CDM[m], tw = W[5], lw = W[4], out = [];
  if (!L.length) return `No ${many} from your Fitbit yet. Start "${nm}" on your Fitbit Air, then sync – it shows here with pace and heart rate.`;
  const useKm = W.some(w => w.km > 0), v = w => useKm ? w.km : w.s / 60, f = x => useKm ? cdDist(x, m) + " " + cdDU(m) : Math.round(x) + " min";
  out.push(tw.n ? `${tw.n} ${tw.n === 1 ? one : many} this week, ${f(v(tw))}` + (v(lw) ? ` – ${v(tw) >= v(lw) ? "up" : "down"} ${Math.abs(Math.round((v(tw) - v(lw)) / v(lw) * 100))}% on last week.` : ".") : `No ${many} yet this week${lw.n ? ` (last week: ${lw.n}, ${f(v(lw))})` : ""}.`);
  const six = L.filter(e => cdDay(e) >= W[0].d), ps = six.map(e => cdPace(e, m)).filter(Boolean), last = L[0], lp = cdPace(last, m);
  if (lp && ps.length >= 3) { const a = ps.reduce((s, x) => s + x, 0) / ps.length, d = Math.round(a - lp);
    out.push(Math.abs(d) < 5 ? `Last pace ${cdPF(lp)}${cdPU(m)}, in line with your 6-week average.` : `Last pace ${cdPF(lp)}${cdPU(m)} – ${Math.abs(d)} s ${d > 0 ? "faster" : "slower"} than your 6-week average.`);
    const hs = six.map(e => e.hr).filter(Boolean); if (last.hr && hs.length >= 3) { const ha = hs.reduce((s, x) => s + x, 0) / hs.length; if (d > 5 && last.hr <= ha + 2) out.push("Faster at the same or lower heart rate – your fitness is improving."); else if (last.hr > ha + 8) out.push(`Heart rate was ${Math.round(last.hr - ha)} bpm above your average – check sleep and recovery.`); } }
  const z = six.reduce((s, e) => { (e.zones || []).forEach((v, i) => s[i] += v || 0); return s; }, [0, 0, 0, 0]), zt = z.reduce((a, b) => a + b, 0);
  if (zt > 0) { const ez = (z[0] + z[1]) / zt * 100; out.push(ez >= 70 ? `${Math.round(ez)}% of the time in light–moderate zones: good easy base (Zone 2) for heart health and fat loss.` : `Only ${Math.round(ez)}% in easy zones – mix in more relaxed ${many} for recovery.`); }
  return out.join(" ");
}
function cdView(m) {
  const [nm, , many] = CDM[m], L = cdList(m), W = cdWeeks(L, m), last = L[0];
  const useKm = W.some(w => w.km > 0), lab = W.map((w, i) => i === 5 ? "This wk" : fmtD(w.d, { day: "numeric", month: "short" }));
  const tot = W.reduce((s, w) => s + (useKm ? w.km : w.s / 60), 0);
  const chart = L.length ? `<div class="chart"><div class="chh"><b>${useKm ? "Distance" : "Time"} per week</b><span>${useKm ? cdDist(tot, m) + " " + cdDU(m) : Math.round(tot) + " min"} · 6 weeks</span></div>${barChart(W.map(w => useKm ? (m === "swim" ? Math.round(w.km * 1000) : r1(w.km)) : Math.round(w.s / 60)), lab, 0, cdC[m], v => m === "swim" && v >= 1000 ? r1(v / 1000) + "k" : v)}</div>` : "";
  const pp = L.filter(e => cdDay(e) >= W[0].d).slice().reverse().map(e => cdPace(e, m)).filter(Boolean);
  const pace = pp.length > 1 ? `<div class="chart"><div class="chh"><b>Pace</b><span>${cdPU(m).slice(1)} · lower is faster</span></div>${lineChart(pp.map((v, i) => ({ x: i, v: v / 60 })), pp.length, ["6 weeks ago", "Latest"], "--mint", v => cdPF(v * 60))}</div>` : "";
  const hh = L.filter(e => cdDay(e) >= W[0].d && e.hr).slice().reverse();
  const hrc = hh.length > 1 ? `<div class="chart"><div class="chh"><b>Average heart rate</b><span>bpm</span></div>${lineChart(hh.map((e, i) => ({ x: i, v: e.hr })), hh.length, ["6 weeks ago", "Latest"], "--red", v => Math.round(v))}</div>` : "";
  const list = L.filter(e => cdDay(e) >= W[0].d);
  return `${last ? `<section class="sec"><div class="sh"><h2>Last ${CDM[m][1]}</h2><span class="hacc">${fmtD(cdDay(last), { weekday: "short", day: "numeric", month: "short" })} · ${hdT(last.start)}</span></div>${cdTiles(last, m)}
    ${cdZones(last) ? `<div class="chart" style="margin-top:10px"><div class="chh"><b>Heart rate zones</b><span>${cdMin((last.zones || []).reduce((a, b) => a + (b || 0), 0))} min</span></div>${cdZones(last)}</div>` : ""}</section>` : ""}
  <section class="sec"><div class="sh"><h2>Insight</h2><span class="hacc">${nm}</span></div><div class="group"><div class="cell" style="--inset:58px"><span class="itile" style="--ic:var(${cdC[m]})">${cdIc(m)}</span><span class="ct"><span class="t2" style="color:var(--label);font-size:15px;line-height:1.4">${esc(cdInsight(L, W, m))}</span></span></div></div></section>
  ${chart || pace || hrc ? `<section class="sec"><div class="sh"><h2>Last 6 Weeks</h2></div><div class="charts">${chart}${pace}${hrc}</div></section>` : ""}
  <section class="sec"><div class="sh"><h2>Sessions</h2><span class="hacc">${list.length} in 6 weeks</span></div>
    <div class="group">${list.length ? list.map(e => { const p = cdPace(e, m), l = m === "swim" ? cdLaps(e) : null; return `<button class="cell ins" style="--inset:58px" data-cdx="${esc(e.start)}"><span class="itile" style="--ic:var(${cdC[m]})">${cdIc(m)}</span><span class="ct"><span class="t1">${e.km ? cdDist(e.km, m) + " " + cdDU(m) : esc(e.name || EXN(e.type))}</span><span class="t2">${fmtD(cdDay(e), { weekday: "short", day: "numeric", month: "short" })} · ${hdT(e.start)}${p ? ` · ${cdPF(p)}${cdPU(m)}` : ""}${l != null ? ` · ${Math.round(l)} laps` : ""}${e.hr ? ` · ${Math.round(e.hr)} bpm` : ""}</span></span><span class="t2" style="margin-left:auto;text-align:right;font-variant-numeric:tabular-nums">${cdMin(e.dur)} min${e.kcal ? `<br>${Math.round(e.kcal)} kcal` : ""}</span></button>`; }).join("") : emptyCell(`No ${many} in the last 6 weeks`, GH.url ? `Record "${nm}" on your Fitbit Air – it appears here after sync.` : "Connect Google Health in Settings to bring in your Fitbit sessions.")}</div>
    <p class="gf">All from your Fitbit Air via Google Health – nothing to log by hand.${m === "swim" ? " Laps show when your Fitbit records swim lengths." : ""}</p></section>`;
}
// one session in a pop-up
function cdPop(start) {
  const e = HD.ex.find(x => x.start === start); if (!e) return; const m = Object.keys(CDM).find(k => cdIs(e, k)) || "walk";
  const el = document.createElement("div"); el.className = "ghpop"; el.id = "ghpop";
  el.innerHTML = `<div class="gpc cdpc" role="dialog" aria-modal="true" aria-label="${esc(CDM[m][0])} session"><span class="itile" style="--ic:var(${cdC[m]})">${cdIc(m)}</span><b>${esc(e.name || EXN(e.type))}</b>
    <p>${fmtD(cdDay(e), { weekday: "long", day: "numeric", month: "long" })} · ${hdT(e.start)} – ${hdT(e.stop)}${e.hrMax ? ` · max ${Math.round(e.hrMax)} bpm` : ""}${e.elev ? ` · ${Math.round(e.elev)} m climb` : ""}</p>${cdTiles(e, m)}${cdZones(e)}<button class="btn2" style="width:100%" id="hdLater">Close</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("open"));
}
document.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if (!b) return; const ds = b.dataset;
  if (ds.aseg) { S.aseg = ds.aseg; renderAll(); return; }
  if (ds.cdx) { cdPop(ds.cdx); return; }
});
