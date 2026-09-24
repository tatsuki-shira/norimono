// 画面の切り替え、ホーム、親メニュー、時間制限
import * as audio from "./audio.js";
import * as fx from "./fx.js";
import { SHARED_DEFS } from "./art.js";
import { createInput } from "./gesture.js";
import depart from "./games/depart.js";
import track from "./games/track.js";
import fire from "./games/fire.js";
import ambulance from "./games/ambulance.js";

const GAMES = [depart, track, fire, ambulance];
const IDLE_HINT_MS = 5000;
const SESSION_GAP_MS = 3 * 60 * 60 * 1000; // 3時間あいたら、遊んだ時間をリセット

const $ = s => document.querySelector(s);
const screens = { home: $("#home"), game: $("#game"), end: $("#end") };
const stage = $("#stage");

// 光と影のグラデーション（どの絵からも url(#g-...) で使う）
document.body.insertAdjacentHTML("afterbegin", SHARED_DEFS);

/* ---------- 設定（localStorage） ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const settings = { limitMin: store.get("limitMin", 0), volume: store.get("volume", 0.7) };
audio.setVolume(settings.volume);

let playStart = store.get("playStart", 0);
function resetPlayTime() {
  playStart = Date.now();
  store.set("playStart", playStart);
}
if (Date.now() - playStart > SESSION_GAP_MS) resetPlayTime();

function show(name) {
  for (const k in screens) screens[k].hidden = k !== name;
}

/* ---------- 長押しボタン ---------- */
function hold(el, ms, cb) {
  let timer;
  el.style.setProperty("--ms", ms + "ms");
  const cancel = () => { clearTimeout(timer); el.classList.remove("holding"); };
  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    el.classList.add("holding");
    timer = setTimeout(() => { cancel(); cb(); }, ms);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => el.addEventListener(ev, cancel));
}

/* ---------- ホーム ---------- */
const grid = $("#grid");
GAMES.forEach((g, i) => {
  const b = document.createElement("button");
  b.className = "card";
  b.style.setProperty("--card", g.color);
  b.style.setProperty("--shadow", g.shadow);
  b.innerHTML = g.icon("home" + i) + `<span class="label">${g.title}</span>`;
  b.addEventListener("click", () => startGame(g));
  grid.append(b);
});

/* ---------- ゲーム ---------- */
let current = null;

function startGame(game) {
  if (isOver()) return showEnd();
  audio.ensureAudio();
  audio.speak(game.say); // タップした瞬間に喋らせる（iPad の声の制限対策）

  const session = fx.newSession();
  stage.innerHTML = "";
  const svg = fx.h("svg", { viewBox: "0 0 1000 750", preserveAspectRatio: "xMidYMid meet" }, stage);
  show("game");

  let hint = null, lastInput = Date.now(), lastMissSay = 0;
  const input = createInput(svg, {
    sfx: audio.sfx,
    onAny() { lastInput = Date.now(); },
    // 違う場所を触ったら、正解の場所を光らせて教える（失敗の音は鳴らさない）
    onMiss() {
      if (!hint) return;
      fx.glowHint(svg, hint);
      if (Date.now() - lastMissSay > 3500) { lastMissSay = Date.now(); audio.speak("ここだよ"); }
    },
  });
  // しばらく触らなかったら、手のアニメーションでやり方を見せる
  const idle = setInterval(() => {
    if (hint && Date.now() - lastInput > IDLE_HINT_MS) {
      lastInput = Date.now();
      fx.hand(svg, hint);
    }
  }, 500);

  const api = {
    svg, input, audio, session,
    step({ say, hint: next } = {}) {
      hint = next || null;
      lastInput = Date.now();
      if (say) audio.speak(say);
    },
    async done() {
      hint = null;
      input.clear();
      await fx.celebrate(stage, audio);
      if (session.alive) goHome();
    },
  };
  current = { session, input, idle };
  game.start(api).catch(err => console.error(err));
}

function stopGame() {
  if (!current) return;
  current.session.alive = false;
  clearInterval(current.idle);
  current.input.destroy();
  current = null;
  audio.stopAll();
  stage.innerHTML = "";
}

function goHome() {
  stopGame();
  show("home");
}

hold($("#homeBtn"), 1000, goHome);

/* ---------- 時間制限 ---------- */
function isOver() {
  return settings.limitMin > 0 && Date.now() - playStart > settings.limitMin * 60000;
}

function showEnd() {
  if (!screens.end.hidden) return;
  stopGame();
  show("end");
  audio.speak("きょうは ここまで。 またね！");
}

setInterval(() => {
  if (Date.now() - playStart > SESSION_GAP_MS && !screens.end.hidden) { resetPlayTime(); show("home"); }
  if (isOver()) showEnd();
}, 3000);

/* ---------- 親メニュー（左上を3秒長押し） ---------- */
const parent = $("#parent");

function renderParent() {
  const min = Math.floor((Date.now() - playStart) / 60000);
  $("#playedText").textContent = `いま ${min}分 あそんでいます`;
  parent.querySelectorAll(".seg").forEach(seg => {
    seg.querySelectorAll("button").forEach(b => b.classList.toggle("on", Number(b.dataset.v) === settings[seg.dataset.key]));
  });
}
function openParent() { renderParent(); parent.hidden = false; }

parent.querySelectorAll(".seg").forEach(seg => {
  seg.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    const key = seg.dataset.key, v = Number(b.dataset.v);
    settings[key] = v;
    store.set(key, v);
    if (key === "volume") { audio.ensureAudio(); audio.setVolume(v); audio.sfx.ding(); }
    renderParent();
  });
});
$("#resetTime").addEventListener("click", () => { resetPlayTime(); renderParent(); });
$("#closeParent").addEventListener("click", () => {
  parent.hidden = true;
  if (!screens.end.hidden && !isOver()) show("home");
});

document.querySelectorAll(".hot").forEach(el => hold(el, 3000, openParent));

// ピンチで拡大されないように（iPad Safari）
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && "speechSynthesis" in window) speechSynthesis.cancel();
});
