// Exercise plans, programs, alternatives and icons (no user data here)
const SPLIT4=[
 {key:"chest",name:["Chest","& Triceps"],tag:"Push",short:"Chest",color:"--red",groups:["Chest","Triceps"],
  lib:[["Barbell bench press","Chest","Barbell","4 × 8–10"],["Incline dumbbell press","Chest","Dumbbells","3 × 10–12"],["Flat dumbbell press","Chest","Dumbbells","3 × 8–12"],["Incline barbell press","Chest","Barbell","4 × 6–8"],["Decline bench press","Chest","Barbell","3 × 8–10"],["Machine chest press","Chest","Machine","3 × 10–12"],["Cable fly (high to low)","Chest","Cable","3 × 12–15"],["Cable fly (low to high)","Chest","Cable","3 × 12–15"],["Pec deck","Chest","Machine","3 × 12–15"],["Dumbbell fly","Chest","Dumbbells","3 × 10–12"],["Chest dips","Chest","Bodyweight","3 × AMRAP"],["Push-ups","Chest","Bodyweight","2 × max reps"],["Smith incline press","Chest","Machine","3 × 8–10"],["Landmine press","Chest","Barbell","3 × 10"],
  ["Close-grip bench press","Triceps","Barbell","4 × 6–8"],["Rope pushdown","Triceps","Cable","3 × 12–15"],["Straight-bar pushdown","Triceps","Cable","3 × 10–12"],["Overhead cable extension","Triceps","Cable","3 × 12"],["EZ-bar skull crushers","Triceps","Barbell","3 × 8–10"],["Overhead dumbbell extension","Triceps","Dumbbells","3 × 10–12"],["Bench dips","Triceps","Bodyweight","3 × 15"],["Reverse-grip pushdown","Triceps","Cable","3 × 12"],["Dumbbell kickbacks","Triceps","Dumbbells","3 × 12–15"],["Diamond push-ups","Triceps","Bodyweight","3 × AMRAP"],["Machine dip","Triceps","Machine","3 × 10–12"],["JM press","Triceps","Barbell","3 × 8"],["Dumbbell pullover","Chest","Dumbbells","3 × 10–12"]]},
 {key:"back",name:["Back","& Biceps"],tag:"Pull",short:"Back",color:"--blue",groups:["Back","Biceps"],
  lib:[["Deadlift","Back","Barbell","4 × 5"],["Pull-ups","Back","Bodyweight","4 × AMRAP"],["Wide lat pulldown","Back","Cable","4 × 10–12"],["Close-grip pulldown","Back","Cable","3 × 10–12"],["Barbell bent-over row","Back","Barbell","4 × 6–8"],["Single-arm dumbbell row","Back","Dumbbells","3 × 10–12 each"],["Seated cable row","Back","Cable","3 × 10–12"],["T-bar row","Back","Barbell","3 × 10–12"],["Chest-supported row","Back","Machine","3 × 10–12"],["Straight-arm pulldown","Back","Cable","3 × 12–15"],["Rack pulls","Back","Barbell","3 × 6"],["Romanian deadlift","Back","Barbell","3 × 8–10"],["Back extensions","Back","Bodyweight","2 × 15"],["Face pulls","Back","Cable","3 × 15"],
  ["Barbell curl","Biceps","Barbell","3 × 12–15"],["EZ-bar curl","Biceps","Barbell","3 × 10"],["Alternating dumbbell curl","Biceps","Dumbbells","3 × 10 each"],["Hammer curl","Biceps","Dumbbells","3 × 12"],["Incline dumbbell curl","Biceps","Dumbbells","3 × 10"],["Preacher curl","Biceps","Machine","3 × 10–12"],["Cable curl","Biceps","Cable","3 × 12–15"],["Concentration curl","Biceps","Dumbbells","3 × 12–15 each"],["Spider curl","Biceps","Dumbbells","3 × 12"],["Rope hammer curl","Biceps","Cable","3 × 12–15"],["Chin-ups","Biceps","Bodyweight","3 × AMRAP"],["Reverse-grip curl","Biceps","Barbell","3 × 12"]]},
 {key:"shoulders",name:["Shoulders","& Core"],tag:"Press",short:"Shoulders",color:"--orange",groups:["Shoulders","Core"],
  lib:[["Overhead barbell press","Shoulders","Barbell","4 × 6–8"],["Seated dumbbell press","Shoulders","Dumbbells","4 × 10–12"],["Arnold press","Shoulders","Dumbbells","3 × 10"],["Machine shoulder press","Shoulders","Machine","3 × 10–12"],["Dumbbell lateral raise","Shoulders","Dumbbells","3 × 12–15"],["Cable lateral raise","Shoulders","Cable","3 × 12–15"],["Front raise","Shoulders","Dumbbells","3 × 12"],["Rear delt fly","Shoulders","Dumbbells","3 × 12–15"],["Reverse pec deck","Shoulders","Machine","3 × 15"],["Upright row","Shoulders","Barbell","3 × 10–12"],["Dumbbell shrugs","Shoulders","Dumbbells","3 × 12–15"],["Landmine shoulder press","Shoulders","Barbell","3 × 10 each"],
  ["Plank","Core","Bodyweight","3 × 40 s"],["Side plank","Core","Bodyweight","3 × 30 s each"],["Hanging leg raise","Core","Bodyweight","3 × 10–15"],["Cable crunch","Core","Cable","3 × 15"],["Ab wheel rollout","Core","Equipment","3 × 10"],["Russian twists","Core","Dumbbells","2 × 20 each side"],["Bicycle crunches","Core","Bodyweight","3 × 20"],["Decline sit-ups","Core","Bodyweight","3 × 15"],["Pallof press","Core","Cable","3 × 12 each"],["Mountain climbers","Core","Bodyweight","3 × 40 s"],["Dead bug","Core","Bodyweight","3 × 10 each"],["Cable woodchoppers","Core","Cable","3 × 12 each"],["V-ups","Core","Bodyweight","3 × 12–15"],["Hollow body hold","Core","Bodyweight","3 × 30 s"],["Reverse crunch","Core","Bodyweight","3 × 15"],["Lying leg raise","Core","Bodyweight","3 × 15"]]},
 {key:"legs",name:["Legs",""],tag:"Lower",short:"Legs",color:"--green",groups:["Quads","Hamstrings","Glutes","Calves"],
  lib:[["Back squat","Quads","Barbell","4 × 6–8"],["Front squat","Quads","Barbell","4 × 6–8"],["Leg press","Quads","Machine","4 × 12–15"],["Hack squat","Quads","Machine","3 × 8–10"],["Bulgarian split squat","Quads","Dumbbells","3 × 10 each"],["Walking lunges","Glutes","Dumbbells","3 × 10–12 each"],["Leg extension","Quads","Machine","3 × 12–15"],["Goblet squat","Quads","Dumbbells","3 × 12"],["Step-ups","Quads","Dumbbells","3 × 10 each"],["Smith machine squat","Quads","Machine","3 × 10"],
  ["Romanian deadlift","Hamstrings","Barbell","3 × 10"],["Lying leg curl","Hamstrings","Machine","3 × 12–15"],["Seated leg curl","Hamstrings","Machine","3 × 12"],["Good mornings","Hamstrings","Barbell","3 × 10"],["Nordic curl","Hamstrings","Bodyweight","3 × 6"],["Sumo deadlift","Hamstrings","Barbell","3 × 6"],
  ["Hip thrust","Glutes","Barbell","4 × 8–10"],["Glute bridge","Glutes","Bodyweight","3 × 15"],["Cable kickback","Glutes","Cable","3 × 12 each"],["Hip abduction machine","Glutes","Machine","3 × 15"],
  ["Standing calf raise","Calves","Machine","3 × 15"],["Seated calf raise","Calves","Machine","3 × 15–20"],["Leg press calf raise","Calves","Machine","3 × 15"],["Single-leg calf raise","Calves","Dumbbells","3 × 12 each"],["Box jumps","Calves","Bodyweight","3 × 8"],["Jump rope","Calves","Equipment","3 × 60 s"],["Hip adduction machine","Glutes","Machine","3 × 15"]]}
];
// Must-do lifts: always in the plan, cannot be removed
const ESS={
 chest:["Barbell bench press","Incline dumbbell press","Rope pushdown","Overhead dumbbell extension"],
 back:["Wide lat pulldown","Seated cable row","Single-arm dumbbell row","Barbell curl"],
 shoulders:["Seated dumbbell press","Dumbbell lateral raise","Rear delt fly","Hanging leg raise"],
 legs:["Leg press","Romanian deadlift","Walking lunges","Standing calf raise"]};
