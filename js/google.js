// Phase 4a – Google Health connection (through your own sync server, see server/worker.js).
// Kept OUTSIDE your workout data (S): stored in localStorage "workout_google" = {url,key,st,test,types}.
const GHK = "workout_google";
let GH = (() => { try { return JSON.parse(localStorage.getItem(GHK)) || {}; } catch { return {}; } })();
let ghBusy = "";
const ghSave = () => { try { localStorage.setItem(GHK, JSON.stringify(GH)); } catch {} };
const ghTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney";
async function ghCall(path, method = "GET") {
  const r = await fetch(GH.url.replace(/\/+$/, "") + path + (path.includes("?") ? "&" : "?") + "tz=" + encodeURIComponent(ghTz()),
    { method, headers: { "X-App-Key": GH.key || "" }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Server error " + r.status), { reconnect: j.reconnect });
  return j;
}
const ghRe = () => { if ($("settings").classList.contains("open")) renderSettings(); };
async function ghRun(what, fn) {
  if (ghBusy) return; ghBusy = what; ghRe();
  try { await fn(); } catch (e) { if (e.reconnect) GH.st = { connected: false, expired: true }; toast(e.message.length > 60 ? "Could not reach the server" : e.message); }
  ghBusy = ""; ghSave(); ghRe();
}
const ghStatus = () => GH.url && GH.key && ghRun("status", async () => { GH.st = await ghCall("/status"); });

const ghHM = m => m == null ? "—" : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
const ghT = iso => iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
const ghD = iso => iso ? new Date(iso + (iso.length === 10 ? "T12:00" : "")).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "—";
const ghName = t => ({ pairedDevices: "Paired devices", profile: "Profile", settings: "Device settings" }[t]) || t.replace(/-/g, " ").replace(/^./, c => c.toUpperCase());
const ghRow = (a, b, c) => `<div class="cell"><span class="ct"><span class="t1">${a}</span>${c ? `<span class="t2">${c}</span>` : ""}</span><span class="t2" style="margin-left:auto;text-align:right;font-variant-numeric:tabular-nums">${b}</span></div>`;

function ghUI() {
  const st = GH.st || {}, ready = GH.url && GH.key, b = w => ghBusy === w ? " …" : "";
  const status = !ready ? "Not set up" : st.connected ? "Connected" : st.expired ? "Sign-in expired – tap Reconnect" : "Not connected";
  let h = `<div class="lh">Google Health (Fitbit Air)</div>
  <div class="group">
    <label class="cell field"><span class="t1">Server</span><input id="ghUrl" type="url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="https://….workers.dev" value="${esc(GH.url || "")}"></label>
    <label class="cell field"><span class="t1">App key</span><input id="ghKey" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Paste or make one" value="${esc(GH.key || "")}"></label>
    <button class="cell action" id="ghMake"><span class="lbl">Make New App Key &amp; Copy</span></button>
  </div>
  <p class="lf">The server keeps your Google sign-in safe. Only this app, with this key, can use it.</p>
  <div class="group">
    ${ghRow("Status", status + b("status"), st.connected && st.since ? "Since " + ghD(new Date(st.since).toISOString()) : "")}
    <button class="cell action" id="ghConnect" ${ready ? "" : "disabled style=\"opacity:.4\""}><span class="lbl">${st.connected ? "Reconnect Google" : st.expired ? "Reconnect Google" : "Connect Google"}${b("connect")}</span></button>
    <button class="cell action" id="ghTest" ${st.connected ? "" : "disabled style=\"opacity:.4\""}><span class="lbl">Test: Sleep &amp; Steps${b("test")}</span></button>
    <button class="cell action" id="ghTypes" ${st.connected ? "" : "disabled style=\"opacity:.4\""}><span class="lbl">Check My Data Types${b("types")}</span></button>
  </div>`;
  const T = GH.test;
  if (T) {
    h += `<div class="lh">Test – Sleep (last nights)</div><div class="group">${T.sleepErr ? ghRow("Sleep", "Error", esc(T.sleepErr)) :
      T.sleep.length ? T.sleep.map(s => ghRow(ghD(s.end), ghHM(s.mins), `${ghT(s.start)} – ${ghT(s.end)}${Object.keys(s.stages).length ? " · " + Object.entries(s.stages).map(([k, m]) => esc(k.toLowerCase()) + " " + ghHM(m)).join(", ") : ""}`)).join("") : ghRow("Sleep", "No data yet")}</div>
    <div class="lh">Test – Steps (last 7 days)</div><div class="group">${T.stepErr ? ghRow("Steps", "Error", esc(T.stepErr)) :
      Object.keys(T.steps).length ? Object.entries(T.steps).sort((a, c) => c[0].localeCompare(a[0])).map(([d, n]) => ghRow(ghD(d), n.toLocaleString())).join("") : ghRow("Steps", "No data yet")}</div>
    <p class="lf">Tested ${new Date(T.at).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}. Compare with the Google Health app.</p>`;
  }
  const Y = GH.types;
  if (Y) {
    const all = [...Y.types, ...Y.extra], cnt = k => all.filter(x => x.st === k).length;
    const lab = { data: ["●", "#30d158", "Has data"], empty: ["○", "#8e8e93", "Allowed, no data yet"], denied: ["✕", "#ff453a", "Not allowed"], na: ["–", "#8e8e93", "Not offered"], err: ["!", "#ff9f0a", "Error"] };
    h += `<div class="lh">My Data Types</div><div class="group">${ghRow("Summary", `${cnt("data")} with data`, `${cnt("empty")} allowed but empty · ${cnt("denied")} not allowed · ${cnt("na") + cnt("err")} not offered`)}
      ${all.sort((a, c) => "data empty denied err na".indexOf(a.st) - "data empty denied err na".indexOf(c.st)).map(x => ghRow(`<span style="color:${lab[x.st][1]}">${lab[x.st][0]}</span> ${ghName(x.t)}`,
        x.st === "data" ? (x.latest ? ghD(x.latest.slice(0, 10)) : "Yes") : lab[x.st][2], x.devices?.length ? esc(x.devices.join(", ")) : x.msg && x.st !== "na" ? esc(x.msg) : "")).join("")}</div>
    <p class="lf">This is the list Phase 4b will bring into the app. Checked ${new Date(Y.at).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.</p>`;
  }
  if (st.connected) h += `<div class="group" style="margin-top:14px"><button class="cell danger" id="ghOff">Disconnect Google</button></div>`;
  return h;
}

document.addEventListener("change", e => {
  if (e.target.id === "ghUrl" || e.target.id === "ghKey") {
    GH[e.target.id === "ghUrl" ? "url" : "key"] = e.target.value.trim(); GH.st = null; ghSave(); ghStatus(); ghRe();
  }
});
document.addEventListener("click", e => {
  const id = e.target.closest("button")?.id; if (!id || !id.startsWith("gh")) return;
  if (id === "ghMake") {
    const k = [...crypto.getRandomValues(new Uint8Array(24))].map(b => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[b % 56]).join("");
    GH.key = k; GH.st = null; ghSave(); navigator.clipboard?.writeText(k).then(() => toast("App key copied"), () => toast("Key made – copy it from the box")); ghRe();
  }
  if (id === "ghConnect") ghRun("connect", async () => { const { url } = await ghCall("/auth/start", "POST"); location.assign(url); });
  if (id === "ghTest") ghRun("test", async () => { GH.test = { ...(await ghCall("/api/test")), at: Date.now() }; });
  if (id === "ghTypes") ghRun("types", async () => { GH.types = { ...(await ghCall("/api/types")), at: Date.now() }; });
  if (id === "ghOff") ghRun("off", async () => { await ghCall("/auth/disconnect", "POST"); GH.st = { connected: false }; GH.test = GH.types = null; });
});
// Coming back from Google: open Settings and refresh the status.
document.addEventListener("visibilitychange", () => { if (!document.hidden && $("settings")?.classList.contains("open")) ghStatus(); });
addEventListener("load", () => {
  if (new URLSearchParams(location.search).has("google")) { history.replaceState(null, "", location.pathname); setTimeout(() => { openSettings(); ghStatus(); }, 300); }
});
