// Catálogo cosmético. Tudo é puramente visual e fictício — sem valor financeiro.
export const CATEGORIES = [
  { id: 'roupa', name: 'Roupas' },
  { id: 'acessorio', name: 'Acessórios' },
  { id: 'expressao', name: 'Expressões' },
  { id: 'animacao', name: 'Animações' },
  { id: 'cenario', name: 'Cenários' },
  { id: 'tema', name: 'Temas da Máquina' },
  { id: 'efeito', name: 'Efeitos de Vitória' },
  { id: 'moldura', name: 'Molduras' },
];

export const RARITIES = {
  comum: { name: 'Comum', color: '#b8c4d6' },
  raro: { name: 'Raro', color: '#3ff3ff' },
  epico: { name: 'Épico', color: '#c77dff' },
  lendario: { name: 'Lendário', color: '#ffd23f' },
};

// `value` é usado pelo renderizador (cor, estilo). `unlock` pode exigir nível ou conquista.
export const CATALOG = [
  // Roupas (cor do colete / manto do tigrinho)
  { id: 'roupa-laranja', cat: 'roupa', name: 'Pelagem Clássica', rarity: 'comum', price: 0, value: 0xff8c1a },
  { id: 'roupa-azul', cat: 'roupa', name: 'Colete Azul-Safira', rarity: 'comum', price: 150, value: 0x3a7bff },
  { id: 'roupa-rosa', cat: 'roupa', name: 'Colete Rosa Chiclete', rarity: 'comum', price: 200, value: 0xff5fb0 },
  { id: 'roupa-neon', cat: 'roupa', name: 'Jaqueta Neon', rarity: 'raro', price: 600, value: 0x3ff3ff },
  { id: 'roupa-smoking', cat: 'roupa', name: 'Smoking Dourado', rarity: 'epico', price: 1500, value: 0xffd23f },
  { id: 'roupa-cosmico', cat: 'roupa', name: 'Manto Cósmico', rarity: 'lendario', price: 0, value: 0x8a5cff, unlock: { level: 15 } },

  // Acessórios
  { id: 'acc-nenhum', cat: 'acessorio', name: 'Sem acessório', rarity: 'comum', price: 0, value: 'none' },
  { id: 'acc-oculos', cat: 'acessorio', name: 'Óculos Redondos', rarity: 'comum', price: 120, value: 'glasses' },
  { id: 'acc-laco', cat: 'acessorio', name: 'Laço Borboleta', rarity: 'comum', price: 100, value: 'bow' },
  { id: 'acc-cartola', cat: 'acessorio', name: 'Cartola de Mágico', rarity: 'raro', price: 700, value: 'top' },
  { id: 'acc-coroa', cat: 'acessorio', name: 'Coroa de Estrelas', rarity: 'epico', price: 1500, value: 'crown', unlock: { level: 8 } },
  { id: 'acc-tiara', cat: 'acessorio', name: 'Tiara de Diamante', rarity: 'lendario', price: 0, value: 'tiara', unlock: { achievement: 'mestre-sorte' } },

  // Expressões (estilo dos olhos e do sorriso)
  { id: 'exp-padrao', cat: 'expressao', name: 'Olhar Padrão', rarity: 'comum', price: 0, value: 'default' },
  { id: 'exp-piscadinha', cat: 'expressao', name: 'Piscadinha Maroto', rarity: 'comum', price: 250, value: 'wink' },
  { id: 'exp-estrela', cat: 'expressao', name: 'Olhos de Estrela', rarity: 'raro', price: 500, value: 'star' },
  { id: 'exp-brava', cat: 'expressao', name: 'Cara de Brabo', rarity: 'raro', price: 800, value: 'angry' },
  { id: 'exp-sonhadora', cat: 'expressao', name: 'Olhar Sonhador', rarity: 'epico', price: 1200, value: 'dreamy', unlock: { level: 10 } },

  // Animações de comemoração
  { id: 'anim-pulo', cat: 'animacao', name: 'Pulinho', rarity: 'comum', price: 0, value: 'jump' },
  { id: 'anim-samba', cat: 'animacao', name: 'Requebrado de Samba', rarity: 'raro', price: 400, value: 'samba' },
  { id: 'anim-backflip', cat: 'animacao', name: 'Cambalhota Épica', rarity: 'epico', price: 1000, value: 'flip', unlock: { level: 12 } },

  // Cenários do palco
  { id: 'cen-circo', cat: 'cenario', name: 'Circo Noturno', rarity: 'comum', price: 0, value: { top: 0x3a0b66, bottom: 0x12031f, glow: 0xff2e9a } },
  { id: 'cen-selva', cat: 'cenario', name: 'Selva Dourada', rarity: 'comum', price: 400, value: { top: 0x174d2a, bottom: 0x06160c, glow: 0xffd23f } },
  { id: 'cen-praia', cat: 'cenario', name: 'Praia Neon', rarity: 'raro', price: 600, value: { top: 0x0a3d6b, bottom: 0x03101f, glow: 0x3ff3ff } },
  { id: 'cen-galaxia', cat: 'cenario', name: 'Galáxia Doce', rarity: 'epico', price: 1500, value: { top: 0x2a0a5e, bottom: 0x05010f, glow: 0xc77dff } },
  { id: 'cen-vulcao', cat: 'cenario', name: 'Vulcão Festivo', rarity: 'lendario', price: 0, value: { top: 0x5c1500, bottom: 0x140200, glow: 0xff6a00 }, unlock: { level: 18 } },

  // Temas da máquina (cor do gabinete)
  { id: 'tema-classico', cat: 'tema', name: 'Clássico Vermelho', rarity: 'comum', price: 0, value: { body: 0xb3123a, trim: 0xffd23f } },
  { id: 'tema-cyber', cat: 'tema', name: 'Cyber Azul', rarity: 'comum', price: 350, value: { body: 0x1545a8, trim: 0x3ff3ff } },
  { id: 'tema-ouro', cat: 'tema', name: 'Ouro Real', rarity: 'raro', price: 900, value: { body: 0x8a5a00, trim: 0xfff3a1 } },
  { id: 'tema-noite', cat: 'tema', name: 'Noite Roxa', rarity: 'epico', price: 1800, value: { body: 0x4a1480, trim: 0xff5fb0 } },

  // Efeitos de vitória (partículas)
  { id: 'ef-confete', cat: 'efeito', name: 'Chuva de Confete', rarity: 'comum', price: 0, value: ['#ffd23f', '#ff2e9a', '#3ff3ff', '#ffffff'] },
  { id: 'ef-raios', cat: 'efeito', name: 'Raios Elétricos', rarity: 'comum', price: 300, value: ['#3ff3ff', '#ffffff'] },
  { id: 'ef-coracoes', cat: 'efeito', name: 'Chuva de Corações', rarity: 'raro', price: 500, value: ['#ff5fb0', '#ff2e9a', '#ffd6ea'] },
  { id: 'ef-fogos', cat: 'efeito', name: 'Fogos de Artifício', rarity: 'epico', price: 1200, value: ['#ff8c1a', '#ffd23f', '#ff3b5c', '#ffffff'] },
  { id: 'ef-estrelas', cat: 'efeito', name: 'Estrelas Cadentes', rarity: 'lendario', price: 0, value: ['#fff7b0', '#ffd23f', '#ffffff'], unlock: { achievement: 'colecionador' } },

  // Molduras das bobinas
  { id: 'mol-simples', cat: 'moldura', name: 'Moldura Simples', rarity: 'comum', price: 0, value: 'plain' },
  { id: 'mol-pisca', cat: 'moldura', name: 'Moldura Pisca-Pisca', rarity: 'comum', price: 200, value: 'blink' },
  { id: 'mol-diamante', cat: 'moldura', name: 'Moldura Diamante', rarity: 'raro', price: 800, value: 'diamond' },
  { id: 'mol-arco', cat: 'moldura', name: 'Arco-Íris Glam', rarity: 'epico', price: 1400, value: 'rainbow' },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((i) => [i.id, i]));

// Item padrão (gratuito) de cada categoria: sempre possuído e equipado no início.
export const DEFAULT_EQUIPPED = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, CATALOG.find((i) => i.cat === c.id && i.price === 0 && !i.unlock).id]),
);
// Acessório "nenhum" é o padrão, e a expressão padrão é "Olhar Padrão".
DEFAULT_EQUIPPED.acessorio = 'acc-nenhum';

export function isItemUnlockedBy(item, { level = 1, achievements = {} }) {
  if (!item.unlock) return true;
  if (item.unlock.level) return level >= item.unlock.level;
  if (item.unlock.achievement) return !!achievements[item.unlock.achievement];
  return false;
}

export function unlockText(item) {
  if (!item.unlock) return '';
  if (item.unlock.level) return `Desbloqueia no nível ${item.unlock.level}`;
  if (item.unlock.achievement) {
    return `Conquista: ${ACH_NAMES[item.unlock.achievement] || item.unlock.achievement}`;
  }
  return '';
}

// Nomes de conquistas usados em textos do catálogo (evita dependência circular).
const ACH_NAMES = {
  'mestre-sorte': 'Mestre da Sorte',
  colecionador: 'Colecionador',
};
