// 🛤️ せんろ つなげよう：
// 長い・短い線路のピースを、同じ長さの切れ目にはめる → 新幹線が走る → 踏切を閉めて、新幹線を通す
import { frag, h, tween, wait, lerp, ease, sparkle, shuffle, fadeSwap } from "../fx.js";
import { Item } from "../gesture.js";
import { FRIENDS, n700, track, trackIcon, animal, button, place, sky, cloud, band, haze, shadow } from "../art.js";

const RAIL_Y = 500;
const SHORT = 110, LONG = 200;
const TRAY_Y = 665;
const LAYOUTS = { 2: [330, 670], 3: [230, 500, 770] };

/* ---------- 線路をつなぐ場面 ---------- */
const scenery = () => `
  ${sky("trk-sky")}
  ${cloud(180, 110)}${cloud(820, 160, 0.8)}
  <path d="M-200,470 Q100,380 300,430 Q650,360 1200,450 L1200,470 Z" fill="#c3d9e8"/>
  <defs><linearGradient id="trk-mt" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5877b3"/><stop offset="1" stop-color="#9db6da"/>
  </linearGradient></defs>
  <polygon points="220,475 440,250 560,250 780,475" fill="url(#trk-mt)"/>
  <polygon points="500,250 560,250 780,475 640,475" fill="#000" opacity=".08"/>
  <polygon points="440,250 560,250 596,288 566,298 532,282 500,304 468,282 434,298 404,288" fill="#fff"/>
  ${haze("trk-haze", 250, 470)}
  ${band("trk-ground", 470, 760, "#a8dc84", "#6fb84c")}
  ${band("trk-bed", 462, 540, "#c8bba8", "#a89885", 78)}
  ${shadow(500, 732, 440, 20)}
  <rect x="70" y="${TRAY_Y - 60}" width="860" height="120" rx="30" fill="#ecdcb8" stroke="#cdb88c" stroke-width="5"/>
  <rect x="70" y="${TRAY_Y - 60}" width="860" height="120" rx="30" fill="url(#g-shade)"/>
  <rect x="90" y="${TRAY_Y - 40}" width="820" height="80" rx="20" fill="#000" opacity=".06"/>`;

/* ---------- 踏切の場面 ---------- */
const HORIZON = 380;
const CROSS_Y = 470;          // 踏切の線路
const CROSS_BTN = { x: 860, y: 650 };
const roadX = (y, side) => 500 + side * (20 + (y - HORIZON) * (230 / 380));

const crossingScene = () => `
  ${sky("crs-sky")}
  ${cloud(200, 90)}${cloud(780, 120, 0.8)}
  <path d="M-200,${HORIZON} Q150,300 420,350 Q700,290 1200,370 L1200,${HORIZON} Z" fill="#c3d9e8"/>
  ${haze("crs-haze", 250, HORIZON)}
  ${band("crs-ground", HORIZON, 760, "#b4e08f", "#6fb84c")}
  <defs><linearGradient id="crs-road" gradientUnits="userSpaceOnUse" x1="0" y1="${HORIZON}" x2="0" y2="760">
    <stop offset="0" stop-color="#a3a8ae"/><stop offset="1" stop-color="#5f646b"/>
  </linearGradient></defs>
  <path d="M${roadX(HORIZON, -1)},${HORIZON} L${roadX(HORIZON, 1)},${HORIZON} L${roadX(900, 1)},900 L${roadX(900, -1)},900 Z" fill="url(#crs-road)"/>
  ${[430, 520, 620, 740].map((y, i) => {
    const w = 3 + i * 3, len = 12 + i * 18;
    return `<rect x="${500 - w / 2}" y="${y}" width="${w}" height="${len}" fill="#fff" opacity=".9"/>`;
  }).join("")}
  ${band("crs-bed", CROSS_Y - 26, CROSS_Y + 34, "#c8bba8", "#a89885", 60)}
  ${track(-1000, 2000, CROSS_Y)}
  <rect x="${roadX(CROSS_Y - 26, -1)}" y="${CROSS_Y - 26}" width="${roadX(CROSS_Y + 30, 1) - roadX(CROSS_Y - 26, -1)}" height="56" fill="#6f747b" opacity=".85"/>
  <rect x="-1000" y="${CROSS_Y - 16}" width="3000" height="7" fill="#7d858f"/>
  <rect x="-1000" y="${CROSS_Y + 10}" width="3000" height="7" fill="#7d858f"/>`;

