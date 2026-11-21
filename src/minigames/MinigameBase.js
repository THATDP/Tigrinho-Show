// Base comum dos minijogos: regras, contagem regressiva, pontuação, medalhas e recompensas.
import Phaser from 'phaser';
import { BaseScene } from '../scenes/BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE } from '../config.js';
import { makeBackground, makeButton, makePanel, text, fmt, floatText, wait, sceneTheme } from '../ui/ui.js';
import { medalFor } from '../logic/progression.js';

const MEDAL_BONUS = { none: 0, bronze: 40, silver: 100, gold: 220 };
const MEDAL_NAME = { none: 'Sem medalha', bronze: 'Bronze', silver: 'Prata', gold: 'Ouro' };
const MEDAL_COLOR = { none: '#8a7fa6', bronze: '#d9893b', silver: '#dfe6ff', gold: '#ffd23f' };
export { MEDAL_NAME, MEDAL_COLOR };

export class MinigameBase extends BaseScene {
  // cfg: { key, id, name, desc, rules[], goals:{bronze,silver,gold}, duration|null, fichasPerPoint, xpCap, accent }
  constructor(key, cfg) {
    super(key);
    this.cfg = cfg;
  }

  create() {
    super.create();
    this.g = ctx.game;
    this.score = 0;
    this.state = 'intro';
    this.dead = false;
    this.cameras.main.setBackgroundColor('#14062b');
    makeBackground(this, { top: 0x2a0b5a, bottom: 0x0b0319, glow: this.cfg.accent || 0xff2e9a });
    this.play = this.add.container(0, 0).setDepth(10);
    this.buildHud();
    this.showIntro();
    this.input.keyboard && this.input.keyboard.on('keydown-SPACE', () => this.onSpace());
    this.input.keyboard && this.input.keyboard.on('keydown-ESC', () => this.quit());
  }

  onSpace() {
    if (this.state === 'intro' && this.introReady) this.startCountdown();
    else if (this.state === 'play' && this.onAction) this.onAction();
  }

  onLeave() {
    this.dead = true;
    this.state = 'over';
  }

  buildHud() {
    const bar = this.add.graphics().setDepth(60);
    bar.fillStyle(0x0b0319, 0.92); bar.fillRect(0, 0, W, 66);
    bar.lineStyle(2, this.cfg.accent || COLORS.gold, 0.7); bar.lineBetween(0, 66, W, 66);
    text(this, 24, 20, this.cfg.name.toUpperCase(), { size: 16, color: this.cfg.accentHex || '#ffd23f', font: FONT_TITLE, align: 'left', origin: 0 }).setDepth(61);
    this.scoreText = text(this, 430, 33, 'PONTOS 0', { size: 26, color: '#ffffff', font: FONT_TITLE }).setDepth(61);
    this.timerText = text(this, 800, 33, '', { size: 24, color: '#3ff3ff', font: FONT_TITLE }).setDepth(61);
    const best = this.g.data.records[this.cfg.id] || 0;
    this.bestText = text(this, 980, 22, `Recorde: ${fmt(best)}`, { size: 14, color: '#d9c8ff', align: 'right', origin: 1 }).setDepth(61);
    this.hintText = text(this, 980, 42, '', { size: 12, color: '#9a86c6', align: 'right', origin: 1 }).setDepth(61);
    makeButton(this, 1200, 33, 110, 40, 'SAIR', () => this.quit(), { color: COLORS.red, size: 16 }).setDepth(62);
  }

  setHint(s) { this.hintText.setText(s); }

  showIntro() {
    this.introReady = false;
    this.overlay = this.add.container(0, 0).setDepth(500);
    this.overlay.add(this.add.rectangle(W / 2, H / 2, W, H, 0x07020f, 0.7));
    const panel = makePanel(this, W / 2 - 380, 110, 760, 520, { color: 0x140624, alpha: 0.96, stroke: this.cfg.accent || COLORS.gold });
    this.overlay.add(panel);
    this.overlay.add(text(this, W / 2, 150, this.cfg.name, { size: 40, color: this.cfg.accentHex || '#ffd23f', font: FONT_TITLE, stroke: '#2a0030', strokeW: 8 }));
    this.overlay.add(text(this, W / 2, 196, this.cfg.desc, { size: 18, color: '#e8dcff', wrap: 680 }));
    const rules = this.cfg.rules.map((r) => '• ' + r).join('\n');
    this.overlay.add(text(this, W / 2 - 330, 240, rules, { size: 17, color: '#ffffff', align: 'left', origin: 0, wrap: 660, shadow: false }));
    // Metas de medalha
    const goals = this.cfg.goals;
    const chips = [['bronze', 'Bronze', '#d9893b'], ['silver', 'Prata', '#dfe6ff'], ['gold', 'Ouro', '#ffd23f']];
    chips.forEach(([k, label, col], i) => {
      const x = W / 2 - 220 + i * 220;
      this.overlay.add(makePanel(this, x - 90, 402, 180, 62, { color: 0x0b0319, alpha: 0.9, stroke: Phaser.Display.Color.HexStringToColor(col).color, radius: 14, strokeW: 2 }));
      this.overlay.add(text(this, x, 418, label, { size: 16, color: col, font: FONT_TITLE }));
      this.overlay.add(text(this, x, 444, `${fmt(goals[k])} pts`, { size: 16, color: '#ffffff' }));
    });
    this.overlay.add(text(this, W / 2, 500, 'Recompensa: fichas fictícias + XP. Quanto mais pontos, melhor!', { size: 14, color: '#b9a6dd', wrap: 680 }));
    const go = makeButton(this, W / 2, 570, 300, 66, 'COMEÇAR (ESPAÇO)', () => this.startCountdown(), { color: this.cfg.accent || COLORS.pink, size: 20 });
    this.overlay.add(go);
    this.introReady = true;
  }

