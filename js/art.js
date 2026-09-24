// イラスト（SVG）。乗り物はすべて右向き

// どの絵からも使う、光と影のグラデーション（main.js がページに1回だけ入れる）
//   g-shade：上が明るく下が暗い（車体の丸み）  g-sphere：ボールのような丸み
//   g-cyl：柱の丸み  g-glass：ガラスの映りこみ  g-shadow：足もとの影
export const SHARED_DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="g-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/>
    </linearGradient>
    <radialGradient id="g-sphere" cx=".38" cy=".3" r=".75">
      <stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".8" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".16"/>
    </radialGradient>
    <linearGradient id="g-cyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity=".35"/>
      <stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/>
    </linearGradient>
    <linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="g-shadow">
      <stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".6" stop-color="#000" stop-opacity=".15"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs></svg>`;

// 足もとの影（(cx, cy) が地面）
export const shadow = (cx, cy, rx, ry = rx * 0.14) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g-shadow)"/>`;

export const wheel = (cx, cy, r) => `
  <g class="wheel">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#23262b"/>
    <circle cx="${cx}" cy="${cy}" r="${r * .5}" fill="#c9ced6"/>
    <circle cx="${cx}" cy="${cy}" r="${r * .5}" fill="url(#g-sphere)"/>
    <rect x="${cx - 2}" y="${cy - r * .5}" width="4" height="${r}" fill="#7d858f"/>
    <rect x="${cx - r * .5}" y="${cy - 2}" width="${r}" height="4" fill="#7d858f"/>
  </g>`;

// <svg viewBox="0 0 W H"> の文字列を、シーンの (x, y) に幅 w で置けるようにする
export function place(svg, x, y, w) {
  const [, vw, vh] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  return svg.replace("<svg ", `<svg x="${x}" y="${y}" width="${w}" height="${(w * vh) / vw}" `);
}

/* ---------- N700系 ---------- */
const NOSE = "M10,60 L250,60 C318,60 362,92 400,130 Q410,146 394,152 L10,152 Z";

