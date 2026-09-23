// 🚑 けがを たすけよう：くまさんを救急車にドラッグ → サイレンボタンをタップ → 病院へ
import { frag, h, tween, wait, lerp, ease, sparkle } from "../fx.js";
import { Item } from "../gesture.js";
import { ambulance, animal, button, place, sky, cloud } from "../art.js";

const CAR_Y = 470;
const STOP_X = 470;
const K = 460 / 420;                          // 救急車の絵の拡大率
const REAR = { x: STOP_X + 62, y: CAR_Y + 112 }; // 後ろのドア
const SIREN = { x: 700, y: 300 };

const ground = () => `
  ${sky("amb-sky")}
  ${cloud(420, 100)}${cloud(760, 60, 0.7)}
  <rect x="-1000" y="520" width="3000" height="1300" fill="#8fd16a"/>
  <rect x="-1000" y="610" width="3000" height="110" fill="#6b7078"/>
  <line x1="-1000" y1="665" x2="2000" y2="665" stroke="#fff" stroke-width="8" stroke-dasharray="60 40"/>`;

const park = () => `
  <rect x="48" y="360" width="24" height="170" fill="#8b6b4a"/>
  <circle cx="60" cy="330" r="80" fill="#5dbb63"/><circle cx="10" cy="370" r="50" fill="#4fa856"/>`;

const hospital = () => `
  <rect x="470" y="170" width="460" height="440" fill="#fff" stroke="#cfd6de" stroke-width="5"/>
  <rect x="455" y="150" width="490" height="30" rx="8" fill="#9ec9e8"/>
  <rect x="680" y="200" width="40" height="110" rx="6" fill="#e53935"/>
  <rect x="645" y="235" width="110" height="40" rx="6" fill="#e53935"/>
  ${[510, 790].map(x => [340, 420].map(y => `<rect x="${x}" y="${y}" width="100" height="56" rx="6" fill="#bfe6ff"/>`).join("")).join("")}
  <rect x="650" y="470" width="100" height="140" rx="6" fill="#bfe6ff" stroke="#9aa3ad" stroke-width="4"/>
  <line x1="700" y1="470" x2="700" y2="610" stroke="#9aa3ad" stroke-width="4"/>`;

export default {
  id: "ambulance",
  title: "けがを たすけよう",
  say: "けがを たすけよう！",
  color: "#fff0c9",
  shadow: "#ecd08a",
  icon: uid => ambulance(uid),

  async start(api) {
    const { svg, input, audio } = api;
    frag(ground(), svg);
    const sceneA = frag(park(), svg);

    // 救急車（後ろのドアは開け閉めできる）
    const car = h("g", {}, svg);
    frag(place(ambulance("amb-game"), 0, 0, 460), car);
    const inside = h("rect", { x: 24, y: 55 * K, width: 77, height: 104 * K, rx: 6, fill: "#3a4656", opacity: 0 }, car);
    const door = frag(`
      <rect x="-46" y="${55 * K}" width="70" height="${104 * K}" rx="6" fill="#fdfdfd" stroke="#b8c0c8" stroke-width="3"/>
      <rect x="-46" y="${112 * K}" width="70" height="${12 * K}" fill="#e53935"/>`, car, { opacity: 0 });
    const setX = x => car.setAttribute("transform", `translate(${x} ${CAR_Y})`);
    const setDoor = t => { inside.setAttribute("opacity", t); door.setAttribute("opacity", t); };
    const drive = async (from, to, ms, e) => {
      car.classList.add("moving");
      await tween(ms, t => setX(lerp(from, to, t)), e);
      car.classList.remove("moving");
    };

    const bear = new Item(frag(animal("kuma", { mood: "sad", bandage: true }), svg), 190, 460, 1);

    // 1. 救急車が来る
    setX(-600);
    audio.sfx.ambulance(3.2);
    await drive(-600, STOP_X, 2600, ease.out);
    audio.sfx.pop();
    await tween(300, setDoor);

    // 2. くまさんをドラッグで乗せる
    api.step({
      say: "くまさんが けがを しちゃった。 きゅうきゅうしゃに のせて あげてね",
      hint: { drag: { from: () => ({ x: bear.x, y: bear.y }), to: REAR } },
    });
    await input.dragOnce(bear, [REAR], { snap: 180 });
    api.step({});
    await tween(250, t => bear.set(bear.x, bear.y, 1 - t));
    bear.el.remove();
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

    // 4. 病院に着く
    const cover = h("rect", { x: -1000, y: -1000, width: 3000, height: 3000, fill: "#fff", opacity: 0 }, svg);
    await tween(400, t => cover.setAttribute("opacity", t));
    sceneA.remove();
    svg.insertBefore(frag(hospital(), null), car);
    setX(-600);
    await tween(400, t => cover.setAttribute("opacity", 1 - t));
    cover.remove();
    audio.sfx.ambulance(2.8);
    await drive(-600, 60, 2400, ease.out);

    await tween(300, setDoor);
    const happy = new Item(frag(animal("kuma", { bandage: true }), svg), 60 + 62, CAR_Y + 112, 0);
    await tween(700, t => happy.set(lerp(122, 380, t), lerp(CAR_Y + 112, 470, t), t), ease.out);
    audio.sfx.ding();
    sparkle(svg, 380, 470);
    audio.speak("くまさん げんきに なったよ！ ありがとう！");
    await wait(2800);
    api.done();
  },
};
