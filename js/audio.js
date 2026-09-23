// 効果音（Web Audio で合成）と読み上げ
let ctx, master, noiseBuf;
let volume = 0.7;
const loops = new Set();

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    newMaster();
  }
  if (ctx.state === "suspended") ctx.resume();
}

function newMaster() {
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
}

export function setVolume(v) {
  volume = v;
  if (master) master.gain.value = v;
}

// ゲームを抜けたときに鳴っている音をぜんぶ止める
export function stopAll() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (!ctx) return;
  loops.forEach(l => l.stop());
  loops.clear();
  master.disconnect();
  newMaster();
}

/* ---------- 部品 ---------- */
function tone(t, freq, dur, { type = "sine", vol = 0.3, to = null, attack = 0.01 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(t, dur, { type = "bandpass", freq = 1000, q = 1, vol = 0.3, sustain = false } = {}) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf; src.loop = true;
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + (sustain ? 0.1 : 0.01));
  src.connect(f).connect(g).connect(master);
  src.start(t);
  if (!sustain) { g.gain.exponentialRampToValueAtTime(0.001, t + dur); src.stop(t + dur + 0.05); }
  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const n = ctx.currentTime;
      g.gain.cancelScheduledValues(n);
      g.gain.setValueAtTime(g.gain.value, n);
      g.gain.linearRampToValueAtTime(0, n + 0.15);
      src.stop(n + 0.2);
    },
  };
}

// 近づいて遠ざかる感じのフェード
function soundBus(t, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(1, t + 0.6);
  g.gain.setValueAtTime(1, t + Math.max(0.7, dur - 1));
  g.gain.linearRampToValueAtTime(0, t + dur);
  g.connect(master);
  return g;
}

function wail(bus, t, dur, lo, hi, up, down, vol) {
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = "sawtooth"; f.type = "lowpass"; f.frequency.value = 1800; g.gain.value = vol;
  o.connect(f).connect(g).connect(bus);
  o.frequency.setValueAtTime(lo, t);
  for (let s = t; s < t + dur; s += up + down) {
    o.frequency.linearRampToValueAtTime(hi, s + up);
    o.frequency.linearRampToValueAtTime(lo, s + up + down);
  }
  o.start(t); o.stop(t + dur);
}

function bell(bus, t) {
  [1480, 2230].forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(i ? 0.12 : 0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + 0.3);
  });
}

const on = fn => (...args) => (ctx ? fn(ctx.currentTime, ...args) : undefined);

/* ---------- 効果音 ---------- */
export const sfx = {
  pop: on(t => tone(t, 520, 0.14, { to: 980, vol: 0.3 })),
  ding: on(t => { tone(t, 1046, 0.4, { vol: 0.22 }); tone(t + 0.08, 1568, 0.45, { vol: 0.18 }); }),
  // 元の場所に戻るときの音（失敗っぽくない、やさしい音）
  boing: on(t => tone(t, 330, 0.28, { to: 520, type: "triangle", vol: 0.22 })),
  click: on(t => { tone(t, 1300, 0.07, { type: "square", vol: 0.08 }); tone(t + 0.05, 1900, 0.06, { type: "square", vol: 0.07 }); }),
  // ピンポーン（ドアの開け閉め）
  chime: on(t => { tone(t, 784, 0.9, { vol: 0.25 }); tone(t + 0.45, 622, 1.1, { vol: 0.25 }); }),
  fanfare: on(t => {
    [523, 659, 784].forEach((f, i) => tone(t + i * 0.13, f, 0.3, { type: "triangle", vol: 0.25 }));
    tone(t + 0.39, 1047, 0.9, { type: "triangle", vol: 0.28 });
  }),
  clap: on(t => {
    for (let i = 0; i < 10; i++) noise(t + i * 0.12 + Math.random() * 0.04, 0.09, { type: "highpass", freq: 1200, vol: 0.4 });
  }),
  hiss: on(t => noise(t, 0.8, { type: "highpass", freq: 2500, vol: 0.28 })),
  // 放水中はずっと鳴る。戻り値の関数で止める
  water: on(t => {
    const n = noise(t, 0, { type: "bandpass", freq: 1300, q: 0.7, vol: 0.22, sustain: true });
    loops.add(n);
    return () => { n.stop(); loops.delete(n); };
  }),
  // ファーン（新幹線の警笛）
  horn: on(t => {
    [466, 587].forEach(freq => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = freq;
      f.type = "lowpass"; f.frequency.value = 1400;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.05);
      g.gain.setValueAtTime(0.09, t + 0.6);
      g.gain.linearRampToValueAtTime(0, t + 0.8);
      o.connect(f).connect(g).connect(master);
      o.start(t); o.stop(t + 0.85);
    });
  }),
  // びゅーん（新幹線の走行音）
  shinkansen: on((t, dur = 3) => {
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseBuf; n.loop = true;
    bp.type = "bandpass"; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(350, t);
    bp.frequency.linearRampToValueAtTime(1700, t + dur * 0.55);
    bp.frequency.linearRampToValueAtTime(450, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.8, t + dur * 0.55);
    g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(bp).connect(g).connect(master);
    n.start(t); n.stop(t + dur);
  }),
  // ピーポーピーポー
  ambulance: on((t, dur = 3) => {
    const bus = soundBus(t, dur), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; g.gain.value = 0.4;
    o.connect(g).connect(bus);
    for (let i = 0, s = t; s < t + dur; i++, s += 0.62) o.frequency.setValueAtTime(i % 2 ? 770 : 960, s);
    o.start(t); o.stop(t + dur);
  }),
  // ウ〜〜
  police: on((t, dur = 3) => wail(soundBus(t, dur), t, dur, 450, 1050, 0.9, 1.3, 0.16)),
  // ウ〜〜 ＋ カンカンカン
  fire: on((t, dur = 3) => {
    const bus = soundBus(t, dur);
    wail(bus, t, dur, 380, 820, 1.4, 1.4, 0.1);
    for (let s = t + 0.1; s < t + dur; s += 0.32) bell(bus, s);
  }),
};

/* ---------- 読み上げ ---------- */
let jaVoice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.replace("_", "-").startsWith("ja"));
  jaVoice = voices.find(v => /Kyoko|O-ren|Otoya/.test(v.name)) || voices[0] || null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

// iPad では最初の1回を「タップした瞬間」に呼ばないと声が出ない（ホームのカードをタップしたときに呼んでいる）
export function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  if (jaVoice) u.voice = jaVoice;
  u.rate = 0.9; u.pitch = 1.25; u.volume = Math.min(1, volume + 0.3);
  speechSynthesis.speak(u);
}