export function n700(uid, twoCars) {
  const windows = (x0, x1) => {
    let h = "";
    for (let x = x0; x <= x1; x += 26) h += `<rect x="${x}" y="80" width="16" height="15" rx="4" fill="#2d3a4a"/><rect x="${x}" y="80" width="16" height="15" rx="4" fill="url(#g-glass)"/>`;
    return h;
  };
  const bogies = xs => xs.map(x => `
    <rect x="${x}" y="150" width="70" height="14" rx="6" fill="#4a4f57"/>
    <circle cx="${x + 16}" cy="164" r="8" fill="#2b2f35"/>
    <circle cx="${x + 54}" cy="164" r="8" fill="#2b2f35"/>`).join("");
  const stripes = (x, w) => `
    <rect x="${x}" y="118" width="${w}" height="12" fill="#1f5fbf"/>
    <rect x="${x}" y="134" width="${w}" height="4" fill="#1f5fbf"/>
    <rect x="${x}" y="142" width="${w}" height="9" fill="#d5dbe2"/>`;

  const lead = `
    ${bogies([40, 250])}
    <defs><clipPath id="nose-${uid}"><path d="${NOSE}"/></clipPath></defs>
    <g clip-path="url(#nose-${uid})">
      <rect x="0" y="50" width="420" height="110" fill="#fbfcfd"/>
      ${stripes(0, 420)}
      <rect x="0" y="58" width="420" height="96" fill="url(#g-shade)"/>
    </g>
    <path d="${NOSE}" fill="none" stroke="#98a2ad" stroke-width="3"/>
    ${windows(30, 220)}
    <rect x="244" y="72" width="16" height="44" rx="3" fill="none" stroke="#b8c0c8" stroke-width="2"/>
    <path d="M292,72 C318,76 338,88 354,104 L324,104 C312,92 302,82 292,79 Z" fill="#2d3a4a"/>
    <path d="M292,72 C318,76 338,88 354,104 L324,104 C312,92 302,82 292,79 Z" fill="url(#g-glass)"/>
    <ellipse cx="386" cy="137" rx="8" ry="4" fill="#ffe27a"/>`;

  if (!twoCars) {
    return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
      ${shadow(210, 172, 200, 9)}<rect x="0" y="170" width="420" height="6" fill="#8a8f98"/>${lead}</svg>`;
  }
  const middle = `
    ${bogies([40, 270])}
    <rect x="10" y="60" width="380" height="92" rx="8" fill="#fbfcfd" stroke="#98a2ad" stroke-width="3"/>
    ${stripes(11.5, 377)}
    <rect x="11.5" y="61.5" width="377" height="89" rx="7" fill="url(#g-shade)"/>
    ${windows(40, 340)}
    <rect x="388" y="76" width="24" height="64" fill="#7d858f"/>`;
  return `<svg viewBox="0 0 820 200" xmlns="http://www.w3.org/2000/svg">
    ${shadow(410, 172, 410, 10)}${middle}<g transform="translate(400,0)">${lead}</g></svg>`;
}

/* ---------- はたらく車 ---------- */
export function fireTruck() {
  let rungs = "";
  for (let x = 45; x < 280; x += 22) rungs += `<rect x="${x}" y="50" width="4" height="14" fill="#9aa3ad"/>`;
  return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
    ${shadow(210, 186, 205, 12)}
    <rect x="20" y="70" width="285" height="88" rx="10" fill="#e53935"/>
    <rect x="40" y="80" width="75" height="32" rx="5" fill="#c62828"/>
    <rect x="125" y="80" width="75" height="32" rx="5" fill="#c62828"/>
    <rect x="210" y="80" width="75" height="32" rx="5" fill="#c62828"/>
    <path d="M300,55 L360,55 Q380,55 388,75 L402,112 L402,158 L300,158 Z" fill="#e53935"/>
    <path d="M318,68 L356,68 Q368,68 373,80 L383,106 L318,106 Z" fill="#bfe6ff" stroke="#8b1d1b" stroke-width="3"/>
    <path d="M318,68 L356,68 Q368,68 373,80 L383,106 L318,106 Z" fill="url(#g-glass)"/>
    <rect x="20" y="120" width="382" height="8" fill="#fff"/>
    <rect x="20" y="70" width="285" height="88" rx="10" fill="url(#g-shade)"/>
    <path d="M300,55 L360,55 Q380,55 388,75 L402,112 L402,158 L300,158 Z" fill="url(#g-shade)"/>
    <rect x="60" y="60" width="10" height="12" fill="#9aa3ad"/>
    <rect x="245" y="60" width="10" height="12" fill="#9aa3ad"/>
    <rect x="30" y="48" width="255" height="18" rx="4" fill="none" stroke="#cfd4da" stroke-width="5"/>
    ${rungs}
    <rect class="beacon" x="318" y="42" width="32" height="14" rx="5" fill="#ff5252"/>
    <rect x="392" y="142" width="18" height="14" rx="4" fill="#9aa3ad"/>
    <circle cx="396" cy="126" r="6" fill="#ffe27a"/>
    ${wheel(100, 160, 26)}${wheel(330, 160, 26)}
  </svg>`;
}

export const AMB_BODY = "M20,55 Q20,45 30,45 L300,45 Q318,45 330,60 L372,100 Q400,106 400,125 L400,150 Q400,158 392,158 L28,158 Q20,158 20,150 Z";

export function ambulance(uid) {
  return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="amb-${uid}"><path d="${AMB_BODY}"/></clipPath></defs>
    ${shadow(210, 184, 205, 12)}
    <path d="${AMB_BODY}" fill="#fdfdfd"/>
    <g clip-path="url(#amb-${uid})"><rect x="0" y="112" width="420" height="12" fill="#e53935"/></g>
    <path d="${AMB_BODY}" fill="url(#g-shade)"/>
    <path d="${AMB_BODY}" fill="none" stroke="#b8c0c8" stroke-width="3"/>
    <path d="M305,60 L326,62 L360,100 L305,100 Z" fill="#bfe6ff" stroke="#7a8691" stroke-width="3"/>
    <path d="M305,60 L326,62 L360,100 L305,100 Z" fill="url(#g-glass)"/>
    <rect x="228" y="60" width="62" height="38" rx="5" fill="#bfe6ff" stroke="#7a8691" stroke-width="3"/>
    <rect x="228" y="60" width="62" height="38" rx="5" fill="url(#g-glass)"/>
    <rect x="115" y="62" width="14" height="42" rx="2" fill="#e53935"/>
    <rect x="101" y="76" width="42" height="14" rx="2" fill="#e53935"/>
    <line x1="215" y1="52" x2="215" y2="156" stroke="#d0d5db" stroke-width="2"/>
    <rect class="beacon" x="262" y="33" width="36" height="13" rx="5" fill="#ff3b3b"/>
    <rect class="beacon" x="30" y="33" width="26" height="13" rx="5" fill="#ff3b3b" style="animation-delay:-.22s"/>
    <circle cx="394" cy="120" r="6" fill="#ffe27a"/>
    ${wheel(90, 160, 24)}${wheel(322, 160, 24)}
  </svg>`;
}

export function policeCar(uid) {
  const body = "M20,112 Q20,100 34,98 L108,96 L148,62 Q156,56 170,56 L270,56 Q284,56 294,66 L326,96 L386,102 Q402,104 402,120 L402,146 Q402,156 392,156 L28,156 Q20,156 20,146 Z";
  return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="pol-${uid}"><path d="${body}"/></clipPath></defs>
    ${shadow(210, 180, 205, 12)}
    <path d="${body}" fill="#1f2228"/>
    <g clip-path="url(#pol-${uid})"><rect x="112" y="40" width="210" height="92" fill="#fbfcfd"/></g>
    <path d="${body}" fill="url(#g-shade)"/>
    <path d="${body}" fill="none" stroke="#1f2228" stroke-width="3"/>
    <path d="M162,68 L206,68 L206,96 L130,96 Z" fill="#bfe6ff" stroke="#7a8691" stroke-width="2"/>
    <path d="M216,68 L266,68 Q275,68 281,74 L303,96 L216,96 Z" fill="#bfe6ff" stroke="#7a8691" stroke-width="2"/>
    <path d="M162,68 L206,68 L206,96 L130,96 Z M216,68 L266,68 Q275,68 281,74 L303,96 L216,96 Z" fill="url(#g-glass)"/>
    <line x1="211" y1="98" x2="211" y2="130" stroke="#c3c9d0" stroke-width="2"/>
    <circle cx="258" cy="114" r="9" fill="#f2c230"/>
    <rect class="beacon" x="182" y="42" width="56" height="14" rx="5" fill="#ff3b3b"/>
    <circle cx="394" cy="116" r="6" fill="#ffe27a"/>
    ${wheel(95, 156, 24)}${wheel(322, 156, 24)}
  </svg>`;
}

/* ---------- 線路 ---------- */
// x1〜x2 の線路（y が線路の中心）
export function track(x1, x2, y) {
  let s = "";
  for (let x = x1 + 6; x < x2 - 8; x += 26) s += `<rect x="${x}" y="${y - 22}" width="14" height="44" rx="3" fill="#8b6b4a"/>`;
  return s + `
    <rect x="${x1}" y="${y - 16}" width="${x2 - x1}" height="7" rx="3" fill="#7d858f"/>
    <rect x="${x1}" y="${y + 10}" width="${x2 - x1}" height="7" rx="3" fill="#7d858f"/>
    <rect x="${x1}" y="${y - 16}" width="${x2 - x1}" height="2.5" fill="#d7dce2"/>
    <rect x="${x1}" y="${y + 10}" width="${x2 - x1}" height="2.5" fill="#d7dce2"/>`;
}

export function trackIcon() {
  return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
    ${track(0, 150, 150)}${track(270, 420, 150)}
    <rect x="152" y="124" width="116" height="52" rx="8" fill="none" stroke="#e08a2c" stroke-width="5" stroke-dasharray="12 8"/>
    <path d="M210,84 L210,110 M198,98 L210,112 L222,98" fill="none" stroke="#e08a2c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(210,50)">${track(-58, 58, 0)}</g>
  </svg>`;
}

/* ---------- どうぶつ（中心が原点、顔の半径は約52） ---------- */
// あそびに出てくるおともだち
export const FRIENDS = [
  { kind: "kuma", name: "くまさん" },
  { kind: "usagi", name: "うさぎさん" },
  { kind: "neko", name: "ねこさん" },
  { kind: "inu", name: "いぬさん" },
  { kind: "panda", name: "パンダさん" },
  { kind: "buta", name: "ぶたさん" },
];

// けがの場所（ばんそうこうを貼るところ）。顔の中心からのずれ
export const HURT = { x: 24, y: -34 };

const ANIMALS = {
  kuma:  { c: "#b07d52", ear: "#8a5a33", inner: "#e8c19a", muzzle: "#f0d6b8", nose: "#3a2a20" },
  usagi: { c: "#fafafa", ear: "#fafafa", inner: "#ffb6c8", muzzle: "#ffffff", nose: "#ff8fab" },
  neko:  { c: "#f5b86b", ear: "#f5b86b", inner: "#ffd9a8", muzzle: "#fff1dc", nose: "#e0736b" },
  inu:   { c: "#ecd2ab", ear: "#a0724a", inner: "#a0724a", muzzle: "#fff6ea", nose: "#3a2a20" },
  panda: { c: "#fafafa", ear: "#2b2b2b", inner: "#2b2b2b", muzzle: "#ffffff", nose: "#2b2b2b" },
  buta:  { c: "#ffc9d4", ear: "#ffb3c3", inner: "#ff94ab", muzzle: "#ffa3b8", nose: "#d9607e" },
};

export function animal(kind, { mood = "happy", bandage = false, hurt = false, ground = false } = {}) {
  const a = ANIMALS[kind];
  const line = kind === "usagi" || kind === "panda" ? `stroke="#d8d8d8" stroke-width="3"` : "";
  let ears = "", front = "";
  if (kind === "kuma" || kind === "panda") ears = `
    <circle cx="-38" cy="-40" r="20" fill="${a.ear}"/><circle cx="38" cy="-40" r="20" fill="${a.ear}"/>
    <circle cx="-38" cy="-40" r="10" fill="${a.inner}"/><circle cx="38" cy="-40" r="10" fill="${a.inner}"/>`;
  if (kind === "usagi") ears = `
    <ellipse cx="-20" cy="-75" rx="15" ry="42" fill="${a.ear}" ${line}/><ellipse cx="20" cy="-75" rx="15" ry="42" fill="${a.ear}" ${line}/>
    <ellipse cx="-20" cy="-72" rx="7" ry="30" fill="${a.inner}"/><ellipse cx="20" cy="-72" rx="7" ry="30" fill="${a.inner}"/>`;
  if (kind === "neko") ears = `
    <path d="M-48,-20 L-40,-70 L-8,-46 Z" fill="${a.ear}"/><path d="M48,-20 L40,-70 L8,-46 Z" fill="${a.ear}"/>
    <path d="M-40,-32 L-36,-58 L-20,-44 Z" fill="${a.inner}"/><path d="M40,-32 L36,-58 L20,-44 Z" fill="${a.inner}"/>`;
  if (kind === "buta") ears = `
    <path d="M-46,-24 L-50,-66 L-14,-48 Z" fill="${a.ear}"/><path d="M46,-24 L50,-66 L14,-48 Z" fill="${a.ear}"/>
    <path d="M-40,-34 L-43,-56 L-24,-46 Z" fill="${a.inner}"/><path d="M40,-34 L43,-56 L24,-46 Z" fill="${a.inner}"/>`;
  // いぬのたれ耳は顔の手前に描く
  if (kind === "inu") front = `
    <ellipse cx="-47" cy="-6" rx="16" ry="34" transform="rotate(18 -47 -6)" fill="${a.ear}"/>
    <ellipse cx="47" cy="-6" rx="16" ry="34" transform="rotate(-18 47 -6)" fill="${a.ear}"/>`;

  const sad = mood === "sad", panda = kind === "panda";
  const patches = panda
    ? `<ellipse cx="-19" cy="-4" rx="14" ry="18" transform="rotate(25 -19 -4)" fill="#2b2b2b"/>
       <ellipse cx="19" cy="-4" rx="14" ry="18" transform="rotate(-25 19 -4)" fill="#2b2b2b"/>`
    : "";
  const lid = panda ? "#fff" : "#2b2b2b";
  const eyes = sad
    ? `<path d="M-27,-4 Q-18,-12 -9,-4" fill="none" stroke="${lid}" stroke-width="4" stroke-linecap="round"/>
       <path d="M9,-4 Q18,-12 27,-4" fill="none" stroke="${lid}" stroke-width="4" stroke-linecap="round"/>
       <path d="M-22,4 q-7,13 0,17 q7,-4 0,-17Z" fill="#6ec6ff"/>`
    : panda
      ? `<circle cx="-18" cy="-6" r="7" fill="#fff"/><circle cx="18" cy="-6" r="7" fill="#fff"/>
         <circle cx="-17" cy="-6" r="4" fill="#2b2b2b"/><circle cx="19" cy="-6" r="4" fill="#2b2b2b"/>`
      : `<circle cx="-18" cy="-6" r="6.5" fill="#2b2b2b"/><circle cx="18" cy="-6" r="6.5" fill="#2b2b2b"/>
         <circle cx="-16" cy="-8" r="2" fill="#fff"/><circle cx="20" cy="-8" r="2" fill="#fff"/>`;
  // ぶたは鼻が大きいので、口を少し下に
  const my = kind === "buta" ? 12 : 0;
  const mouth = sad
    ? `<path d="M-10,${34 + my} Q0,${26 + my} 10,${34 + my}" fill="none" stroke="#3a2a20" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M-11,${27 + my} Q0,${39 + my} 11,${27 + my}" fill="none" stroke="#3a2a20" stroke-width="3.5" stroke-linecap="round"/>`;
  const nose = kind === "buta"
    ? `<ellipse cx="-8" cy="18" rx="4" ry="6" fill="${a.nose}"/><ellipse cx="8" cy="18" rx="4" ry="6" fill="${a.nose}"/>`
    : `<ellipse cx="0" cy="12" rx="7" ry="5" fill="${a.nose}"/>`;
  const whiskers = kind === "neko"
    ? `<path d="M-30,18 L-56,12 M-30,24 L-56,28 M30,18 L56,12 M30,24 L56,28" stroke="#9c6b3f" stroke-width="2.5" stroke-linecap="round"/>`
    : "";
  const scrape = hurt && !bandage
    ? `<g transform="translate(${HURT.x},${HURT.y}) rotate(-25)">
         <ellipse rx="20" ry="11" fill="#ff9a9a" opacity=".7"/>
         <path d="M-12,-3 L12,-3 M-9,4 L9,4" stroke="#e5484d" stroke-width="3.5" stroke-linecap="round"/>
       </g>`
    : "";
  const band = bandage
    ? `<g transform="translate(${HURT.x},${HURT.y}) rotate(-25)">
         <rect x="-28" y="-10" width="56" height="20" rx="8" fill="#fff4e0" stroke="#e0c9a6" stroke-width="2"/>
         <rect x="-9" y="-10" width="18" height="20" fill="#f3dfc1"/>
       </g>`
    : "";

  return `
    ${ground ? shadow(0, 104, 52, 11) : ""}
    <ellipse cx="0" cy="74" rx="40" ry="32" fill="${a.c}" ${line}/>
    <ellipse cx="0" cy="74" rx="40" ry="32" fill="url(#g-sphere)"/>
    ${ears}
    <circle cx="0" cy="0" r="52" fill="${a.c}" ${line}/>
    <ellipse cx="0" cy="20" rx="24" ry="17" fill="${a.muzzle}"/>
    <circle cx="-32" cy="16" r="9" fill="#ffb3b3" opacity=".7"/><circle cx="32" cy="16" r="9" fill="#ffb3b3" opacity=".7"/>
    <circle cx="0" cy="0" r="52" fill="url(#g-sphere)"/>
    ${patches}${eyes}${nose}
    ${mouth}${whiskers}${front}${scrape}${band}`;
}

/* ---------- けしき ---------- */
// 富士山（(x, y) が裾の真ん中）
export const fuji = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <defs><linearGradient id="fuji-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5877b3"/><stop offset="1" stop-color="#a9bfdf"/>
    </linearGradient></defs>
    <path d="M-380,0 L-110,-300 Q0,-326 110,-300 L380,0 Z" fill="url(#fuji-g)"/>
    <path d="M0,-313 Q60,-311 110,-300 L380,0 L120,0 Z" fill="#000" opacity=".08"/>
    <path d="M-110,-300 Q0,-326 110,-300 L160,-245 L122,-228 L92,-254 L52,-224 L12,-250 L-28,-221 L-68,-252 L-108,-226 L-160,-245 Z" fill="#fff"/>
  </g>`;

// 電柱（架線の柱）。(x, y) が根もと
export const pole = (x, y) => `
  <rect x="${x - 5}" y="${y - 230}" width="10" height="230" fill="#9aa3ad"/>
  <rect x="${x - 5}" y="${y - 230}" width="10" height="230" fill="url(#g-cyl)"/>
  <rect x="${x - 5}" y="${y - 222}" width="64" height="8" fill="#9aa3ad"/>`;

// 鉄橋（トラス）。y が線路の中心
// 奥側の骨組みは新幹線の後ろ、手前側は新幹線の前に描くと奥行きが出る
function truss(x1, x2, y, color, width, lift = 0) {
  const top = y - 190 - lift, base = y - 10 - lift, n = Math.round((x2 - x1) / 150), w = (x2 - x1) / n;
  let d = `M${x1},${base} L${x1 + w / 2},${top} L${x2 - w / 2},${top} L${x2},${base}`;
  for (let i = 0; i < n; i++) {
    const a = x1 + i * w;
    d += ` M${a},${base} L${a + w / 2},${top} L${a + w},${base}`;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`;
}

