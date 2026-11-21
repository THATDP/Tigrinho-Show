// Helpers visuais compartilhados por Loja, Inventário e Coleção.
import Phaser from 'phaser';
import { RARITIES, CATEGORIES, unlockText, isItemUnlockedBy } from '../logic/catalog.js';
import { text, makePanel } from './ui.js';

export const RARITY_HEX = {
  comum: 0xb8c4d6, raro: 0x3ff3ff, epico: 0xc77dff, lendario: 0xffd23f,
};

// Cor representativa de um item (para a "amostra" do cartão).
export function swatchColors(item) {
  const v = item.value;
  if (typeof v === 'number') return [v];
  if (Array.isArray(v)) return v.map((c) => parseInt(c.slice(1), 16));
  if (v && typeof v === 'object') return [v.body || v.top, v.trim || v.glow].filter((c) => c !== undefined);
  return [0x6b5a80, 0x9a86c6];
}

export function drawSwatch(scene, x, y, item, size = 46) {
  const cols = swatchColors(item);
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    g.fillStyle(cols[i], 1);
    const w = size / n;
    g.fillRoundedRect(-size / 2 + i * w, -size / 2, w, size, 10);
  }
  g.lineStyle(2, 0xffffff, 0.6);
  g.strokeRoundedRect(-size / 2, -size / 2, size, size, 10);
  c.add(g);
  if (typeof item.value === 'string') {
    c.add(text(scene, 0, 0, '★', { size: 22, color: '#ffffff' }));
  }
  return c;
}

export function catName(id) {
  return (CATEGORIES.find((c) => c.id === id) || {}).name || id;
}

export function rarityColor(rarity) {
  return Phaser.Display.Color.HexStringToColor(RARITIES[rarity].color).color;
}

// Abas de categoria: retorna um array de { id, btn }.
export function categoryTabs(scene, y, active, onSelect, makeButton) {
  const x0 = 640 - ((CATEGORIES.length * 150 + (CATEGORIES.length - 1) * 6) / 2) + 75;
  return CATEGORIES.map((c, i) => {
    const on = c.id === active;
    const btn = makeButton(scene, x0 + i * 156, y, 150, 40, c.name, () => onSelect(c.id), {
      color: on ? 0xffd23f : 0x3a2a5c, textColor: on ? '#1a0a2e' : '#e8dcff', size: 13, sound: true,
    });
    return btn;
  });
}

// Cartão de item (usado na loja, inventário e coleção).
export function itemCard(scene, x, y, w, h, item, state, handlers = {}) {
  const c = scene.add.container(x, y);
  const rc = rarityColor(item.rarity);
  c.add(makePanel(scene, -w / 2, -h / 2, w, h, { color: 0x140624, alpha: 0.95, stroke: rc, radius: 16, strokeW: 3 }));
  c.add(text(scene, -w / 2 + 16, -h / 2 + 14, RARITIES[item.rarity].name.toUpperCase(), { size: 12, color: RARITIES[item.rarity].color, font: 'Arial Black, sans-serif', align: 'left', origin: 0 }));
  c.add(drawSwatch(scene, w / 2 - 44, -h / 2 + 52, item, 52));
  c.add(text(scene, -w / 2 + 14, -h / 2 + 40, item.name, { size: w < 260 ? 14 : 15, color: '#ffffff', bold: true, align: 'left', origin: 0, wrap: w - 130 }));
  let status = '';
  if (state.equipped) status = 'EQUIPADO';
  else if (state.owned) status = 'POSSUÍDO';
  else if (!state.unlocked) status = unlockText(item) || 'BLOQUEADO';
  else status = item.price === 0 ? 'GRÁTIS' : `${item.price.toLocaleString('pt-BR')} fichas`;
  c.add(text(scene, -w / 2 + 14, h / 2 - 66, status, { size: 12, color: state.equipped ? '#3bdc7a' : (state.owned ? '#3ff3ff' : '#d9c8ff'), align: 'left', origin: 0, wrap: w - 28 }));
  c.setSize(w, h);
  if (handlers.onSelect) {
    const hit = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => handlers.onSelect());
    c.add(hit);
  }
  return c;
}

export function describeState(game, item) {
  return {
    owned: game.data.owned.includes(item.id),
    equipped: game.data.equipped[item.cat] === item.id,
    unlocked: isItemUnlockedBy(item, { level: game.level, achievements: game.data.achievements }),
  };
}
