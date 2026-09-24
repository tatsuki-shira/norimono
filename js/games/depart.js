// 🚄 しゅっぱつ しんこう：
// とうきょう駅でお客さんを乗せる → 鉄橋・富士山・トンネルを走る → しんおおさか駅でお客さんを降ろす
import { frag, h, tween, wait, lerp, ease, sparkle, shuffle, fadeSwap, clamp01 } from "../fx.js";
import { Item } from "../gesture.js";
import { FRIENDS, n700, animal, button, sky, cloud, track, fuji, pole, bridge, bridgeFront, tunnel, stationSign, place } from "../art.js";

/* ---------- 駅 ---------- */
const BODY = "M-400,150 L880,150 C990,150 1060,270 1100,420 L1100,510 L-400,510 Z";
const WINDOWS = [60, 200, 640, 780];
const SLOTS = WINDOWS.map(x => ({ x: x + 55, y: 258 }));
const DOOR = { x: 500, y: 350 };
const BTN = { x: 870, y: 640 };
const PLATFORM_Y = 640;
const SPOTS = [150, 330, 690, 850];          // ホームで待つ場所
const NEAR_DOOR = [330, 690, 150, 850];      // 降りたお客さんが並ぶ順

// ホームの床は、奥（上）に向かって目地が細く集まるように描く
function floorLines() {
  const VY = 250, TOP = 572; // 消える点の高さと、床のいちばん奥
  let s = "";
  for (let i = -16; i <= 16; i++) {
    const k = (760 - VY) / (TOP - VY);
    s += `<line x1="${500 + i * 80}" y1="${TOP}" x2="${500 + i * 80 * k}" y2="760" stroke="#bfb29b" stroke-width="2"/>`;
  }
  for (const y of [650, 705]) s += `<line x1="-1000" y1="${y}" x2="2000" y2="${y}" stroke="#bfb29b" stroke-width="2"/>`;
  return s;
}

const stationScenery = name => `
  ${sky("dep-sky")}
  <defs>
    <linearGradient id="dep-floor" gradientUnits="userSpaceOnUse" x1="0" y1="560" x2="0" y2="760">
      <stop offset="0" stop-color="#e8dfcf"/><stop offset="1" stop-color="#c7bba5"/>
    </linearGradient>
    <linearGradient id="dep-roof" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="72">
      <stop offset="0" stop-color="#4f565e"/><stop offset="1" stop-color="#7a828b"/>
    </linearGradient>
  </defs>
  <rect x="-1000" y="-1000" width="3000" height="1072" fill="url(#dep-roof)"/>
  ${[-180, 120, 420, 720, 1020].map(x => `<rect x="${x}" y="28" width="140" height="12" rx="6" fill="#f4f7fb"/><rect x="${x - 10}" y="38" width="160" height="10" rx="5" fill="#fff" opacity=".25"/>`).join("")}
  <rect x="-1000" y="62" width="3000" height="10" fill="#565d65"/>
  <g transform="translate(500 110)">${stationSign(name)}</g>
  <rect x="-1000" y="495" width="3000" height="60" fill="#3b4048"/>
  <rect x="-1000" y="546" width="3000" height="14" fill="#6d737c"/>
  <rect x="-1000" y="560" width="3000" height="1200" fill="url(#dep-floor)"/>
  ${floorLines()}
  <rect x="-1000" y="560" width="3000" height="12" fill="#f5f5f5"/>
  <rect x="-1000" y="594" width="3000" height="26" fill="#f4c430"/>
  <rect x="-1000" y="617" width="3000" height="3" fill="#d9a21f"/>`;

// 手前の柱（新幹線より手前、お客さんより奥）
const pillars = () => [-10, 1010].map(x => `
  <rect x="${x - 26}" y="72" width="52" height="700" fill="#8e98a4"/>
  <rect x="${x - 26}" y="72" width="52" height="700" fill="url(#g-cyl)"/>
  <rect x="${x - 34}" y="72" width="68" height="18" fill="#6d757f"/>`).join("");

const panel = x => `
  <rect x="${x}" y="195" width="70" height="290" fill="#eef1f4" stroke="#b8c0c8" stroke-width="3"/>
  <rect x="${x + 14}" y="220" width="42" height="80" rx="8" fill="#2d3a4a"/>
  <rect x="${x + 14}" y="220" width="42" height="80" rx="8" fill="url(#g-glass)"/>
  <rect x="${x}" y="410" width="70" height="26" fill="#1f5fbf"/>`;

