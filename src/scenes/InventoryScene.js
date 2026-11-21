// Inventário: equipe roupas, acessórios, expressões, animações, cenários, temas, efeitos e molduras.
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS } from '../config.js';
import { CATALOG, CATEGORIES } from '../logic/catalog.js';
import { makeBackground, makeButton, text, toast, sceneTheme, backButton, header, makePanel } from '../ui/ui.js';
import { itemCard, describeState, categoryTabs } from '../ui/cosmetics.js';
import { Tiger } from '../objects/Tiger.js';

export class InventoryScene extends BaseScene {
  constructor() { super('InventoryScene'); }

  create() {
    super.create();
    this.cat = this.registry.get('invCat') || 'roupa';
    makeBackground(this, sceneTheme());
    header(this, 'INVENTÁRIO', 'Escolha como o Tigrinho aparece no palco');
    backButton(this);
    makePanel(this, 40, 170, 380, 520, { color: 0x140624, alpha: 0.7, stroke: COLORS.cyan });
    this.add.image(230, 552, 'pedestal').setScale(0.9);
    this.tiger = new Tiger(this, 230, 360, { scale: 0.9 });
    this.equipText = text(this, 230, 628, '', { size: 12, color: '#e8dcff', wrap: 350, shadow: false });
    this.gridBox = this.add.container(0, 0);
    this.renderAll();
  }

  renderAll() {
    this.renderTabs();
    this.renderGrid();
  }

  renderTabs() {
    if (this.tabs) this.tabs.forEach((t) => t.destroy());
    this.tabs = categoryTabs(this, 128, this.cat, (id) => {
      this.cat = id;
      this.registry.set('invCat', id);
      ctx.audio && ctx.audio.sfx('click');
      this.renderAll();
    }, makeButton);
  }

  renderGrid() {
    this.gridBox.removeAll(true);
    const g = ctx.game;
    const owned = CATALOG.filter((i) => i.cat === this.cat && g.data.owned.includes(i.id));
    const cols = 3, cw = 250, ch = 150, gap = 20;
    const startX = 460 + cw / 2;
    if (!owned.length) {
      this.gridBox.add(text(this, 850, 380, 'Nada aqui ainda.\nCompre na LOJA!', { size: 22, color: '#d9c8ff' }));
    }
    owned.forEach((item, i) => {
      const x = startX + (i % cols) * (cw + gap);
      const y = 250 + Math.floor(i / cols) * (ch + 16);
      const st = describeState(g, item);
      this.gridBox.add(itemCard(this, x, y, cw, ch, item, st));
      const label = st.equipped ? 'EQUIPADO' : 'EQUIPAR';
      this.gridBox.add(makeButton(this, x, y + ch / 2 - 26, 180, 40, label, () => this.equip(item), {
        color: st.equipped ? COLORS.green : COLORS.cyan, textColor: st.equipped ? '#ffffff' : '#1a0a2e', size: 14, disabled: st.equipped,
      }));
    });
    // Status do equipado
    const eq = CATEGORIES.map((c) => {
      const it = g.equippedItem(c.id);
      return `${c.name}: ${it ? it.name : '—'}`;
    });
    // (resumo exibido abaixo do mascote)
    this.equipText.setText(eq.join('   ·   '));
    this.tiger.refreshOutfit();
  }

  equip(item) {
    if (!ctx.game.equip(item.id)) return;
    ctx.audio && ctx.audio.sfx('equip');
    ctx.game.save();
    this.tiger.refreshOutfit();
    toast(this, `${item.name} equipado!`, '#3bdc7a', 120);
    this.renderGrid();
    this.tiger.squash(0.08);
  }
}
