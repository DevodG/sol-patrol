// SOL PATROL — game data. Facts use real NASA numbers; sources in Science Notes.
"use strict";

const ACTIONS = [
  {
    id: "air", name: "Make Air", icon: "wind", power: 6,
    desc: "Run the oxygen machine.",
    effects: { air: +16 },
    effectText: "+16 Air",
    fact: "On the ISS, machines split water to make oxygen to breathe. Mars bases will do the same!",
  },
  {
    id: "food", name: "Grow Food", icon: "leaf", power: 5,
    desc: "Water the Mars garden.",
    effects: { food: +20, air: -4 },
    effectText: "+20 Food, −4 Air",
    fact: "Plants drink water and breathe too! Growing food uses air and water, just like on Earth farms.",
  },
  {
    id: "shield", name: "Raise Shields", icon: "shield", power: 5,
    desc: "Charge the radiation shield for tonight.",
    effects: {},
    effectText: "Shield ON tonight",
    fact: "Radiation is invisible energy from the Sun. Shields and thick walls block it to keep astronauts safe.",
  },
  {
    id: "science", name: "Do Science", icon: "flask", power: 4,
    desc: "Collect Mars rocks. Uses extra air. Costs more Power each time!",
    effects: { air: -6 },
    effectText: "+1 Science Star, −6 Air",
    fact: "Science is why we go to Mars! But every experiment uses power and air. Commanders must choose wisely.",
  },
  {
    id: "call", name: "Call Earth", icon: "radio", power: 3,
    desc: "Video chat with family. It takes ~12 minutes to arrive!",
    effects: { health: +12 },
    effectText: "+12 Crew Health",
    fact: "Mars is so far that messages take 3 to 22 minutes to reach Earth. There is no live chat with Mars!",
  },
  {
    id: "rest", name: "Rest & Fix", icon: "heart", power: 2,
    desc: "Crew naps and fixes small things.",
    effects: { health: +7 },
    effectText: "+7 Crew Health",
    fact: "Astronauts sleep about 8 hours a day in space. Rest keeps their bodies and brains strong.",
  },
];

const EVENTS = [
  {
    id: "solar-storm", kind: "storm", title: "Solar Storm Tonight!",
    forecast: "Sun Watch: the Sun looks grumpy. A storm may come tonight.",
    fact: "Solar storms are real! NASA's DONKI system watches the Sun every day and warns astronauts. In October 2024 the Sun fired an X9.0 flare — the strongest of its cycle.",
  },
  {
    id: "dust-storm", kind: "dust", title: "Dust Storm!",
    forecast: "Dust Watch: red dust is blowing toward base.",
    fact: "Mars dust storms can cover the whole planet! In 2018 a giant storm ended NASA's Opportunity rover mission by blocking its sunlight.",
  },
  {
    id: "cold-night", kind: "cold", title: "Super Cold Night!",
    forecast: "Cold Watch: tonight will be freezing, near −80°C.",
    fact: "Mars nights can drop to −80°C (−110°F). Heaters use lots of power, so cold nights test the whole base.",
  },
  {
    id: "air-leak", kind: "leak", title: "Pssst… Air Leak!",
    forecast: "All Quiet: no big danger spotted. Small surprises can still happen!",
    fact: "Even a tiny hole leaks precious air. Astronauts check seals every day — air is life in space.",
  },
  {
    id: "quiet-night", kind: "quiet", title: "Quiet Starry Night",
    forecast: "All Quiet: clear skies and a calm Sun tonight.",
    fact: "A sol is one Mars day: 24 hours and 37 minutes. Mars sunsets look blue-grey, the opposite of Earth!",
  },
  {
    id: "garden-pests", kind: "pests", title: "Bugs in the Garden!",
    forecast: "All Quiet: no big danger spotted. Small surprises can still happen!",
    fact: "Space gardens must stay super clean. NASA grows real lettuce and peppers on the ISS in the Veggie garden.",
  },
  {
    id: "rover-ice", kind: "ice", title: "Rover Found Ice!",
    forecast: "All Quiet: the rover is exploring. It might find something good!",
    fact: "Mars has real water ice under its soil! Future astronauts can melt it for drinking water and split it to make air.",
  },
  {
    id: "homesick", kind: "sick", title: "Crew Feels Homesick",
    forecast: "Crew Watch: the crew misses home a little today.",
    fact: "NASA studies astronaut feelings and sleep (OSDR research). Happy, rested crews make fewer mistakes on missions.",
  },
  {
    id: "meteor", kind: "meteor", title: "Tiny Space Rock!",
    forecast: "Sky Watch: small space rocks may fall tonight.",
    fact: "Mars has a very thin sky (atmosphere), so more space rocks reach the ground than on Earth. Strong domes matter!",
  },
];