// 踏切の柱（✕の看板・赤いランプ2つ）。(x, y) が根もと
function crossingPost(parent, x, y, s) {
  const g = frag(`
    ${shadow(0, 0, 60, 10)}
    <rect x="-7" y="-300" width="14" height="300" fill="#f2f2f2"/>
    <rect x="-7" y="-300" width="14" height="300" fill="url(#g-cyl)"/>
    ${[-270, -230, -190, -150, -110, -70].map(yy => `<rect x="-7" y="${yy}" width="14" height="20" fill="#222"/>`).join("")}
    <g transform="translate(0 -300)">
      <rect x="-70" y="-12" width="140" height="24" rx="4" fill="#f5c400" stroke="#222" stroke-width="4" transform="rotate(30)"/>
      <rect x="-70" y="-12" width="140" height="24" rx="4" fill="#f5c400" stroke="#222" stroke-width="4" transform="rotate(-30)"/>
    </g>
    <rect x="-66" y="-250" width="132" height="14" rx="6" fill="#3b4048"/>
    <circle cx="-44" cy="-222" r="24" fill="#23262b"/><circle cx="44" cy="-222" r="24" fill="#23262b"/>
    <rect x="-24" y="-40" width="48" height="40" rx="6" fill="#dcdfe3"/>
    <rect x="-24" y="-40" width="48" height="40" rx="6" fill="url(#g-shade)"/>`, parent, { transform: `translate(${x} ${y}) scale(${s})` });
  const lamps = [-44, 44].map(cx => h("circle", { cx, cy: -222, r: 20, fill: "#4a2020" }, g));
  return lamps;
}

// 遮断機のバー（黄色と黒のしましま）。dir=1 で右へ、-1 で左へ下りる
function gateArm(parent, x, y, s, dir, len) {
  const g = h("g", {}, parent);
  let stripes = "";
  for (let i = 0; i < len; i += 40) stripes += `<rect x="${i}" y="-7" width="20" height="14" fill="#222"/>`;
  frag(`<rect x="0" y="-7" width="${len}" height="14" rx="6" fill="#f5c400"/>${stripes}<rect x="0" y="-7" width="${len}" height="14" rx="6" fill="url(#g-shade)"/>`, g);
  // t=0 で上がっている、t=1 で下りている
  const set = t => g.setAttribute("transform", `translate(${x} ${y}) scale(${s * dir} ${s}) rotate(${-80 * (1 - t)})`);
  set(0);
  return set;
}

