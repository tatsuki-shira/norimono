// 🚄 しゅっぱつ しんこう：ドアをタップ → お客さんをドラッグで乗せる → しゅっぱつボタンをタップ
import { frag, h, tween, wait, lerp, ease, sparkle } from "../fx.js";
import { Item } from "../gesture.js";
import { n700, animal, button, sky } from "../art.js";

const BODY = "M-400,150 L880,150 C990,150 1060,270 1100,420 L1100,510 L-400,510 Z";
const WINDOWS = [60, 200, 640, 780];
const SLOTS = [{ x: 115, y: 258 }, { x: 255, y: 258 }, { x: 695, y: 258 }];
const DOOR = { x: 500, y: 350 };
const GO = { x: 870, y: 640 };
const PASSENGERS = [
  { kind: "kuma", name: "くまさん", x: 150 },
  { kind: "usagi", name: "うさぎさん", x: 330 },
  { kind: "neko", name: "ねこさん", x: 850 },
];

const scenery = () => `
  ${sky("dep-sky")}
  <rect x="-1000" y="-1000" width="3000" height="1070" fill="#6f7780"/>
  <rect x="-1000" y="62" width="3000" height="10" fill="#565d65"/>
  <rect x="-1000" y="546" width="3000" height="10" fill="#8a8f98"/>
  <rect x="-1000" y="560" width="3000" height="1200" fill="#d9cfbd"/>
  <rect x="-1000" y="560" width="3000" height="12" fill="#f5f5f5"/>
  <rect x="-1000" y="594" width="3000" height="26" fill="#f4c430"/>`;

const panel = x => `
  <rect x="${x}" y="195" width="70" height="290" fill="#eef1f4" stroke="#b8c0c8" stroke-width="3"/>
  <rect x="${x + 14}" y="220" width="42" height="80" rx="8" fill="#2d3a4a"/>
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
    </g>
    <path d="${BODY}" fill="none" stroke="#98a2ad" stroke-width="5"/>
    <path d="M930,175 C985,188 1030,238 1058,300 L990,300 C976,252 956,214 930,196Z" fill="#2d3a4a"/>
    <g fill="#2d3a4a">${wins}</g>`;
}

export default {
  id: "depart",
  title: "しゅっぱつ しんこう",
  say: "しゅっぱつ しんこう！",
  color: "#dff1ff",
  shadow: "#a9d3f2",
  icon: uid => n700(uid, false),

  async start(api) {
    const { svg, input, audio } = api;
    frag(scenery(), svg);

    const train = frag(trainMarkup(), svg);
    const frame = h("rect", { x: 425, y: 190, width: 150, height: 300, rx: 10, fill: "#3a4656" }, train);
    const panels = h("g", { "clip-path": "url(#dep-door)" }, train);
    const left = frag(panel(430), panels), right = frag(panel(500), panels);
    const faces = h("g", { "clip-path": "url(#dep-win)" }, train);
    const setX = x => train.setAttribute("transform", `translate(${x} 0)`);
    const setDoor = t => {
      left.setAttribute("transform", `translate(${-70 * t} 0)`);
      right.setAttribute("transform", `translate(${70 * t} 0)`);
    };

    // 1. 電車が入ってくる
    setX(-1500);
    audio.sfx.shinkansen(2.4);
    await tween(2300, t => setX(lerp(-1500, 0, t)), ease.out);

    // 2. ドアをタップ
    api.step({ say: "でんしゃが きたよ！ ドアを タッチしてね", hint: { tap: DOOR } });
    await input.tapOnce(frame, { pad: 40 });
    api.step({});
    audio.sfx.chime();
    audio.speak("ドアが ひらきます");
    await tween(800, setDoor);

    // 3. お客さんをドラッグで乗せる
    const people = PASSENGERS.map(p => ({ ...p, it: new Item(frag(animal(p.kind), svg), p.x, 640, 0) }));
    for (const p of people) {
      audio.sfx.pop();
      await tween(300, t => p.it.set(p.x, 640, 0.9 * t), ease.back);
    }
    const waiting = new Set(people);
    let slot = 0;
    api.step({
      say: "おきゃくさんを でんしゃに のせてあげてね",
      hint: { drag: { from: () => { const [p] = waiting; return p && { x: p.it.x, y: p.it.y }; }, to: DOOR } },
    });
    await Promise.all(people.map(async p => {
      await input.dragOnce(p.it, [DOOR], { snap: 200, onSnap: () => waiting.delete(p) });
      await tween(250, t => p.it.set(p.it.x, p.it.y, 0.9 * (1 - t)));
      p.it.el.remove();
      const s = SLOTS[slot++];
      const face = new Item(frag(animal(p.kind), faces), s.x, s.y, 0);
      audio.sfx.ding();
      sparkle(svg, s.x, s.y);
      audio.speak(waiting.size ? `${p.name} のったね！` : `${p.name} のったね！ みんな のったよ！`);
      await tween(350, t => face.set(s.x, s.y, 0.55 * t), ease.back);
    }));

    // 4. ドアが閉まる
    await wait(1600);
    audio.sfx.chime();
    audio.speak("ドアが しまります");
    await tween(800, t => setDoor(1 - t));

    // 5. しゅっぱつボタンをタップ
    const btn = frag(button("しゅっぱつ", "#2fb84f"), svg, { transform: `translate(${GO.x} ${GO.y})` });
    audio.sfx.pop();
    await wait(500);
    api.step({ say: "みどりの ボタンを おしてね", hint: { tap: GO } });
    await input.tapOnce(btn, { pad: 30 });
    api.step({});
    btn.setAttribute("transform", `translate(${GO.x} ${GO.y}) scale(.9)`);
    audio.speak("しゅっぱつ しんこう！");
    audio.sfx.horn();
    await wait(1000);
    audio.sfx.shinkansen(2.8);
    await tween(2600, t => setX(lerp(0, 1600, t)), ease.in);
    api.done();
  },
};
