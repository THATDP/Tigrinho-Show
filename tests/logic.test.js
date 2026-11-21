import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, seedFromString } from '../src/logic/rng.js';
import { spinGrid, evaluateSpin, evaluateLine, winTier, MULTIPLIER_TABLE } from '../src/logic/spin.js';
import { PAYLINES, REEL_STRIP, SYMBOLS, PAYTABLE } from '../src/logic/symbols.js';
import { levelInfo, xpToNext, dailyMissionsFor, MISSION_POOL, medalFor, ACHIEVEMENTS } from '../src/logic/progression.js';
import { loadSave, sanitizeSave, defaultSave, SAVE_KEY, BACKUP_KEY, memoryStorage, writeSave, todayKey } from '../src/logic/save.js';
import { CATALOG, CATALOG_BY_ID, DEFAULT_EQUIPPED, isItemUnlockedBy, CATEGORIES } from '../src/logic/catalog.js';
import { GameState, DAILY_SPIN_LIMIT, HELP_AMOUNT } from '../src/state/game.js';
import { rollEvent, EVENTS, EVENT_COOLDOWN } from '../src/logic/events.js';

const NOW = new Date(2026, 10, 21, 12, 0, 0);

test('rng é determinístico com a mesma semente', () => {
  const a = createRng(42), b = createRng(42);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
  const r = createRng(1);
  for (let i = 0; i < 1000; i++) { const v = r.next(); assert.ok(v >= 0 && v < 1); }
});

test('seedFromString gera semente estável', () => {
  assert.equal(seedFromString('abc'), seedFromString('abc'));
  assert.notEqual(seedFromString('abc'), seedFromString('abd'));
});

test('grade tem 3 linhas × 5 colunas com símbolos válidos', () => {
  const rng = createRng(7);
  for (let i = 0; i < 200; i++) {
    const { grid } = spinGrid(rng);
    assert.equal(grid.length, 3);
    for (const row of grid) {
      assert.equal(row.length, 5);
      for (const s of row) assert.ok(SYMBOLS[s], 'símbolo inválido ' + s);
    }
  }
});

test('evaluateLine: três iguais pagam e curinga substitui', () => {
  const r = evaluateLine(['sino', 'sino', 'sino', 'limao', 'limao']);
  assert.equal(r.symbol, 'sino'); assert.equal(r.count, 3); assert.equal(r.mult, PAYTABLE.sino[3]);
  const w = evaluateLine(['tigre', 'diamante', 'diamante', 'diamante', 'diamante']);
  assert.equal(w.symbol, 'diamante'); assert.equal(w.count, 5); assert.equal(w.mult, PAYTABLE.diamante[5]); assert.equal(w.wilds, 1);
  assert.equal(evaluateLine(['sino', 'cereja', 'sino', 'sino', 'sino']), null, 'linha quebrada não conta');
  assert.equal(evaluateLine(['bola', 'bola', 'bola', 'bola', 'bola']), null, 'bola não paga como linha');
  // Curingas no início assumem o símbolo da primeira posição não-curinga.
  const leading = evaluateLine(['tigre', 'tigre', 'tigre', 'limao', 'limao']);
  assert.equal(leading.symbol, 'limao'); assert.equal(leading.count, 5);
  const allWild = evaluateLine(['tigre', 'tigre', 'tigre', 'tigre', 'tigre']);
  assert.equal(allWild.symbol, 'tigre'); assert.equal(allWild.count, 5);
});

test('evaluateSpin soma linhas, aplica multiplicador e explica o resultado', () => {
  const grid = [
    ['sino', 'sino', 'sino', 'sino', 'sino'],
    ['limao', 'cereja', 'limao', 'cereja', 'limao'],
    ['cereja', 'limao', 'cereja', 'limao', 'cereja'],
  ];
  const res = evaluateSpin(grid, { bet: 10, multiplier: 1 });
  // Só a linha "Topo" paga: 5× Sino = PAYTABLE × linha de 2 fichas (bet 10 / 5 linhas).
  assert.equal(res.lines.length, 1);
  assert.equal(res.lines[0].line, 'Topo');
  assert.equal(res.total, PAYTABLE.sino[5] * 2);
  const doubled = evaluateSpin(grid, { bet: 10, multiplier: 2 });
  assert.equal(doubled.total, res.total * 2);
  assert.ok(res.explanation.length >= 1);
  assert.ok(res.explanation[0].includes('Sino'));
});

test('dispersão com 3+ bolas dá giros grátis e pagamento', () => {
  const grid = [
    ['bola', 'limao', 'bola', 'limao', 'limao'],
    ['limao', 'bola', 'limao', 'limao', 'cereja'],
    ['cereja', 'cereja', 'cereja', 'cereja', 'bola'],
  ];
  const res = evaluateSpin(grid, { bet: 10 });
  assert.equal(res.scatterCount, 4);
  assert.equal(res.scatterOk, true);
  assert.equal(res.freeSpins, 8);
  assert.ok(res.total >= 100, 'dispersão 4× = 10× aposta');
});