// Default plan: 6 exercises, about 18 sets, so lifting fits in ~36 minutes
const DEFAULT={
 chest:["Barbell bench press","Incline dumbbell press","Cable fly (high to low)","Push-ups","Overhead dumbbell extension","Rope pushdown"],
 back:["Wide lat pulldown","Seated cable row","Single-arm dumbbell row","Back extensions","Barbell curl","Hammer curl"],
 shoulders:["Seated dumbbell press","Dumbbell lateral raise","Rear delt fly","Hanging leg raise","Plank","Russian twists"],
 legs:["Leg press","Romanian deadlift","Walking lunges","Lying leg curl","Leg extension","Standing calf raise"]};
// Pairs done back to back with rest only after the second
const SUPER={
 chest:[["Overhead dumbbell extension","Rope pushdown"],["Overhead cable extension","Rope pushdown"],["EZ-bar skull crushers","Rope pushdown"]],
 back:[["Barbell curl","Hammer curl"],["EZ-bar curl","Hammer curl"],["Back extensions","Face pulls"]],
 shoulders:[["Hanging leg raise","Plank","Russian twists"],["Dumbbell lateral raise","Rear delt fly"]],
 legs:[["Lying leg curl","Leg extension"],["Seated leg curl","Leg extension"]]};
// Every area a day must hit, and the exercises that hit it
const AREAS={
 chest:{"Upper chest":["Incline dumbbell press","Incline barbell press","Smith incline press","Cable fly (low to high)","Landmine press"],
  "Mid chest":["Dumbbell pullover","Barbell bench press","Flat dumbbell press","Machine chest press","Pec deck","Dumbbell fly","Push-ups"],
  "Lower chest":["Decline bench press","Chest dips","Cable fly (high to low)"],
  "Triceps long head":["Overhead cable extension","Overhead dumbbell extension","EZ-bar skull crushers"],
  "Triceps outer heads":["Rope pushdown","Straight-bar pushdown","Dumbbell kickbacks","Diamond push-ups","Close-grip bench press","Bench dips","Machine dip","JM press","Reverse-grip pushdown"]},
 back:{"Lats (width)":["Pull-ups","Wide lat pulldown","Close-grip pulldown","Straight-arm pulldown","Single-arm dumbbell row"],
  "Mid back (thickness)":["Barbell bent-over row","Seated cable row","T-bar row","Chest-supported row","Face pulls"],
  "Lower back":["Deadlift","Rack pulls","Romanian deadlift","Back extensions"],
  "Biceps":["Barbell curl","EZ-bar curl","Alternating dumbbell curl","Cable curl","Chin-ups","Incline dumbbell curl","Preacher curl","Spider curl","Concentration curl"],
  "Brachialis & forearm":["Hammer curl","Rope hammer curl","Reverse-grip curl"]},
 shoulders:{"Front delts":["Overhead barbell press","Seated dumbbell press","Arnold press","Machine shoulder press","Front raise","Landmine shoulder press"],
  "Side delts":["Dumbbell lateral raise","Cable lateral raise","Upright row"],
  "Rear delts & traps":["Rear delt fly","Reverse pec deck","Dumbbell shrugs"],
  "Abs":["Hanging leg raise","Cable crunch","Decline sit-ups","V-ups","Reverse crunch","Lying leg raise","Mountain climbers"],
  "Obliques":["Side plank","Russian twists","Bicycle crunches","Pallof press","Cable woodchoppers"],
  "Deep core":["Plank","Ab wheel rollout","Dead bug","Hollow body hold"]},
 legs:null};