function trainMarkup() {
  const wins = WINDOWS.map(x => `<rect x="${x}" y="205" width="110" height="85" rx="16"/>`).join("");
  return `
    <defs>
      <clipPath id="dep-body"><path d="${BODY}"/></clipPath>
      <clipPath id="dep-door"><rect x="430" y="195" width="140" height="290"/></clipPath>
      <clipPath id="dep-win">${wins}</clipPath>
    </defs>
    <rect x="40" y="505" width="220" height="38" rx="10" fill="#4a4f57"/>
    <rect x="700" y="505" width="220" height="38" rx="10" fill="#4a4f57"/>
    <g clip-path="url(#dep-body)">
      <rect x="-400" y="140" width="1520" height="380" fill="#fbfcfd"/>
      <rect x="-400" y="410" width="1520" height="26" fill="#1f5fbf"/>
      <rect x="-400" y="446" width="1520" height="9" fill="#1f5fbf"/>
      <rect x="-400" y="478" width="1520" height="40" fill="#d5dbe2"/>
      <rect x="-400" y="150" width="1520" height="360" fill="url(#g-shade)"/>
    </g>
    <path d="${BODY}" fill="none" stroke="#98a2ad" stroke-width="5"/>
    <path d="M930,175 C985,188 1030,238 1058,300 L990,300 C976,252 956,214 930,196Z" fill="#2d3a4a"/>
    <path d="M930,175 C985,188 1030,238 1058,300 L990,300 C976,252 956,214 930,196Z" fill="url(#g-glass)"/>
    <g fill="#2d3a4a">${wins}</g>`;
}

// 駅と、ドアの開く新幹線。場面を変えるときは root ごと消す
function buildStation(svg, name) {
  const root = h("g", {}, svg);
  frag(stationScenery(name), root);
  const train = frag(trainMarkup(), root);
  const frame = h("rect", { x: 425, y: 190, width: 150, height: 300, rx: 10, fill: "#3a4656" }, train);
  const panels = h("g", { "clip-path": "url(#dep-door)" }, train);
  const left = frag(panel(430), panels), right = frag(panel(500), panels);
  const faces = h("g", { "clip-path": "url(#dep-win)" }, train);
  // 窓ガラスの映りこみ（顔より手前）
  frag(WINDOWS.map(x => `<rect x="${x}" y="205" width="110" height="85" rx="16" fill="url(#g-glass)"/>`).join(""), train, { "pointer-events": "none" });
  frag(pillars(), root);
  return {
    root, frame, faces,
    setX: x => train.setAttribute("transform", `translate(${x} 0)`),
    setDoor: t => {
      left.setAttribute("transform", `translate(${-70 * t} 0)`);
      right.setAttribute("transform", `translate(${70 * t} 0)`);
    },
  };
}

/* ---------- 走る場面 ---------- */
const RAIL = 533;               // 線路の中心
const GROUND = 545;
const TRAIN_X = 150, TRAIN_W = 700;
const NOSE = { x: 821, y: 490 }; // ライトの場所
const RIVER = [1800, 2700];
const T_IN = 5200, T_OUT = 6600; // トンネルの入口と出口
const END = 7400;
const LIGHT = { x: 870, y: 655 };

// 遠くのものほどゆっくり動いて、うすく青っぽく見える
const distantMarkup = () => `
  <path d="M-200,${GROUND} L-200,420 Q100,330 350,400 Q600,300 900,390 Q1150,320 1400,395 Q1650,330 1900,400 L2100,380 L2100,${GROUND} Z" fill="#b9d3e6"/>`;

const farMarkup = () => `
  ${cloud(200, 90)}${cloud(900, 130, 0.8)}${cloud(1700, 80)}${cloud(2600, 120, 0.7)}
  ${[0, 700, 2300, 3000].map(x => `<ellipse cx="${x}" cy="${GROUND}" rx="420" ry="120" fill="#a9d8a0"/>`).join("")}`;

const hazeMarkup = () => `
  <defs><linearGradient id="run-haze" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="${GROUND}">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/>
  </linearGradient></defs>
  <rect x="-1000" y="0" width="3000" height="${GROUND}" fill="url(#run-haze)"/>`;

// 少し手前の木と家（地面の少し奥）
function midMarkup() {
  let s = "";
  for (let x = 0; x < 5200; x += 520) {
    s += `<g transform="translate(${x} ${GROUND})">
      <circle cx="0" cy="-34" r="40" fill="#5aa653"/><circle cx="46" cy="-24" r="30" fill="#4f9a49"/>
      <circle cx="0" cy="-34" r="40" fill="url(#g-sphere)"/>
      <rect x="130" y="-58" width="84" height="58" fill="#f3ead8"/><path d="M118,-56 L172,-96 L226,-56 Z" fill="#b5524a"/>
      <rect x="150" y="-40" width="22" height="20" fill="#9fc9ec"/>
    </g>`;
  }
  return s;
}

