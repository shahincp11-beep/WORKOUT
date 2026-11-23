# Notes for editing

- `index.html` – page structure only (screens, sheets, tab bar).
- `css/app.css` – all styles, Light / Dark looks, photo header, iPad layout (min-width 744px) at the end under `v2`.
- `js/data.js` – exercise plans, programs, alternatives, warm-ups, icons. No user data.
- `js/app.js` – state, safe save/load, backup export/import, screens, events, rest timer.
- `img/` – compressed gym photos. Mapping in `js/data.js` (PH, DAYPH, GRPPH, SCRPH). Missing photos are skipped safely.
- `js/photos.js` – Phase 2b: Look (S.phStyle clean/bg/full), your photos per slot (S.phx: c=yours, x=removed; JPEGs in IndexedDB `workout-photos`, also in backups as `photos`), photo-matched accent (S.matchPh, S.accent.ph=1). `ph(key,card)` decides what shows.
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

## Google Health data (Phase 4b)
- `js/health.js` – sync (`/api/sync?days=`), stores Google data in localStorage `workout_health` (HD: days, sleep, ex, weight, hrToday, stepsToday), never deletes older days; in backups as `health`.
- `actDay(d)` = your manual log + Google values (Google wins, manual fills gaps).
- Auto sync on open / return to app if older than ~1 h; `?sync=1` forces a sync, `?start=1` asks which workout (for iOS Shortcuts).
- Reconnect pop-up when Google sign-in expires. Settings → Sync shows failed types and today's raw values.

## Gym Mode (Phase 4c)
- `js/gym.js` – arrival check (S.gym={lat,lon,r,ask,lastAsk}, Settings → Gym Mode), "You're at the gym" pop-up, readiness score + suggested load (gymReady: sleep 40, HRV 30, resting HR 20, recent workouts 10), four-workout picker, full-screen Gym Mode (one exercise per page, reps wheel, kg ±, Log Set → rest timer, swipe up).
- Per set reps in S.reps, exercise times in S.gyT, last log S.gyLast. Session saves r (reps), x (minutes per exercise), rd (readiness), mins (from S.started).
- Floating timer: img/gymclock.mp4 (silent 2-hour clock) shown in iOS picture-in-picture, seeked to elapsed time; returning to the app opens Gym Mode on the current exercise (S.gyFloat). In-app mini box #gymini with hide arrow (S.gymPos). sw.js never caches .mp4 (range requests).