SPLIT4.forEach(d=>{if(!AREAS[d.key]){AREAS[d.key]={};d.groups.forEach(g=>AREAS[d.key][g]=d.lib.filter(e=>e[1]===g).map(e=>e[0]))}});
const areaOf=(k,n)=>Object.keys(AREAS[k]).find(a=>AREAS[k][a].includes(n))||"";
const isEss=(k,n)=>{const sw=(S.swaps&&S.swaps[k])||{};return (ESS[k].includes(n)&&!sw[n])||Object.entries(sw).some(([o,a])=>a===n&&ESS[k].includes(o));};

// 4th field = tier: m must-do, r recommended, o optional · 5th "s" = stretch (not counted as cardio)
// Warm-up (10 min): easy incline walk, a quick pulse raiser, moves for today's muscles, then light warm-up sets
const W1=["Incline treadmill walk","Easy-brisk pace · 5–6 km/h · 6–8% incline","5 min","m"];
const WJJ=["Jumping jacks","2 × 30 s to raise your heart rate","1 min","r"];
const WGS=["World's greatest stretch","3 slow reps each side","2 min","m"];
const WSET=n=>["Warm-up sets",`2 light sets of ${n} before your working sets`,"2 min","m"];
const WARM={common:[],
 chest:[W1,WJJ,WGS,["Band pull-aparts","2 × 15 · wakes up the upper back","1 min","m"],["Arm circles and chest openers","10 each direction","1 min","o"],WSET("bench press")],
 back:[W1,WJJ,WGS,["Dead hang","2 × 20 s · loosens shoulders and lats","1 min","m"],["Cat-cow and thoracic rotations","8 each","1 min","o"],WSET("lat pulldown")],
 shoulders:[W1,WJJ,WGS,["Band dislocates","2 × 10 · opens the shoulders","1 min","m"],["Band external rotations","2 × 12 each arm","1 min","r"],WSET("shoulder press")],
 legs:[W1,WJJ,WGS,["Bodyweight squats","2 × 15","1 min","m"],["Leg swings and hip circles","10 each direction","1 min","r"],WSET("leg press")]};
// After lifting (15 min): 12 min cardio, alternating intervals and steady Zone 2, then 3 min stretching
const Z2=["Zone 2 incline walk","Steady pace you can still talk at · 10–12% incline · 5–6 km/h","12 min"];
const COOL=t=>["Cool-down stretch",`${t} · hold each 30 s`,"3 min","m","s"];
const FIN={chest:[["Treadmill intervals","6 rounds · 1 min fast walk or jog / 1 min easy · 70–80% effort","12 min","m"],["Rowing machine","Swap-in · steady, smooth strokes","12 min","r"],COOL("Chest, triceps and shoulders")],
 back:[[...Z2,"m"],["Stationary bike","Swap-in · steady, moderate resistance","12 min","r"],COOL("Lats, biceps and lower back")],
 shoulders:[["Bike intervals","8 rounds · 30 s hard / 60 s easy · 70–80% effort","12 min","m"],["Elliptical","Swap-in · steady, moderate pace","12 min","r"],COOL("Shoulders, chest and hip flexors")],
 legs:[[...Z2,"m"],["Stair climber","Swap-in · slow, steady pace","12 min","r"],COOL("Quads, hamstrings, glutes and calves")]};
// Recommended lifts; everything not must-do or recommended is optional
const REC={
 chest:["Cable fly (high to low)","Push-ups","Dumbbell pullover","Flat dumbbell press","Incline barbell press","Chest dips","Cable fly (low to high)","Close-grip bench press","EZ-bar skull crushers","Overhead cable extension"],
 back:["Back extensions","Hammer curl","Concentration curl","T-bar row","Pull-ups","Deadlift","Barbell bent-over row","Face pulls","Incline dumbbell curl","Chin-ups"],
 shoulders:["Upright row","Plank","Russian twists","Overhead barbell press","Arnold press","Cable lateral raise","Reverse pec deck","Dumbbell shrugs","Cable crunch","Ab wheel rollout"],
 legs:["Lying leg curl","Leg extension","Back squat","Bulgarian split squat","Hip thrust","Seated leg curl","Seated calf raise"]};

