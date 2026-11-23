// Workout sync server – Cloudflare Worker (free plan).
// Holds the Google sign-in so the app never sees the Google secret.
// Setup (Cloudflare dashboard): KV binding GH; secrets CLIENT_ID, CLIENT_SECRET, APP_KEY.
// Reused by Phase 5 (encrypted cloud copy + iPhone/iPad sync).

const APP = "https://shahincp11-beep.github.io";
const APP_PAGE = APP + "/WORKOUT/";
const API = "https://health.googleapis.com/v4/users/me";
const SCOPES = ["activity_and_fitness", "health_metrics_and_measurements", "sleep", "nutrition", "location", "profile", "settings"]
  .map(s => "https://www.googleapis.com/auth/googlehealth." + s + ".readonly");
// Every data type listed in Google's docs; the probe shows which your account really offers.
const TYPES = ["sleep", "steps", "distance", "floors", "altitude", "heart-rate", "daily-resting-heart-rate", "heart-rate-variability",
  "daily-heart-rate-variability", "time-in-heart-rate-zone", "calories-in-heart-rate-zone", "active-zone-minutes", "active-minutes",
  "activity-level", "sedentary-period", "total-calories", "active-energy-burned", "basal-energy-burned", "exercise", "swim-lengths-data",
  "oxygen-saturation", "daily-oxygen-saturation", "respiratory-rate", "daily-respiratory-rate", "daily-sleep-temperature-derivations",
  "core-body-temperature", "vo2-max", "run-vo2-max", "weight", "body-fat", "height", "blood-glucose", "nutrition-log", "hydration-log",
  "electrocardiogram", "irregular-rhythm-notification"];

