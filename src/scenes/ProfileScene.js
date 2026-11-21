import Phaser from 'phaser';
// Perfil local: nome, nível, estatísticas e recordes de cada minijogo.
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE } from '../config.js';
import { levelInfo } from '../logic/progression.js';
import { makeBackground, makeButton, makePanel, text, fmt, header, backButton, sceneTheme } from '../ui/ui.js';
import { Tiger } from '../objects/Tiger.js';
import { MINIGAME_LIST } from '../minigames/index.js';

const STAT_LABELS = [
  ['spins', 'Giros'], ['wins', 'Linhas vencedoras'], ['bigWins', 'Vitórias grandes'], ['megaWins', 'Vitórias épicas'],
  ['freeSpinsTriggered', 'Rodadas bônus'], ['events', 'Eventos especiais'], ['minigames', 'Minijogos jogados'],
  ['fichasWon', 'Fichas ganhas'], ['biggestWin', 'Maior prêmio'], ['symbolsSeen', 'Símbolos vistos'],
  ['itemsOwned', 'Cosméticos'], ['missionsDone', 'Missões resgatadas'],
];

export class ProfileScene extends BaseScene {
  constructor() { super('ProfileScene'); }

  create() {
    super.create();
    const g = ctx.game;
    makeBackground(this, sceneTheme());
    header(this, 'PERFIL', 'Seu cartão de colecionador (local, neste navegador)');
    backButton(this);
    const lv = levelInfo(g.data.xp);
    makePanel(this, 40, 150, 380, 500, { color: 0x140624, alpha: 0.92, stroke: COLORS.gold, radius: 22 });
    this.add.image(230, 500, 'pedestal').setScale(0.9);
    this.tiger = new Tiger(this, 230, 360, { scale: 0.9 });
    this.tiger.setInteractive(new Phaser.Geom.Rectangle(-110, -210, 220, 330), Phaser.Geom.Rectangle.Contains);
    this.tiger.on('pointerdown', () => this.tiger.celebrate(g.equippedId('animacao') === 'anim-samba' ? 'samba' : 'jump'));
    text(this, 230, 178, g.data.profile.name, { size: 22, color: '#ffffff', font: FONT_TITLE, wrap: 360 });
    text(this, 230, 570, `NÍVEL ${lv.level}`, { size: 26, color: '#ffd23f', font: FONT_TITLE });
    const bw = 300;
    const bar = this.add.graphics();
    bar.fillStyle(0x2a0f40, 1).fillRoundedRect(230 - bw / 2, 596, bw, 14, 7);
    bar.fillStyle(0x3ff3ff, 1).fillRoundedRect(230 - bw / 2, 596, Math.max(6, bw * (lv.into / lv.need)), 14, 7);
    text(this, 230, 624, `${fmt(lv.into)} / ${fmt(lv.need)} XP · ${fmt(g.data.xp)} XP total`, { size: 13, color: '#b9a6dd' });
    text(this, 230, 650, `Saldo: ${fmt(g.fichas)} fichas fictícias`, { size: 15, color: '#3bdc7a' });

    // Estatísticas
    makePanel(this, 460, 150, 780, 300, { color: 0x140624, alpha: 0.92, stroke: COLORS.cyan, radius: 22 });
    text(this, 470, 170, 'ESTATÍSTICAS', { size: 18, color: '#3ff3ff', font: FONT_TITLE, align: 'left', origin: 0 });
    STAT_LABELS.forEach(([k, label], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 500 + col * 250, y = 214 + row * 64;
      text(this, x, y, fmt(g.data.stats[k] || 0), { size: 24, color: '#ffffff', font: FONT_TITLE, align: 'left', origin: 0 });
      text(this, x, y + 30, label, { size: 13, color: '#b9a6dd', align: 'left', origin: 0 });
    });

    // Recordes
    makePanel(this, 460, 470, 780, 190, { color: 0x140624, alpha: 0.92, stroke: COLORS.pink, radius: 22 });
    text(this, 470, 490, 'RECORDES', { size: 18, color: '#ff5fb0', font: FONT_TITLE, align: 'left', origin: 0 });
    MINIGAME_LIST.forEach((m, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 500 + col * 185, y = 530 + row * 62;
      text(this, x, y, fmt(g.data.records[m.id] || 0), { size: 22, color: m.accentHex, font: FONT_TITLE, align: 'left', origin: 0 });
      text(this, x, y + 28, m.name.replace('Desafio de ', '').replace('Coleta do ', '').replace('Corrida do ', '').replace('Sequência de ', 'Seq. '), { size: 12, color: '#d9c8ff', align: 'left', origin: 0, wrap: 175 });
    });
    const started = new Date(g.data.profile.createdAt);
    const days = Math.max(1, Math.floor((Date.now() - started.getTime()) / 86400000) + 1);
    text(this, 470, 648, `Jogando há ${days} dia(s) · sessão atual: ${Math.floor((Date.now() - ctx.sessionStart) / 60000)} min`, { size: 13, color: '#b9a6dd', align: 'left', origin: 0 });
    makeButton(this, W - 130, H - 40, 200, 44, 'EDITAR NOME', () => this.goto('SettingsScene'), { color: COLORS.violet, size: 14 });
  }
}