// ================= Programs: 4-Day Split, Upper/Lower, Push/Pull/Legs =================
const LIB=Object.fromEntries(SPLIT4.map(d=>[d.key,d.lib]));
const pick=(key,groups,as)=>LIB[key].filter(e=>groups.includes(e[1])).map(e=>[e[0],as||e[1],e[2],e[3]]);
const pickN=(key,names,as)=>LIB[key].filter(e=>names.includes(e[0])).map(e=>[e[0],as||e[1],e[2],e[3]]);
const REAR=["Rear delt fly","Reverse pec deck","Dumbbell shrugs"];
const TRAP_BAR=["Trap bar deadlift","Glutes","Barbell","3 × 4–6"];
function mkLib(parts,rx={}){const seen=new Set(),out=[];parts.flat().forEach(e=>{if(seen.has(e[0]))return;seen.add(e[0]);out.push([e[0],e[1],e[2],rx[e[0]]||e[3]]);});return out;}
const upperParts=()=>[pick("chest",["Chest"]),pick("back",["Back"]).filter(e=>!["Deadlift","Rack pulls","Romanian deadlift"].includes(e[0])),pick("shoulders",["Shoulders"]),pick("back",["Biceps"]),pick("chest",["Triceps"])];
const lowerParts=()=>[pick("legs",["Quads","Hamstrings","Glutes","Calves"]),[TRAP_BAR],pick("shoulders",["Core"])];
const UL_UP=["Chest","Back","Shoulders","Biceps","Triceps"],UL_LO=["Quads","Hamstrings","Glutes","Calves","Core"];
const ULDAYS=[
 {key:"ua",name:["Upper A",""],tag:"Strength",short:"Upper A",color:"--red",icon:"chest",groups:UL_UP,
  lib:mkLib(upperParts(),{"Barbell bench press":"3 × 5–8","Chest-supported row":"3 × 8–12","Seated dumbbell press":"3 × 6–8","Wide lat pulldown":"3 × 8–12","Dumbbell lateral raise":"3 × 12–15","EZ-bar curl":"2 × 8–12","Overhead cable extension":"2 × 10–15"})},
 {key:"la",name:["Lower A",""],tag:"Strength",short:"Lower A",color:"--green",icon:"legs",groups:UL_LO,
  lib:mkLib(lowerParts(),{"Trap bar deadlift":"3 × 4–6","Leg press":"3 × 10–12","Seated leg curl":"3 × 10–15","Leg extension":"2 × 12–15","Hip abduction machine":"2 × 12–15","Standing calf raise":"3 × 12–15","Cable crunch":"2 × 12–15"})},
 {key:"ub",name:["Upper B",""],tag:"Muscle · lower chest",short:"Upper B",color:"--orange",icon:"shoulders",groups:UL_UP,
  lib:mkLib(upperParts(),{"Incline dumbbell press":"3 × 8–12","Seated cable row":"3 × 10–12","Cable fly (high to low)":"3 × 12–15","Face pulls":"3 × 12–15","Dumbbell lateral raise":"2 × 12–15","Hammer curl":"2 × 10–15","Chest dips":"2 × 8–12"})},
 {key:"lb",name:["Lower B",""],tag:"Muscle",short:"Lower B",color:"--cyan",icon:"legs",groups:UL_LO,
  lib:mkLib(lowerParts(),{"Romanian deadlift":"3 × 8–10","Hack squat":"3 × 8–12","Bulgarian split squat":"3 × 8–12 each","Hip thrust":"3 × 8–12","Leg extension":"2 × 12–15","Hip adduction machine":"2 × 12–15","Seated calf raise":"3 × 12–15","Pallof press":"2 × 12 each side"})}];
const PPLDAYS=[
 {key:"push",name:["Push",""],tag:"Chest · shoulders · triceps",short:"Push",color:"--red",icon:"chest",groups:["Chest","Shoulders","Triceps"],
  lib:mkLib([pick("chest",["Chest"]),pick("shoulders",["Shoulders"]).filter(e=>!REAR.includes(e[0])),pick("chest",["Triceps"])],{"Barbell bench press":"4 × 6–10","Seated dumbbell press":"3 × 8–12","Cable fly (high to low)":"2 × 12–15","Dumbbell lateral raise":"3 × 12–15"})},
 {key:"pull",name:["Pull",""],tag:"Back · rear delts · biceps",short:"Pull",color:"--blue",icon:"back",groups:["Back","Rear delts & traps","Biceps"],
  lib:mkLib([pick("back",["Back"]),pickN("shoulders",REAR,"Rear delts & traps"),pick("back",["Biceps"])],{"Wide lat pulldown":"4 × 8–12","Single-arm dumbbell row":"3 × 10–12 each","Face pulls":"3 × 15","Hammer curl":"2 × 12"})},
 {key:"plegs",name:["Legs",""],tag:"Legs · core",short:"Legs",color:"--green",icon:"legs",groups:UL_LO,
  lib:mkLib(lowerParts(),{"Leg press":"4 × 10–12","Romanian deadlift":"3 × 8–10","Walking lunges":"3 × 10 each","Lying leg curl":"3 × 12","Standing calf raise":"3 × 15","Hanging leg raise":"3 × 10–15"})}];