export function bridge(x1, x2, y) {
  const n = Math.round((x2 - x1) / 150), w = (x2 - x1) / n;
  let piers = "";
  for (let i = 0; i <= n; i += 2) {
    const a = Math.min(x1 + i * w, x2);
    piers += `<rect x="${a - 22}" y="${y + 20}" width="44" height="260" fill="#9aa0a8"/><rect x="${a - 22}" y="${y + 20}" width="44" height="260" fill="url(#g-cyl)"/>`;
  }
  return `${piers}
    ${truss(x1 + 20, x2 + 20, y, "#8f4a36", 7, 16)}
    <rect x="${x1}" y="${y + 14}" width="${x2 - x1}" height="18" fill="#8a4a33"/>
    <rect x="${x1}" y="${y + 26}" width="${x2 - x1}" height="6" fill="#000" opacity=".2"/>`;
}

export const bridgeFront = (x1, x2, y) => truss(x1, x2, y, "#c65a3a", 9);

// トンネルのある山（x1〜x2）。groundY は地面の高さ
export function tunnel(x1, x2, groundY) {
  const portal = x => `
    <path d="M${x - 75},${groundY} L${x - 75},${groundY - 200} Q${x - 75},${groundY - 265} ${x},${groundY - 265} Q${x + 75},${groundY - 265} ${x + 75},${groundY - 200} L${x + 75},${groundY} Z" fill="#a7adb5"/>
    <path d="M${x - 75},${groundY} L${x - 75},${groundY - 200} Q${x - 75},${groundY - 265} ${x},${groundY - 265} Q${x + 75},${groundY - 265} ${x + 75},${groundY - 200} L${x + 75},${groundY} Z" fill="url(#g-cyl)"/>
    <path d="M${x - 52},${groundY} L${x - 52},${groundY - 190} Q${x - 52},${groundY - 240} ${x},${groundY - 240} Q${x + 52},${groundY - 240} ${x + 52},${groundY - 190} L${x + 52},${groundY} Z" fill="#1c1f24"/>
    <path d="M${x - 38},${groundY} L${x - 38},${groundY - 180} Q${x - 38},${groundY - 222} ${x},${groundY - 222} Q${x + 38},${groundY - 222} ${x + 38},${groundY - 180} L${x + 38},${groundY} Z" fill="#000"/>`;
  const mid = (x1 + x2) / 2;
  let trees = "";
  for (let x = x1 + 180; x < x2 - 120; x += 150) {
    const ty = groundY - 395 + Math.abs(x - mid) * 0.12;
    trees += `<circle cx="${x}" cy="${ty}" r="38" fill="#4e9a4c"/><circle cx="${x}" cy="${ty}" r="38" fill="url(#g-sphere)"/>`;
  }
  return `
    <defs><linearGradient id="tun-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#72c06b"/><stop offset="1" stop-color="#4a9446"/>
    </linearGradient></defs>
    <path d="M${x1},${groundY + 220} L${x1},${groundY - 250} C${x1 + 150},${groundY - 420} ${x1 + 500},${groundY - 430} ${mid},${groundY - 420} C${x2 - 500},${groundY - 430} ${x2 - 150},${groundY - 420} ${x2},${groundY - 250} L${x2},${groundY + 220} Z" fill="url(#tun-g)"/>
    ${trees}${portal(x1)}${portal(x2)}`;
}