function worldMarkup() {
  let poles = "";
  for (let x = 100; x < END + 1500; x += 400) {
    const onBridge = x > RIVER[0] - 50 && x < RIVER[1] + 50;
    const inTunnel = x > T_IN - 100 && x < T_OUT + 100;
    if (!onBridge && !inTunnel) poles += pole(x, RAIL - 10);
  }
  // 田んぼのすじは、手前ほど太く・間があく
  let rows = "";
  for (let y = 556, gap = 10; y < 780; y += gap, gap *= 1.35) {
    rows += `<rect x="-500" y="${y}" width="${END + 2500}" height="${gap * 0.4}" fill="#6fb24c" opacity=".55"/>`;
  }
  return `
    <defs>
      <linearGradient id="run-ground" gradientUnits="userSpaceOnUse" x1="0" y1="${GROUND}" x2="0" y2="760">
        <stop offset="0" stop-color="#a8dc84"/><stop offset="1" stop-color="#7cc257"/>
      </linearGradient>
      <linearGradient id="run-river" gradientUnits="userSpaceOnUse" x1="0" y1="${GROUND}" x2="0" y2="760">
        <stop offset="0" stop-color="#8fd0f0"/><stop offset="1" stop-color="#3d9ad6"/>
      </linearGradient>
    </defs>
    <rect x="-500" y="${GROUND}" width="${END + 2500}" height="300" fill="url(#run-ground)"/>
    ${rows}
    <rect x="${RIVER[0] - 60}" y="${GROUND}" width="${RIVER[1] - RIVER[0] + 120}" height="300" fill="url(#run-river)"/>
    <path d="M${RIVER[0]},640 q40,-14 80,0 t80,0 M${RIVER[0] + 400},700 q40,-14 80,0 t80,0 M${RIVER[0] + 650},610 q40,-14 80,0 t80,0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <line x1="-500" y1="${RAIL - 200}" x2="${END + 2000}" y2="${RAIL - 200}" stroke="#5a6068" stroke-width="2"/>
    ${poles}
    ${bridge(RIVER[0], RIVER[1], RAIL)}
    <rect x="-500" y="${RAIL - 14}" width="${END + 2500}" height="30" fill="#b9aa97"/>
    ${track(-500, END + 2000, RAIL)}`;
}

const beamMarkup = () => `
  <polygon points="${NOSE.x},${NOSE.y - 8} 1150,${NOSE.y - 70} 1150,${NOSE.y + 60} ${NOSE.x},${NOSE.y + 8}" fill="#fff6b0" opacity=".55"/>
  <circle cx="${NOSE.x}" cy="${NOSE.y}" r="16" fill="#fff6b0"/>`;

// トンネルの中のあかり
function lampsMarkup() {
  let s = "";
  for (let x = T_IN - 400; x < T_OUT + 400; x += 170) {
    s += `<circle cx="${x}" cy="300" r="22" fill="#ffb347" opacity=".35"/><circle cx="${x}" cy="300" r="9" fill="#ffd27a"/>`;
  }
  return s;
}