  startCountdown() {
    if (this.state !== 'intro') return;
    this.state = 'countdown';
    this.overlay.destroy(true);
    this.overlay = this.add.container(0, 0).setDepth(500);
    const big = text(this, W / 2, H / 2, '', { size: 120, color: '#ffd23f', font: FONT_TITLE, stroke: '#7a0041', strokeW: 14 });
    this.overlay.add(big);
    const seq = ['3', '2', '1', 'VAI!'];
    seq.forEach((s, i) => {
      this.time.delayedCall(i * 700, () => {
        if (this.dead) return;
        big.setText(s).setScale(1.6).setAlpha(1);
        this.tweens.add({ targets: big, scale: 1, duration: 450, ease: 'Back.easeOut' });
        ctx.audio && ctx.audio.sfx(i === 3 ? 'go' : 'tick');
      });
    });
    this.time.delayedCall(seq.length * 700, () => {
      if (this.dead) return;
      this.overlay.destroy(true);
      this.overlay = null;
      this.begin();
    });
  }

  begin() {
    this.state = 'play';
    this.timeLeft = this.cfg.duration ?? null;
    this.elapsed = 0;
    this.onStart && this.onStart();
  }

  update(time, delta) {
    if (this.state !== 'play') return;
    this.elapsed += delta;
    if (this.timeLeft !== null) {
      this.timeLeft = Math.max(0, this.timeLeft - delta);
      this.timerText.setText(`${Math.ceil(this.timeLeft / 1000)}s`);
      if (this.timeLeft <= 0) return this.finish('time');
    } else {
      this.timerText.setText(`${Math.floor(this.elapsed / 1000)}s`);
    }
    this.onUpdate && this.onUpdate(delta);
  }

  addScore(n, x, y, color = '#ffd23f') {
    this.score += n;
    this.scoreText.setText(`PONTOS ${fmt(this.score)}`);
    if (x !== undefined) floatText(this, x, y, (n >= 0 ? '+' : '') + n, color, 24);
  }

  // Encerra a partida: calcula medalha, recompensas e vai para o resultado.
  finish(reason = 'end') {
    if (this.state !== 'play' && this.state !== 'countdown') return;
    this.state = 'over';
    const score = Math.max(0, Math.floor(this.score));
    const medal = medalFor(score, this.cfg.goals);
    const fichas = Math.min(1500, Math.round(score * (this.cfg.fichasPerPoint || 0.5)) + MEDAL_BONUS[medal]);
    const xp = Math.min(this.cfg.xpCap || 120, 10 + Math.floor(score / 10));
    const rec = this.g.recordMinigame(this.cfg.id, score, medal);
    const got = this.g.gain(fichas);
    const lv = this.g.addXp(xp);
    this.g.track('fichasWon', got);
    const ach = this.g.checkAchievements();
    this.g.save();
    ctx.audio && ctx.audio.sfx(medal === 'gold' ? 'win-big' : medal === 'none' ? 'lose' : 'success');
    this.time.delayedCall(900, () => {
      this.goto('ResultScene', {
        gameKey: this.cfg.id, name: this.cfg.name, score, medal, fichas: got, xp, reason,
        isRecord: rec.isRecord, best: rec.best, levelUps: lv.levelUps, achievements: ach,
        goals: this.cfg.goals, retry: this.cfg.key,
      });
    });
  }

  quit() {
    if (this.state === 'over') return;
    this.state = 'over';
    this.goto('MinigameMenuScene');
  }

  // Utilitário: pausa curta com promessa (para sequências de animação).
  pause(ms) { return wait(this, ms); }
}
