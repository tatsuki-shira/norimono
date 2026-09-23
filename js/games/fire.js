// 🚒 ひを けそう：ホースの先を指で動かして、火に水をかける
import { frag, h, wait, puff } from "../fx.js";
import { Item } from "../gesture.js";
import { fireTruck, flame, place, sky, cloud } from "../art.js";

const HOSE_FROM = { x: 250, y: 560 };
const NOZZLE_HOME = { x: 420, y: 620 };
const REACH = 210;   // ノズルから水が届くところまでの高さ
const HIT = 95;      // 水が火に当たったとみなす距離

const scenery = () => `
  ${sky("fire-sky")}
  ${cloud(160, 110)}${cloud(900, 90, 0.7)}
  <rect x="-1000" y="560" width="3000" height="1200" fill="#8fd16a"/>
  <rect x="530" y="270" width="320" height="290" fill="#ffe9c7" stroke="#d9b98a" stroke-width="4"/>
  <path d="M500,288 L690,130 L880,288 Z" fill="#c8553d" stroke="#a84330" stroke-width="4" stroke-linejoin="round"/>
  <rect x="560" y="315" width="90" height="80" rx="8" fill="#9fd4ff" stroke="#fff" stroke-width="7"/>
  <rect x="730" y="315" width="90" height="80" rx="8" fill="#9fd4ff" stroke="#fff" stroke-width="7"/>
  <rect x="650" y="440" width="80" height="120" rx="10" fill="#9c6b3f"/>
  <circle cx="712" cy="505" r="6" fill="#f2c230"/>`;

const nozzleMarkup = `
  <rect x="-17" y="-40" width="34" height="74" rx="11" fill="#d4a017" stroke="#9c7410" stroke-width="3"/>
  <rect x="-11" y="-54" width="22" height="18" rx="5" fill="#555"/>
  <rect x="-17" y="-6" width="34" height="8" fill="#9c7410"/>`;

export default {
  id: "fire",
  title: "ひを けそう",
  say: "ひを けそう！",
  color: "#ffe1dc",
  shadow: "#f3aca1",
  icon: () => fireTruck(),

  async start(api) {
    const { svg, input, audio, session } = api;
    frag(scenery(), svg);

    const fires = [{ x: 690, y: 215 }, { x: 605, y: 345 }, { x: 775, y: 345 }].map(f => ({
      ...f, hp: 1, item: new Item(frag(flame(), svg), f.x, f.y, 1),
    }));
    frag(place(fireTruck(), -30, 450, 380), svg);

    const hose = h("path", { fill: "none", stroke: "#c0392b", "stroke-width": 16, "stroke-linecap": "round" }, svg);
    const spray = h("path", { class: "water", fill: "none", visibility: "hidden" }, svg);
    const splash = h("circle", { r: 34, fill: "#bfe9ff", opacity: 0.8, visibility: "hidden" }, svg);
    const nozzle = new Item(frag(nozzleMarkup, svg), NOZZLE_HOME.x, NOZZLE_HOME.y, 1);

    const aim = () => ({ x: nozzle.x, y: nozzle.y - REACH });
    const redraw = () => {
      const n = nozzle, a = aim();
      hose.setAttribute("d", `M${HOSE_FROM.x},${HOSE_FROM.y} Q${(HOSE_FROM.x + n.x) / 2},${Math.max(HOSE_FROM.y, n.y) + 130} ${n.x},${n.y + 34}`);
      spray.setAttribute("d", `M${n.x},${n.y - 54} Q${n.x + 28},${n.y - 140} ${a.x},${a.y}`);
      splash.setAttribute("cx", a.x);
      splash.setAttribute("cy", a.y);
    };
    redraw();

    audio.sfx.fire(2.4);
    await wait(1600);

    let out = 0, spraying = false, last = 0, stopWater = null, finish;
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

    const loop = now => {
      if (!spraying || !session.alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = aim();
      for (const f of fires) {
        if (f.hp <= 0 || Math.hypot(a.x - f.x, a.y - f.y) > HIT) continue;
        f.hp -= dt * 0.9;
        if (f.hp <= 0) extinguish(f);
        else f.item.set(f.x, f.y, 0.35 + 0.65 * f.hp);
      }
      requestAnimationFrame(loop);
    };
    const setSpray = on => {
      spraying = on;
      spray.setAttribute("visibility", on ? "visible" : "hidden");
      splash.setAttribute("visibility", on ? "visible" : "hidden");
      if (on) {
        stopWater = audio.sfx.water();
        last = performance.now();
        requestAnimationFrame(loop);
      } else {
        stopWater?.();
        stopWater = null;
      }
    };

    let dx = 0, dy = 0;
    input.drag(nozzle.el, {
      pad: 60,
      onStart(p) { dx = p.x - nozzle.x; dy = p.y - nozzle.y; setSpray(true); },
      onMove(p) {
        nozzle.set(Math.max(20, Math.min(980, p.x - dx)), Math.max(REACH - 60, Math.min(730, p.y - dy)));
        redraw();
      },
      onEnd() { setSpray(false); },
    });

    api.step({
      say: "かじだ！ ホースを もって、 ひに みずを かけてね",
      hint: { drag: { from: () => ({ x: nozzle.x, y: nozzle.y }), to: () => { const f = burning(); return f && { x: f.x, y: f.y + REACH }; } } },
    });

    await allOut;
    api.step({});
    input.clear();
    setSpray(false);
    await wait(1400);
    audio.speak("ありがとう しょうぼうしゃ！");
    audio.sfx.fire(3);
    await wait(2800);
    api.done();
  },
};