const cors = { "Access-Control-Allow-Origin": APP, "Access-Control-Allow-Headers": "X-App-Key, Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const page = (title, msg) => new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:17px -apple-system,system-ui;background:#000;color:#fff;text-align:center;padding:80px 24px"><h2>${title}</h2><p style="color:#aaa">${msg}</p><p><a href="${APP_PAGE}?google=1" style="display:inline-block;margin-top:18px;padding:12px 22px;border-radius:12px;background:#ff3b30;color:#fff;text-decoration:none;font-weight:600">Back to Workout</a></p></body>`, { headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" } });
const rnd = () => [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, "0")).join("");
function keyOk(req, env) {
  const a = req.headers.get("X-App-Key") || "", b = env.APP_KEY || "";
  if (!b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}

async function tokenCall(env, body) {
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, ...body }) });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}
// Returns a valid access token, refreshing when needed. null = not connected / sign-in expired.
async function access(env) {
  const t = await env.GH.get("tok", "json");
  if (!t || t.expired) return null;
  if (t.access && t.exp > Date.now() + 60000) return t.access;
  const { ok, j } = await tokenCall(env, { grant_type: "refresh_token", refresh_token: t.refresh });
  if (!ok) { if (j.error === "invalid_grant") { t.expired = Date.now(); await env.GH.put("tok", JSON.stringify(t)); } return null; }
  t.access = j.access_token; t.exp = Date.now() + (j.expires_in || 3600) * 1000;
  await env.GH.put("tok", JSON.stringify(t));
  return t.access;
}
async function gget(tok, path) {
  const r = await fetch(API + path, { headers: { Authorization: "Bearer " + tok } });
  const j = await r.json().catch(() => ({}));
  return { s: r.status, j };
}
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const val = (dp, type) => dp[camel(type)] || dp[type] || Object.values(dp).find(v => v && typeof v === "object" && !Array.isArray(v) && v !== dp.dataSource) || {};
// First time-like value found in a data point (for "latest" dates).
function when(o, d = 0) {
  if (!o || typeof o !== "object" || d > 4) return null;
  for (const [k, v] of Object.entries(o)) if (typeof v === "string" && /time$|date$/i.test(k) && /^\d{4}-\d\d-\d\d/.test(v)) return v;
  for (const v of Object.values(o)) { const w = when(v, d + 1); if (w) return w; }
  if (o.year && o.month && o.day) return `${o.year}-${String(o.month).padStart(2, "0")}-${String(o.day).padStart(2, "0")}`;
  return null;
}
const day = (iso, tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

async function test(tok, tz) {
  // Sleep: last 7 sessions
  const sl = await gget(tok, "/dataTypes/sleep/dataPoints?pageSize=7");
  const sleep = (sl.j.dataPoints || []).map(dp => {
    const v = val(dp, "sleep"), iv = v.interval || dp.interval || {};
    const st = iv.startTime, en = iv.endTime, stages = {};
    for (const arr of Object.values(v)) if (Array.isArray(arr)) for (const x of arr) {
      const n = x.type || x.stage || x.sleepStage, a = x.interval?.startTime || x.startTime, b = x.interval?.endTime || x.endTime;
      if (n && a && b) stages[n] = (stages[n] || 0) + Math.round((new Date(b) - new Date(a)) / 60000);
    }
    return { start: st, end: en, mins: st && en ? Math.round((new Date(en) - new Date(st)) / 60000) : null, stages, fields: Object.keys(v) };
  });
  // Steps: per-day totals for the last 7 days (your time zone)
  const from = day(Date.now() - 6 * 864e5, tz), days = {};
  let pt = "", pages = 0, stepErr = null;
  do {
    const f = encodeURIComponent(`steps.interval.civil_start_time >= "${from}"`);
    const r = await gget(tok, `/dataTypes/steps/dataPoints?pageSize=10000&filter=${f}${pt ? "&pageToken=" + encodeURIComponent(pt) : ""}`);
    if (r.s !== 200) { stepErr = r.j.error?.message || "HTTP " + r.s; break; }
    for (const dp of r.j.dataPoints || []) {
      const v = val(dp, "steps"), s = (v.interval || dp.interval || {}).startTime;
      if (s) days[day(s, tz)] = (days[day(s, tz)] || 0) + Number(v.count ?? v.countSum ?? 0);
    }
    pt = r.j.nextPageToken || ""; pages++;
  } while (pt && pages < 5);
  return { sleep, sleepErr: sl.s === 200 ? null : (sl.j.error?.message || "HTTP " + sl.s), steps: days, stepErr };
}

async function probe(tok) {
  const one = async t => {
    const r = await gget(tok, `/dataTypes/${t}/dataPoints?pageSize=${t === "sleep" || t === "exercise" ? 5 : 1}`);
    if (r.s === 200) { const dp = (r.j.dataPoints || [])[0]; return { t, st: dp ? "data" : "empty", latest: dp ? when(dp) : null, fields: dp ? Object.keys(val(dp, t)) : [] }; }
    return { t, st: r.s === 403 ? "denied" : r.s === 404 || r.s === 400 ? "na" : "err", msg: (r.j.error?.message || "HTTP " + r.s).slice(0, 140) };
  };
  const types = await Promise.all(TYPES.map(one));
  const extra = await Promise.all(["/profile", "/settings", "/pairedDevices"].map(async p => { const r = await gget(tok, p); return { t: p.slice(1), st: r.s === 200 ? "data" : r.s === 403 ? "denied" : "err", fields: r.s === 200 ? Object.keys(r.j) : [], devices: p === "/pairedDevices" ? (r.j.pairedDevices || []).map(d => d.displayName || d.deviceName || d.name) : undefined }; }));
  return { types, extra };
}

// ---------- Phase 4b: full sync ----------
// Returns compact day-by-day data the app stores on the device. ~30 Google calls (free-plan limit is 50).
const ymdOf = o => o && o.year ? `${o.year}-${String(o.month).padStart(2, "0")}-${String(o.day).padStart(2, "0")}` : null;
const civ = d => { const [y, m, dd] = d.split("-").map(Number); return { date: { year: y, month: m, day: dd } }; };
const addD = (d, n) => { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const N = v => v == null || v === "" || isNaN(+v) ? null : +v;
const secs = v => typeof v === "string" && /s$/.test(v) ? Math.round(parseFloat(v)) : N(v);
// Flatten a roll-up value to { "countSum": 123, "x.y": 4 } – field names vary, the app picks what it needs.
function flat(o, pre = "", out = {}) {
  if (!o || typeof o !== "object") return out;
  for (const [k, v] of Object.entries(o)) {
    const key = pre ? pre + "." + k : k;
    if (Array.isArray(v)) v.forEach((x, i) => { const tag = x && (x.heartRateZoneType || x.heartRateZone || x.activityLevel || x.activityLevelType || x.type); flat(x, key + "." + (tag || i), out); });
    else if (v && typeof v === "object") flat(v, key, out);
    else if (typeof v === "string" && /^-?\d+(\.\d+)?s$/.test(v)) out[key] = secs(v);
    else if (N(v) != null && typeof v !== "boolean") out[key] = N(v);
    else if (typeof v === "string") out[key] = v;
  }
  return out;
}
async function gpost(tok, path, body) {
  const r = await fetch(API + path, { method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { s: r.status, j: await r.json().catch(() => ({})) };
}
const errOf = r => r.j.error?.message?.slice(0, 120) || "HTTP " + r.s;
async function listAll(tok, type, filter, size, max = 4) {
  let pt = "", out = [], n = 0, err = null;
  do {
    const r = await gget(tok, `/dataTypes/${type}/dataPoints?pageSize=${size}${filter ? "&filter=" + encodeURIComponent(filter) : ""}${pt ? "&pageToken=" + encodeURIComponent(pt) : ""}`);
    if (r.s !== 200) { err = errOf(r); break; }
    out.push(...(r.j.dataPoints || [])); pt = r.j.nextPageToken || ""; n++;
  } while (pt && n < max);
  return { pts: out, err };
}
// Daily roll-ups: { date: flatValues }
async function daily(tok, type, from, to) {
  const lim = ["heart-rate", "active-minutes", "total-calories", "calories-in-heart-rate-zone"].includes(type) ? 14 : 90, res = {};
  const chunks = []; for (let a = from; a < to; a = addD(a, lim)) chunks.push([a, addD(a, lim) < to ? addD(a, lim) : to]);
  const rs = await Promise.all(chunks.map(([a, b]) => gpost(tok, `/dataTypes/${type}/dataPoints:dailyRollUp`, { range: { start: civ(a), end: civ(b) }, windowSizeDays: 1, pageSize: lim })));
  for (const r of rs) {
    if (r.s !== 200) return { err: errOf(r) };
    for (const p of r.j.rollupDataPoints || []) {
      const d = ymdOf(p.civilStartTime?.date || p.civilStartTime), v = Object.entries(p).find(([k]) => !/^civil/.test(k));
      if (d && v) res[d] = flat(v[1]);
    }
  }
  return { res };
}
// Today in 15-min (heart rate) or 1-hour (steps) buckets
async function intraday(tok, type, startIso, win) {
  const r = await gpost(tok, `/dataTypes/${type}/dataPoints:rollUp`, { range: { startTime: startIso, endTime: new Date().toISOString() }, windowSize: win + "s", pageSize: 200 });
  if (r.s !== 200) return { err: errOf(r) };
  return { res: (r.j.rollupDataPoints || []).map(p => { const v = Object.entries(p).find(([k]) => !/Time$/.test(k)); return [p.startTime, v ? flat(v[1]) : {}]; }) };
}
// Midnight today in your time zone, as a UTC timestamp
function midnight(tz) {
  const now = new Date(), d = day(now.toISOString(), tz);
  const off = new Date(now.toLocaleString("en-US", { timeZone: tz })) - new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(Date.parse(d + "T00:00:00Z") - off).toISOString();
}

async function sync(tok, tz, days) {
  const to = addD(day(new Date().toISOString(), tz), 1), from = addD(to, -days), errs = {}, out = { from, to: addD(to, -1), days: {} };
  const put = (d, k, v) => { if (d && v != null) (out.days[d] ||= {})[k] = v; };
  const ROLL = ["steps", "distance", "total-calories", "active-energy-burned", "active-zone-minutes", "active-minutes", "heart-rate",
    "sedentary-period", "time-in-heart-rate-zone", "swim-lengths-data"];
  const DAILY = { "daily-resting-heart-rate": v => ({ rhr: N(v.beatsPerMinute) }),
    "daily-heart-rate-variability": v => ({ hrv: N(v.averageHeartRateVariabilityMilliseconds), hrvDeep: N(v.deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds), nremHr: N(v.nonRemHeartRateBeatsPerMinute) }),
    "daily-oxygen-saturation": v => ({ spo2: N(v.averagePercentage), spo2Lo: N(v.lowerBoundPercentage), spo2Hi: N(v.upperBoundPercentage) }),
    "daily-respiratory-rate": v => ({ br: N(v.breathsPerMinute) }),
    "daily-sleep-temperature-derivations": v => ({ temp: N(v.nightlyTemperatureCelsius), tempBase: N(v.baselineTemperatureCelsius) }),
    "daily-heart-rate-zones": v => ({ zones: (v.heartRateZones || []).map(z => [z.heartRateZoneType, N(z.minBeatsPerMinute), N(z.maxBeatsPerMinute)]) }) };
  const mid = midnight(tz);
  const [roll, dl, sl, ex, wt, ht, hrT, stT, dev] = await Promise.all([
    Promise.all(ROLL.map(t => daily(tok, t, from, to))),
    // Google rejects a date filter on these daily types, so take the newest days instead (newest first).
    Promise.all(Object.keys(DAILY).map(t => listAll(tok, t, "", days + 3, 1))),
    listAll(tok, "sleep", `sleep.interval.civil_end_time >= "${from}"`, 25, 3),
    listAll(tok, "exercise", `exercise.interval.civil_start_time >= "${from}"`, 25, 3),
    listAll(tok, "weight", "", 60, 1),
    listAll(tok, "height", "", 1, 1),
    intraday(tok, "heart-rate", mid, 900),
    intraday(tok, "steps", mid, 3600),
    gget(tok, "/pairedDevices")]);
  ROLL.forEach((t, i) => { const r = roll[i]; if (r.err) errs[t] = r.err; else for (const [d, v] of Object.entries(r.res)) put(d, "r_" + camel(t), v); });
  Object.entries(DAILY).forEach(([t, f], i) => {
    const r = dl[i]; if (r.err) { errs[t] = r.err; return; }
    for (const dp of r.pts) { const v = val(dp, t), d = ymdOf(v.date); if (d) for (const [k, x] of Object.entries(f(v))) put(d, k, x); }
  });
  if (sl.err) errs.sleep = sl.err;
  out.sleep = sl.pts.map(dp => {
    const v = val(dp, "sleep"), iv = v.interval || {}, sm = v.summary || {}, st = {};
    for (const x of sm.stagesSummary || []) if (x.type) st[x.type] = N(x.minutes);
    const t0 = Date.parse(iv.startTime);
    return { end: (iv.civilEndTime ? ymdOf(iv.civilEndTime.date) : null) || day(iv.endTime, tz), start: iv.startTime, stop: iv.endTime, type: v.type,
      nap: !!v.metadata?.nap, main: v.metadata?.mainSleep !== false, asleep: N(sm.minutesAsleep), awake: N(sm.minutesAwake), inBed: N(sm.minutesInSleepPeriod),
      toSleep: N(sm.minutesToFallAsleep), afterWake: N(sm.minutesAfterWakeUp), stages: st,
      tl: (v.stages || []).map(x => [x.type?.[0], Math.round((Date.parse(x.startTime) - t0) / 6e4), Math.round((Date.parse(x.endTime) - Date.parse(x.startTime)) / 6e4)]) };
  }).filter(s => s.start);
  if (ex.err) errs.exercise = ex.err;
  out.ex = ex.pts.map(dp => {
    const v = val(dp, "exercise"), iv = v.interval || {}, m = v.metricsSummary || {}, z = m.heartRateZoneDurations || {};
    return { start: iv.startTime, stop: iv.endTime, type: v.exerciseType, name: v.displayName || "", dur: secs(v.activeDuration),
      kcal: N(m.caloriesKcal), km: N(m.distanceMillimeters) != null ? N(m.distanceMillimeters) / 1e6 : null, steps: N(m.steps), hr: N(m.averageHeartRateBeatsPerMinute),
      azm: N(m.activeZoneMinutes), pace: N(m.averagePaceSecondsPerMeter), elev: N(m.elevationGainMillimeters) != null ? N(m.elevationGainMillimeters) / 1000 : null,
      zones: [secs(z.lightTime), secs(z.moderateTime), secs(z.vigorousTime), secs(z.peakTime)] };
  }).filter(e => e.start);
  if (wt.err) errs.weight = wt.err;
  out.weight = wt.pts.map(dp => { const v = val(dp, "weight"), t = v.sampleTime || {}; return [t.civilTime ? ymdOf(t.civilTime.date) : day(t.physicalTime, tz), N(v.weightGrams) / 1000]; }).filter(x => x[0] && x[1]);
  const h = ht.pts[0] && val(ht.pts[0], "height"); out.heightCm = h ? N(h.heightMillimeters) / 10 : null;
  if (hrT.err) errs.hrToday = hrT.err; else out.hrToday = hrT.res;
  if (stT.err) errs.stepsToday = stT.err; else out.stepsToday = stT.res;
  out.devices = dev.s === 200 ? (dev.j.pairedDevices || []).map(d => flat(d)) : [];
  out.errs = errs; out.at = Date.now();
  return out;
}

const MAPHOST = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.co)$/i;
function mapCoords(t) {
  t = decodeURIComponent(t || "");
  let m = t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || t.match(/[?&](?:q|ll|query|center|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || t.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
  return m ? { lat: +m[1], lon: +m[2] } : null;
}
async function mapGeocode(q) {
  if (!q) return null;
  try {
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=au&q=" + encodeURIComponent(q), { headers: { "User-Agent": "workout-sync/1.0 (personal fitness app)" } });
    const j = await r.json(); return j[0] ? { lat: +j[0].lat, lon: +j[0].lon } : null;
  } catch (e) { return null; }
}
async function mapLink(link) {
  let url, name;
  try { url = new URL(link.trim()); } catch (e) { return { error: "That isn't a link" }; }
  const H = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", "Accept-Language": "en-AU,en", "Cookie": "CONSENT=YES+cb; SOCS=CAI" };
  for (let i = 0; i < 8; i++) {
    if (/consent\.google/.test(url.hostname) && url.searchParams.get("continue")) { url = new URL(url.searchParams.get("continue")); continue; }
    if (!MAPHOST.test(url.hostname)) return { error: "Please paste a Google Maps link" };
    name = name || (url.pathname.match(/\/place\/([^/]+)/) || [])[1]?.replace(/\+/g, " ") || url.searchParams.get("q") || url.searchParams.get("query") || undefined;
    try { name = name && decodeURIComponent(name); } catch (e) {}
    const c = mapCoords(url.href);
    if (c && !/goo\.gl$/.test(url.hostname)) return { ...c, url: url.href, name };
    const r = await fetch(url.href, { redirect: "manual", headers: H });
    const loc = r.headers.get("Location");
    if (loc) { url = new URL(loc, url); continue; }
    const html = r.ok ? await r.text() : "";
    let c2 = mapCoords(html);
    const st = html.match(/APP_INITIALIZATION_STATE=\[\[\[-?[\d.]+,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
    if (!c2 && st) c2 = { lat: +st[2], lon: +st[1] };
    name = name || (html.match(/<meta[^>]+(?:property|itemprop)="(?:og:title|name)"[^>]+content="([^"]+)"/) || [])[1]?.replace(/ · Google Maps$| - Google Maps$/, "");
    if (c2 && !(c2.lat === 0 && c2.lon === 0)) return { ...c2, url: url.href, name };
    const g = await mapGeocode(name);
    return g ? { ...g, url: url.href, name, approx: 1 } : { error: "No location found in that link", url: url.href, name };
  }
  return { error: "Too many redirects" };
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url), p = u.pathname;
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Max-Age": "86400" } });
    if (p === "/") return new Response("Workout sync server is running.", { headers: { "Content-Type": "text/plain" } });

    // Google sends you back here after you allow access.
    if (p === "/auth/callback") {
      const st = u.searchParams.get("state"), code = u.searchParams.get("code");
      if (u.searchParams.get("error")) return page("Not connected", "Google sign-in was cancelled.");
      if (!st || !(await env.GH.get("st:" + st))) return page("Link expired", "Please tap Connect Google again in the app.");
      await env.GH.delete("st:" + st);
      const { ok, j } = await tokenCall(env, { grant_type: "authorization_code", code, redirect_uri: u.origin + "/auth/callback" });
      if (!ok || !j.refresh_token) return page("Not connected", "Google did not return a sign-in key (" + (j.error_description || j.error || "no refresh token") + "). Please try again.");
      await env.GH.put("tok", JSON.stringify({ refresh: j.refresh_token, access: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000, scope: j.scope || "", since: Date.now() }));
      return page("Connected ✓", "Google Health is linked to your Workout app. Go back to the app to test it.");
    }

    if (!keyOk(req, env)) return json({ error: "Wrong app key" }, 401);
    const tz = u.searchParams.get("tz") || "Australia/Sydney";

    // Gym location (Phase 4c): open a Google Maps share link and read the exact spot from it
    if (p === "/api/maplink") return json(await mapLink(u.searchParams.get("u") || ""));

    if (p === "/auth/start" && req.method === "POST") {
      const st = rnd(); await env.GH.put("st:" + st, "1", { expirationTtl: 600 });
      const q = new URLSearchParams({ client_id: env.CLIENT_ID, redirect_uri: u.origin + "/auth/callback", response_type: "code",
        access_type: "offline", prompt: "consent", include_granted_scopes: "true", scope: SCOPES.join(" "), state: st });
      return json({ url: "https://accounts.google.com/o/oauth2/v2/auth?" + q });
    }
    if (p === "/auth/disconnect" && req.method === "POST") {
      const t = await env.GH.get("tok", "json");
      if (t?.refresh) await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(t.refresh), { method: "POST" }).catch(() => {});
      await env.GH.delete("tok"); return json({ ok: true });
    }
    if (p === "/status") {
      const t = await env.GH.get("tok", "json");
      if (!t) return json({ connected: false });
      const tok = await access(env), t2 = await env.GH.get("tok", "json");
      return json({ connected: !!tok, expired: !!t2?.expired, since: t.since, scopes: (t.scope || "").split(" ").filter(s => s.includes("googlehealth")).map(s => s.split("googlehealth.")[1]) });
    }
    const tok = await access(env);
    if (!tok) return json({ error: "Not connected or sign-in expired", reconnect: true }, 409);
    if (p === "/api/test") return json(await test(tok, tz));
    if (p === "/api/types") return json(await probe(tok));
    if (p === "/api/sync") return json(await sync(tok, tz, Math.max(2, Math.min(+u.searchParams.get("days") || 7, 30))));
    if (p === "/api/raw") { // for building Phase 4b: one data type, newest first
      const t = (u.searchParams.get("type") || "").replace(/[^a-z-]/g, ""), n = Math.min(+u.searchParams.get("n") || 3, 25);
      return json((await gget(tok, `/dataTypes/${t}/dataPoints?pageSize=${n}`)).j);
    }
    return json({ error: "Not found" }, 404);
  }
};