// Face pulls move to the rear-delt group on Pull day
PPLDAYS[1].lib.forEach(e=>{if(e[0]==="Face pulls")e[1]="Rear delts & traps";});
SPLIT4.forEach(d=>d.icon=d.key);
const PROGRAMS={
 split4:{name:"4-Day Split",sub:"Chest & Triceps · Back & Biceps · Shoulders & Core · Legs",days:SPLIT4},
 ul:{name:"Upper / Lower",sub:"Upper A · Lower A · Upper B · Lower B · every muscle twice per rotation",days:ULDAYS},
 ppl:{name:"Push / Pull / Legs",sub:"Push · Pull · Legs · 3-day rotation",days:PPLDAYS}};
const ALLDAYS=[...SPLIT4,...ULDAYS,...PPLDAYS];
let DAYS=SPLIT4;

Object.assign(ESS,{
 ua:["Barbell bench press","Chest-supported row","Seated dumbbell press","Wide lat pulldown"],
 la:["Trap bar deadlift","Leg press","Seated leg curl","Standing calf raise"],
 ub:["Incline dumbbell press","Seated cable row","Cable fly (high to low)","Chest dips"],
 lb:["Romanian deadlift","Hack squat","Hip thrust","Seated calf raise"],
 push:["Barbell bench press","Incline dumbbell press","Seated dumbbell press","Rope pushdown"],
 pull:["Wide lat pulldown","Seated cable row","Face pulls","Barbell curl"],
 plegs:["Leg press","Romanian deadlift","Standing calf raise","Hanging leg raise"]});
Object.assign(DEFAULT,{
 ua:["Barbell bench press","Chest-supported row","Seated dumbbell press","Wide lat pulldown","Dumbbell lateral raise","EZ-bar curl","Overhead cable extension"],
 la:["Trap bar deadlift","Leg press","Seated leg curl","Leg extension","Hip abduction machine","Standing calf raise","Cable crunch"],
 ub:["Incline dumbbell press","Seated cable row","Cable fly (high to low)","Face pulls","Dumbbell lateral raise","Hammer curl","Chest dips"],
 lb:["Romanian deadlift","Hack squat","Hip thrust","Leg extension","Hip adduction machine","Seated calf raise","Pallof press"],
 push:["Barbell bench press","Incline dumbbell press","Seated dumbbell press","Dumbbell lateral raise","Cable fly (high to low)","Rope pushdown"],
 pull:["Wide lat pulldown","Seated cable row","Single-arm dumbbell row","Face pulls","Barbell curl","Hammer curl"],
 plegs:["Leg press","Romanian deadlift","Walking lunges","Lying leg curl","Standing calf raise","Hanging leg raise"]});
Object.assign(REC,{
 ua:["Dumbbell lateral raise","EZ-bar curl","Overhead cable extension","Flat dumbbell press","Seated cable row","Pull-ups","Face pulls","Hammer curl","Rope pushdown"],
 la:["Leg extension","Hip abduction machine","Cable crunch","Romanian deadlift","Hack squat","Lying leg curl","Seated calf raise","Plank"],
 ub:["Face pulls","Dumbbell lateral raise","Hammer curl","Decline bench press","Chest-supported row","Wide lat pulldown","Overhead cable extension","Rear delt fly"],
 lb:["Leg extension","Hip adduction machine","Pallof press","Bulgarian split squat","Walking lunges","Lying leg curl","Standing calf raise","Cable crunch"],
 push:["Dumbbell lateral raise","Cable fly (high to low)","Overhead cable extension","Chest dips","Flat dumbbell press","Arnold press","Cable lateral raise"],
 pull:["Single-arm dumbbell row","Hammer curl","Pull-ups","Chest-supported row","Rear delt fly","Dumbbell shrugs","Incline dumbbell curl","Back extensions"],
 plegs:["Walking lunges","Lying leg curl","Leg extension","Hip thrust","Seated calf raise","Plank","Cable crunch"]});
Object.assign(SUPER,{
 ua:[["EZ-bar curl","Overhead cable extension"]],
 la:[["Leg extension","Hip abduction machine"],["Standing calf raise","Cable crunch"]],
 ub:[["Hammer curl","Chest dips"],["Face pulls","Dumbbell lateral raise"]],
 lb:[["Leg extension","Hip adduction machine"],["Seated calf raise","Pallof press"]],
 push:[["Dumbbell lateral raise","Rope pushdown"]],
 pull:[["Barbell curl","Hammer curl"]],
 plegs:[["Lying leg curl","Leg extension"],["Standing calf raise","Hanging leg raise"]]});
// Strength lifts rest longer; some lifts carry a coaching note
const STRONG={ua:["Barbell bench press","Seated dumbbell press"],la:["Trap bar deadlift"]};
const NOTE={ub:{"Cable fly (high to low)":"Lower-chest focus","Chest dips":"Lower-chest focus · assisted if needed","Decline bench press":"Lower-chest focus"},
 lb:{"Hack squat":"Or Bulgarian split squat — tap Alternatives"},chest:{"Cable fly (high to low)":"Lower-chest focus"},push:{"Cable fly (high to low)":"Lower-chest focus","Chest dips":"Lower-chest focus · assisted if needed"}};
