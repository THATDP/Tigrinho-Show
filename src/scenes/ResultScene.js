// Tela de resultados: pontuação, medalha, recompensas, recorde e reação do Tigrinho.
import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE } from '../config.js';
import { Tiger } from '../objects/Tiger.js';
import { makeBackground, makeButton, text, fmt, makePanel, sceneTheme, burst, confettiRain, banner, toast, shake } from '../ui/ui.js';
import { MEDAL_NAME, MEDAL_COLOR } from '../minigames/MinigameBase.js';
import { MINIGAME_LIST } from '../minigames/index.js';
import { ACHIEVEMENTS } from '../logic/progression.js';

export class ResultScene extends BaseScene {
  constructor() { super('ResultScene'); }

  init(data) {
    this.data2 = data || {};
  }

  create() {
    super.create();
    const d = this.data2;
    makeBackground(this, sceneTheme());
    const medal = d.medal || 'none';
    const cfg = MINIGAME_LIST.find((m) => m.id === d.gameKey);
    text(this, W / 2, 56, 'RESULTADO', { size: 44, color: '#ffd23f', font: FONT_TITLE, stroke: '#7a0041', strokeW: 8 });
    text(this, W / 2, 104, d.name || 'Partida', { size: 22, color: cfg ? cfg.accentHex : '#d9c8ff' });

    // Painel principal
    makePanel(this, 500, 140, 680, 460, { color: 0x140624, alpha: 0.92, stroke: cfg ? cfg.accent : COLORS.gold });
    this.add.image(200, 430, 'pedestal').setScale(0.85);
    this.tiger = new Tiger(this, 200, 320, { scale: 0.9 });
    this.tiger.setDepth(5);

    const scoreText = text(this, 840, 210, '0', { size: 88, color: '#ffffff', font: FONT_TITLE, stroke: '#2a0030', strokeW: 10 });
    text(this, 840, 268, 'PONTOS', { size: 18, color: '#b9a6dd' });
    this.tweens.addCounter({ from: 0, to: d.score || 0, duration: 1100, ease: 'Cubic.easeOut', onUpdate: (tw) => scoreText.setText(fmt(tw.getValue())) });

    // Medalha
    const mc = this.add.container(1080, 210);
    const mg = this.add.graphics();
    const col = medal === 'none' ? 0x4a4458 : Phaser.Display.Color.HexStringToColor(MEDAL_COLOR[medal]).color;
    mg.fillStyle(col, 1); mg.fillCircle(0, 0, 58);
    mg.lineStyle(6, 0xffffff, 0.8); mg.strokeCircle(0, 0, 58);
    mc.add(mg);
    mc.add(text(this, 0, -6, medal === 'none' ? '—' : MEDAL_NAME[medal].toUpperCase(), { size: 17, color: medal === 'none' ? '#d9c8ff' : '#1a0a2e', font: FONT_TITLE, stroke: '', strokeW: 0, shadow: false }));
    mc.add(text(this, 0, 18, medal === 'none' ? 'sem medalha' : 'medalha', { size: 13, color: medal === 'none' ? '#d9c8ff' : '#1a0a2e', shadow: false, stroke: '', strokeW: 0 }));
    mc.setScale(0);
    this.tweens.add({ targets: mc, scale: 1, duration: 500, delay: 900, ease: 'Back.easeOut' });

    // Metas
    if (d.goals) {
      const gl = `Bronze ${fmt(d.goals.bronze)}  ·  Prata ${fmt(d.goals.silver)}  ·  Ouro ${fmt(d.goals.gold)}`;
      text(this, 840, 300, gl, { size: 13, color: '#b9a6dd' });
    }

    // Recompensas
    const rows = [
      [`+${fmt(d.fichas || 0)} fichas fictícias`, '#ffd23f'],
      [`+${d.xp || 0} XP`, '#3ff3ff'],
    ];
    if (d.isRecord) rows.push(['NOVO RECORDE!', '#ff2e9a']);
    else if (d.best) rows.push([`Recorde atual: ${fmt(d.best)}`, '#d9c8ff']);
    (d.levelUps || []).forEach((l) => rows.push([`SUBIU PARA O NÍVEL ${l.level}! +${fmt(l.fichas)} fichas`, '#3bdc7a']));
    (d.achievements || []).forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) rows.push([`🏆 ${a.name}`, '#ffd23f']);
    });
    rows.forEach(([s, c], i) => {
      const t = text(this, 840, 350 + i * 30, s, { size: 19, color: c, font: FONT_TITLE, stroke: '#000', strokeW: 4 });
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, x: { from: 860, to: 840 }, duration: 320, delay: 400 + i * 160 });
    });

    // Botões
    const by = 560;
    makeButton(this, 620, by + 80, 240, 60, 'JOGAR DE NOVO', () => this.goto(d.retry || 'MinigameMenuScene'), { color: COLORS.green, size: 18 });
    makeButton(this, 880, by + 80, 220, 60, 'MINIJOGOS', () => this.goto('MinigameMenuScene'), { color: COLORS.pink, size: 18 });
    makeButton(this, 1120, by + 80, 180, 60, 'MENU', () => this.goto('MenuScene'), { color: COLORS.violet, size: 18 });

    // Reação do Tigrinho e efeitos
    this.time.delayedCall(1000, () => {
      if (medal === 'gold') {
        this.tiger.celebrate('flip');
        confettiRain(this, [0xffd23f, 0xff2e9a, 0x3ff3ff, 0xffffff], 2200);
        ctx.audio && ctx.audio.sfx('win-big');
        banner(this, 'MEDALHA DE OURO!', '#ffd23f');
      } else if (medal === 'silver' || medal === 'bronze') {
        this.tiger.celebrate('jump');
        burst(this, 1080, 210, { count: 30, tints: [0xffd23f, 0xffffff] });
        ctx.audio && ctx.audio.sfx('success');
      } else {
        this.tiger.lose();
        ctx.audio && ctx.audio.sfx('lose');
      }
    });
    if (d.reason === 'lives') toast(this, 'Fim de jogo! Você perdeu todas as vidas.', '#ff8c1a', 110);
    if (d.reason === 'crash') shake(this, 8, 300);
    this.input.keyboard && this.input.keyboard.on('keydown-SPACE', () => this.goto(d.retry || 'MinigameMenuScene'));
  }

  onEscape() { this.goto('MinigameMenuScene'); }
}
