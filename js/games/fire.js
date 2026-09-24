// 🚒 ひを けそう：
// 消防署から出動 → ホースの先を指で動かして火を消す → はしごを伸ばして、ねこさんを助ける
import { frag, h, tween, wait, lerp, ease, puff, sparkle, shuffle, fadeSwap } from "../fx.js";
import { Item } from "../gesture.js";
import { fireTruck, flame, animal, button, place, sky, cloud, tree, band, haze, shadow } from "../art.js";

const TRUCK = { x: -30, y: 450, w: 380 };
const HOSE_FROM = { x: 250, y: 560 };
const NOZZLE_HOME = { x: 420, y: 620 };
const REACH = 210;   // ノズルから水が届くところまでの高さ
const HIT = 95;      // 水が火に当たったとみなす距離
const GO = { x: 870, y: 640 };
// 火が出るかもしれない場所（2階の窓・1階の窓・屋根）
const FIRE_SPOTS = [
  { x: 570, y: 245 }, { x: 670, y: 245 }, { x: 770, y: 245 },
  { x: 570, y: 425 }, { x: 790, y: 425 }, { x: 670, y: 130 },
];
const CAT_WIN = { x: 670, y: 262 };
const PIVOT = { x: 60, y: 495 };        // はしごの根もと
const LADDER_TO = { x: 670, y: 305 };   // はしごを掛ける窓の下

/* ---------- 消防署 ---------- */
const station = () => `
  ${sky("fs-sky")}
  ${cloud(160, 100)}${cloud(880, 80, 0.7)}
  <path d="M-200,560 Q150,430 450,520 Q750,420 1200,540 L1200,560 Z" fill="#b9d3e6"/>
  ${haze("fs-haze", 300, 560)}
  ${band("fs-ground", 560, 760, "#a3dd7e", "#6fb84c")}
  <rect x="-1000" y="560" width="3000" height="70" fill="#9aa0a8"/>
  ${shadow(520, 566, 330, 18)}
  <path d="M770,200 L840,170 L840,540 L770,560 Z" fill="#b3372f"/>
  <rect x="230" y="200" width="540" height="360" fill="#d8453b"/>
  <rect x="230" y="200" width="540" height="360" fill="url(#g-shade)" opacity=".6"/>
  <rect x="215" y="180" width="570" height="28" rx="6" fill="#f3ece2"/>
  <path d="M785,180 L855,150 L855,172 L785,208 Z" fill="#d8cfc2"/>
  <rect x="330" y="222" width="340" height="70" rx="10" fill="#fff"/>
  <text x="500" y="270" text-anchor="middle" font-size="40" font-weight="800" fill="#c62828">しょうぼうしょ</text>
  <rect x="290" y="320" width="420" height="240" fill="#f3ece2"/>
  <rect x="300" y="330" width="400" height="230" fill="#2e333a"/>
  <rect x="300" y="330" width="400" height="40" fill="#000" opacity=".25"/>`;

const shutterMarkup = () => `
  <defs><pattern id="fs-slat" patternUnits="userSpaceOnUse" width="400" height="20">
    <rect width="400" height="20" fill="#c9ced6"/><rect y="16" width="400" height="4" fill="#9aa3ad"/>
  </pattern></defs>`;

/* ---------- 家 ---------- */
const houseScene = () => `
  ${sky("fire-sky")}
  ${cloud(160, 110)}${cloud(900, 90, 0.7)}
  <path d="M-200,560 Q200,420 520,520 Q800,440 1200,530 L1200,560 Z" fill="#b9d3e6"/>
  ${haze("fire-haze", 300, 560)}
  ${band("fire-ground", 560, 760, "#a3dd7e", "#6fb84c")}
  ${tree(975, 575, 0.8)}
  ${shadow(720, 562, 260, 16)}
  <path d="M840,180 L920,150 L920,530 L840,560 Z" fill="#e8cfa9"/>
  <rect x="500" y="180" width="340" height="380" fill="#ffe9c7"/>
  <rect x="500" y="180" width="340" height="380" fill="url(#g-shade)" opacity=".5"/>
  <rect x="500" y="336" width="340" height="8" fill="#e6cfa5"/>
  <path d="M670,60 L750,30 L940,160 L860,190 Z" fill="#a84330"/>
  <path d="M480,190 L670,60 L860,190 Z" fill="#c8553d" stroke="#a84330" stroke-width="4" stroke-linejoin="round"/>
  ${[530, 630, 730].map(x => win(x, 220)).join("")}
  ${[530, 750].map(x => win(x, 400)).join("")}
  <rect x="635" y="430" width="70" height="130" rx="8" fill="#9c6b3f"/>
  <rect x="635" y="430" width="70" height="130" rx="8" fill="url(#g-shade)"/>
  <circle cx="690" cy="500" r="5" fill="#f2c230"/>`;