const isStrong=(k,n)=>(STRONG[k]||[]).includes(n);

// Areas: one per muscle group, plus exercises that clearly train two groups
ALLDAYS.forEach(d=>{if(AREAS[d.key])return;AREAS[d.key]={};d.groups.forEach(g=>AREAS[d.key][g]=d.lib.filter(e=>e[1]===g).map(e=>e[0]));});
const ALSO={Triceps:["Chest dips","Close-grip bench press","Push-ups"],Biceps:["Chin-ups"],Glutes:["Romanian deadlift","Walking lunges","Bulgarian split squat","Hack squat","Leg press"],Hamstrings:["Trap bar deadlift","Good mornings"],Shoulders:["Face pulls"],"Rear delts & traps":["Face pulls"]};
["ua","ub","la","lb","push","plegs","pull"].forEach(k=>{Object.entries(ALSO).forEach(([a,names])=>{if(AREAS[k][a])names.forEach(n=>{if(!AREAS[k][a].includes(n)&&ALLDAYS.find(d=>d.key===k).lib.some(e=>e[0]===n))AREAS[k][a].push(n);});});});

// Warm-up and after-lifting cardio for the new days
const WSETn=n=>["Warm-up sets",`1–2 ramp-up sets of ${n}`,"2 min","m"];
const mob={upper:["Band dislocates","2 × 10 · opens the shoulders","1 min","m"],lower:["Bodyweight squats","2 × 15","1 min","m"],pull:["Dead hang","2 × 20 s · loosens shoulders and lats","1 min","m"]};
const mob2={upper:["Band pull-aparts","2 × 15","1 min","r"],lower:["Leg swings and hip circles","10 each direction","1 min","r"],pull:["Cat-cow and thoracic rotations","8 each","1 min","o"]};
const ULWALK=["Incline walk","Steady Zone 2 · 10–12% incline · you can still talk","15 min","m"];
Object.assign(WARM,{
 ua:[W1,WJJ,WGS,mob.upper,mob2.upper,WSETn("bench press")],la:[W1,WJJ,WGS,mob.lower,mob2.lower,WSETn("trap bar deadlift")],
 ub:[W1,WJJ,WGS,mob.upper,mob2.upper,WSETn("incline press")],lb:[W1,WJJ,WGS,mob.lower,mob2.lower,WSETn("Romanian deadlift")],
 push:[W1,WJJ,WGS,mob.upper,mob2.upper,WSETn("bench press")],pull:[W1,WJJ,WGS,mob.pull,mob2.upper,WSETn("lat pulldown")],plegs:[W1,WJJ,WGS,mob.lower,mob2.lower,WSETn("leg press")]});
Object.assign(FIN,{
 ua:[ULWALK,["Stationary bike","Swap-in · steady, moderate resistance","15 min","r"],COOL("Chest, back and shoulders")],
 la:[ULWALK,["Stationary bike","Swap-in · easy spin if legs are tired","15 min","r"],COOL("Quads, hamstrings, glutes and calves")],
 ub:[ULWALK,["Rowing machine","Swap-in · steady, smooth strokes","15 min","r"],COOL("Chest, triceps and shoulders")],
 lb:[ULWALK,["Stationary bike","Swap-in · easy spin if legs are tired","15 min","r"],COOL("Hamstrings, glutes and hips")],
 push:[["Treadmill intervals","6 rounds · 1 min fast walk or jog / 1 min easy · 70–80% effort","12 min","m"],["Rowing machine","Swap-in · steady, smooth strokes","12 min","r"],COOL("Chest, triceps and shoulders")],
 pull:[[...Z2,"m"],["Stationary bike","Swap-in · steady, moderate resistance","12 min","r"],COOL("Lats, biceps and upper back")],
 plegs:[[...Z2,"m"],["Stair climber","Swap-in · slow, steady pace","12 min","r"],COOL("Quads, hamstrings, glutes and calves")]});