// 駅名の看板（中心が原点）
export const stationSign = name => `
  <line x1="-100" y1="-60" x2="-100" y2="-32" stroke="#565d65" stroke-width="4"/>
  <line x1="100" y1="-60" x2="100" y2="-32" stroke="#565d65" stroke-width="4"/>
  <rect x="-160" y="-32" width="320" height="66" rx="6" fill="#fff" stroke="#b8c0c8" stroke-width="3"/>
  <rect x="-158" y="20" width="316" height="12" fill="#f08a24"/>
  <text y="8" text-anchor="middle" font-size="34" font-weight="800" fill="#2b2b2b">${name}</text>`;

/* ---------- そのほか ---------- */
// 火（中心が原点）
export const flame = () => `
  <g class="flame">
    <path d="M0,55 C-45,55 -50,10 -30,-15 C-25,5 -10,5 -12,-10 C-15,-35 0,-55 5,-70 C15,-40 45,-25 42,10 C40,40 25,55 0,55Z" fill="#ff7a1a"/>
    <path d="M0,55 C-22,55 -26,30 -14,12 C-8,24 2,20 0,8 C0,-8 8,-18 10,-26 C18,-8 26,8 24,28 C22,45 14,55 0,55Z" fill="#ffd23f"/>
  </g>`;

