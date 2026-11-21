// Loja fictícia de cosméticos: compre com fichas fictícias e equipe.
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS } from '../config.js';
import { CATALOG, CATEGORIES, unlockText } from '../logic/catalog.js';
import { makeBackground, makeButton, text, fmt, toast, sceneTheme, backButton, header, tween } from '../ui/ui.js';
import { itemCard, describeState, categoryTabs } from '../ui/cosmetics.js';
import { Tiger } from '../objects/Tiger.js';

export class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }

  create() {
    super.create();
    this.cat = this.registry.get('shopCat') || 'roupa';
    makeBackground(this, sceneTheme());
    header(this, 'LOJA FICTÍCIA', 'Cosméticos puramente visuais · pagos com fichas fictícias');
    this.balance = text(this, 1180, 48, '', { size: 22, color: '#ffd23f', font: 'Arial Black, sans-serif', align: 'right', origin: 1 });
    backButton(this);
    this.grid = this.add.container(0, 0);
    this.renderTabs();
    this.renderGrid();
    text(this, W / 2, H - 22, 'Itens desbloqueiam por nível e conquistas. Nenhum item tem valor real.', { size: 14, color: '#b9a6dd', shadow: false });
  }

  renderTabs() {
    if (this.tabs) this.tabs.forEach((t) => t.destroy());
    this.tabs = categoryTabs(this, 128, this.cat, (id) => {
      this.cat = id;
      this.registry.set('shopCat', id);
      ctx.audio && ctx.audio.sfx('click');
      this.renderTabs();
      this.renderGrid();
    }, makeButton);
  }

  renderGrid() {
    this.grid.removeAll(true);
    const g = ctx.game;
    this.balance.setText(`${fmt(g.fichas)} fichas`);
    const items = CATALOG.filter((i) => i.cat === this.cat);
    const cols = 4, cw = 280, ch = 176, gap = 22;
    const startX = (W - (cols * cw + (cols - 1) * gap)) / 2 + cw / 2;
    items.forEach((item, i) => {
      const x = startX + (i % cols) * (cw + gap);
      const y = 255 + Math.floor(i / cols) * (ch + 18);
      const st = describeState(g, item);
      const card = itemCard(this, x, y, cw, ch, item, st, { onSelect: () => this.act(item) });
      this.grid.add(card);
      const label = this.actionLabel(item, st);
      const btn = makeButton(this, x, y + ch / 2 - 26, 200, 40, label.text, () => this.act(item), {
        color: label.color, size: 14, disabled: label.disabled,
      });
      this.grid.add(btn);
    });
  }

  actionLabel(item, st) {
    if (st.equipped) return { text: 'EQUIPADO', color: COLORS.green, disabled: true };
    if (st.owned) return { text: 'EQUIPAR', color: COLORS.cyan, disabled: false };
    if (!st.unlocked) return { text: 'BLOQUEADO', color: 0x4a4458, disabled: true };
    if (item.price === 0) return { text: 'RESGATAR', color: COLORS.green, disabled: false };
    if (ctx.game.fichas < item.price) return { text: 'SEM FICHAS', color: 0x4a4458, disabled: true };
    return { text: `COMPRAR ${fmt(item.price)}`, color: COLORS.gold, disabled: false };
  }

  act(item) {
    const g = ctx.game;
    const st = describeState(g, item);
    if (st.equipped) return;
    if (st.owned) {
      g.equip(item.id);
      ctx.audio && ctx.audio.sfx('equip');
      toast(this, `${item.name} equipado!`, '#3bdc7a', 120);
    } else {
      if (!st.unlocked) {
        ctx.audio && ctx.audio.sfx('error');
        return toast(this, `Ainda bloqueado: ${unlockText(item) || 'continue jogando'}`, '#ff8c1a', 120);
      }
      const res = g.buyItem(item.id);
      if (!res.ok) {
        ctx.audio && ctx.audio.sfx('error');
        return toast(this, res.reason, '#ff8c1a', 120);
      }
      g.equip(item.id);
      ctx.audio && ctx.audio.sfx('buy');
      const out = g.checkAchievements();
      toast(this, item.price ? `Comprou ${item.name}!` : `Resgatou ${item.name}!`, '#ffd23f', 120);
      for (const id of out) toast(this, `🏆 Conquista desbloqueada!`, '#ffd23f', 160);
    }
    g.save();
    this.renderGrid();
  }
}
