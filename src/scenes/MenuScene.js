// Menu principal: mascote, título animado e acesso a todas as telas.
import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE } from '../config.js';
import { Tiger } from '../objects/Tiger.js';
import { makeBackground, makeButton, text, sceneTheme, fmt, makePanel, toast } from '../ui/ui.js';
import { levelInfo } from '../logic/progression.js';
import { DAILY_SPIN_LIMIT } from '../state/game.js';

export class MenuScene extends BaseScene {
  constructor() { super('MenuScene'); }

  create() {
    super.create();
    this.cameras.main.setBackgroundColor('#14062b');
    makeBackground(this, sceneTheme());

    // Título com balanço
    const title = text(this, 330, 110, 'TIGRINHO', { size: 66, color: '#ffd23f', font: FONT_TITLE, stroke: '#7a0041', strokeW: 12 });
    const title2 = text(this, 330, 186, 'SHOW', { size: 58, color: '#3ff3ff', font: FONT_TITLE, stroke: '#063b52', strokeW: 10 });
    this.tweens.add({ targets: title, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: title2, scale: { from: 1, to: 1.04 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    text(this, 330, 236, 'arcade cartunesco de sorte fictícia', { size: 16, color: '#d9c8ff' });

    // Pedestal + mascote
    this.add.image(330, 616, 'pedestal').setScale(1.0);
    this.tiger = new Tiger(this, 330, 420, { scale: 1.12 });
    this.tiger.setInteractive(new Phaser.Geom.Rectangle(-110, -210, 220, 330), Phaser.Geom.Rectangle.Contains);
    this.tiger.on('pointerdown', () => {
      const r = Math.random();
      if (r < 0.4) this.tiger.laugh(1000);
      else if (r < 0.7) this.tiger.celebrate('flip');
      else this.tiger.surprise();
      ctx.audio && ctx.audio.sfx('pop');
    });
    this.tiger.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    this.tiger.on('pointerout', () => this.input.setDefaultCursor('default'));
    this.time.delayedCall(4000, () => this.idleQuip());

    // Cartão do jogador
    this.drawProfileCard();

    // Grade de botões
    const buttons = [
      ['JOGAR\nMÁQUINA', 'MachineScene', COLORS.orange],
      ['MINIJOGOS', 'MinigameMenuScene', COLORS.pink],
      ['MISSÕES', 'MissionsScene', COLORS.green],
      ['CONQUISTAS', 'AchievementsScene', COLORS.gold],
      ['COLEÇÃO', 'CollectionScene', COLORS.cyan],
      ['LOJA', 'ShopScene', COLORS.violet],
      ['INVENTÁRIO', 'InventoryScene', 0xff5fb0],
      ['PERFIL', 'ProfileScene', 0x3a7bff],
      ['CONFIG.', 'SettingsScene', 0x6b6b80],
    ];
    const cols = [700, 910, 1120];
    const rows = [240, 350, 460];
    buttons.forEach(([label, key, color], i) => {
      const x = cols[i % 3];
      const y = rows[Math.floor(i / 3)];
      makeButton(this, x, y, 190, 88, label, () => this.goto(key), {
        color, size: label.includes('\n') ? 17 : 19, textColor: color === COLORS.gold || color === COLORS.cyan ? '#1a0a2e' : '#ffffff',
      });
    });

    // Rodapé
    text(this, W / 2, H - 24, 'Todas as fichas são fictícias — sem valor monetário. Jogue com moderação!', { size: 14, color: '#b9a6dd', shadow: false });

    // Pausa sugerida (anti-compulsão)
    const mins = Math.floor((Date.now() - ctx.sessionStart) / 60000);
    if (mins >= 45) toast(this, 'Já faz um tempo! Hora de uma pausa, campeão 🐯', '#3ff3ff', 190);

  }

  drawProfileCard() {
    const g = ctx.game;
    const lv = levelInfo(g.data.xp);
    const cx = 119;
    makePanel(this, 24, 262, 190, 140, { color: 0x1a0a2e, alpha: 0.85, stroke: COLORS.gold });
    text(this, cx, 280, g.data.profile.name, { size: 15, color: '#ffffff', bold: true, wrap: 170 });
    this.add.text(cx, 304, `Nível ${lv.level}`, { fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffd23f' }).setOrigin(0.5);
    const barW = 150;
    const bar = this.add.graphics();
    bar.fillStyle(0x2a0f40, 1).fillRoundedRect(cx - barW / 2, 326, barW, 10, 5);
    bar.fillStyle(0x3ff3ff, 1).fillRoundedRect(cx - barW / 2, 326, Math.max(6, barW * (lv.into / lv.need)), 10, 5);
    text(this, cx, 350, `${fmt(g.fichas)} fichas`, { size: 15, color: '#ffd23f', bold: true });
    this.help = null;
    const left = DAILY_SPIN_LIMIT - g.data.spinsToday.count;
    text(this, cx, 374, `Giros hoje: ${Math.max(0, left)} restantes`, { size: 12, color: '#d9c8ff' });
    if (g.fichas < 10 && g.canRequestHelp()) {
      this.help = makeButton(this, cx, 460, 170, 44, 'AJUDA DO TIGRINHO', () => {
        const got = g.requestHelp();
        g.save();
        toast(this, `+${fmt(got)} fichas de cortesia! Divirta-se.`, '#3bdc7a');
        this.help.destroy();
        this.help = null;
      }, { color: COLORS.green, size: 13 });
    }
  }

  idleQuip() {
    if (!this.tiger || !this.tiger.active) return;
    this.tiger.squash(0.06);
    this.time.delayedCall(6000, () => this.idleQuip());
  }
}
