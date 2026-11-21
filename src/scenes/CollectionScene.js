// Coleção: símbolos descobertos na máquina e todos os cosméticos (com raridades).
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS } from '../config.js';
import { SYMBOLS, SYMBOL_IDS } from '../logic/symbols.js';
import { CATALOG, RARITIES } from '../logic/catalog.js';
import { makeBackground, makePanel, text, fmt, header, backButton, sceneTheme } from '../ui/ui.js';
import { rarityColor, drawSwatch } from '../ui/cosmetics.js';

export class CollectionScene extends BaseScene {
  constructor() { super('CollectionScene'); }

  create() {
    super.create();
    const g = ctx.game;
    makeBackground(this, sceneTheme());
    header(this, 'COLEÇÃO', 'Descubra todos os símbolos e colecione cosméticos');
    backButton(this);

    // Símbolos
    const seen = Object.keys(g.data.collection.symbols).length;
    text(this, 80, 130, `SÍMBOLOS DA MÁQUINA  ${seen}/${SYMBOL_IDS.length}`, { size: 18, color: '#3ff3ff', font: 'Arial Black, sans-serif', align: 'left', origin: 0 });
    makePanel(this, 60, 150, 1160, 150, { color: 0x140624, alpha: 0.9, stroke: COLORS.cyan, radius: 18 });
    SYMBOL_IDS.forEach((id, i) => {
      const x = 60 + 72 + i * 135, y = 225;
      const count = g.data.collection.symbols[id] || 0;
      const img = this.add.image(x, y - 14, `sym-${id}`).setScale(0.6);
      if (!count) img.setTint(0x000000).setAlpha(0.5);
      text(this, x, y + 46, count ? SYMBOLS[id].name : '???', { size: 13, color: count ? '#ffffff' : '#6b5a80', bold: true });
      text(this, x, y + 62, count ? `visto ${fmt(count)}×` : 'não descoberto', { size: 11, color: count ? '#3bdc7a' : '#6b5a80', shadow: false });
    });

    // Cosméticos
    const owned = CATALOG.filter((c) => g.data.owned.includes(c.id)).length;
    text(this, 80, 326, `COSMÉTICOS  ${owned}/${CATALOG.length}`, { size: 18, color: '#ffd23f', font: 'Arial Black, sans-serif', align: 'left', origin: 0 });
    const cols = 10, cw = 112, ch = 66, gap = 6;
    const sx = 60 + cw / 2 + 4, sy = 380;
    CATALOG.forEach((item, i) => {
      const x = sx + (i % cols) * (cw + gap);
      const y = sy + Math.floor(i / cols) * (ch + gap);
      const isOwned = g.data.owned.includes(item.id);
      const rc = rarityColor(item.rarity);
      const panel = makePanel(this, x - cw / 2, y - ch / 2, cw, ch, { color: isOwned ? 0x2a0f40 : 0x0b0319, alpha: 0.95, stroke: isOwned ? rc : 0x3a3050, radius: 10, strokeW: isOwned ? 3 : 1 });
      void panel;
      this.add.rectangle(x - cw / 2 + 8, y - ch / 2 + 8, 8, 8, rc).setOrigin(0.5);
      const name = isOwned ? item.name : '???';
      text(this, x, y + 4, name, { size: 11, color: isOwned ? '#ffffff' : '#6b5a80', wrap: cw - 10, bold: isOwned });
      text(this, x, y + 24, RARITIES[item.rarity].name, { size: 10, color: isOwned ? RARITIES[item.rarity].color : '#4a4458', shadow: false });
      text(this, x, y - 22, item.cat.toUpperCase(), { size: 9, color: '#9a86c6', shadow: false });
    });
    text(this, W / 2, H - 20, 'Cosméticos são apenas visuais. Raridade é só um selo de colecionador.', { size: 13, color: '#b9a6dd', shadow: false });
  }
}
