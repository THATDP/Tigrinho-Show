// Salvamento em localStorage (ou qualquer storage compatível, para testes).
// Dados corrompidos ou ausentes são tratados: o original é copiado para backup e o padrão é usado.
import { DEFAULT_EQUIPPED, CATEGORIES } from './catalog.js';

export const SAVE_KEY = 'tigrinho-show-save-v1';
export const BACKUP_KEY = 'tigrinho-show-save-v1-backup';
export const SAVE_VERSION = 1;

export const STAT_KEYS = [
  'spins', 'wins', 'bigWins', 'megaWins', 'freeSpinsTriggered', 'freeSpinsPlayed', 'events',
  'minigames', 'goldMedals', 'fichasWon', 'fichasSpent', 'biggestWin', 'symbolsSeen',
  'itemsBought', 'itemsOwned', 'level', 'missionsDone', 'playtime', 'nearMisses',
  'minigame:reflexo', 'minigame:coleta', 'minigame:corrida', 'minigame:memoria',
  'minigame:sequencia', 'minigame:precisao', 'minigame:tesouro',
];

export const MINIGAME_KEYS = ['reflexo', 'coleta', 'corrida', 'memoria', 'sequencia', 'precisao', 'tesouro'];

export const DEFAULT_SETTINGS = {
  master: 0.8, music: 0.5, sfx: 0.8,
  shake: true, particles: 'full', fastSpin: false, reducedMotion: false,
};

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function defaultSave(now = new Date()) {
  const equipped = { ...DEFAULT_EQUIPPED };
  const owned = Object.values(equipped);
  return {
    version: SAVE_VERSION,
    profile: { name: 'Jogador Fictício', createdAt: now.toISOString() },
    fichas: 1000,
    xp: 0,
    spinsToday: { date: todayKey(now), count: 0 },
    helpToday: { date: todayKey(now), count: 0 },
    daily: { date: '', missions: [] },
    achievements: {},
    stats: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])),
    owned: [...new Set(owned)],
    equipped,
    collection: { symbols: {} },
    records: {},
    settings: { ...DEFAULT_SETTINGS },
    lastBet: 10,
    eventsSinceLast: 0,
    unlockedSeen: {},
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, d, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
const str = (v, d, max = 60) => (typeof v === 'string' && v.length ? v.slice(0, max) : d);
const bool = (v, d) => (typeof v === 'boolean' ? v : d);

// Valida e completa um objeto salvo. Nunca lança exceção.
export function sanitizeSave(raw, now = new Date()) {
  const base = defaultSave(now);
  if (!isObj(raw)) return null;
  const s = base;
  if (isObj(raw.profile)) s.profile.name = str(raw.profile.name, base.profile.name, 24);
  if (isObj(raw.profile) && typeof raw.profile.createdAt === 'string') s.profile.createdAt = raw.profile.createdAt;
  s.fichas = num(raw.fichas, base.fichas, 0, 1e12);
  s.xp = num(raw.xp, 0, 0, 1e12);
  if (isObj(raw.spinsToday)) s.spinsToday = { date: str(raw.spinsToday.date, '', 10), count: num(raw.spinsToday.count, 0, 0, 1e6) };
  if (isObj(raw.helpToday)) s.helpToday = { date: str(raw.helpToday.date, '', 10), count: num(raw.helpToday.count, 0, 0, 1e6) };
  if (isObj(raw.daily) && Array.isArray(raw.daily.missions)) {
    s.daily = {
      date: str(raw.daily.date, '', 10),
      missions: raw.daily.missions
        .filter((m) => isObj(m) && typeof m.id === 'string')
        .map((m) => ({ id: m.id.slice(0, 40), progress: num(m.progress, 0, 0, 1e9), claimed: bool(m.claimed, false) }))
        .slice(0, 6),
    };
  }
  if (isObj(raw.achievements)) {
    for (const [k, v] of Object.entries(raw.achievements)) {
      if (typeof v === 'string' || typeof v === 'number') s.achievements[k.slice(0, 40)] = v;
    }
  }
  if (isObj(raw.stats)) {
    for (const k of STAT_KEYS) s.stats[k] = num(raw.stats[k], 0, 0, 1e12);
  }
  if (Array.isArray(raw.owned)) {
    s.owned = [...new Set(raw.owned.filter((x) => typeof x === 'string').map((x) => x.slice(0, 40)))];
  }
  if (isObj(raw.equipped)) {
    for (const c of CATEGORIES) {
      if (typeof raw.equipped[c.id] === 'string') s.equipped[c.id] = raw.equipped[c.id].slice(0, 40);
    }
  }
  if (isObj(raw.collection) && isObj(raw.collection.symbols)) {
    for (const [k, v] of Object.entries(raw.collection.symbols)) s.collection.symbols[k.slice(0, 20)] = num(v, 0, 0, 1e9);
  }
  if (isObj(raw.records)) {
    for (const [k, v] of Object.entries(raw.records)) s.records[k.slice(0, 30)] = num(v, 0, 0, 1e12);
  }
  if (isObj(raw.settings)) {
    const st = raw.settings;
    s.settings = {
      master: num(st.master, DEFAULT_SETTINGS.master, 0, 1),
      music: num(st.music, DEFAULT_SETTINGS.music, 0, 1),
      sfx: num(st.sfx, DEFAULT_SETTINGS.sfx, 0, 1),
      shake: bool(st.shake, DEFAULT_SETTINGS.shake),
      particles: st.particles === 'low' ? 'low' : 'full',
      fastSpin: bool(st.fastSpin, DEFAULT_SETTINGS.fastSpin),
      reducedMotion: bool(st.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
    };
  }
  s.lastBet = num(raw.lastBet, 10, 1, 1000);
  s.eventsSinceLast = num(raw.eventsSinceLast, 0, 0, 1e6);
  if (isObj(raw.unlockedSeen)) s.unlockedSeen = raw.unlockedSeen;
  return s;
}

// Lê do storage. Retorna { save, status } com status: 'ok' | 'new' | 'recovered'.
export function loadSave(storage, now = new Date()) {
  let text = null;
  try {
    text = storage ? storage.getItem(SAVE_KEY) : null;
  } catch (e) {
    return { save: defaultSave(now), status: 'new' };
  }
  if (text === null || text === undefined) return { save: defaultSave(now), status: 'new' };
  try {
    const parsed = JSON.parse(text);
    const clean = sanitizeSave(parsed, now);
    if (clean) return { save: clean, status: 'ok' };
    throw new Error('formato inválido');
  } catch (e) {
    try { storage.setItem(BACKUP_KEY, text); } catch (_) { /* ignora */ }
    return { save: defaultSave(now), status: 'recovered' };
  }
}

export function writeSave(storage, save) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch (e) {
    return false; // quota cheia ou storage bloqueado: o jogo continua funcionando
  }
}

// Storage em memória (fallback quando localStorage está bloqueado e para testes).
export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