export default {
  id: "track",
  title: "せんろ つなげよう",
  say: "せんろ つなげよう！",
  color: "#e4f6d8",
  shadow: "#b3dc9b",
  icon: () => trackIcon(),

  async start(api) {
    const { svg, input, audio, session } = api;

    /* ---- 1. 長い・短いピースをはめる ---- */
    let scene = frag(scenery(), svg);
    const count = Math.random() < 0.5 ? 2 : 3;
    const sizes = shuffle(count === 2 ? [SHORT, LONG] : [SHORT, LONG, Math.random() < 0.5 ? SHORT : LONG]);
    const gaps = LAYOUTS[count].map((x, i) => ({ x, y: RAIL_Y, w: sizes[i], filled: false }));

    // 切れ目のある線路
    const edges = [-1000, ...gaps.flatMap(g => [g.x - g.w / 2, g.x + g.w / 2]), 2000];
    let rails = "";
    for (let i = 0; i < edges.length; i += 2) rails += track(edges[i], edges[i + 1], RAIL_Y);
    frag(rails, scene);
    for (const g of gaps) {
      g.mark = h("rect", { x: g.x - g.w / 2, y: RAIL_Y - 26, width: g.w, height: 52, rx: 8, class: "gap-mark" }, scene);
    }

    // 待っている新幹線（先頭だけ見えている）
    const train = frag(place(n700("trk", true), 0, RAIL_Y - 190, 820), scene);
    const setX = x => train.setAttribute("transform", `translate(${x} 0)`);
    setX(-690);

    // トレイの上のピース（並び順はばらばら）
    const pieces = shuffle(gaps.map(g => g.w)).map((w, i) =>
      Object.assign(new Item(frag(track(-w / 2, w / 2, 0), scene), LAYOUTS[count][i], TRAY_Y, 0), { w }));
    for (const p of pieces) {
      audio.sfx.pop();
      await tween(260, t => p.set(p.homeX, TRAY_Y, t), ease.back);
    }

    const free = () => gaps.filter(g => !g.filled);
    const fits = p => free().filter(g => g.w === p.w);
    const loose = new Set(pieces);
    let lastWrong = 0;
    api.step({
      say: "せんろが きれちゃった。 おなじ ながさの せんろを はめてね",
      hint: {
        drag: {
          from: () => { const [p] = loose; return p && { x: p.x, y: p.y }; },
          to: () => { const [p] = loose; return p && fits(p)[0]; },
        },
      },
    });

    await Promise.all(pieces.map(async p => {
      const g = await input.dragOnce(p, () => fits(p), {
        pad: 50, snap: 170,
        onSnap: g => { g.filled = true; loose.delete(p); },
        // 長さの違う切れ目の近くで離したら、やさしく教える
        onReturn: it => {
          const near = free().some(g => g.w !== p.w && Math.hypot(g.x - it.x, g.y - it.y) < 170);
          if (near && Date.now() - lastWrong > 3000) {
            lastWrong = Date.now();
            audio.speak(p.w === LONG ? "ながすぎたね。 ながい きれめを さがそう" : "みじかすぎたね。 みじかい きれめを さがそう");
          }
        },
      });
      g.mark.remove();
      audio.sfx.click();
      audio.sfx.ding();
      sparkle(svg, g.x, g.y);
      audio.speak(free().length ? "カチッ！ つながったね！" : "ぜんぶ つながった！");
    }));

    // 新幹線が走り抜ける
    await wait(2200);
    audio.speak("しゅっぱつ しんこう！");
    audio.sfx.horn();
    await wait(1000);
    audio.sfx.shinkansen(3.2);
    await tween(3000, t => setX(lerp(-690, 1100, t)), ease.in);

    /* ---- 2. 踏切 ---- */
    const friend = shuffle(FRIENDS)[0];
    let farLamps, nearLamps, setFar, setNear, runner, pal, stage2;
    await fadeSwap(svg, () => {
      scene.remove();
      scene = frag(crossingScene(), svg);
      // 奥の遮断機（線路の向こう側）
      farLamps = crossingPost(scene, roadX(CROSS_Y - 40, 1) + 50, CROSS_Y - 40, 0.55);
      setFar = gateArm(scene, roadX(CROSS_Y - 40, 1) + 36, CROSS_Y - 52, 0.55, -1, 320);
      // 新幹線
      runner = frag(place(n700("crs", true), 0, CROSS_Y - 200, 900), scene);
      runner.setAttribute("transform", "translate(-1100 0)");
      // 手前の遮断機
      stage2 = h("g", {}, scene);
      nearLamps = crossingPost(stage2, roadX(600, -1) - 70, 600, 1);
      setNear = gateArm(stage2, roadX(600, -1) - 44, 580, 1, 1, 470);
      pal = new Item(frag(animal(friend.kind, { ground: true }), stage2), 500, 640, 0.75);
    });

    const btn = frag(button("カンカン", "#e53935"), scene, { transform: `translate(${CROSS_BTN.x} ${CROSS_BTN.y})` });
    audio.sfx.pop();
    api.step({
      say: `ふみきり だよ。 でんしゃが くるから、 ボタンを おして しめよう`,
      hint: { tap: CROSS_BTN },
    });
    await input.tapOnce(btn, { pad: 30 });
    api.step({});
    btn.remove();

    // ランプが交互に光って、遮断機が下りる
    let blinking = true;
    (async () => {
      for (let on = 0; blinking && session.alive; on ^= 1) {
        for (const lamps of [nearLamps, farLamps]) {
          lamps[0].setAttribute("fill", on ? "#ff3b30" : "#4a2020");
          lamps[1].setAttribute("fill", on ? "#4a2020" : "#ff3b30");
        }
        await wait(480);
      }
      for (const l of [...nearLamps, ...farLamps]) l.setAttribute("fill", "#4a2020");
    })();
    audio.sfx.crossing(7.5);
    audio.speak(`カンカン カンカン。 ${friend.name}、 まっててね`);
    await tween(1500, t => { setNear(t); setFar(t); }, ease.out);
    await wait(900);

    // 新幹線が通る
    audio.sfx.horn();
    audio.sfx.shinkansen(3.4);
    await tween(3200, t => runner.setAttribute("transform", `translate(${lerp(-1100, 1150, t)} 0)`), ease.inOut);
    await wait(500);

    // 遮断機が上がって、おともだちがわたる
    blinking = false;
    await tween(1300, t => { setNear(1 - t); setFar(1 - t); }, ease.inOut);
    audio.sfx.ding();
    audio.speak(`あいたね！ ${friend.name}、 わたれるよ`);
    await wait(900);
    await tween(2600, t => pal.set(500, lerp(640, HORIZON + 30, t), lerp(0.75, 0.22, t)), ease.inOut);
    sparkle(svg, 500, HORIZON + 30);
    audio.speak("ばいばーい！");
    await wait(1800);
    api.done();
  },
};