const win = (x, y) => `
  <rect x="${x}" y="${y}" width="80" height="80" rx="6" fill="#9fd4ff" stroke="#fff" stroke-width="7"/>
  <rect x="${x}" y="${y}" width="80" height="80" rx="6" fill="url(#g-glass)"/>`;

const nozzleMarkup = `
  <rect x="-17" y="-40" width="34" height="74" rx="11" fill="#d4a017" stroke="#9c7410" stroke-width="3"/>
  <rect x="-17" y="-40" width="34" height="74" rx="11" fill="url(#g-cyl)"/>
  <rect x="-11" y="-54" width="22" height="18" rx="5" fill="#555"/>
  <rect x="-17" y="-6" width="34" height="8" fill="#9c7410"/>`;

// はしご（根もと p から先っぽ q まで）
function ladderPath(p, q) {
  const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * 11, ny = dx / len * 11;
  let d = `M${p.x + nx},${p.y + ny} L${q.x + nx},${q.y + ny} M${p.x - nx},${p.y - ny} L${q.x - nx},${q.y - ny}`;
  for (let s = 20; s < len; s += 26) {
    const cx = p.x + dx * s / len, cy = p.y + dy * s / len;
    d += ` M${cx + nx},${cy + ny} L${cx - nx},${cy - ny}`;
  }
  return d;
}