// Curated REAL archived space-weather examples (shown only when live DONKI is unreachable).
const ARCHIVE_FLARES = [
  { date: "2024-10-03", cls: "X9.0", note: "Strongest solar flare of Solar Cycle 25" },
  { date: "2024-05-10", cls: "X5.8", note: "Part of the great May 2024 solar storm that lit Earth's skies with auroras" },
  { date: "2023-12-31", cls: "X5.0", note: "New Year's Eve flare watched by NASA's Sun observatories" },
];

const FACTS = [
  "Radiation check: astronauts on the space station get about 0.5 mSv of radiation a day. On Earth you get about 0.01 mSv a day. (RadLab, NASA)",
  "A Mars sol is 24 hours and 37 minutes — a little longer than your day!",
  "Messages to Mars take 3 to 22 minutes one way. Astronauts cannot joystick-drive rovers live!",
  "NASA's Veggie garden grows real food on the space station. Mars crews will grow food too.",
  "Mars dust is super fine, like talcum powder. It sticks to everything, even spacesuits!",
  "The space station recycles about 90% of its water — even sweat and breath become drinking water.",
];

// Daily Dilemma: pick ONE. You cannot have both — that is the trade-off.
const DILEMMAS = [
  { q: "Nova found spare water. Where should it go?", a: { label: "Water the garden", effects: { food: +10, air: -5 }, text: "+10 Food, −5 Air" }, b: { label: "Make extra air", effects: { air: +10, food: -5 }, text: "+10 Air, −5 Food" } },
  { q: "The rover can make ONE trip today. Where should Pip send it?", a: { label: "Fetch underground ice", effects: { air: +8, food: -4 }, text: "+8 Air, −4 Food for the trip snacks" }, b: { label: "Collect shiny rocks", effects: { health: +6, air: -4 }, text: "+6 Crew Health (happy crew!), −4 Air" } },
  { q: "Movie night or early bedtime for the crew?", a: { label: "Movie night!", effects: { health: +9, food: -6 }, text: "+9 Crew Health, −6 Food for popcorn" }, b: { label: "Early bedtime", effects: { air: +6, health: -3 }, text: "+6 Air saved, −3 Crew Health (grumpy!)" } },
  { q: "Sunshine is strong at lunch. Use the spare Power hour for…", a: { label: "Charge shields a little", effects: { health: +5, food: -4 }, text: "+5 Crew Health (crew feels safer), −4 Food" }, b: { label: "Grow a bonus salad", effects: { food: +9, air: -5 }, text: "+9 Food, −5 Air" } },
  { q: "A supply drone can drop ONE crate. Pick wisely, Commander!", a: { label: "Air tanks crate", effects: { air: +11, food: -3 }, text: "+11 Air, −3 Food (drone fee!)" }, b: { label: "Snack crate", effects: { food: +11, air: -3 }, text: "+11 Food, −3 Air (drone fee!)" } },
  { q: "Fix the squeaky air fan now, or let the crew rest?", a: { label: "Fix it together", effects: { air: +9, health: -4 }, text: "+9 Air, −4 Crew Health (tired crew)" }, b: { label: "Let them rest", effects: { health: +8, air: -5 }, text: "+8 Crew Health, −5 Air (fan wastes air)" } },
];

const RANKS = [
  { min: 3, title: "Sol Patrol Commander", msg: "Wow! You kept everyone safe AND did amazing science. NASA would hire you today!" },
  { min: 1, title: "Outpost Explorer", msg: "Great commanding! Your crew is safe and you discovered lots of Mars secrets." },
  { min: 0, title: "Brave Cadet", msg: "You did it! Your crew survived Mars. Try again and earn more Science Stars!" },
];
