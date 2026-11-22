# Notes for editing

- `index.html` – page structure only (screens, sheets, tab bar).
- `css/app.css` – all styles, Light / Dark looks, photo header, iPad layout (min-width 744px) at the end under `v2`.
- `js/data.js` – exercise plans, programs, alternatives, warm-ups, icons. No user data.
- `js/app.js` – state, safe save/load, backup export/import, screens, events, rest timer.
- `img/` – compressed gym photos. Mapping in `js/data.js` (PH, DAYPH, GRPPH, SCRPH). Missing photos are skipped safely.
- Accent colour: `S.accent={c:[[h,l],[h,l]],fade,sel}`; none = default red. CSS vars `--accent`, `--accent-fill` → `--tint`, `--tintfill`.
- Old Transparent look (`S.look="glass"`) is migrated to Dark on load.
- `sw.js` – offline cache. Bump `CACHE` and list any new file when files change.

## Data safety (never lose data)
- All data: localStorage key `split4v3` (object `S`). Never rename it.
- `split4v3_lastgood` – copy of the last data that loaded fine (refreshed each launch).
- `split4v3_failed_<time>` – unreadable data is kept here, never overwritten.
- `split4v3_preimport` – data as it was just before a backup was imported.
- Settings → Data: Export Backup / Import Backup (JSON file `{app,key,ver,saved,data}`).
- Save is verified; a failed save shows a toast once. Persistent storage is requested on launch.
- No personal defaults in code: age and height are only what you type in Settings.

## Branches
- `main` and `gh-pages` are kept identical.
