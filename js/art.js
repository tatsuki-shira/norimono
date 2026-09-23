// イラスト（SVG）。乗り物はすべて右向き
export const wheel = (cx, cy, r) => `
  <g class="wheel">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#23262b"/>
    <circle cx="${cx}" cy="${cy}" r="${r * .5}" fill="#c9ced6"/>
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
    for (let x = x0; x <= x1; x += 26) h += `<rect x="${x}" y="80" width="16" height="15" rx="4" fill="#2d3a4a"/>`;
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
    </g>
    <path d="${NOSE}" fill="none" stroke="#98a2ad" stroke-width="3"/>
    ${windows(30, 220)}
    <rect x="244" y="72" width="16" height="44" rx="3" fill="none" stroke="#b8c0c8" stroke-width="2"/>
    <path d="M292,72 C318,76 338,88 354,104 L324,104 C312,92 302,82 292,79 Z" fill="#2d3a4a"/>
    <ellipse cx="386" cy="137" rx="8" ry="4" fill="#ffe27a"/>`;

  if (!twoCars) {
    return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="170" width="420" height="6" fill="#8a8f98"/>${lead}</svg>`;
  }
  const middle = `
    ${bogies([40, 270])}
    <rect x="10" y="60" width="380" height="92" rx="8" fill="#fbfcfd" stroke="#98a2ad" stroke-width="3"/>
    ${stripes(11.5, 377)}
    ${windows(40, 340)}
    <rect x="388" y="76" width="24" height="64" fill="#7d858f"/>`;
  return `<svg viewBox="0 0 820 200" xmlns="http://www.w3.org/2000/svg">
    ${middle}<g transform="translate(400,0)">${lead}</g></svg>`;
}

/* ---------- はたらく車 ---------- */
export function fireTruck() {
  let rungs = "";
  for (let x = 45; x < 280; x += 22) rungs += `<rect x="${x}" y="50" width="4" height="14" fill="#9aa3ad"/>`;
  return `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="70" width="285" height="88" rx="10" fill="#e53935"/>
    <rect x="40" y="80" width="75" height="32" rx="5" fill="#c62828"/>
    <rect x="125" y="80" width="75" height="32" rx="5" fill="#c62828"/>
    <rect x="210" y="80" width="75" height="32" rx="5" fill="#c62828"/>
    <path d="M300,55 L360,55 Q380,55 388,75 L402,112 L402,158 L300,158 Z" fill="#e53935"/>
    <path d="M318,68 L356,68 Q368,68 373,80 L383,106 L318,106 Z" fill="#bfe6ff" stroke="#8b1d1b" stroke-width="3"/>
    <rect x="20" y="120" width="382" height="8" fill="#fff"/>
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
    <path d="${AMB_BODY}" fill="#fdfdfd"/>
    <g clip-path="url(#amb-${uid})"><rect x="0" y="112" width="420" height="12" fill="#e53935"/></g>
    <path d="${AMB_BODY}" fill="none" stroke="#b8c0c8" stroke-width="3"/>
    <path d="M305,60 L326,62 L360,100 L305,100 Z" fill="#bfe6ff" stroke="#7a8691" stroke-width="3"/>
    <rect x="228" y="60" width="62" height="38" rx="5" fill="#bfe6ff" stroke="#7a8691" stroke-width="3"/>
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
    <path d="${body}" fill="#1f2228"/>
    <g clip-path="url(#pol-${uid})"><rect x="112" y="40" width="210" height="92" fill="#fbfcfd"/></g>
    <path d="${body}" fill="none" stroke="#1f2228" stroke-width="3"/>
    <path d="M162,68 L206,68 L206,96 L130,96 Z" fill="#bfe6ff" stroke="#7a8691" stroke-width="2"/>
    <path d="M216,68 L266,68 Q275,68 281,74 L303,96 L216,96 Z" fill="#bfe6ff" stroke="#7a8691" stroke-width="2"/>
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
    <rect x="${x1}" y="${y + 10}" width="${x2 - x1}" height="7" rx="3" fill="#7d858f"/>`;
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
const ANIMALS = {
  kuma:  { c: "#b07d52", ear: "#8a5a33", inner: "#e8c19a", muzzle: "#f0d6b8", nose: "#3a2a20" },
  usagi: { c: "#fafafa", ear: "#fafafa", inner: "#ffb6c8", muzzle: "#ffffff", nose: "#ff8fab" },
  neko:  { c: "#f5b86b", ear: "#f5b86b", inner: "#ffd9a8", muzzle: "#fff1dc", nose: "#e0736b" },
};

export function animal(kind, { mood = "happy", bandage = false } = {}) {
  const a = ANIMALS[kind];
  const line = kind === "usagi" ? `stroke="#d8d8d8" stroke-width="3"` : "";
  let ears = "";
  if (kind === "kuma") ears = `
    <circle cx="-38" cy="-40" r="20" fill="${a.ear}"/><circle cx="38" cy="-40" r="20" fill="${a.ear}"/>
    <circle cx="-38" cy="-40" r="10" fill="${a.inner}"/><circle cx="38" cy="-40" r="10" fill="${a.inner}"/>`;
  if (kind === "usagi") ears = `
    <ellipse cx="-20" cy="-75" rx="15" ry="42" fill="${a.ear}" ${line}/><ellipse cx="20" cy="-75" rx="15" ry="42" fill="${a.ear}" ${line}/>
    <ellipse cx="-20" cy="-72" rx="7" ry="30" fill="${a.inner}"/><ellipse cx="20" cy="-72" rx="7" ry="30" fill="${a.inner}"/>`;
  if (kind === "neko") ears = `
    <path d="M-48,-20 L-40,-70 L-8,-46 Z" fill="${a.ear}"/><path d="M48,-20 L40,-70 L8,-46 Z" fill="${a.ear}"/>
    <path d="M-40,-32 L-36,-58 L-20,-44 Z" fill="${a.inner}"/><path d="M40,-32 L36,-58 L20,-44 Z" fill="${a.inner}"/>`;

  const sad = mood === "sad";
  const eyes = sad
    ? `<path d="M-27,-4 Q-18,-12 -9,-4" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
       <path d="M9,-4 Q18,-12 27,-4" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
       <path d="M-22,4 q-7,13 0,17 q7,-4 0,-17Z" fill="#6ec6ff"/>`
    : `<circle cx="-18" cy="-6" r="6.5" fill="#2b2b2b"/><circle cx="18" cy="-6" r="6.5" fill="#2b2b2b"/>
       <circle cx="-16" cy="-8" r="2" fill="#fff"/><circle cx="20" cy="-8" r="2" fill="#fff"/>`;
  const mouth = sad
    ? `<path d="M-10,34 Q0,26 10,34" fill="none" stroke="#3a2a20" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M-11,27 Q0,39 11,27" fill="none" stroke="#3a2a20" stroke-width="3.5" stroke-linecap="round"/>`;
  const whiskers = kind === "neko"
    ? `<path d="M-30,18 L-56,12 M-30,24 L-56,28 M30,18 L56,12 M30,24 L56,28" stroke="#9c6b3f" stroke-width="2.5" stroke-linecap="round"/>`
    : "";
  const band = bandage
    ? `<g transform="translate(24,-34) rotate(-25)">
         <rect x="-28" y="-10" width="56" height="20" rx="8" fill="#fff4e0" stroke="#e0c9a6" stroke-width="2"/>
         <rect x="-9" y="-10" width="18" height="20" fill="#f3dfc1"/>
       </g>`
    : "";

  return `
    <ellipse cx="0" cy="74" rx="40" ry="32" fill="${a.c}" ${line}/>
    ${ears}
    <circle cx="0" cy="0" r="52" fill="${a.c}" ${line}/>
    <ellipse cx="0" cy="20" rx="24" ry="17" fill="${a.muzzle}"/>
    <circle cx="-32" cy="16" r="9" fill="#ffb3b3" opacity=".7"/><circle cx="32" cy="16" r="9" fill="#ffb3b3" opacity=".7"/>
    ${eyes}
    <ellipse cx="0" cy="12" rx="7" ry="5" fill="${a.nose}"/>
    ${mouth}${whiskers}${band}`;
}

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