// 丸いボタン（中心が原点）
export const button = (label, color) => `
  <g class="pulse">
    <circle r="86" cy="9" fill="rgba(0,0,0,.18)"/>
    <circle r="80" fill="${color}" stroke="#fff" stroke-width="8"/>
    <circle r="76" fill="url(#g-sphere)"/>
    <text y="12" text-anchor="middle" font-size="${label.length > 4 ? 30 : 36}" font-weight="800" fill="#fff">${label}</text>
  </g>`;

export const sky = id => `
  <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="560">
    <stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e3f5ff"/>
  </linearGradient></defs>
  <rect x="-1000" y="-1000" width="3000" height="1600" fill="url(#${id})"/>`;

export const cloud = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".95">
    <ellipse cx="0" cy="0" rx="70" ry="26"/><circle cx="-22" cy="-18" r="28"/><circle cx="20" cy="-24" r="34"/>
  </g>`;

// ばんそうこう（中心が原点）
export const bandage = () => `
  <g transform="rotate(-25)">
    <rect x="-34" y="-12" width="68" height="24" rx="10" fill="#fff4e0" stroke="#e0c9a6" stroke-width="2"/>
    <rect x="-11" y="-12" width="22" height="24" fill="#f3dfc1"/>
    <rect x="-34" y="-12" width="68" height="24" rx="10" fill="url(#g-shade)"/>
  </g>`;

// 木（(x, y) が根もと）
export const tree = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    ${shadow(0, 0, 80, 14)}
    <rect x="-12" y="-150" width="24" height="150" fill="#8b6b4a"/>
    <rect x="-12" y="-150" width="24" height="150" fill="url(#g-cyl)"/>
    ${[[-40, -150, 50, "#4fa856"], [30, -170, 62, "#5dbb63"], [-5, -215, 52, "#66c46b"]].map(([cx, cy, r, c]) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g-sphere)"/>`).join("")}
  </g>`;

// 上から下へ色が変わる地面など（y1〜y2 で c1 → c2）。高さを省くと画面の下まで
export const band = (id, y1, y2, c1, c2, height = y2 - y1 + 1000) => `
  <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect x="-1000" y="${y1}" width="3000" height="${height}" fill="url(#${id})"/>`;

// 地平線に近いほど白くかすむ（遠くのものに重ねる）
export const haze = (id, y1, y2) => `
  <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/>
  </linearGradient></defs>
  <rect x="-1000" y="${y1}" width="3000" height="${y2 - y1}" fill="url(#${id})"/>`;

// 遠くの街（うすい色のビル）。y が地面
export const city = (y, color = "#c6d6e6") => {
  const bs = [[-60, 150], [30, 210], [110, 120], [190, 260], [280, 170], [370, 230], [460, 140], [540, 280], [630, 190], [720, 240], [810, 130], [890, 220], [980, 170]];
  return bs.map(([x, hgt]) => `<rect x="${x}" y="${y - hgt}" width="78" height="${hgt}" fill="${color}"/>
    <rect x="${x + 60}" y="${y - hgt}" width="18" height="${hgt}" fill="#000" opacity=".05"/>`).join("");
};
