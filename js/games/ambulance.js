// 🚑 けがを たすけよう：
// けがをしたおともだちを救急車に乗せる → サイレン → 信号を青にする → 病院でばんそうこうを貼る
import { frag, h, tween, wait, lerp, ease, sparkle, fadeSwap, shuffle } from "../fx.js";
import { Item } from "../gesture.js";
import { FRIENDS, HURT, ambulance, animal, bandage, button, place, sky, cloud, tree, band, haze, city } from "../art.js";

const CAR_Y = 470;
const STOP_X = 470;
const K = 460 / 420;                          // 救急車の絵の拡大率
const REAR = { x: STOP_X + 62, y: CAR_Y + 112 }; // 後ろのドア
const SIREN = { x: 700, y: 300 };
const SIGNAL_STOP = 250;
const SIGNAL = { x: 710, y: 262 };             // 信号の灯り
const BED = { x: 430, y: 400, s: 1.1 };        // ベッドの上のおともだち
const PATCH = { x: 820, y: 470 };              // ばんそうこうの置き場所

// 道路のある町（遠くのビル → かすみ → 草 → 道路）
const street = (id, { farCity = true } = {}) => `
  ${sky(id + "-sky")}
  ${cloud(420, 100)}${cloud(760, 60, 0.7)}
  ${farCity ? city(520) : ""}
  ${haze(id + "-haze", 300, 520)}
  ${band(id + "-grass", 520, 760, "#a3dd7e", "#6fb84c")}
  <rect x="-1000" y="604" width="3000" height="8" fill="#d9dde2"/>
  ${band(id + "-road", 612, 720, "#80858d", "#5a5f67", 108)}
  <rect x="-1000" y="720" width="3000" height="8" fill="#d9dde2"/>
  <line x1="-1000" y1="665" x2="2000" y2="665" stroke="#fff" stroke-width="8" stroke-dasharray="60 40"/>`;

const park = () => `${tree(60, 540, 0.95)}${tree(-60, 560, 0.8)}`;

// 横に3つ並んだ日本の信号（左から 青・黄・赤）
const signal = () => `
  <rect x="${SIGNAL_STOP + 470}" y="612" width="8" height="108" fill="#fff"/>
  ${[0, 1, 2, 3, 4].map(i => `<rect x="${SIGNAL_STOP + 500 + i * 36}" y="616" width="20" height="100" fill="#fff" opacity=".9"/>`).join("")}
  <rect x="852" y="250" width="16" height="360" fill="#9aa3ad"/>
  <rect x="852" y="250" width="16" height="360" fill="url(#g-cyl)"/>
  <rect x="780" y="252" width="80" height="12" fill="#9aa3ad"/>
  <rect x="610" y="228" width="200" height="68" rx="14" fill="#3b4048"/>
  <rect x="610" y="228" width="200" height="68" rx="14" fill="url(#g-shade)"/>
  ${[650, 710, 770].map(x => `<circle cx="${x}" cy="262" r="24" fill="#23262b"/>`).join("")}`;

const hospital = () => `
  <rect x="470" y="170" width="460" height="440" fill="#fff" stroke="#cfd6de" stroke-width="5"/>
  <path d="M930,170 L990,140 L990,580 L930,610 Z" fill="#dfe4ea"/>
  <rect x="470" y="170" width="460" height="440" fill="url(#g-shade)" opacity=".5"/>
  <rect x="455" y="150" width="490" height="30" rx="8" fill="#9ec9e8"/>
  <path d="M945,150 L1005,122 L1005,146 L945,180 Z" fill="#7fb0d3"/>
  <rect x="680" y="200" width="40" height="110" rx="6" fill="#e53935"/>
  <rect x="645" y="235" width="110" height="40" rx="6" fill="#e53935"/>
  ${[510, 790].map(x => [340, 420].map(y => `<rect x="${x}" y="${y}" width="100" height="56" rx="6" fill="#bfe6ff"/><rect x="${x}" y="${y}" width="100" height="56" rx="6" fill="url(#g-glass)"/>`).join("")).join("")}
  <rect x="650" y="470" width="100" height="140" rx="6" fill="#bfe6ff" stroke="#9aa3ad" stroke-width="4"/>
  <rect x="650" y="470" width="100" height="140" rx="6" fill="url(#g-glass)"/>
  <line x1="700" y1="470" x2="700" y2="610" stroke="#9aa3ad" stroke-width="4"/>`;

