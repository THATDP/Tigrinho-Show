// Configurações: volumes independentes, acessibilidade e gerenciamento do progresso local.
import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE } from '../config.js';
import { makeBackground, makeButton, makePanel, text, header, backButton, sceneTheme, toast, fmt } from '../ui/ui.js';
import { defaultSave, SAVE_KEY } from '../logic/save.js';

export class SettingsScene extends BaseScene {
  constructor() { super('SettingsScene'); }

  create() {
    super.create();
    makeBackground(this, sceneTheme());
    header(this, 'CONFIGURAÇÕES', 'Volumes independentes, acessibilidade e seus dados');
    backButton(this);
    this.box = this.add.container(0, 0);
    this.resetArmed = 0;
    this.dragSetter = null;
    // Arrastar sliders: listeners globais registrados uma única vez.
    this.input.on('pointermove', (p) => { if (this.dragSetter) this.dragSetter(p.x); });
    this.input.on('pointerup', () => { if (this.dragSetter) { this.dragSetter = null; ctx.game.save(); } });
    this.render();
  }

  render() {
    this.box.removeAll(true);
    const s = ctx.game.data.settings;
    const px = 120, py = 150;
    this.box.add(makePanel(this, px, py, 560, 520, { color: 0x140624, alpha: 0.92, stroke: COLORS.cyan, radius: 20 }));
    this.box.add(text(this, px + 280, py + 26, 'ÁUDIO', { size: 20, color: '#3ff3ff', font: FONT_TITLE }));
    this.slider(px + 280, py + 80, 'Volume geral', 'master');
    this.slider(px + 280, py + 150, 'Música', 'music');
    this.slider(px + 280, py + 220, 'Efeitos sonoros', 'sfx');
    this.box.add(makeButton(this, px + 280, py + 290, 220, 46, 'TESTAR SOM', () => { ctx.audio && ctx.audio.unlock(); ctx.audio && ctx.audio.sfx('win-small'); }, { color: COLORS.cyan, textColor: '#1a0a2e', size: 16 }));
    this.box.add(text(this, px + 280, py + 340, 'Volumes são independentes e salvos.', { size: 13, color: '#b9a6dd', shadow: false }));

    // Acessibilidade e jogo
    const qx = 720, qy = 150;
    this.box.add(makePanel(this, qx, qy, 440, 520, { color: 0x140624, alpha: 0.92, stroke: COLORS.gold, radius: 20 }));
    this.box.add(text(this, qx + 220, qy + 26, 'JOGO E ACESSIBILIDADE', { size: 18, color: '#ffd23f', font: FONT_TITLE }));
    this.toggle(qx + 220, qy + 86, 'Tremor de tela', s.shake, () => this.set('shake', !s.shake));
    this.toggle(qx + 220, qy + 146, 'Partículas', s.particles === 'full', () => this.set('particles', s.particles === 'full' ? 'low' : 'full'), 'Completas', 'Reduzidas');
    this.toggle(qx + 220, qy + 206, 'Giro rápido na máquina', s.fastSpin, () => this.set('fastSpin', !s.fastSpin));
    this.toggle(qx + 220, qy + 266, 'Movimento reduzido', s.reducedMotion, () => this.set('reducedMotion', !s.reducedMotion));
    this.box.add(makeButton(this, qx + 220, qy + 336, 260, 46, 'TELA CHEIA', () => this.fullscreen(), { color: COLORS.violet, size: 16 }));
    this.box.add(makeButton(this, qx + 220, qy + 396, 260, 46, 'TROCAR NOME', () => this.rename(), { color: COLORS.green, size: 16 }));

    // Perigo
    const armed = this.resetArmed > Date.now();
    this.box.add(makeButton(this, qx + 220, qy + 462, 300, 46, armed ? 'CLIQUE DE NOVO PARA APAGAR' : 'APAGAR PROGRESSO', () => this.reset(), { color: armed ? COLORS.red : 0x6b2a3a, size: armed ? 13 : 15 }));
  }

  slider(cx, y, label, key) {
    const s = ctx.game.data.settings;
    const w = 380, x0 = cx - w / 2;
    this.box.add(text(this, x0, y - 26, label, { size: 16, color: '#ffffff', align: 'left', origin: 0 }));
    const pct = text(this, x0 + w, y - 26, `${Math.round(s[key] * 100)}%`, { size: 16, color: '#ffd23f', align: 'right', origin: 1 });
    this.box.add(pct);
    const g = this.add.graphics();
    const draw = () => {
      g.clear();
      g.fillStyle(0x2a0f40, 1).fillRoundedRect(x0, y - 7, w, 14, 7);
      g.fillStyle(0xff2e9a, 1).fillRoundedRect(x0, y - 7, Math.max(8, w * s[key]), 14, 7);
      g.fillStyle(0xffffff, 1).fillCircle(x0 + w * s[key], y, 13);
    };
    draw();
    this.box.add(g);
    const hit = this.add.zone(cx, y, w + 30, 44).setInteractive({ useHandCursor: true, draggable: false });
    this.box.add(hit);
    const setFromX = (px) => {
      const v = Phaser.Math.Clamp((px - x0) / w, 0, 1);
      s[key] = Math.round(v * 100) / 100;
      pct.setText(`${Math.round(s[key] * 100)}%`);
      ctx.audio && ctx.audio.applySettings({ [key]: s[key] });
      ctx.game.setSetting(key, s[key]);
      draw();
    };
    hit.on('pointerdown', (p) => { this.dragSetter = setFromX; setFromX(p.x); });
  }

  toggle(cx, y, label, on, onClick, onText = 'LIGADO', offText = 'DESLIGADO') {
    this.box.add(text(this, cx - 200, y, label, { size: 16, color: '#ffffff', align: 'left', origin: 0 }));
    this.box.add(makeButton(this, cx + 150, y + 2, 150, 40, on ? onText : offText, () => { onClick(); ctx.game.save(); this.render(); }, {
      color: on ? COLORS.green : 0x4a4458, textColor: '#ffffff', size: 13,
    }));
  }

  set(key, value) {
    ctx.game.setSetting(key, value);
    if (key === 'reducedMotion' || key === 'fastSpin' || key === 'particles' || key === 'shake') ctx.game.save();
  }

  fullscreen() {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
  }

  rename() {
    const name = window.prompt('Qual é o seu nome de jogador fictício? (até 24 letras)', ctx.game.data.profile.name);
    if (name === null) return;
    const clean = name.trim().slice(0, 24);
    if (clean) {
      ctx.game.data.profile.name = clean;
      ctx.game.save();
      toast(this, `Oi, ${clean}! 🐯`, '#3bdc7a', 120);
    }
  }

  reset() {
    if (this.resetArmed < Date.now()) {
      this.resetArmed = Date.now() + 4000;
      toast(this, 'Clique de novo em até 4s para apagar tudo.', '#ff8c1a', 120);
      this.render();
      this.time.delayedCall(4100, () => this.render());
      return;
    }
    this.resetArmed = 0;
    ctx.game.reset(new Date());
    ctx.game.save();
    ctx.audio && ctx.audio.applySettings(ctx.game.data.settings);
    toast(this, 'Progresso apagado. Um novo começo!', '#ffd23f', 120);
    this.time.delayedCall(600, () => this.goto('MenuScene'));
  }
}
