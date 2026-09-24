// アニメーションの道具と演出（ヒントの手、光る輪、キラキラ、紙吹雪）
export const NS = "http://www.w3.org/2000/svg";

// ゲームを抜けたら session.alive が false になり、待っている処理はそこで止まる
let session = { alive: true };
export function newSession() {
  session.alive = false;
  session = { alive: true };
  return session;
}

export function h(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

// SVG の文字列を <g> にして parent に入れる
export function frag(markup, parent, attrs = {}) {
  const g = h("g", attrs, parent);
  g.innerHTML = markup;
  return g;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  linear: t => t,
  out: t => 1 - (1 - t) ** 3,
  in: t => t * t * t,
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: t => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
};

export function tween(ms, fn, e = ease.inOut) {
  const s = session;
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      if (!s.alive) return;
      const t = Math.min(1, (now - t0) / ms);
      fn(e(t));
      if (t < 1) requestAnimationFrame(step);
      else res();
    };
    requestAnimationFrame(step);
  });
}

export function wait(ms) {
  const s = session;
  return new Promise(res => setTimeout(() => { if (s.alive) res(); }, ms));
}

export const clamp01 = v => Math.max(0, Math.min(1, v));

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 白くフェードして、fn() で場面を入れ替える
export async function fadeSwap(svg, fn, ms = 400) {
  const cover = h("rect", { x: -1000, y: -1000, width: 3000, height: 3000, fill: "#fff", opacity: 0 }, svg);
  await tween(ms, t => cover.setAttribute("opacity", t));
  fn();
  svg.appendChild(cover); // 新しい場面より手前に
  await tween(ms, t => cover.setAttribute("opacity", 1 - t));
  cover.remove();
}

/* ---------- ヒント ---------- */
// 値が関数なら呼ぶ（動くものの場所を毎回取り直すため）
const pt = v => (typeof v === "function" ? v() : v);

export function ring(svg, x, y, r = 80) {
  const c = h("circle", { cx: x, cy: y, r, class: "fx-ring" }, svg);
  setTimeout(() => c.remove(), 1500);
}

// 触ってほしい場所を光らせる
export function glowHint(svg, hint) {
  const p = hint.tap ? pt(hint.tap) : pt(hint.drag.from);
  if (p) ring(svg, p.x, p.y);
}

// 👆 の手でやり方を見せる
export async function hand(svg, hint) {
  const el = h("text", { class: "fx-hand", "font-size": 110, "text-anchor": "middle" }, svg);
  el.textContent = "👆";
  const put = (x, y) => el.setAttribute("transform", `translate(${x + 8} ${y + 100})`);
  if (hint.tap) {
    const p = pt(hint.tap);
    if (!p) { el.remove(); return; }
    ring(svg, p.x, p.y);
    for (let i = 0; i < 2; i++) {
      await tween(280, t => put(p.x, p.y + 30 * (1 - t)), ease.out);
      await tween(280, t => put(p.x, p.y + 30 * t));
    }
  } else {
    const a = pt(hint.drag.from), b = pt(hint.drag.to);
    if (!a || !b) { el.remove(); return; }
    ring(svg, a.x, a.y);
    for (let i = 0; i < 2; i++) {
      put(a.x, a.y);
      await wait(300);
      await tween(1100, t => put(lerp(a.x, b.x, t), lerp(a.y, b.y, t)));
      await wait(300);
    }
  }
  el.remove();
}

/* ---------- 演出 ---------- */
export function sparkle(svg, x, y) {
  const colors = ["#ffd54a", "#ff8a65", "#4fc3f7", "#81c784", "#f06292"];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, c = h("circle", { r: 9, fill: colors[i % 5], cx: x, cy: y, class: "fx-dot" }, svg);
    tween(600, t => {
      c.setAttribute("cx", x + Math.cos(a) * 110 * t);
      c.setAttribute("cy", y + Math.sin(a) * 110 * t);
      c.setAttribute("opacity", 1 - t);
    }, ease.out).then(() => c.remove());
  }
}

export function puff(svg, x, y) {
  for (let i = 0; i < 5; i++) {
    const c = h("circle", { r: 26, fill: "#b0b6bd", cx: x + (i - 2) * 16, cy: y, class: "fx-dot" }, svg);
    tween(900, t => {
      c.setAttribute("cy", y - 90 * t - i * 6);
      c.setAttribute("r", 26 + 20 * t);
      c.setAttribute("opacity", 0.9 * (1 - t));
    }, ease.out).then(() => c.remove());
  }
}

export async function celebrate(root, audio) {
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#ff6b6b", "#ffd54a", "#4fc3f7", "#81c784", "#ba68c8", "#ff8a65"];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.8 + "s";
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
    p.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
    p.style.setProperty("--x", Math.random() * 30 - 15 + "vw");
    box.append(p);
  }
  const yay = document.createElement("div");
  yay.className = "yay";
  yay.textContent = "できたね！";
  box.append(yay);
  root.append(box);

  audio.sfx.fanfare();
  audio.speak("できたね！ すごい すごい！");
  setTimeout(() => audio.sfx.clap(), 700);
  await wait(3600);
  box.remove();
}