// 病院のお部屋（床は奥に向かって目地が集まる）
function room() {
  let floor = "";
  for (let i = -12; i <= 12; i++) floor += `<line x1="${500 + i * 90}" y1="560" x2="${500 + i * 90 * 1.9}" y2="760" stroke="#b9c7cf" stroke-width="2"/>`;
  return `
    ${band("room-wall", -1000, 560, "#eef8f5", "#d3ebe4")}
    ${band("room-floor", 560, 760, "#dfe8ec", "#b8c6ce")}
    ${floor}
    <rect x="-1000" y="548" width="3000" height="14" fill="#c4d3da"/>
    <rect x="80" y="110" width="220" height="170" rx="10" fill="#bfe6ff" stroke="#fff" stroke-width="10"/>
    <rect x="80" y="110" width="220" height="170" rx="10" fill="url(#g-glass)"/>
    <line x1="190" y1="110" x2="190" y2="280" stroke="#fff" stroke-width="8"/>
    <g transform="translate(560 170)"><rect x="-38" y="-38" width="76" height="76" rx="16" fill="#fff"/>
      <rect x="-10" y="-28" width="20" height="56" rx="4" fill="#e53935"/><rect x="-28" y="-10" width="56" height="20" rx="4" fill="#e53935"/></g>
    <!-- ベッド -->
    <ellipse cx="450" cy="640" rx="240" ry="22" fill="url(#g-shadow)"/>
    <rect x="232" y="520" width="14" height="120" fill="#9aa3ad"/><rect x="654" y="520" width="14" height="120" fill="#9aa3ad"/>
    <rect x="232" y="440" width="18" height="120" rx="8" fill="#b8c0c8"/>
    <rect x="240" y="500" width="420" height="46" rx="14" fill="#ffffff" stroke="#cfd6de" stroke-width="3"/>
    <rect x="240" y="500" width="420" height="46" rx="14" fill="url(#g-shade)"/>
    <rect x="250" y="486" width="120" height="30" rx="14" fill="#f4f7fb" stroke="#cfd6de" stroke-width="3"/>
    <rect x="440" y="508" width="220" height="38" rx="10" fill="#9ec9e8"/>
    <!-- ばんそうこうの台 -->
    <ellipse cx="820" cy="640" rx="100" ry="14" fill="url(#g-shadow)"/>
    <rect x="812" y="510" width="16" height="130" fill="#9aa3ad"/>
    <rect x="730" y="496" width="180" height="20" rx="8" fill="#d9dde2"/>
    <rect x="730" y="496" width="180" height="20" rx="8" fill="url(#g-shade)"/>`;
}

