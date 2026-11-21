import Phaser from 'phaser';
// Menu de minijogos: cartões com regras resumidas, recordes e entrada direta.
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS } from '../config.js';
import { MINIGAME_LIST } from '../minigames/index.js';
import { makeBackground, makeButton, text, fmt, makePanel, header, backButton, sceneTheme } from '../ui/ui.js';
import { Tiger } from '../objects/Tiger.js';
import { MEDAL_COLOR } from '../minigames/MinigameBase.js';

export class MinigameMenuScene extends BaseScene {
  constructor() { super('MinigameMenuScene'); }

  create() {
    super.create();
    makeBackground(this, sceneTheme());
    header(this, 'MINIJOGOS', 'Sete desafios com regras próprias, dificuldade crescente e medalhas');
    backButton(this);
    const xs = [205, 495, 785, 1075];
    const ys = [246, 470];
    MINIGAME_LIST.forEach((cfg, i) => {
      const x = xs[i % 4], y = ys[Math.floor(i / 4)];
      this.card(x, y, cfg);
    });
    // Cartão de dica (oitavo espaço)
    const x = xs[3], y = ys[1];
    makePanel(this, x - 130, y - 100, 260, 200, { color: 0x140624, alpha: 0.9, stroke: COLORS.gold });
    this.tiger = new Tiger(this, x, y - 20, { scale: 0.38 });
    text(this, x, y + 60, 'Dica: medalhas dão\nfichas extras e XP!', { size: 15, color: '#ffd23f', wrap: 240 });
    this.tiger.setInteractive(new Phaser.Geom.Rectangle(-120, -220, 240, 280), Phaser.Geom.Rectangle.Contains);
    this.tiger.on('pointerdown', () => this.tiger.celebrate('jump'));
    text(this, W / 2, H - 22, 'Espaço para começar em cada minijogo · ESC volta ao menu', { size: 14, color: '#b9a6dd', shadow: false });
  }

  card(x, y, cfg) {
    const w = 260, h = 200;
    makePanel(this, x - w / 2, y - h / 2, w, h, { color: 0x140624, alpha: 0.92, stroke: cfg.accent, radius: 20, strokeW: 3 });
    text(this, x, y - h / 2 + 22, cfg.name, { size: 17, color: cfg.accentHex, font: 'Arial Black, sans-serif', stroke: '#000', strokeW: 4, wrap: w - 20 });
    text(this, x, y - 14, cfg.desc, { size: 13, color: '#e8dcff', wrap: w - 36 });
    const best = ctx.game.data.records[cfg.id] || 0;
    const medal = best >= cfg.goals.gold ? 'gold' : best >= cfg.goals.silver ? 'silver' : best >= cfg.goals.bronze ? 'bronze' : 'none';
    text(this, x - 60, y + 36, `Recorde: ${fmt(best)}`, { size: 14, color: '#ffffff', bold: true });
    if (medal !== 'none') text(this, x + 70, y + 36, `Medalha ${medal === 'gold' ? 'Ouro' : medal === 'silver' ? 'Prata' : 'Bronze'}`, { size: 12, color: MEDAL_COLOR[medal] });
    makeButton(this, x, y + h / 2 - 22, 160, 40, 'JOGAR', () => this.goto(cfg.key), { color: cfg.accent, textColor: '#1a0a2e', size: 18 });
  }
}