async function journey(api, st, riders) {
  const { svg, input, audio } = api;
  let root, distant, far, mid, world, fore, dark, lamps, trains, beams, offFuji;
  let lightOn = false;

  await fadeSwap(svg, () => {
    st.root.remove();
    root = h("g", {}, svg);
    frag(sky("run-sky"), root);
    distant = frag(distantMarkup(), root);
    far = frag(farMarkup(), root);
    const fujiEl = frag(fuji(1550, GROUND, 1), far);
    frag(hazeMarkup(), root);
    mid = frag(midMarkup(), root);
    world = frag(worldMarkup(), root);
    const outside = frag(place(n700("run-a", true), TRAIN_X, RAIL - 160, TRAIN_W), root);
    // ライトの光は新幹線といっしょに山に隠れるように、外用と中用の2つ
    beams = [frag(beamMarkup(), root, { opacity: 0 })];
    fore = frag(bridgeFront(RIVER[0], RIVER[1], RAIL) + tunnel(T_IN, T_OUT, GROUND), root);
    // トンネルの中：まっくらな画面に、新幹線とあかりだけ見える
    dark = h("g", { opacity: 0 }, root);
    h("rect", { x: -1000, y: -1000, width: 3000, height: 3000, fill: "#12151b" }, dark);
    lamps = frag(lampsMarkup(), dark);
    const inside = frag(place(n700("run-b", true), TRAIN_X, RAIL - 160, TRAIN_W), dark);
    beams.push(frag(beamMarkup(), dark, { opacity: 0 }));
    trains = [outside, inside];

    // 富士山をさわると、お返事してくれる（さわらなくても先に進む）
    let lastFuji = 0;
    offFuji = input.drag(fujiEl, {
      pad: 0,
      onStart(p) {
        if (Date.now() - lastFuji < 1500) return;
        lastFuji = Date.now();
        audio.sfx.ding();
        sparkle(svg, p.x, p.y);
        audio.speak(shuffle(["ふじさん！", "おおきいね！", "にほんで いちばん たかい やま だよ"])[0]);
      },
    });
  });

  const setOx = ox => {
    distant.setAttribute("transform", `translate(${-ox * 0.12} 0)`);
    far.setAttribute("transform", `translate(${-ox * 0.3} 0)`);
    mid.setAttribute("transform", `translate(${-ox * 0.6} 0)`);
    world.setAttribute("transform", `translate(${-ox} 0)`);
    fore.setAttribute("transform", `translate(${-ox} 0)`);
    lamps.setAttribute("transform", `translate(${-ox} 0)`);
    // 新幹線がぜんぶ山に隠れているあいだは、トンネルの中の画面にする
    const d = clamp01((ox - 4850) / 150) * clamp01((5850 - ox) / 150);
    dark.setAttribute("opacity", d);
    beams.forEach(b => b.setAttribute("opacity", lightOn ? 1 : 0));
    const bob = `translate(0 ${Math.sin(performance.now() / 70) * 1.5})`;
    trains.forEach(t => t.setAttribute("transform", bob));
  };
  const run = (a, b, ms, e = ease.linear) => tween(ms, t => setOx(lerp(a, b, t)), e);
  setOx(0);

  // 田んぼ → 鉄橋 → 富士山
  audio.sfx.shinkansen(10);
  await run(0, 1500, 3000);
  audio.speak("てっきょう だよ。 ガタンゴトン");
  audio.sfx.clatter(2.6);
  await run(1500, 2700, 2400);
  audio.speak(`ふじさん だ！ ${riders[0].name}、 みえるかな？`);
  await run(2700, 4000, 2600);

  // トンネルの前でゆっくりになる → ライトのボタン
  await run(4000, 4270, 1200, ease.out);
  const btn = frag(button("ライト", "#f5a623"), root, { transform: `translate(${LIGHT.x} ${LIGHT.y})` });
  audio.sfx.pop();
  api.step({ say: "トンネルだ！ ボタンを おして、 ライトを つけよう", hint: { tap: LIGHT } });
  await input.tapOnce(btn, { pad: 30 });
  api.step({});
  btn.remove();
  lightOn = true;
  setOx(4270);
  audio.sfx.ding();
  audio.sfx.horn();
  audio.speak("ピカッ！ トンネルに はいるよ");
  await wait(1200);

  // トンネルの中 → 外へ
  audio.sfx.shinkansen(7);
  let saidDark = false;
  await tween(7000, t => {
    const ox = lerp(4270, END, t);
    setOx(ox);
    if (!saidDark && ox > 5000) { saidDark = true; audio.speak("まっくら だね。 ライトで ぴかぴか"); }
  }, ease.inOut);
  audio.speak("でたー！ つぎは しんおおさか");
  await wait(1800);

  offFuji();
  return root;
}