export default {
  id: "ambulance",
  title: "けがを たすけよう",
  say: "けがを たすけよう！",
  color: "#fff0c9",
  shadow: "#ecd08a",
  icon: uid => ambulance(uid),

  async start(api) {
    const { svg, input, audio } = api;
    const friend = shuffle(FRIENDS)[0];
    let scene = frag(street("park") + park(), svg);

    // 救急車（後ろのドアは開け閉めできる）
    const car = h("g", {}, svg);
    frag(place(ambulance("amb-game"), 0, 0, 460), car);
    const inside = h("rect", { x: 24, y: 55 * K, width: 77, height: 104 * K, rx: 6, fill: "#3a4656", opacity: 0 }, car);
    const door = frag(`
      <rect x="-46" y="${55 * K}" width="70" height="${104 * K}" rx="6" fill="#fdfdfd" stroke="#b8c0c8" stroke-width="3"/>
      <rect x="-46" y="${112 * K}" width="70" height="${12 * K}" fill="#e53935"/>
      <rect x="-46" y="${55 * K}" width="70" height="${104 * K}" rx="6" fill="url(#g-shade)"/>`, car, { opacity: 0 });
    const setX = x => car.setAttribute("transform", `translate(${x} ${CAR_Y})`);
    const setDoor = t => { inside.setAttribute("opacity", t); door.setAttribute("opacity", t); };
    const drive = async (from, to, ms, e) => {
      car.classList.add("moving");
      await tween(ms, t => setX(lerp(from, to, t)), e);
      car.classList.remove("moving");
    };
    const swap = markup => fadeSwap(svg, () => {
      scene.remove();
      scene = frag(markup, null);
      svg.insertBefore(scene, car);
    });

    const hurt = new Item(frag(animal(friend.kind, { mood: "sad", hurt: true, ground: true }), svg), 190, 460, 1);

    // 1. 救急車が来る
    setX(-600);
    audio.sfx.ambulance(3.2);
    audio.speak(`たいへん！ ${friend.name}が けがを しちゃった`);
    await drive(-600, STOP_X, 2600, ease.out);
    audio.sfx.pop();
    await tween(300, setDoor);

    // 2. おともだちをドラッグで乗せる
    api.step({
      say: `${friend.name}を きゅうきゅうしゃに のせて あげてね`,
      hint: { drag: { from: () => ({ x: hurt.x, y: hurt.y }), to: REAR } },
    });
    await input.dragOnce(hurt, [REAR], { snap: 180 });
    api.step({});
    await tween(250, t => hurt.set(hurt.x, hurt.y, 1 - t));
    hurt.el.remove();
    audio.sfx.ding();
    audio.speak("のったね！");
    await tween(300, t => setDoor(1 - t));

    // 3. サイレンボタンをタップ
    await wait(800);
    const btn = frag(button("ピーポー", "#e53935"), svg, { transform: `translate(${SIREN.x} ${SIREN.y})` });
    audio.sfx.pop();
    api.step({ say: "あかい ボタンを おして、 サイレンを ならそう！", hint: { tap: SIREN } });
    await input.tapOnce(btn, { pad: 30 });
    api.step({});
    btn.remove();
    audio.sfx.ambulance(4.5);
    audio.speak("ピーポーピーポー！ びょういんへ しゅっぱつ！");
    await wait(800);
    await drive(STOP_X, 1150, 2400, ease.in);

    // 4. 信号：赤で止まって、タッチで青にする
    await swap(street("sig") + signal());
    const lamp = h("circle", { cx: 770, cy: 262, r: 22, fill: "#ff3b30" }, scene);
    const glow = h("circle", { cx: 770, cy: 262, r: 40, fill: "#ff3b30", opacity: 0.25 }, scene);
    const light = (x, c) => {
      for (const el of [lamp, glow]) { el.setAttribute("cx", x); el.setAttribute("fill", c); }
    };
    setX(-600);
    audio.sfx.ambulance(2.6);
    await drive(-600, SIGNAL_STOP, 2400, ease.out);
    audio.speak("しんごうが あか。 とまれ！");
    await wait(1800);
    api.step({ say: "しんごうを タッチして、 あおに しよう", hint: { tap: SIGNAL } });
    await input.tapOnce(lamp, { pad: 120 });
    api.step({});
    light(710, "#ffc400");
    audio.sfx.click();
    await wait(600);
    light(650, "#2fd35a");
    audio.sfx.ding();
    audio.speak("あお！ すすめ！");
    audio.sfx.ambulance(3);
    await wait(600);
    await drive(SIGNAL_STOP, 1150, 2400, ease.in);

    // 5. 病院に着く
    await swap(street("hos", { farCity: false }) + hospital());
    setX(-600);
    audio.sfx.ambulance(2.8);
    await drive(-600, 60, 2400, ease.out);
    await tween(300, setDoor);
    const walk = new Item(frag(animal(friend.kind, { mood: "sad", hurt: true, ground: true }), svg), 122, CAR_Y + 112, 0);
    await tween(700, t => walk.set(lerp(122, 380, t), lerp(CAR_Y + 112, 470, t) - Math.sin(t * Math.PI) * 50, t), ease.out);
    audio.speak("びょういんに ついたよ");
    await wait(1200);
    await tween(900, t => walk.set(lerp(380, 700, t), lerp(470, 520, t), 1 - 0.6 * t));
    walk.el.remove();

    // 6. お部屋でばんそうこうを貼る
    await swap(room());
    car.setAttribute("visibility", "hidden");
    let pal = frag(animal(friend.kind, { mood: "sad", hurt: true }), scene, { transform: `translate(${BED.x} ${BED.y}) scale(${BED.s})` });
    const patch = new Item(frag(bandage(), scene), PATCH.x, PATCH.y, 0);
    audio.sfx.pop();
    await tween(300, t => patch.set(PATCH.x, PATCH.y, 1.3 * t), ease.back);
    const spot = { x: BED.x + HURT.x * BED.s, y: BED.y + HURT.y * BED.s };
    api.step({
      say: "ばんそうこうを いたい ところに はって あげてね",
      hint: { drag: { from: () => ({ x: patch.x, y: patch.y }), to: spot } },
    });
    await input.dragOnce(patch, [spot], { pad: 50, snap: 150 });
    api.step({});
    patch.el.remove();
    pal.remove();
    pal = frag(animal(friend.kind, { bandage: true }), scene, { transform: `translate(${BED.x} ${BED.y}) scale(${BED.s})` });
    audio.sfx.click();
    audio.sfx.ding();
    sparkle(svg, spot.x, spot.y);
    audio.speak("ぺたっ！ いたいの いたいの とんでいけー！");
    await wait(2600);
    await tween(500, t => pal.setAttribute("transform", `translate(${BED.x} ${BED.y - Math.sin(t * Math.PI) * 60}) scale(${BED.s})`));
    sparkle(svg, BED.x, BED.y - 40);
    audio.speak(`${friend.name} げんきに なったよ！ ありがとう！`);
    await wait(2800);
    api.done();
  },
};
