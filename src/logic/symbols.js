// Símbolos da máquina, pesos das bobinas e tabela de pagamentos.
// Tudo é fictício: os valores são "fichas" internas sem qualquer valor monetário.

export const SYMBOLS = {
  tigre:    { id: 'tigre',    name: 'Tigrinho',      wild: true,  color: 0xff8c1a },
  bola:     { id: 'bola',     name: 'Bola Mágica',   scatter: true, color: 0x8a5cff },
  diamante: { id: 'diamante', name: 'Diamante',      color: 0x3ff3ff },
  sete:     { id: 'sete',     name: 'Sete Dourado',  color: 0xff2e9a },
  estrela:  { id: 'estrela',  name: 'Estrela',       color: 0xffd23f },
  sino:     { id: 'sino',     name: 'Sino',          color: 0xffb300 },
  cereja:   { id: 'cereja',   name: 'Cereja',        color: 0xff3b5c },
  limao:    { id: 'limao',    name: 'Limão Pop',     color: 0xb8ff3b },
};

export const SYMBOL_IDS = Object.keys(SYMBOLS);

// Pesos de cada símbolo na fita (strip) de cada bobina. Quanto maior, mais comum.
export const REEL_WEIGHTS = {
  tigre: 2,
  bola: 1,
  diamante: 2,
  sete: 3,
  estrela: 4,
  sino: 5,
  cereja: 6,
  limao: 6,
};

// Pagamento por linha: multiplicador da linha (x linhaAposta) por quantidade de símbolos iguais.
export const PAYTABLE = {
  diamante: { 3: 10, 4: 40, 5: 200 },
  sete:     { 3: 8,  4: 25, 5: 100 },
  estrela:  { 3: 6,  4: 18, 5: 60 },
  sino:     { 3: 4,  4: 12, 5: 40 },
  cereja:   { 3: 4,  4: 8,  5: 22 },
  limao:    { 3: 3,  4: 6,  5: 16 },
  tigre:    { 3: 15, 4: 50, 5: 250 }, // tigre curinga pagando como símbolo próprio
};

// Pagamento de dispersão (bola mágica em qualquer posição), multiplicador da aposta total.
export const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };
export const SCATTER_FREE_SPINS = { 3: 5, 4: 8, 5: 12 };

// Cinco linhas de pagamento: índices de linha (0 = topo, 1 = meio, 2 = base) por bobina.
export const PAYLINES = [
  { name: 'Meio', rows: [1, 1, 1, 1, 1] },
  { name: 'Topo', rows: [0, 0, 0, 0, 0] },
  { name: 'Base', rows: [2, 2, 2, 2, 2] },
  { name: 'Vale', rows: [0, 1, 2, 1, 0] },
  { name: 'Monte', rows: [2, 1, 0, 1, 2] },
];

export const REELS = 5;
export const ROWS = 3;
export const BET_OPTIONS = [10, 20, 50];

// Fita de cada bobina: lista de símbolos com repetição proporcional ao peso.
export function buildReelStrip() {
  const strip = [];
  for (const id of SYMBOL_IDS) {
    for (let i = 0; i < REEL_WEIGHTS[id]; i++) strip.push(id);
  }
  return strip;
}

export const REEL_STRIP = buildReelStrip();
