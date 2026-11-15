// Kept checks for SOL PATROL balance/data contracts. Run: node test.mjs
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert";

const src = fs.readFileSync(new URL("./data.js", import.meta.url), "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + "\n;globalThis.__d = { ACTIONS, EVENTS, ARCHIVE_FLARES, RANKS, FACTS, DILEMMAS };", ctx);
const { ACTIONS, EVENTS, ARCHIVE_FLARES, RANKS, FACTS, DILEMMAS } = ctx.__d;

// No free/safe choice: every mission card must cost Power.
assert.ok(ACTIONS.length >= 5, "need at least 5 mission cards");
for (const a of ACTIONS) {
  assert.ok(a.power > 0, `${a.id} must cost power (no free choice)`);
  assert.ok(a.name && a.desc && a.fact, `${a.id} needs name/desc/fact for kids`);
}
// Trade-off inside production: growing food must also cost a resource besides Power.
const food = ACTIONS.find((a) => a.id === "food");
assert.ok(food.effects.air < 0 || food.effects.food < 0, "Grow Food must carry a second cost");

// Arena balance contracts: no silent surplus, shields affordable, science escalates in game.js.
const air = ACTIONS.find((a) => a.id === "air");
assert.ok(air.effects.air <= 16, "Make Air must not outrun the -14/sol night drain by a wide margin");
assert.ok(ACTIONS.find((a) => a.id === "shield").power <= 5, "Raise Shields must be affordable");
const gameSrc = fs.readFileSync(new URL("./game.js", import.meta.url), "utf8");
assert.ok(gameSrc.includes("4 + state.stars * 2"), "Science cost must escalate per star (star-farm fix)");
assert.ok(!gameSrc.includes("??"), "no ?? token (old classroom Safari parse blocker)");
assert.ok(gameSrc.includes("Promise.allSettled"), "DONKI fetches must run in parallel");

// Event deck: varied, forecastable, each with a real-science fact.
assert.ok(EVENTS.length >= 8, "event deck needs >= 8 for replayability");
assert.strictEqual(new Set(EVENTS.map((e) => e.id)).size, EVENTS.length, "event ids unique");
for (const e of EVENTS) assert.ok(e.forecast && e.fact && e.title, `${e.id} needs forecast+fact`);

// Archived data is real-shaped and labelled by date; ranks are reachable in 8 sols.
for (const f of ARCHIVE_FLARES) assert.match(f.date, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(RANKS[0].min <= 8, "top rank must be reachable within 8 sols");
assert.ok(FACTS.length >= 4, "need rotating real facts");

// Interactivity contracts: daily dilemma is a real either/or trade-off; scene modules are wired.
assert.ok(DILEMMAS.length >= 5, "need at least 5 daily dilemmas");
for (const d of DILEMMAS) {
  assert.ok(d.q && d.a.label && d.b.label, "dilemma needs question + two choices");
  const hasCost = (o) => Object.values(o.effects).some((v) => v < 0);
  assert.ok(hasCost(d.a) && hasCost(d.b), "both dilemma choices must carry a cost");
}
const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
for (const id of ["mod-habitat", "mod-green", "mod-dish", "mod-solar", "rover", "crew1", "dilemmaA", "dilemmaB", "speech"]) {
  assert.ok(html.includes(`id="${id}"`), `index.html missing interactive element #${id}`);
}
assert.ok(gameSrc.includes("wireScene") && gameSrc.includes("chooseDilemma"), "scene clicks + dilemma must be wired in game.js");

console.log("test.mjs: all checks passed");
