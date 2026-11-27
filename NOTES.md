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

## Gym (Phase 4c → 4d-1)
- `js/gym.js` – arrival check (S.gym, Settings → Gym Mode), "You're at the gym" pop-up, readiness (gymReady), four-workout picker → opens the day page with the timer running.
- 4d-1 gym list (full-screen Gym Mode, floating timer and gymclock.mp4 removed): S.started={k,t,p?} total time from timestamps (keeps counting in the background); tap an exercise header → its timer (S.gyT[sk]={a,on}, gxMs; old {s,e} still read); one at a time; stops on its last set.
- Sets: S.reps[sk] reps per set, S.rpc[sk] reps picker, S.nsx[sk] your set count (nSets(e,k)). Bar #wbar above the tab bar on every tab (time, pause, Finish). S.gyLast = last tap.
- Leaving the gym: on opening the app >gym radius+200 m away (or 3 h after the last tap) → save ending at the last tap.
- Mode button (S.mode gym/walk/swim/run) on the right of Start; walk/swim/run read HD.ex (full views in 4d-2).
- Recent list → tap to correct date, time, sets, cardio, kg, reps, minutes or delete. Own exercises: S.custom[dayKey]=[[name,group,"Your own","3 × 10"]] (added to d.lib on load).
- First renderAll() is at the end of gym.js.