/* ---------- あそび ---------- */
export default {
  id: "depart",
  title: "しゅっぱつ しんこう",
  say: "しゅっぱつ しんこう！",
  color: "#dff1ff",
  shadow: "#a9d3f2",
  icon: uid => n700(uid, false),

  async start(api) {
    const { svg, input, audio } = api;

    // 今日のお客さん（毎回ちがう動物が 2〜4 人）
    const count = 2 + Math.floor(Math.random() * 3);
    const spots = shuffle(SPOTS).slice(0, count).sort((a, b) => a - b);
    const riders = shuffle(FRIENDS).slice(0, count).map((a, i) => ({ ...a, x: spots[i] }));

    /* ---- とうきょう駅 ---- */
    let st = buildStation(svg, "とうきょう");

    // 1. 電車が入ってくる
    st.setX(-1500);
    audio.sfx.shinkansen(2.4);
    await tween(2300, t => st.setX(lerp(-1500, 0, t)), ease.out);

    // 2. ドアをタップ
    api.step({ say: "でんしゃが きたよ！ ドアを タッチしてね", hint: { tap: DOOR } });
    await input.tapOnce(st.frame, { pad: 40 });
    api.step({});
    audio.sfx.chime();
    audio.speak("ドアが ひらきます");
    await tween(800, st.setDoor);

    // 3. お客さんをドラッグで乗せる
    for (const r of riders) {
      r.it = new Item(frag(animal(r.kind, { ground: true }), st.root), r.x, PLATFORM_Y, 0);
      audio.sfx.pop();
      await tween(300, t => r.it.set(r.x, PLATFORM_Y, 0.9 * t), ease.back);
    }
    const waiting = new Set(riders);
    let slot = 0;
    api.step({
      say: `${riders.length}にんの おきゃくさんを でんしゃに のせてあげてね`,
      hint: { drag: { from: () => { const [r] = waiting; return r && { x: r.it.x, y: r.it.y }; }, to: DOOR } },
    });
    await Promise.all(riders.map(async r => {
      await input.dragOnce(r.it, [DOOR], { snap: 200, onSnap: () => waiting.delete(r) });
      await tween(250, t => r.it.set(r.it.x, r.it.y, 0.9 * (1 - t)));
      r.it.el.remove();
      r.slot = SLOTS[slot++];
      const face = new Item(frag(animal(r.kind), st.faces), r.slot.x, r.slot.y, 0);
      audio.sfx.ding();
      sparkle(svg, r.slot.x, r.slot.y);
      audio.speak(waiting.size ? `${r.name} のったね！` : `${r.name} のったね！ みんな のったよ！`);
      await tween(350, t => face.set(r.slot.x, r.slot.y, 0.55 * t), ease.back);
    }));

    // 4. ドアが閉まる
    await wait(1600);
    audio.sfx.chime();
    audio.speak("ドアが しまります");
    await tween(800, t => st.setDoor(1 - t));

    // 5. しゅっぱつボタンをタップ
    const go = frag(button("しゅっぱつ", "#2fb84f"), st.root, { transform: `translate(${BTN.x} ${BTN.y})` });
    audio.sfx.pop();
    await wait(500);
    api.step({ say: "みどりの ボタンを おしてね", hint: { tap: BTN } });
    await input.tapOnce(go, { pad: 30 });
    api.step({});
    go.remove();
    audio.speak("しゅっぱつ しんこう！");
    audio.sfx.horn();
    await wait(1000);
    audio.sfx.shinkansen(2.8);
    await tween(2600, t => st.setX(lerp(0, 1600, t)), ease.in);

    /* ---- 走る ---- */
    const run = await journey(api, st, riders);

    /* ---- しんおおさか駅 ---- */
    await fadeSwap(svg, () => {
      run.remove();
      st = buildStation(svg, "しんおおさか");
      for (const r of riders) r.face = new Item(frag(animal(r.kind), st.faces), r.slot.x, r.slot.y, 0.55);
      st.setX(-1500);
    });
    audio.sfx.shinkansen(2.4);
    await tween(2300, t => st.setX(lerp(-1500, 0, t)), ease.out);
    audio.speak("しんおおさか に つきました");
    await wait(2200);

    // 6. ドアをタップ
    api.step({ say: "ドアを タッチして あけてね", hint: { tap: DOOR } });
    await input.tapOnce(st.frame, { pad: 40 });
    api.step({});
    audio.sfx.chime();
    audio.speak("ドアが ひらきます");
    await tween(800, st.setDoor);

    // 7. 窓のお客さんをタップして降ろす
    const inside = new Set(riders);
    let spot = 0;
    api.step({
      say: "おきゃくさんを タッチして、 おろして あげてね",
      hint: { tap: () => { const [r] = inside; return r && r.slot; } },
    });
    await Promise.all(riders.map(async r => {
      await input.tapOnce(r.face.el, { pad: 20 });
      inside.delete(r);
      r.face.el.remove();
      const x = NEAR_DOOR[spot++];
      const it = new Item(frag(animal(r.kind, { ground: true }), st.root), DOOR.x, DOOR.y + 80, 0.5);
      audio.sfx.pop();
      await tween(600, t => it.set(lerp(DOOR.x, x, t), lerp(DOOR.y + 80, PLATFORM_Y, t) - Math.sin(t * Math.PI) * 60, lerp(0.5, 0.9, t)), ease.out);
      audio.sfx.ding();
      sparkle(svg, x, PLATFORM_Y);
      audio.speak(inside.size ? `${r.name}、 ありがとう！` : `${r.name}、 ありがとう！ みんな ついたね！`);
    }));
    api.step({});

    await wait(2200);
    api.done();
  },
};