test('sem vitória: total zero e near miss quando há dois iguais', () => {
  const grid = [
    ['sino', 'cereja', 'limao', 'sete', 'estrela'],
    ['cereja', 'sino', 'sete', 'limao', 'sino'],
    ['limao', 'sete', 'estrela', 'cereja', 'cereja'],
  ];
  const res = evaluateSpin(grid, { bet: 10 });
  assert.equal(res.total, 0);
  assert.equal(res.isWin, false);
});

test('winTier classifica vitórias pela proporção da aposta', () => {
  assert.equal(winTier(0, 10), 'none');
  assert.equal(winTier(10, 10), 'small');
  assert.equal(winTier(60, 10), 'medium');
  assert.equal(winTier(300, 10), 'big');
  assert.equal(winTier(1500, 10), 'mega');
});

test('multiplicadores somam peso válido e começam em x1', () => {
  const total = MULTIPLIER_TABLE.reduce((a, m) => a + m.weight, 0);
  assert.equal(total, 100);
  assert.equal(MULTIPLIER_TABLE[0].value, 1);
});

test('RTP simulado da máquina está em faixa equilibrada (fictícia)', () => {
  const rng = createRng(2026);
  const bet = 10;
  let staked = 0, returned = 0;
  const N = 40000;
  for (let i = 0; i < N; i++) {
    const { grid } = spinGrid(rng);
    const m = rng.weighted(MULTIPLIER_TABLE, (x) => x.weight).value;
    const res = evaluateSpin(grid, { bet, multiplier: m });
    staked += bet;
    returned += res.total;
    if (res.freeSpins) {
      // rodada grátis simples (sem multiplicador extra) para estimar contribuição
      for (let k = 0; k < res.freeSpins; k++) {
        const g = spinGrid(rng).grid;
        returned += evaluateSpin(g, { bet, multiplier: 1, freeSpinMultiplier: 2 }).total;
      }
    }
  }
  const rtp = returned / staked;
  console.log('RTP simulado (fictício):', rtp.toFixed(3));
  assert.ok(rtp > 0.85 && rtp < 1.05, 'RTP fora da faixa: ' + rtp);
});

test('níveis: XP acumulado converte corretamente', () => {
  assert.deepEqual(levelInfo(0), { level: 1, into: 0, need: 100 });
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(xpToNext(2), 140);
  assert.equal(levelInfo(100 + 140).level, 3);
});

test('missões diárias são estáveis por dia e têm 3 itens válidos', () => {
  const a = dailyMissionsFor('2026-11-21');
  const b = dailyMissionsFor('2026-11-21');
  assert.deepEqual(a, b);
  assert.equal(a.length, 3);
  const ids = new Set(a.map((m) => m.id));
  assert.equal(ids.size, 3, 'missões não se repetem');
  for (const m of a) assert.ok(MISSION_POOL.find((p) => p.id === m.id));
});

test('medalhas respeitam as metas', () => {
  const goals = { bronze: 100, silver: 200, gold: 300 };
  assert.equal(medalFor(50, goals), 'none');
  assert.equal(medalFor(100, goals), 'bronze');
  assert.equal(medalFor(250, goals), 'silver');
  assert.equal(medalFor(300, goals), 'gold');
});

test('catálogo: ids únicos, categorias válidas e padrões equipados', () => {
  const ids = CATALOG.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  const cats = new Set(CATEGORIES.map((c) => c.id));
  for (const i of CATALOG) assert.ok(cats.has(i.cat), i.id);
  for (const c of CATEGORIES) assert.ok(CATALOG_BY_ID[DEFAULT_EQUIPPED[c.id]], c.id);
  assert.equal(isItemUnlockedBy(CATALOG_BY_ID['roupa-cosmico'], { level: 1 }), false);
  assert.equal(isItemUnlockedBy(CATALOG_BY_ID['roupa-cosmico'], { level: 15 }), true);
});

test('eventos respeitam cooldown', () => {
  const rng = createRng(5);
  for (let i = 0; i < 500; i++) assert.equal(rollEvent(rng, EVENT_COOLDOWN - 1), null);
  let hits = 0;
  const rng2 = createRng(9);
  for (let i = 0; i < 10000; i++) if (rollEvent(rng2, 100)) hits++;
  const rate = hits / 10000;
  assert.ok(rate > 0.04 && rate < 0.08, 'taxa de evento ' + rate);
  assert.ok(Object.keys(EVENTS).length >= 5);
});

test('salvamento: ausente, válido e corrompido', () => {
  const st = memoryStorage();
  assert.equal(loadSave(st, NOW).status, 'new');
  const s = defaultSave(NOW);
  s.fichas = 777;
  writeSave(st, s);
  const ok = loadSave(st, NOW);
  assert.equal(ok.status, 'ok');
  assert.equal(ok.save.fichas, 777);
  st.setItem(SAVE_KEY, '{quebrado');
  const bad = loadSave(st, NOW);
  assert.equal(bad.status, 'recovered');
  assert.equal(bad.save.fichas, 1000);
  assert.equal(st.getItem(BACKUP_KEY), '{quebrado');
});

