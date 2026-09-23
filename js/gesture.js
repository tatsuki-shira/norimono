// タップとドラッグの共通処理
// 「決まった場所」だけが反応する。当たり判定は見た目より pad の分だけ広い
import { tween, ease, lerp } from "./fx.js";

// ドラッグできるもの。el は原点が中心になるように描いた <g>
export class Item {
  constructor(el, x, y, s = 1) {
    this.el = el;
    this.homeX = x;
    this.homeY = y;
    this.set(x, y, s);
  }
  set(x, y, s = this.s) {
    this.x = x; this.y = y; this.s = s;
    this.el.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
  }
}

export function createInput(svg, { onAny, onMiss, sfx } = {}) {
  let regs = [];
  let active = null; // いま動かしているもの（最初の指だけ使う）

  const toSvg = (x, y) => new DOMPoint(x, y).matrixTransform(svg.getScreenCTM().inverse());
  const inside = (p, r) => {
    const b = r.el.getBoundingClientRect();
    const a = toSvg(b.left, b.top), c = toSvg(b.right, b.bottom);
    return p.x >= a.x - r.pad && p.x <= c.x + r.pad && p.y >= a.y - r.pad && p.y <= c.y + r.pad;
  };

  function down(e) {
    onAny?.();
    if (active) return;
    const p = toSvg(e.clientX, e.clientY);
    let hit = null;
    for (let i = regs.length - 1; i >= 0; i--) {
      if (inside(p, regs[i])) { hit = regs[i]; break; }
    }
    if (!hit) { onMiss?.(p); return; }
    e.preventDefault();
    if (hit.kind === "tap") { hit.onHit(p); return; }
    try { svg.setPointerCapture(e.pointerId); } catch {}
    active = { reg: hit, id: e.pointerId };
    hit.onStart?.(p);
  }
  function move(e) {
    if (!active || e.pointerId !== active.id) return;
    active.reg.onMove?.(toSvg(e.clientX, e.clientY));
  }
  function up(e) {
    if (!active || e.pointerId !== active.id) return;
    const r = active.reg;
    active = null;
    r.onEnd?.(toSvg(e.clientX, e.clientY));
  }

  svg.addEventListener("pointerdown", down);
  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", up);
  svg.addEventListener("pointercancel", up);

  const add = r => {
    regs.push(r);
    return () => {
      regs = regs.filter(x => x !== r);
      if (active?.reg === r) active = null;
    };
  };

  return {
    toSvg,

    // el をタップしたら解決する
    tapOnce(el, { pad = 30 } = {}) {
      return new Promise(res => {
        const rm = add({ kind: "tap", el, pad, onHit(p) { rm(); res(p); } });
      });
    },

    // item を targets（{x, y} の配列、または配列を返す関数）のどれかに置いたら解決する
    // 近くで離せば吸い付き、遠ければ元の場所に戻る
    dragOnce(item, targets, { pad = 40, snap = 160, onSnap } = {}) {
      return new Promise(res => {
        let dx = 0, dy = 0, s0 = item.s;
        const rm = add({
          kind: "drag", el: item.el, pad,
          onStart(p) {
            dx = p.x - item.x; dy = p.y - item.y; s0 = item.s;
            item.el.parentNode.appendChild(item.el); // いちばん手前に
            item.set(item.x, item.y, s0 * 1.12);
            sfx?.pop();
          },
          onMove(p) { item.set(p.x - dx, p.y - dy); },
          onEnd() {
            item.set(item.x, item.y, s0);
            const list = typeof targets === "function" ? targets() : targets;
            let best = null, bd = Infinity;
            for (const t of list) {
              const d = Math.hypot(t.x - item.x, t.y - item.y);
              if (d < bd) { bd = d; best = t; }
            }
            const x0 = item.x, y0 = item.y;
            if (best && bd <= snap) {
              rm();
              onSnap?.(best);
              tween(180, t => item.set(lerp(x0, best.x, t), lerp(y0, best.y, t)), ease.out).then(() => res(best));
            } else {
              sfx?.boing();
              tween(450, t => item.set(lerp(x0, item.homeX, t), lerp(y0, item.homeY, t)), ease.back);
            }
          },
        });
      });
    },

    // ずっと触っていられるもの（ホースなど）。戻り値の関数で解除
    drag(el, { pad = 40, onStart, onMove, onEnd }) {
      return add({ kind: "drag", el, pad, onStart, onMove, onEnd });
    },

    clear() { regs = []; active = null; },

    destroy() {
      regs = []; active = null;
      svg.removeEventListener("pointerdown", down);
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);
      svg.removeEventListener("pointercancel", up);
    },
  };
}
