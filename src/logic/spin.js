// Motor de giro: gera a grade, avalia linhas e dispersão, sorteia multiplicador
// e devolve uma explicação legível do resultado. 100% determinístico com um RNG injetado.
import {
  SYMBOLS, PAYTABLE, PAYLINES, SCATTER_PAY, SCATTER_FREE_SPINS,
  REEL_STRIP, REELS, ROWS,
} from './symbols.js';

// Multiplicadores fictícios aplicados às linhas vencedoras.
export const MULTIPLIER_TABLE = [
  { value: 1, weight: 60, label: 'Normal' },
  { value: 2, weight: 25, label: 'Dobrado!' },
  { value: 3, weight: 10, label: 'Triplicado!!' },
  { value: 5, weight: 4, label: 'Quíntuplo!!!' },
  { value: 10, weight: 1, label: 'LENDÁRIO!!!!' },
];

// Grade: cada bobina escolhe uma posição da fita e mostra ROWS símbolos consecutivos (cíclico).
export function spinGrid(rng) {
  const stops = [];
  const grid = [];
  for (let r = 0; r < REELS; r++) {
    const pos = rng.int(0, REEL_STRIP.length);
    stops.push(pos);
  }
  for (let row = 0; row < ROWS; row++) {
    const line = [];
    for (let r = 0; r < REELS; r++) {
      line.push(REEL_STRIP[(stops[r] + row) % REEL_STRIP.length]);
    }
    grid.push(line);
  }
  return { grid, stops };
}

// Sorteia o multiplicador fictício.
export function rollMultiplier(rng) {
  return rng.weighted(MULTIPLIER_TABLE, (m) => m.weight);
}

// Avalia uma linha: a partir da bobina 0, conta símbolos iguais (curingas substituem).
export function evaluateLine(symbols) {
  let target = null;
  for (const s of symbols) {
    if (!SYMBOLS[s].wild) { target = s; break; }
  }
  if (target === null) target = 'tigre'; // linha só de curingas
  let count = 0;
  let wilds = 0;
  for (const s of symbols) {
    if (s === target) count++;
    else if (SYMBOLS[s].wild) { count++; wilds++; }
    else break;
  }
  if (count < 3 || !PAYTABLE[target]) return null;
  const mult = PAYTABLE[target][Math.min(count, 5)];
  if (!mult) return null;
  return { symbol: target, count, wilds, mult };
}

// Avalia o giro completo. `bet` é a aposta total fictícia (dividida entre as linhas).
// Retorna { lines, scatter, total, freeSpins, multiplier, explanation[], nearMiss }.
export function evaluateSpin(grid, { bet, multiplier = 1, freeSpinMultiplier = 1 }) {
  const lineBet = bet / PAYLINES.length;
  const lines = [];
  for (const pl of PAYLINES) {
    const syms = pl.rows.map((row, reel) => grid[row][reel]);
    const res = evaluateLine(syms);
    if (res) {
      lines.push({ line: pl.name, rows: pl.rows, ...res, base: res.mult * lineBet });
    }
  }

  // Dispersão: bolas mágicas em qualquer lugar da grade.
  let scatterCount = 0;
  for (const row of grid) for (const s of row) if (s === 'bola') scatterCount++;
  const scatterOk = scatterCount >= 3;
  const scatterCountClamped = Math.min(scatterCount, 5);
  const scatterMult = scatterOk ? SCATTER_PAY[scatterCountClamped] * bet : 0;
  const freeSpins = scatterOk ? SCATTER_FREE_SPINS[scatterCountClamped] : 0;

  const mult = multiplier * freeSpinMultiplier;
  const explanation = [];
  let total = 0;
  for (const l of lines) {
    const pay = l.base * mult;
    total += pay;
    const wildTxt = l.wilds ? ` (com ${l.wilds} Tigrinho curinga)` : '';
    explanation.push(
      `Linha ${l.line}: ${l.count}× ${SYMBOLS[l.symbol].name}${wildTxt} = +${pay}`,
    );
  }
  if (scatterOk) {
    total += scatterMult * freeSpinMultiplier;
    explanation.push(
      `Bolas Mágicas ×${scatterCount}: +${scatterMult * freeSpinMultiplier} e ${freeSpins} giros grátis!`,
    );
  }
  if (lines.length && mult > 1) {
    explanation.push(`Multiplicador ×${mult} aplicado às linhas.`);
  }

  // Quase-acerto: dois símbolos iguais em alguma linha (para feedback engraçado).
  let nearMiss = false;
  if (!lines.length) {
    for (const pl of PAYLINES) {
      const syms = pl.rows.map((row, reel) => grid[row][reel]);
      if (syms[0] === syms[1] && !SYMBOLS[syms[0]].scatter) { nearMiss = true; break; }
    }
  }

  return {
    lines,
    scatterCount,
    scatterOk,
    freeSpins,
    total,
    multiplier: mult,
    explanation,
    nearMiss,
    isWin: total > 0,
  };
}

// Conta quais símbolos apareceram na grade (para a coleção).
export function symbolsInGrid(grid) {
  const set = new Set();
  for (const row of grid) for (const s of row) set.add(s);
  return [...set];
}

// Classifica a vitória para efeitos e feedback.
export function winTier(total, bet) {
  if (total <= 0) return 'none';
  const ratio = total / bet;
  if (ratio >= 100) return 'mega';
  if (ratio >= 25) return 'big';
  if (ratio >= 5) return 'medium';
  return 'small';
}
