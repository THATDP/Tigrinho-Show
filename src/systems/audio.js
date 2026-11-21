// Áudio 100% sintetizado (Web Audio API): sem arquivos externos.
// Controles independentes: volume geral, música e efeitos.
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI -> frequência

export class AudioManager {
  constructor() {
    this.ac = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.settings = { master: 0.8, music: 0.5, sfx: 0.8 };
    this.noise = null;
    this.musicTimer = null;
    this.musicMood = null;
    this.lastTick = 0;
  }

  // Cria o contexto só após um gesto do usuário (exigência dos navegadores).
  unlock() {
    if (this.ac) {
      if (this.ac.state === 'suspended') this.ac.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      this.ac = new Ctx();
    } catch (e) {
      return;
    }
    this.master = this.ac.createGain();
    this.musicBus = this.ac.createGain();
    this.sfxBus = this.ac.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(this.ac.destination);
    this.applySettings(this.settings);
    // Ruído branco reutilizável (para chiados, vento e impactos).
    const len = this.ac.sampleRate * 1;
    this.noise = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  applySettings(s) {
    this.settings = { ...this.settings, ...s };
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.master.gain.setTargetAtTime(this.settings.master, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.settings.music * 0.5, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(this.settings.sfx, t, 0.02);
  }

  get ready() { return !!this.ac; }

  // ---------- blocos básicos ----------
  tone({ freq, end, type = 'sine', dur = 0.2, vol = 0.3, when = 0, bus = 'sfx', glide = null, attack = 0.005 }) {
    if (!this.ac) return;
    const t0 = this.ac.currentTime + when;
    const osc = this.ac.createOscillator();
    const g = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(bus === 'music' ? this.musicBus : this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    if (end) osc.frequency.exponentialRampToValueAtTime(end, t0 + dur);
  }

  noiseBurst({ dur = 0.15, vol = 0.2, when = 0, freq = 1200, q = 1 } = {}) {
    if (!this.ac) return;
    const t0 = this.ac.currentTime + when;
    const src = this.ac.createBufferSource();
    src.buffer = this.noise;
    const f = this.ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t0, Math.random() * 0.5, dur + 0.05);
  }

  // ---------- efeitos ----------
  sfx(name) {
    if (!this.ac) return;
    if (this.ac.state === 'suspended') this.ac.resume();
    const T = this.tone.bind(this);
    switch (name) {
      case 'click': T({ freq: 880, end: 660, type: 'triangle', dur: 0.08, vol: 0.25 }); break;
      case 'hover': T({ freq: 1200, type: 'sine', dur: 0.04, vol: 0.08 }); break;
      case 'back': T({ freq: 520, end: 380, type: 'triangle', dur: 0.1, vol: 0.2 }); break;
      case 'error': T({ freq: 180, end: 120, type: 'square', dur: 0.25, vol: 0.12 }); break;
      case 'reel-tick': {
        const now = performance.now();
        if (now - this.lastTick < 35) break;
        this.lastTick = now;
        this.noiseBurst({ dur: 0.03, vol: 0.12, freq: 2400, q: 2 });
        break;
      }
      case 'reel-stop': this.noiseBurst({ dur: 0.18, vol: 0.35, freq: 220, q: 0.8 }); T({ freq: 140, end: 70, type: 'sine', dur: 0.2, vol: 0.4 }); break;
      case 'coin': T({ freq: 1320, type: 'square', dur: 0.06, vol: 0.12 }); T({ freq: 1760, type: 'square', dur: 0.12, vol: 0.12, when: 0.06 }); break;
      case 'win-small': [72, 76, 79].forEach((n, i) => T({ freq: NOTE(n), type: 'triangle', dur: 0.18, vol: 0.2, when: i * 0.08 })); break;
      case 'win-medium': [72, 76, 79, 84].forEach((n, i) => T({ freq: NOTE(n), type: 'square', dur: 0.2, vol: 0.12, when: i * 0.09 })); break;
      case 'win-big': [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => { T({ freq: NOTE(n), type: 'sawtooth', dur: 0.3, vol: 0.09, when: i * 0.07 }); }); this.noiseBurst({ dur: 0.6, vol: 0.2, freq: 3000, q: 0.5 }); break;
      case 'jackpot': {
        for (let i = 0; i < 16; i++) T({ freq: NOTE(60 + (i % 7) * 2 + Math.floor(i / 7) * 12), type: 'square', dur: 0.14, vol: 0.08, when: i * 0.06 });
        this.noiseBurst({ dur: 1.2, vol: 0.25, freq: 4000, q: 0.4, when: 0.1 });
        break;
      }
      case 'lose': T({ freq: 330, end: 165, type: 'triangle', dur: 0.5, vol: 0.2 }); T({ freq: 277, end: 140, type: 'triangle', dur: 0.6, vol: 0.2, when: 0.3 }); break;
      case 'mascot': T({ freq: 110, end: 220, type: 'sawtooth', dur: 0.6, vol: 0.25 }); this.noiseBurst({ dur: 0.7, vol: 0.2, freq: 600, q: 0.6 }); T({ freq: 330, end: 660, type: 'square', dur: 0.4, vol: 0.1, when: 0.5 }); break; // rugido/estalo
      case 'roar': T({ freq: 90, end: 50, type: 'sawtooth', dur: 0.9, vol: 0.3 }); this.noiseBurst({ dur: 0.9, vol: 0.25, freq: 500, q: 0.8 }); break;
      case 'event': [60, 67, 72, 79].forEach((n, i) => T({ freq: NOTE(n), type: 'square', dur: 0.12, vol: 0.1, when: i * 0.06 })); break;
      case 'bonus': [76, 79, 83, 86, 91].forEach((n, i) => T({ freq: NOTE(n), type: 'triangle', dur: 0.14, vol: 0.18, when: i * 0.07 })); break;
      case 'whoosh': this.noiseBurst({ dur: 0.35, vol: 0.2, freq: 900, q: 0.7 }); break;
      case 'pop': T({ freq: 600, end: 1200, type: 'sine', dur: 0.12, vol: 0.25 }); break;
      case 'tick': T({ freq: 1000, type: 'square', dur: 0.03, vol: 0.08 }); break;
      case 'go': T({ freq: 880, type: 'square', dur: 0.25, vol: 0.2 }); break;
      case 'fail': T({ freq: 300, end: 90, type: 'sawtooth', dur: 0.45, vol: 0.2 }); break;
      case 'success': [72, 79, 84].forEach((n, i) => T({ freq: NOTE(n), type: 'triangle', dur: 0.25, vol: 0.2, when: i * 0.1 })); break;
      case 'levelup': [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) => T({ freq: NOTE(n), type: 'triangle', dur: 0.2, vol: 0.2, when: i * 0.08 })); break;
      case 'laugh': [0, 0.12, 0.24, 0.36].forEach((w) => T({ freq: 480, end: 300, type: 'triangle', dur: 0.1, vol: 0.2, when: w })); break; // "ha ha"
      case 'sad': T({ freq: 392, end: 262, type: 'triangle', dur: 0.7, vol: 0.2 }); break;
      case 'surprise': T({ freq: 300, end: 900, type: 'triangle', dur: 0.25, vol: 0.25 }); break;
      case 'relampago': for (let i = 0; i < 6; i++) T({ freq: 1400 + i * 120, type: 'square', dur: 0.05, vol: 0.1, when: i * 0.03 }); break;
      case 'buy': [76, 83].forEach((n, i) => T({ freq: NOTE(n), type: 'triangle', dur: 0.18, vol: 0.2, when: i * 0.1 })); break;
      case 'equip': T({ freq: NOTE(79), type: 'sine', dur: 0.2, vol: 0.2 }); break;
      default: break;
    }
  }

  // ---------- música (loop procedural suave) ----------
  startMusic(mood = 'circo') {
    if (!this.ac) return;
    if (this.musicMood === mood && this.musicTimer) return;
    this.stopMusic();
    this.musicMood = mood;
    const cfg = MOODS[mood] || MOODS.circo;
    let step = 0;
    let nextTime = this.ac.currentTime + 0.1;
    const stepDur = 60 / cfg.bpm / 2; // colcheias
    const schedule = () => {
      if (!this.ac) return;
      while (nextTime < this.ac.currentTime + 0.3) {
        const bar = Math.floor(step / 16) % cfg.chords.length;
        const chord = cfg.chords[bar];
        const i = step % 16;
        const when = nextTime - this.ac.currentTime;
        if (i % 4 === 0) this.tone({ freq: NOTE(chord[0] - 12), type: 'triangle', dur: stepDur * 3.6, vol: 0.22, when, bus: 'music' });
        if (i % 2 === 1) this.tone({ freq: NOTE(chord[(i >> 1) % chord.length] + 12), type: cfg.lead, dur: stepDur * 0.9, vol: 0.06, when, bus: 'music' });
        if (i === 0 || i === 8) this.tone({ freq: 80, end: 40, type: 'sine', dur: 0.15, vol: 0.18, when, bus: 'music' });
        if (cfg.hats && i % 2 === 0) this.noiseBurst({ dur: 0.03, vol: 0.025, freq: 7000, q: 1, when });
        nextTime += stepDur;
        step++;
      }
    };
    schedule();
    this.musicTimer = setInterval(schedule, 80);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicMood = null;
  }
}

// Progressões em semitons MIDI (acordes como listas de notas).
const MOODS = {
  circo: { bpm: 124, lead: 'square', hats: true, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] },
  suspense: { bpm: 92, lead: 'triangle', hats: false, chords: [[50, 53, 57], [46, 50, 53], [48, 51, 55], [45, 48, 52]] },
  arcade: { bpm: 150, lead: 'square', hats: true, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]] },
  festa: { bpm: 136, lead: 'sawtooth', hats: true, chords: [[64, 67, 71], [62, 65, 69], [57, 60, 64], [59, 62, 66]] },
};
