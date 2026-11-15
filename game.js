// SOL PATROL — Junior Astronaut Mission Trainer (NASA Space Apps 2026)
"use strict";

const $ = (id) => document.getElementById(id);
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
const rand = (a, b) => a + Math.random() * (b - a);

let audioCtx = null;
function beep(freq, dur) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.type = "sine";
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* sound is optional */ }
}

const state = {
  sol: 1, maxSol: 8,
  power: 18, air: 70, food: 65, health: 85, stars: 0,
  shieldOn: false, used: new Set(), deck: [], tonight: null,
  solarTomorrow: null, grewToday: false, restedToday: false,
  over: false, sound: true, sunRisk: "active", started: false,
};

const SAVE_KEY = "sol-patrol-save-v1";
function saveGame() {
  if (!state.started || state.over) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      sol: state.sol, power: state.power, air: state.air, food: state.food, health: state.health,
      stars: state.stars, shieldOn: state.shieldOn, used: [...state.used],
      deck: state.deck.map((e) => e.id), tonight: state.tonight ? state.tonight.id : null,
      solarTomorrow: state.solarTomorrow, grewToday: state.grewToday, restedToday: state.restedToday, sunRisk: state.sunRisk,
    }));
    $("saveWarn").classList.add("hidden");
  } catch (e) {
    $("saveWarn").classList.remove("hidden");
  }
}
function readSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.sol ? s : null; } catch (e) { return null; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nothing to clear */ } }
function restoreSave(s) {
  const byId = (id) => EVENTS.find((e) => e.id === id);
  Object.assign(state, {
    sol: s.sol, power: s.power, air: s.air, food: s.food, health: s.health, stars: s.stars,
    shieldOn: !!s.shieldOn, used: new Set(s.used || []), deck: (s.deck || []).map(byId).filter(Boolean),
    tonight: s.tonight ? byId(s.tonight) : null, solarTomorrow: s.solarTomorrow != null ? s.solarTomorrow : null,
    grewToday: !!s.grewToday, restedToday: !!s.restedToday, sunRisk: s.sunRisk || "active", over: false, started: true,
  });
  if (!state.tonight) pickTonight(); else $("forecast").textContent = "Tonight: " + state.tonight.forecast;
  $("phaseTitle").textContent = `Sol ${state.sol} — Your turn, Commander!`;
  $("sceneCaption").textContent = `Welcome back, Commander! Sol ${state.sol} on Mars.`;
  $("nightShade").classList.add("hidden");
  $("nightBtn").disabled = false;
  logMsg(`Mission restored at Sol ${state.sol}. Your crew waited for you!`);
  render();
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function logMsg(text) {
  const p = document.createElement("p");
  p.textContent = text;
  $("log").prepend(p);
  while ($("log").children.length > 5) $("log").lastChild.remove();
}

function floatText(anchor, text) {
  try {
    const r = anchor.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "float-num"; s.textContent = text;
    s.style.left = (window.scrollX + r.left + r.width / 2) + "px";
    s.style.top = (window.scrollY + r.top) + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  } catch (e) { /* decoration only */ }
}

function render() {
  $("solPill").textContent = `Sol ${Math.min(state.sol, state.maxSol)} of ${state.maxSol}`;
  $("starPill").textContent = `Science Stars: ${state.stars}`;
  $("powerVal").textContent = state.power;
  $("airVal").textContent = state.air;
  $("foodVal").textContent = state.food;
  $("healthVal").textContent = state.health;
  $("powerBar").style.width = clamp(state.power * 3) + "%";
  $("airBar").style.width = state.air + "%";
  $("foodBar").style.width = state.food + "%";
  $("healthBar").style.width = state.health + "%";
  for (const [id, v] of [["airBar", state.air], ["foodBar", state.food], ["healthBar", state.health]]) {
    $(id).classList.toggle("low", v <= 25);
  }
  const sh = $("shieldStatus");
  sh.textContent = state.shieldOn
    ? "Shield is ON tonight. Solar storms will barely hurt you. (It cost power!)"
    : "Shield is OFF tonight. Solar storms can hurt the crew.";
  sh.classList.toggle("on", state.shieldOn);
  $("shieldDome").classList.toggle("hidden", !state.shieldOn);
  document.querySelectorAll(".action-card").forEach((card) => {
    const a = ACTIONS.find((x) => x.id === card.dataset.id);
    const used = state.used.has(a.id);
    const costEl = card.querySelector(".cost");
    if (costEl) costEl.textContent = `${actionCost(a)} Power`;
    card.classList.toggle("used", used);
    card.disabled = used || state.power < actionCost(a) || state.over;
  });
  const proj = (v, drain) => Math.max(0, Math.floor(v / drain));
  $("airNote").textContent = state.air <= 42 ? `Careful! Air runs out in about ${proj(state.air, 14)} nights if you do nothing.` : "";
  $("foodNote").textContent = state.food <= 36 ? `Careful! Food runs out in about ${proj(state.food, 12)} nights if you do nothing.` : "";
  for (const [bar, v] of [["powerBar", clamp(state.power * 3)], ["airBar", state.air], ["foodBar", state.food], ["healthBar", state.health]]) $(bar).parentElement.setAttribute("aria-valuenow", v);
  saveGame();
}

function buildActions() {
  const wrap = $("actions");
  wrap.innerHTML = "";
  for (const a of ACTIONS) {
    const b = document.createElement("button");
    b.className = "action-card"; b.dataset.id = a.id;
    b.setAttribute("aria-label", `${a.name}. Costs ${a.power} power. ${a.effectText}`);
    b.innerHTML = `<span class="action-top"><span class="action-name">${a.name}</span><span class="cost">${a.power} Power</span></span>
      <span class="action-desc" style="display:block">${a.desc}</span>
      <span class="action-effect" style="display:block">${a.effectText}</span>
      <span class="action-fact">${a.fact}</span>`;
    b.addEventListener("click", () => doAction(a, b));
    wrap.appendChild(b);
  }
}

function actionCost(a) { return a.id === "science" ? 4 + state.stars * 2 : a.power; }

function doAction(a, btn) {
  const cost = actionCost(a);
  if (state.over || state.used.has(a.id) || state.power < cost) return;
  state.power -= cost;
  state.used.add(a.id);
  if (a.id === "shield") state.shieldOn = true;
  if (a.id === "food") state.grewToday = true;
  if (a.id === "rest" || a.id === "call") state.restedToday = true;
  if (a.id === "science") { state.stars += 1; floatText(btn, "+1 Star"); beep(880, 0.25); }
  for (const [k, v] of Object.entries(a.effects)) {
    const before = state[k];
    state[k] = clamp(state[k] + v);
    const real = state[k] - before;
    floatText(btn, real !== v && v > 0 ? `+${real} ${k} (tank full!)` : `${real > 0 ? "+" : ""}${real} ${k}`);
  }
  beep(520, 0.15);
  const modId = { air: "mod-habitat", food: "mod-green", shield: "shieldDome", science: "rover", call: "mod-dish", rest: "crew1" }[a.id];
  const mod = modId ? $(modId) : null;
  if (mod) { mod.classList.remove("acting"); void mod.getBoundingClientRect(); mod.classList.add("acting"); setTimeout(() => mod.classList.remove("acting"), 950); }
  logMsg(`${a.name} done! ${a.effectText}. Power left: ${state.power}.`);
  render();
}

function pickTonight() {
  if (!state.deck.length) state.deck = shuffled(EVENTS);
  state.tonight = state.deck.pop();
  $("forecast").textContent = "Tonight: " + state.tonight.forecast;
}

function morning() {
  let solar = state.solarTomorrow != null ? state.solarTomorrow : Math.floor(rand(9, 21));
  state.solarTomorrow = null;
  const banked = Math.min(state.power, 5);
  state.power = clamp(banked + solar);
  state.used = new Set();
  state.shieldOn = false; state.grewToday = false; state.restedToday = false;
  pickTonight();
  $("phaseTitle").textContent = `Sol ${state.sol} — Your turn, Commander!`;
  $("phaseHint").textContent = "Tap cards to run your base. Watch your Power — you cannot do everything!";
  $("sceneCaption").textContent = `Morning of Sol ${state.sol}. Sunshine made ${solar} Power!`;
  $("powerNote").textContent = `Solar panels made ${solar} Power. Leftover power saved: ${banked} (batteries hold only 5).`;
  $("nightShade").classList.add("hidden");
  $("nightBtn").disabled = false;
  logMsg(`Sol ${state.sol} morning: +${solar} Power from sunshine.`);
  render();
}

function resolveNight() {
  if (state.over) return;
  $("nightBtn").disabled = true;
  document.querySelectorAll(".action-card").forEach((c) => (c.disabled = true));
  $("nightShade").classList.remove("hidden");
  $("sceneCaption").textContent = "Night falls on Mars…";
  beep(300, 0.3);
  const ev = state.tonight;
  let text = "";
  state.air = clamp(state.air - 14);
  state.food = clamp(state.food - 12);
  text += "Your crew breathed air (−14) and ate dinner (−12). ";
  if (ev.id === "solar-storm") {
    if (state.shieldOn) { state.health = clamp(state.health - 3); text += "A solar storm hit, but your SHIELD protected the crew (−3 Health). Great planning!"; }
    else { const dmg = state.sunRisk === "stormy" ? 38 : 30; state.health = clamp(state.health - dmg); text += `A solar storm hit with NO shield! Radiation hurt the crew (−${dmg} Health). Shields matter!`; }
  } else if (ev.id === "dust-storm") {
    state.solarTomorrow = 6; state.air = clamp(state.air - 4); state.food = clamp(state.food - 8);
    text += "Dust covered the solar panels. Tomorrow will make little power (6). Dust clogged air filters (−4 Air) and spoiled food (−8 Food).";
  } else if (ev.id === "cold-night") {
    if (state.power >= 3) { state.power -= 3; text += "Heaters used your leftover Power (−3) and everyone stayed warm."; }
    else { state.health = clamp(state.health - 9); text += "It was freezing and heaters had no power. The crew got too cold (−9 Health). Save some Power!"; }
  } else if (ev.id === "air-leak") {
    state.air = clamp(state.air - 14); text += "A tiny leak let air escape (−14 Air). The crew patched it with tape and teamwork!";
  } else if (ev.id === "quiet-night") {
    state.health = clamp(state.health + 4); text += "Everyone slept under bright Mars stars (+4 Health).";
  } else if (ev.id === "garden-pests") {
    if (state.grewToday) { state.food = clamp(state.food - 4); text += "Bugs nibbled the garden, but you grew food today so you only lost a little (−4 Food)."; }
    else { state.food = clamp(state.food - 13); text += "Bugs ate stored food (−13 Food). Growing fresh food helps protect you!"; }
  } else if (ev.id === "rover-ice") {
    state.air = clamp(state.air + 10); text += "The rover melted underground ice into water, and the base made extra air (+10 Air). Ice is treasure on Mars!";
  } else if (ev.id === "homesick") {
    if (state.restedToday) { state.health = clamp(state.health - 2); text += "The crew missed home, but rest today helped (−2 Health only)."; }
    else { state.health = clamp(state.health - 10); text += "The crew felt homesick and tired (−10 Health). Rest and calls home really help!"; }
  } else if (ev.id === "meteor") {
    if (state.shieldOn) { state.health = clamp(state.health - 2); text += "A tiny space rock bounced off your raised shield (−2 Health). Phew!"; }
    else { state.health = clamp(state.health - 14); text += "A tiny space rock dented the dome (−14 Health). Shields protect from more than radiation!"; }
  }
  text += ` Air left: ${state.air} — about ${Math.floor(state.air / 14)} nights of breathing left. Food left: ${state.food}.`;
  render();
  $("eventTitle").textContent = ev.title;
  $("eventText").textContent = text;
  $("eventFact").textContent = "Real science: " + ev.fact;
  $("eventCard").classList.remove("hidden");
  $("eventBtn").focus();
}

function checkEnd() {
  const deadList = [["Air", state.air], ["Food", state.food], ["Crew Health", state.health]].filter(([, v]) => v <= 0).map(([n]) => n);
  if (deadList.length) return endGame(false, deadList.join(" and "));
  if (state.sol >= state.maxSol) return endGame(true, null);
  state.sol += 1;
  morning();
}

function endGame(won, reason) {
  state.over = true;
  clearSave();
  render();
  $("endScreen").classList.remove("hidden");
  if (won) {
    const rank = RANKS.find((r) => state.stars >= r.min);
    $("endTitle").textContent = "SOL PATROL — Mission Complete, You Survived Mars!";
    $("endRank").textContent = `${rank.title} · ${state.stars} Science Stars · Spend the sunshine. Survive the night.`;
    $("endMsg").textContent = rank.msg;
    $("endLessons").innerHTML = "<strong>What you learned:</strong><br>1. Power is limited — every choice costs something.<br>2. Shields protect crews from invisible radiation.<br>3. Messages to Mars take minutes, so crews must solve problems alone.<br>4. Growing food uses air and water too. Everything is connected!";
    beep(660, 0.3); setTimeout(() => beep(880, 0.4), 220);
  } else {
    $("endTitle").textContent = "Rescue Mission Launched!";
    $("endRank").textContent = `Your ${reason} ran out on Sol ${state.sol}`;
    $("endMsg").textContent = "Do not worry — real commanders learn from every mission. NASA is sending supplies, and your crew is safe. Look at what ran low, try a new plan, and fly again!";
    $("endLessons").innerHTML = `<strong>Commander's tip:</strong> watch the <strong>${reason}</strong> meter. Do the matching mission card earlier next time, and check tonight's forecast before you spend all your Power.`;
    beep(220, 0.4);
  }
  $("againBtn").focus();
}

function resetGame() {
  Object.assign(state, { sol: 1, power: 0, air: 70, food: 65, health: 85, stars: 0, shieldOn: false, used: new Set(), deck: shuffled(EVENTS), tonight: null, solarTomorrow: null, grewToday: false, restedToday: false, over: false });
  $("log").innerHTML = "";
  $("endScreen").classList.add("hidden");
  $("eventCard").classList.add("hidden");
  logMsg("Welcome, Commander of your Sol Patrol — Nova and Pip are counting on you! Survive 8 sols on Mars.");
  morning();
}

async function loadSunData() {
  const badge = $("liveBadge"), txt = $("sunText");
  const fmt = (d) => d.toISOString().slice(0, 10);
  const end = new Date(), start = new Date(Date.now() - 30 * 864e5);
  // NOTE: DONKI /FLR via api.nasa.gov returned 404 in live probes (2026-11-15); GST + SEP are the working radiation endpoints.
  const urls = [
    `https://api.nasa.gov/DONKI/GST?startDate=${fmt(start)}&endDate=${fmt(end)}&api_key=DEMO_KEY`,
    `https://api.nasa.gov/DONKI/SEP?startDate=${fmt(start)}&endDate=${fmt(end)}&api_key=DEMO_KEY`,
  ];
  const key = new URLSearchParams(location.search).get("key") || "DEMO_KEY";
  const liveUrls = urls.map((u) => u.replace("DEMO_KEY", key));
  try {
    // Reuse a cached live answer for 6 hours so judge/classroom NATs do not burn the NASA quota.
    try {
      const c = JSON.parse(localStorage.getItem("sol-patrol-sun") || "null");
      if (c && Date.now() - c.at < 6 * 3600e3) {
        state.sunRisk = c.risk;
        badge.textContent = "LIVE FROM NASA (saved today)";
        badge.className = "live-badge";
        txt.textContent = c.text;
        return;
      }
    } catch (e) { /* cache is optional */ }
    let storms = null, seps = null, got200 = false;
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 6000) : null;
    try {
      const results = await Promise.allSettled(liveUrls.map((url) => fetch(url, ctl ? { signal: ctl.signal } : {}).then(async (res) => {
        if (!res.ok) throw new Error("NASA busy");
        got200 = true;
        return res.json();
      })));
      if (results[0].status === "fulfilled" && Array.isArray(results[0].value)) storms = results[0].value;
      if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) seps = results[1].value;
    } finally { if (timer) clearTimeout(timer); }
    if (!got200 && !storms && !seps) throw new Error("No live space weather");
    storms = storms || []; seps = seps || [];
    let maxKp = 0;
    for (const g of storms) for (const k of (g.allKpIndex || [])) maxKp = Math.max(maxKp, Number(k.kpIndex) || 0);
    const count = storms.length + seps.length;
    state.sunRisk = maxKp >= 7 || count > 14 ? "stormy" : count > 4 ? "active" : "calm";
    badge.textContent = "LIVE FROM NASA";
    badge.className = "live-badge";
    txt.textContent = `Real Sun news: NASA counted ${count} space-weather events in the last 30 days${maxKp ? `, strongest storm Kp ${maxKp} (Kp 9 is the biggest)` : ""}. Radiation risk today: ${state.sunRisk.toUpperCase()}. (Source: NASA DONKI GST/SEP)`;
    try { localStorage.setItem("sol-patrol-sun", JSON.stringify({ at: Date.now(), risk: state.sunRisk, text: txt.textContent })); } catch (e) { /* cache is optional */ }
  } catch (e) {
    const a = ARCHIVE_FLARES[0];
    state.sunRisk = "active";
    badge.textContent = "ARCHIVED REAL DATA";
    badge.className = "live-badge archive";
    txt.textContent = `Offline mode — showing a real past flare: class ${a.cls} on ${a.date}. ${a.note}. (Source: NASA DONKI archive; this is not live.)`;
  }
}