export default {
  id: "fire",
  title: "ひを けそう",
  say: "ひを けそう！",
  color: "#ffe1dc",
  shadow: "#f3aca1",
  icon: () => fireTruck(),

  async start(api) {
    const { svg, input, audio, session } = api;

    /* ---- 1. 消防署から出動 ---- */
    let scene = frag(station(), svg);
    const truckA = h("g", { transform: "translate(310 388)" }, scene);
    frag(place(fireTruck(), 0, 0, 380), truckA);
    frag(shutterMarkup(), scene);
    const shutter = h("rect", { x: 300, y: 330, width: 400, height: 230, fill: "url(#fs-slat)" }, scene);
    h("rect", { x: 300, y: 330, width: 400, height: 230, fill: "url(#g-shade)", opacity: 0.4, "pointer-events": "none" }, scene);
    const shade = scene.lastChild;

    audio.sfx.fire(2.2);
    await wait(900);
    const go = frag(button("しゅつどう", "#e53935"), scene, { transform: `translate(${GO.x} ${GO.y})` });
    audio.sfx.pop();
    api.step({ say: "かじです！ ボタンを おして、 しゅつどう！", hint: { tap: GO } });
    await input.tapOnce(go, { pad: 30 });
    api.step({});
    go.remove();
    audio.sfx.click();
    audio.speak("シャッターが あくよ");
    await tween(1200, t => {
      const hgt = 230 * (1 - t);
      shutter.setAttribute("height", hgt);
      shade.setAttribute("height", hgt);
    });
    audio.sfx.fire(4);
    audio.speak("しゅつどう！ ウーウー カンカン");
    truckA.classList.add("moving");
    await tween(2600, t => truckA.setAttribute("transform", `translate(${lerp(310, 1200, t)} ${lerp(388, 450, Math.min(1, t * 3))})`), ease.in);

    /* ---- 2. 家の火を消す ---- */
    await fadeSwap(svg, () => {
      scene.remove();
      scene = frag(houseScene(), svg);
    });
    const count = 3 + Math.floor(Math.random() * 3);
    const fires = shuffle(FIRE_SPOTS).slice(0, count).map(f => ({
      ...f, hp: 1, item: new Item(frag(flame(), scene), f.x, f.y, 1),
    }));
    const truck = h("g", { class: "moving" }, scene);
    frag(place(fireTruck(), 0, 0, TRUCK.w), truck);
    audio.sfx.fire(3);
    await tween(2400, t => truck.setAttribute("transform", `translate(${lerp(-500, TRUCK.x, t)} ${TRUCK.y})`), ease.out);
    truck.classList.remove("moving");

    const ladderBack = h("path", { fill: "none", stroke: "#7d858f", "stroke-width": 12, "stroke-linecap": "round" }, scene);
    const ladder = h("path", { fill: "none", stroke: "#e3e7ec", "stroke-width": 7, "stroke-linecap": "round" }, scene);
    const hose = h("path", { fill: "none", stroke: "#c0392b", "stroke-width": 16, "stroke-linecap": "round" }, scene);
    const spray = h("path", { class: "water", fill: "none", visibility: "hidden" }, scene);
    const splash = h("circle", { r: 34, fill: "#bfe9ff", opacity: 0.8, visibility: "hidden" }, scene);
    const nozzle = new Item(frag(nozzleMarkup, scene), NOZZLE_HOME.x, NOZZLE_HOME.y, 1);

    const aim = () => ({ x: nozzle.x, y: nozzle.y - REACH });
    const redraw = () => {
      const n = nozzle, a = aim();
      hose.setAttribute("d", `M${HOSE_FROM.x},${HOSE_FROM.y} Q${(HOSE_FROM.x + n.x) / 2},${Math.max(HOSE_FROM.y, n.y) + 130} ${n.x},${n.y + 34}`);
      spray.setAttribute("d", `M${n.x},${n.y - 54} Q${n.x + 28},${n.y - 140} ${a.x},${a.y}`);
      splash.setAttribute("cx", a.x);
      splash.setAttribute("cy", a.y);
    };
    redraw();
    audio.speak(`かじだ！ ひが ${count}つ もえてるよ`);
    await wait(1800);

    let out = 0, spraying = false, stopWater = null, finish;
    const allOut = new Promise(r => (finish = r));
    const burning = () => fires.find(f => f.hp > 0);

    const extinguish = f => {
      f.item.el.remove();
      puff(svg, f.x, f.y);
      audio.sfx.hiss();
      audio.sfx.ding();
      out++;
      audio.speak(out < fires.length ? "きえた！" : "ぜんぶ きえた！");
      if (out === fires.length) finish();
    };

    // 水を当てると小さくなって消える。途中でやめると、少しずつ元にもどる
    let last = performance.now();
    const loop = now => {
      if (!session.alive || out === fires.length) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = aim();
      for (const f of fires) {
        if (f.hp <= 0) continue;
        const hit = spraying && Math.hypot(a.x - f.x, a.y - f.y) <= HIT;
        f.hp = hit ? f.hp - dt * 0.9 : Math.min(1, f.hp + dt * 0.08);
        if (f.hp <= 0) extinguish(f);
        else f.item.set(f.x, f.y, 0.35 + 0.65 * f.hp);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const setSpray = on => {
      spraying = on;
      spray.setAttribute("visibility", on ? "visible" : "hidden");
      splash.setAttribute("visibility", on ? "visible" : "hidden");
      if (on) stopWater = audio.sfx.water();
      else { stopWater?.(); stopWater = null; }
    };

    let dx = 0, dy = 0;
    const offHose = input.drag(nozzle.el, {
      pad: 60,
      onStart(p) { dx = p.x - nozzle.x; dy = p.y - nozzle.y; setSpray(true); },
      onMove(p) {
        nozzle.set(Math.max(20, Math.min(980, p.x - dx)), Math.max(REACH - 60, Math.min(730, p.y - dy)));
        redraw();
      },
      onEnd() { setSpray(false); },
    });

    api.step({
      say: "ホースを もって、 ひに みずを かけてね",
      hint: { drag: { from: () => ({ x: nozzle.x, y: nozzle.y }), to: () => { const f = burning(); return f && { x: f.x, y: f.y + REACH }; } } },
    });

    await allOut;
    api.step({});
    offHose();
    setSpray(false);
    // ホースの先を元の場所へ
    const from = { x: nozzle.x, y: nozzle.y };
    await tween(700, t => { nozzle.set(lerp(from.x, NOZZLE_HOME.x, t), lerp(from.y, NOZZLE_HOME.y, t)); redraw(); });
    await wait(700);

    /* ---- 3. はしごで ねこさんを助ける ---- */
    const winClip = frag(`<defs><clipPath id="fire-win"><rect x="630" y="220" width="80" height="80" rx="6"/></clipPath></defs>`, scene);
    const catWin = frag(animal("neko", { mood: "sad" }), h("g", { "clip-path": "url(#fire-win)" }, winClip),
      { transform: `translate(${CAT_WIN.x} ${CAT_WIN.y + 60}) scale(.5)` });
    audio.sfx.pop();
    await tween(500, t => catWin.setAttribute("transform", `translate(${CAT_WIN.x} ${CAT_WIN.y + 60 * (1 - t)}) scale(.5)`), ease.back);
    audio.speak("あっ！ ねこさんが のこってる！");
    await wait(2000);

    let tip = { x: 230, y: 495 };
    const knob = new Item(frag(`<g class="pulse"><circle r="26" fill="#f5a623" stroke="#fff" stroke-width="6"/><circle r="22" fill="url(#g-sphere)"/></g>`, scene), tip.x, tip.y, 1);
    const drawLadder = () => {
      const d = ladderPath(PIVOT, tip);
      ladder.setAttribute("d", d);
      ladderBack.setAttribute("d", d);
    };
    const setTip = p => {
      const dx = p.x - PIVOT.x, dy = p.y - PIVOT.y, len = Math.hypot(dx, dy) || 1;
      const l = Math.max(170, Math.min(760, len));
      tip = { x: PIVOT.x + dx / len * l, y: Math.min(PIVOT.y, PIVOT.y + dy / len * l) };
      knob.set(tip.x, tip.y);
      drawLadder();
    };
    drawLadder();

    api.step({
      say: "はしごを のばして、 ねこさんを たすけよう",
      hint: { drag: { from: () => tip, to: LADDER_TO } },
    });
    await new Promise(res => {
      const off = input.drag(knob.el, {
        pad: 50,
        onStart() { audio.sfx.pop(); },
        onMove: setTip,
        onEnd() {
          if (Math.hypot(tip.x - LADDER_TO.x, tip.y - LADDER_TO.y) > 130) return;
          off();
          setTip(LADDER_TO);
          res();
        },
      });
    });
    api.step({});
    knob.el.remove();
    audio.sfx.click();
    audio.sfx.ding();
    audio.speak("とどいた！ ねこさん、 おりておいで");
    await wait(1200);

    // ねこさんが窓から出て、はしごをおりてくる
    winClip.remove();
    const cat = new Item(frag(animal("neko", { ground: true }), scene), CAT_WIN.x, CAT_WIN.y, 0.5);
    await tween(400, t => cat.set(CAT_WIN.x, lerp(CAT_WIN.y, LADDER_TO.y - 40, t), 0.5 + 0.1 * t));
    const mid = { x: lerp(LADDER_TO.x, PIVOT.x, 0.45), y: lerp(LADDER_TO.y, PIVOT.y, 0.45) - 40 };
    await tween(1400, t => cat.set(lerp(LADDER_TO.x, mid.x, t), lerp(LADDER_TO.y - 40, mid.y, t)));
    await tween(700, t => cat.set(lerp(mid.x, 440, t), lerp(mid.y, 560, t) - Math.sin(t * Math.PI) * 80, lerp(0.6, 0.9, t)), ease.out);
    audio.sfx.ding();
    sparkle(svg, 440, 560);
    audio.speak("ねこさん たすかったね！ ありがとう しょうぼうしゃ！");
    audio.sfx.fire(3);
    await wait(3000);
    api.done();
  },
};
