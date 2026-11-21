// Estado central do jogo: economia fictícia, progressão, missões, conquistas, loja e recordes.
// Não depende do Phaser: todas as regras aqui são testáveis.
import { loadSave, writeSave, todayKey, defaultSave, memoryStorage, MINIGAME_KEYS } from '../logic/save.js';
import { ACHIEVEMENTS, MISSION_POOL, dailyMissionsFor, levelInfo, levelUpReward } from '../logic/progression.js';
import { CATALOG_BY_ID, isItemUnlockedBy, CATEGORIES } from '../logic/catalog.js';
import { SYMBOL_IDS } from '../logic/symbols.js';

export const DAILY_SPIN_LIMIT = 150;   // limite saudável de giros por dia (incentiva variar os modos)
export const HELP_AMOUNT = 200;        // "Ajuda do Tigrinho" quando o saldo acaba
export const HELP_DAILY_LIMIT = 3;
export const XP_PER_SPIN = 2;
export const XP_PER_WIN = 3;

export class GameState {
  constructor(storage = memoryStorage(), now = new Date()) {
    this.storage = storage;
    const { save, status } = loadSave(storage, now);
    this.data = save;
    this.loadStatus = status;
    this.rollDay(now);
    this.refreshLevel();
  }

  // ---------- persistência ----------
  save() {
    return writeSave(this.storage, this.data);
  }

  reset(now = new Date()) {
    this.data = defaultSave(now);
    this.rollDay(now);
    this.save();
  }

  // Virada de dia: zera limites diários e gera novas missões.
  rollDay(now = new Date()) {
    const key = todayKey(now);
    const d = this.data;
    if (d.spinsToday.date !== key) d.spinsToday = { date: key, count: 0 };
    if (d.helpToday.date !== key) d.helpToday = { date: key, count: 0 };
    if (d.daily.date !== key) {
      d.daily = { date: key, missions: dailyMissionsFor(key) };
    }
    return key;
  }

  get fichas() { return this.data.fichas; }
  get level() { return levelInfo(this.data.xp).level; }
  get levelData() { return levelInfo(this.data.xp); }

  refreshLevel() {
    const lvl = this.level;
    if (this.data.stats.level < lvl) this.data.stats.level = lvl;
    return lvl;
  }

  // ---------- economia ----------
  spinsLeftToday() {
    return Math.max(0, DAILY_SPIN_LIMIT - this.data.spinsToday.count);
  }

  canAfford(bet) {
    return this.data.fichas >= bet;
  }

  // Um giro pode acontecer se houver giros grátis ou saldo + limite diário.
  canSpin(bet, freeSpins = 0) {
    if (freeSpins > 0) return true;
    return this.canAfford(bet) && this.spinsLeftToday() > 0;
  }

  spend(amount) {
    const a = Math.max(0, Math.floor(amount));
    if (a > this.data.fichas) return false;
    this.data.fichas -= a;
    this.data.stats.fichasSpent += a;
    return true;
  }

  // Ganha fichas fictícias (prêmios, missões, minijogos). Estatísticas: use track().
  gain(amount) {
    const a = Math.max(0, Math.floor(amount));
    this.data.fichas += a;
    return a;
  }

  // Ajuda do Tigrinho: saldo de cortesia quando não há fichas suficientes (limitada por dia).
  canRequestHelp() {
    return this.data.helpToday.count < HELP_DAILY_LIMIT;
  }

  requestHelp() {
    if (!this.canRequestHelp()) return 0;
    this.data.helpToday.count++;
    return this.gain(HELP_AMOUNT);
  }

  // ---------- XP / nível ----------
  addXp(amount) {
    const before = this.level;
    this.data.xp += Math.max(0, Math.floor(amount));
    const after = this.refreshLevel();
    const rewards = [];
    for (let l = before + 1; l <= after; l++) {
      const r = levelUpReward(l);
      this.gain(r);
      rewards.push({ level: l, fichas: r });
    }
    return { levelUps: rewards, newLevel: after > before ? after : null };
  }