function wire() {
  buildActions();
  const existing = readSave();
  if (existing) {
    $("startBtn").textContent = `Continue Sol ${existing.sol}`;
    $("freshBtn").classList.remove("hidden");
  }
  $("startBtn").addEventListener("click", () => {
    $("titleScreen").classList.add("hidden");
    if (!state.started) {
      const s = readSave();
      if (s) restoreSave(s); else { state.started = true; resetGame(); }
    }
    beep(600, 0.2);
    $("phaseTitle").focus();
  });
  $("freshBtn").addEventListener("click", () => {
    clearSave();
    $("titleScreen").classList.add("hidden");
    state.started = true;
    resetGame();
    beep(600, 0.2);
  });
  let lastFocus = null;
  function openModal(id, opener) {
    lastFocus = opener || document.activeElement;
    const m = $(id);
    m.classList.remove("hidden");
    const f = m.querySelector("button");
    if (f) f.focus();
  }
  function closeModal(id) {
    const m = $(id);
    if (m.classList.contains("hidden")) return;
    m.classList.add("hidden");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }
  $("howBtn").addEventListener("click", (e) => openModal("howModal", e.currentTarget));
  $("helpBtn").addEventListener("click", (e) => openModal("howModal", e.currentTarget));
  document.querySelector(".close-how").addEventListener("click", () => closeModal("howModal"));
  $("scienceBtn").addEventListener("click", (e) => openModal("scienceModal", e.currentTarget));
  document.querySelector(".close-sci").addEventListener("click", () => closeModal("scienceModal"));
  $("nightBtn").addEventListener("click", resolveNight);
  $("eventBtn").addEventListener("click", () => { $("eventCard").classList.add("hidden"); beep(500, 0.15); checkEnd(); if (!state.over) $("phaseTitle").focus(); });
  $("againBtn").addEventListener("click", () => { resetGame(); $("phaseTitle").focus(); });
  $("soundBtn").addEventListener("click", () => { state.sound = !state.sound; $("soundBtn").textContent = state.sound ? "Sound: ON" : "Sound: OFF"; $("soundBtn").setAttribute("aria-pressed", String(!state.sound)); if (state.sound) beep(600, 0.15); });
  for (const m of ["howModal", "scienceModal"]) {
    $(m).addEventListener("click", (e) => { if (e.target === $(m)) closeModal(m); });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal("howModal"); closeModal("scienceModal"); }
    if (e.key === "Tab") {
      for (const id of ["howModal", "scienceModal"]) {
        const m = $(id);
        if (m.classList.contains("hidden")) continue;
        const items = [...m.querySelectorAll("button")];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }
    }
  });
  render();
  loadSunData();
}

document.addEventListener("DOMContentLoaded", wire);
