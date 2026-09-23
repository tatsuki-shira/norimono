// 🛤️ せんろ つなげよう：線路のピースをドラッグして切れ目にはめる → 新幹線が走る
import { frag, h, tween, wait, lerp, ease, sparkle } from "../fx.js";
import { Item } from "../gesture.js";
import { n700, track, trackIcon, place, sky, cloud } from "../art.js";

const RAIL_Y = 500;
const GAP_W = 130;
const TRAY_Y = 665;

const scenery = () => `
  ${sky("trk-sky")}
  ${cloud(180, 110)}${cloud(820, 160, 0.8)}
  <polygon points="220,475 440,250 560,250 780,475" fill="#5b7fb8"/>
  <polygon points="440,250 560,250 596,288 566,298 532,282 500,304 468,282 434,298 404,288" fill="#fff"/>
  <rect x="-1000" y="470" width="3000" height="1300" fill="#8fd16a"/>
  <rect x="-1000" y="468" width="3000" height="64" fill="#b9aa97"/>
  <rect x="70" y="${TRAY_Y - 60}" width="860" height="120" rx="30" fill="#ecdcb8" stroke="#cdb88c" stroke-width="5"/>`;

export default {
  id: "track",
  title: "せんろ つなげよう",
  say: "せんろ つなげよう！",
  color: "#e4f6d8",
  shadow: "#b3dc9b",
  icon: () => trackIcon(),

  async start(api) {
    const { svg, input, audio } = api;
    frag(scenery(), svg);

    const gaps = [250, 500, 750].map(x => ({ x, y: RAIL_Y, filled: false }));
    // 切れ目のある線路
    const edges = [-1000, ...gaps.flatMap(g => [g.x - GAP_W / 2, g.x + GAP_W / 2]), 2000];
    let rails = "";
    for (let i = 0; i < edges.length; i += 2) rails += track(edges[i], edges[i + 1], RAIL_Y);
    frag(rails, svg);
    for (const g of gaps) {
      g.mark = h("rect", {
        x: g.x - GAP_W / 2, y: RAIL_Y - 26, width: GAP_W, height: 52, rx: 8, class: "gap-mark",
      }, svg);
    }

    // 待っている新幹線（先頭だけ見えている）
    const train = frag(place(n700("trk", true), 0, RAIL_Y - 190, 820), svg);
    const setX = x => train.setAttribute("transform", `translate(${x} 0)`);
    setX(-690);

    // 線路のピース（トレイの上）
    const pieces = [230, 500, 770].map(x => new Item(frag(track(-GAP_W / 2, GAP_W / 2, 0), svg), x, TRAY_Y, 0));
    for (const p of pieces) {
      audio.sfx.pop();
      await tween(260, t => p.set(p.homeX, TRAY_Y, t), ease.back);
    }

    const free = () => gaps.filter(g => !g.filled);
    const loose = new Set(pieces);
    api.step({
      say: "せんろが きれちゃった。 せんろを つなげて あげてね",
      hint: { drag: { from: () => { const [p] = loose; return p && { x: p.x, y: p.y }; }, to: () => free()[0] } },
    });

    await Promise.all(pieces.map(async p => {
      const g = await input.dragOnce(p, free, {
        pad: 50, snap: 170,
        onSnap: g => { g.filled = true; loose.delete(p); },
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
    api.done();
  },
};