// Best swaps for each exercise (only those in that day's library are shown)
const ALT={
 "Barbell bench press":["Flat dumbbell press","Machine chest press","Smith incline press","Push-ups"],
 "Incline dumbbell press":["Incline barbell press","Smith incline press","Cable fly (low to high)","Landmine press"],
 "Flat dumbbell press":["Barbell bench press","Machine chest press","Push-ups"],
 "Cable fly (high to low)":["Chest dips","Decline bench press","Pec deck","Dumbbell fly"],
 "Chest dips":["Decline bench press","Cable fly (high to low)","Machine dip","Close-grip bench press"],
 "Push-ups":["Machine chest press","Flat dumbbell press","Diamond push-ups"],
 "Overhead dumbbell extension":["Overhead cable extension","EZ-bar skull crushers","JM press"],
 "Overhead cable extension":["Overhead dumbbell extension","EZ-bar skull crushers","JM press"],
 "Rope pushdown":["Straight-bar pushdown","Reverse-grip pushdown","Dumbbell kickbacks","Machine dip"],
 "Wide lat pulldown":["Pull-ups","Close-grip pulldown","Straight-arm pulldown","Single-arm dumbbell row"],
 "Seated cable row":["Chest-supported row","T-bar row","Single-arm dumbbell row","Barbell bent-over row"],
 "Chest-supported row":["Seated cable row","T-bar row","Single-arm dumbbell row","Barbell bent-over row"],
 "Single-arm dumbbell row":["Seated cable row","Chest-supported row","Barbell bent-over row"],
 "Back extensions":["Romanian deadlift","Rack pulls","Good mornings"],
 "Face pulls":["Rear delt fly","Reverse pec deck","Dumbbell shrugs"],
 "Barbell curl":["EZ-bar curl","Cable curl","Alternating dumbbell curl","Preacher curl"],
 "EZ-bar curl":["Barbell curl","Cable curl","Preacher curl","Alternating dumbbell curl"],
 "Hammer curl":["Rope hammer curl","Reverse-grip curl","Alternating dumbbell curl"],
 "Seated dumbbell press":["Machine shoulder press","Arnold press","Overhead barbell press","Landmine shoulder press"],
 "Dumbbell lateral raise":["Cable lateral raise","Upright row","Machine shoulder press"],
 "Rear delt fly":["Reverse pec deck","Face pulls"],
 "Hanging leg raise":["Reverse crunch","Lying leg raise","Cable crunch","V-ups"],
 "Plank":["Dead bug","Ab wheel rollout","Hollow body hold","Side plank"],
 "Russian twists":["Cable woodchoppers","Pallof press","Bicycle crunches","Side plank"],
 "Cable crunch":["Decline sit-ups","Reverse crunch","Hanging leg raise","Ab wheel rollout"],
 "Pallof press":["Cable woodchoppers","Side plank","Dead bug"],
 "Leg press":["Hack squat","Back squat","Goblet squat","Smith machine squat"],
 "Hack squat":["Bulgarian split squat","Leg press","Front squat","Goblet squat"],
 "Back squat":["Leg press","Hack squat","Front squat","Goblet squat"],
 "Trap bar deadlift":["Romanian deadlift","Sumo deadlift","Hip thrust","Good mornings"],
 "Romanian deadlift":["Good mornings","Sumo deadlift","Trap bar deadlift","Lying leg curl"],
 "Walking lunges":["Bulgarian split squat","Step-ups","Goblet squat"],
 "Bulgarian split squat":["Walking lunges","Step-ups","Hack squat"],
 "Lying leg curl":["Seated leg curl","Nordic curl","Romanian deadlift"],
 "Seated leg curl":["Lying leg curl","Nordic curl","Romanian deadlift"],
 "Leg extension":["Goblet squat","Bulgarian split squat","Step-ups"],
 "Hip thrust":["Glute bridge","Cable kickback","Hip abduction machine"],
 "Hip abduction machine":["Cable kickback","Glute bridge"],
 "Hip adduction machine":["Sumo deadlift","Goblet squat"],
 "Standing calf raise":["Leg press calf raise","Single-leg calf raise","Seated calf raise"],
 "Seated calf raise":["Standing calf raise","Leg press calf raise","Single-leg calf raise"]};

const TIERS={m:"Must-do",r:"Recommended",o:"Optional"};
const tierOf=(k,n)=>isEss(k,n)?"m":REC[k].includes(n)?"r":"o";

const sv=(p,o={})=>`<svg viewBox="0 0 24 24" fill="${o.fill?"currentColor":"none"}" stroke="${o.fill?"none":"currentColor"}" stroke-width="${o.w||2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const G={
  play:sv('<path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10.3-6.4a.8.8 0 0 0 0-1.4L9.2 4.9A.8.8 0 0 0 8 5.6z"/>',{fill:1}),
  star:sv('<path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/>',{fill:1}),
  check:sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>',{w:2.6}),
  minus:sv('<path d="M6 12h12"/>',{w:3}),
  lock:sv('<rect x="5.5" y="10.5" width="13" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  plusc:sv('<circle cx="12" cy="12" r="10.5" fill="currentColor" stroke="none"/><path d="M12 7.5v9M7.5 12h9" style="stroke:var(--ontint)" stroke-width="2.2"/>'),
  checkc:sv('<circle cx="12" cy="12" r="10.5" fill="currentColor" stroke="none"/><path d="m7.5 12.3 3 3 6-6.3" style="stroke:var(--ontint)" stroke-width="2.2"/>'),
  addRow:sv('<circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/>'),
  shuffle:sv('<path d="M3 7h3.5c4 0 6 10 10 10H21M3 17h3.5c1.6 0 2.8-1.5 3.8-3.4M13.7 10.4c1-1.9 2.2-3.4 3.8-3.4H21M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
  reset:sv('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8"/>'),
  flame:sv('<path d="M12 22c4.2 0 7-2.8 7-6.7 0-3.8-2.5-6-4-8.5-.5 2-1.6 3.3-2.9 3.9.2-3.4-1.5-6.4-4-8.7.2 3.7-3.6 6.5-3.6 11.4C4.5 18.9 7.6 22 12 22z"/>',{fill:1}),
  walk:sv('<circle cx="13.5" cy="4.2" r="2"/><path d="M10.5 21l1.8-5.2 2.7 2.4V21M7.5 12.2l2.7-3.6 3.6 1 1.9 3M12.3 15.8l-1-5.3"/>',{w:2.1}),
  fork:sv('<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M17.5 21V3c-2.2 1-3.5 3.6-3.5 7.2 0 1.9 1.2 2.8 3.5 2.8"/>',{w:2.1}),
  drop:sv('<path d="M12 2.8s6.5 6.9 6.5 11.7a6.5 6.5 0 0 1-13 0C5.5 9.7 12 2.8 12 2.8z"/>',{fill:1}),
  moon:sv('<path d="M20.5 14.6A8.5 8.5 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1z"/>',{fill:1}),
  leaf:sv('<path d="M5 20c0-9.5 5.5-15 15-15 0 9.5-5.5 14.5-14 14.5M5 20l7.5-7.5"/>',{w:2.1}),
  tab:{
    chest:sv('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',{w:2.2}),
    back:sv('<path d="M3 4.5h18M7.5 4.5v3.2a4.5 4.5 0 0 0 9 0V4.5"/><circle cx="12" cy="14" r="2"/><path d="M12 16.5V21"/>',{w:2}),
    shoulders:sv('<path d="M3.5 3.5v4M20.5 3.5v4M3.5 5.5h17M8 5.5l2.3 6M16 5.5l-2.3 6"/><circle cx="12" cy="14" r="2"/><path d="M12 16.5V21"/>',{w:2}),
    legs:sv('<path d="M9 3v7l-3.2 5L9 21M15 3v7l3.2 5L15 21"/>',{w:2.2})
  }
};
const play=(n,extra="proper form",soft=false,img="")=>`<a class="play${soft?" soft":""}${img?" thumb":""}"${img?` style="--img:url(${img})"`:""} href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${n} ${extra} #shorts`)}" target="_blank" rel="noopener" aria-label="Watch how to do ${esc(n)}">${G.play}</a>`;
const tierTag=t=>`<span class="tt ${t}">${t==="m"?G.star:""}${TIERS[t]}</span> · `;