  // ---------- estatísticas, missões e conquistas ----------
  // Incrementa uma estatística global e o progresso das missões do dia.
  // Retorna { missionsDone: [ids], achievements: [ids] } recém-concluídos.
  track(stat, amount = 1) {
    const out = { missionsDone: [], achievements: [] };
    if (amount <= 0) return out;
    if (stat in this.data.stats) this.data.stats[stat] += amount;
    for (const m of this.data.daily.missions) {
      const def = MISSION_POOL.find((p) => p.id === m.id);
      if (!def || m.claimed) continue;
      if (def.stat !== stat) continue;
      const was = m.progress >= def.target;
      m.progress = Math.min(def.target, m.progress + amount);
      if (!was && m.progress >= def.target) out.missionsDone.push(m.id);
    }
    out.achievements = this.checkAchievements();
    return out;
  }

  setStat(key, value) {
    if (!(key in this.data.stats)) return;
    this.data.stats[key] = Math.max(this.data.stats[key], value);
    this.checkAchievements();
  }

  // Confere conquistas. Concede a recompensa de cada uma recém-desbloqueada.
  checkAchievements() {
    const unlocked = [];
    this.data.stats.symbolsSeen = Object.keys(this.data.collection.symbols).length;
    this.data.stats.itemsOwned = this.data.owned.length;
    this.data.stats.level = this.level;
    for (const a of ACHIEVEMENTS) {
      if (this.data.achievements[a.id]) continue;
      if ((this.data.stats[a.stat] ?? 0) >= a.target) {
        this.data.achievements[a.id] = new Date().toISOString();
        this.gain(a.reward);
        unlocked.push(a.id);
      }
    }
    return unlocked;
  }

  // Resgata a recompensa de uma missão concluída.
  claimMission(id) {
    const m = this.data.daily.missions.find((x) => x.id === id);
    const def = MISSION_POOL.find((p) => p.id === id);
    if (!m || !def || m.claimed || m.progress < def.target) return null;
    m.claimed = true;
    this.data.stats.missionsDone++;
    const fichas = this.gain(def.reward);
    const xp = this.addXp(def.xp);
    return { fichas, xp: def.xp, levelUps: xp.levelUps };
  }

  missionDef(id) {
    return MISSION_POOL.find((p) => p.id === id);
  }

  // ---------- coleção ----------
  // Registra símbolos vistos na grade. Retorna ids novos.
  recordSymbols(ids) {
    const fresh = [];
    for (const id of ids) {
      if (!SYMBOL_IDS.includes(id)) continue;
      if (!this.data.collection.symbols[id]) fresh.push(id);
      this.data.collection.symbols[id] = (this.data.collection.symbols[id] || 0) + 1;
    }
    this.data.stats.symbolsSeen = Object.keys(this.data.collection.symbols).length;
    return fresh;
  }

  // ---------- minijogos e recordes ----------
  recordMinigame(key, score, medal = 'none') {
    const best = this.data.records[key] ?? 0;
    const isRecord = score > best && score > 0;
    if (isRecord) this.data.records[key] = Math.floor(score);
    this.track('minigames', 1);
    if (MINIGAME_KEYS.includes(key)) this.track('minigame:' + key, 1);
    if (medal === 'gold') this.track('goldMedals', 1);
    return { isRecord, best: Math.max(best, score) };
  }

  // ---------- loja e inventário ----------
  itemState(id) {
    const item = CATALOG_BY_ID[id];
    if (!item) return null;
    const owned = this.data.owned.includes(id);
    const unlocked = isItemUnlockedBy(item, { level: this.level, achievements: this.data.achievements });
    const equipped = this.data.equipped[item.cat] === id;
    return { item, owned, unlocked, equipped, canBuy: !owned && unlocked && this.data.fichas >= item.price };
  }

  buyItem(id) {
    const st = this.itemState(id);
    if (!st) return { ok: false, reason: 'Item inexistente.' };
    if (st.owned) return { ok: false, reason: 'Você já tem este item.' };
    if (!st.unlocked) return { ok: false, reason: 'Ainda bloqueado.' };
    if (!this.spend(st.item.price)) return { ok: false, reason: 'Fichas insuficientes.' };
    this.data.owned.push(id);
    this.track('itemsBought', 1);
    this.checkAchievements();
    return { ok: true };
  }

  equip(id) {
    const st = this.itemState(id);
    if (!st || !st.owned) return false;
    this.data.equipped[st.item.cat] = id;
    return true;
  }

  equippedId(cat) {
    return this.data.equipped[cat];
  }

  equippedItem(cat) {
    return CATALOG_BY_ID[this.data.equipped[cat]] || null;
  }

  // ---------- configurações ----------
  setSetting(key, value) {
    if (key in this.data.settings) this.data.settings[key] = value;
  }

  categories() {
    return CATEGORIES;
  }
}