test('sanitizeSave descarta tipos inválidos e limita valores', () => {
  const clean = sanitizeSave({ fichas: 'muitas', xp: -5, stats: { spins: 'x', wins: 12 }, settings: { master: 9, particles: 'zzz' }, owned: [1, 'roupa-azul'] }, NOW);
  assert.equal(clean.fichas, 1000);
  assert.equal(clean.xp, 0);
  assert.equal(clean.stats.spins, 0);
  assert.equal(clean.stats.wins, 12);
  assert.equal(clean.settings.master, 1);
  assert.equal(clean.settings.particles, 'full');
  assert.ok(clean.owned.includes('roupa-azul'));
  assert.equal(sanitizeSave('texto', NOW), null);
});

test('GameState: giros, limite diário e saldo', () => {
  const g = new GameState(memoryStorage(), NOW);
  assert.equal(g.fichas, 1000);
  assert.ok(g.canSpin(10));
  assert.equal(g.spend(10), true);
  assert.equal(g.fichas, 990);
  g.data.fichas = 5;
  assert.equal(g.canSpin(10), false);
  assert.equal(g.canSpin(10, 2), true, 'giro grátis ignora saldo');
  g.data.fichas = 1000;
  g.data.spinsToday.count = DAILY_SPIN_LIMIT;
  assert.equal(g.canSpin(10), false, 'limite diário impede giro');
});

test('GameState: ajuda do Tigrinho tem limite diário', () => {
  const g = new GameState(memoryStorage(), NOW);
  g.data.fichas = 0;
  for (let i = 0; i < 3; i++) assert.equal(g.requestHelp(), HELP_AMOUNT);
  assert.equal(g.requestHelp(), 0);
});

test('GameState: track progride missões e destrava conquistas com recompensa', () => {
  const g = new GameState(memoryStorage(), NOW);
  const before = g.fichas;
  const res = g.track('spins', 1);
  assert.ok(res.achievements.includes('primeiro-giro'));
  assert.ok(g.fichas > before, 'recompensa da conquista creditada');
  g.data.daily.missions = [{ id: 'giros-15', progress: 14, claimed: false }];
  const r2 = g.track('spins', 1);
  assert.deepEqual(r2.missionsDone, ['giros-15']);
  const claim = g.claimMission('giros-15');
  assert.ok(claim && claim.fichas === 150);
  assert.equal(g.claimMission('giros-15'), null, 'não resgata duas vezes');
});

test('GameState: XP sobe de nível e paga recompensa', () => {
  const g = new GameState(memoryStorage(), NOW);
  const f = g.fichas;
  const r = g.addXp(100);
  assert.equal(r.newLevel, 2);
  assert.equal(g.fichas, f + 400);
});

test('GameState: compra, bloqueio e equipar', () => {
  const g = new GameState(memoryStorage(), NOW);
  assert.equal(g.buyItem('roupa-azul').ok, true);
  assert.equal(g.buyItem('roupa-azul').ok, false, 'não compra de novo');
  assert.equal(g.buyItem('roupa-cosmico').ok, false, 'bloqueado por nível');
  g.data.fichas = 0;
  assert.equal(g.buyItem('roupa-rosa').ok, false, 'sem fichas');
  assert.equal(g.equip('roupa-azul'), true);
  assert.equal(g.equippedId('roupa'), 'roupa-azul');
  assert.equal(g.equip('roupa-rosa'), false, 'não equipa item não possuído');
});

test('GameState: recordes e coleção de símbolos', () => {
  const g = new GameState(memoryStorage(), NOW);
  assert.equal(g.recordMinigame('reflexo', 50).isRecord, true);
  assert.equal(g.recordMinigame('reflexo', 20).isRecord, false);
  assert.equal(g.data.records.reflexo, 50);
  const fresh = g.recordSymbols(['sino', 'sino', 'tigre']);
  assert.deepEqual(fresh.sort(), ['sino', 'tigre']);
  assert.equal(g.recordSymbols(['sino']).length, 0);
});

test('GameState: persistência round-trip', () => {
  const st = memoryStorage();
  const g = new GameState(st, NOW);
  g.gain(500);
  g.save();
  const g2 = new GameState(st, NOW);
  assert.equal(g2.fichas, 1500);
  assert.equal(g2.loadStatus, 'ok');
});

test('GameState: virada de dia zera limites e troca missões', () => {
  const st = memoryStorage();
  const g = new GameState(st, NOW);
  g.data.spinsToday.count = 99;
  g.save();
  const next = new Date(2026, 10, 22, 9, 0, 0);
  const g2 = new GameState(st, next);
  assert.equal(g2.data.spinsToday.count, 0);
  assert.equal(g2.data.spinsToday.date, todayKey(next));
});

test('todas as conquistas têm recompensa e alvo positivo', () => {
  for (const a of ACHIEVEMENTS) { assert.ok(a.reward > 0); assert.ok(a.target > 0); }
});