// ---------- extra icons ----------
Object.assign(G,{
  bolt:sv('<path d="M13.5 2.5 5 13.5h6.2l-1 8 8.3-11.2h-6.3z"/>',{fill:1}),
  heart:sv('<path d="M12 20.6s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.4 4.4 4.4 0 0 1 20 10c0 5.9-8 10.6-8 10.6z"/>',{fill:1}),
  wave:sv('<path d="M2.5 12.5h3.2l2.1-5.5 3.6 10.5 3-7.5 2 2.5h5.1"/>',{w:2.2}),
  band:sv('<rect x="7" y="2.5" width="10" height="19" rx="5"/><path d="M10 12h4"/>',{w:2}),
  flask:sv('<path d="M9.5 3h5M10.5 3v6.2L5 18.3A2.1 2.1 0 0 0 6.8 21.5h10.4a2.1 2.1 0 0 0 1.8-3.2L13.5 9.2V3M7.3 15h9.4"/>',{w:2}),
  scale:sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8.3 10a5 5 0 0 1 7.4 0L12 13.2z"/>',{w:2}),
  copy:sv('<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',{w:2}),
  out:sv('<path d="M7 17 17 7M9 7h8v8"/>',{w:2.2}),
  chevL:sv('<path d="M15 5l-7 7 7 7"/>',{w:2.6}),
  chevR:sv('<path d="M9 5l7 7-7 7"/>',{w:2.6}),
  sparkle:sv('<path d="M11 2.5l2 5.3 5.3 2-5.3 2-2 5.4-2-5.4-5.3-2 5.3-2zM18.5 14l1 2.6 2.5 1-2.5 1-1 2.6-1-2.6-2.5-1 2.5-1z"/>',{fill:1}),
  run:sv('<circle cx="15" cy="4.3" r="2"/><path d="M7.5 21l3.2-6 3.1 2.7V21M5.5 11.4l3.6-3.6 4.2 1.4 2.1 3.4 3.1.6M10.7 15l1.6-5.8"/>',{w:2.1}),
  pulse:sv('<path d="M12 20.6s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.4 4.4 4.4 0 0 1 20 10c0 5.9-8 10.6-8 10.6z"/><path d="M4.5 12.5h3.3l1.6-2.7 2.3 5.2 1.6-2.5h6.2"/>',{w:2}),
  dumbbell:sv('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',{w:2.2}),
  trend:sv('<path d="M3.5 17.5 9 12l3.5 3.5 8-8M15 7.5h5.5V13"/>',{w:2.2}),
  calendar:sv('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',{w:2})
});


// ---------- photos (Phase 2) ----------
const PH={cable:"img/workout-cable.jpg",bench:"img/upper-a-bench.jpg",squat:"img/lower-a-squat.jpg",pullup:"img/upper-b-pullup.jpg",rdl:"img/lower-b-rdl.jpg",
  treadmill:"img/activity-treadmill.jpg",dumbbells:"img/health-dumbbells.jpg",press:"img/shoulder-press.jpg"};
const DAYPH={ua:"bench",la:"squat",ub:"pullup",lb:"rdl",chest:"bench",back:"pullup",shoulders:"press",legs:"squat",push:"bench",pull:"pullup",plegs:"squat"};
const GRPPH={Chest:"bench",Triceps:"bench",Back:"pullup",Biceps:"pullup","Rear delts & traps":"pullup",Shoulders:"press",Core:"cable",Quads:"squat",Calves:"squat",Hamstrings:"rdl",Glutes:"rdl"};
const SCRPH={workout:"cable",activity:"treadmill",health:"dumbbells",insights:"press"};
