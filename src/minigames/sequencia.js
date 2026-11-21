// 5) Sequência de Símbolos (Simon): repita a sequência de cores/sons. Cada rodada cresce.
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W, H } from '../config.js';
import { burst, wait, floatText } from '../ui/ui.js';

export const CFG = {
  key: 'MG_sequencia', id: 'sequencia', name: 'Sequência de Símbolos', accent: 0xffd23f, accentHex: '#ffd23f',
  desc: 'O Tigrinho acende os botões em ordem. Repita a sequência!',
  rules: [
    'Observe a sequência de luzes e sons com atenção.',
    'Repita exatamente na mesma ordem clicando nos botões.',
    'Cada elemento certo vale 10 pontos × nível da rodada.',
    'Você tem 2 vidas. Errar 2 vezes encerra a partida.',
  ],
  goals: { bronze: 300, silver: 550, gold: 850 }, duration: null, fichasPerPoint: 0.5, xpCap: 150,
};

const PADS = [
  { color: 0xff3b5c, light: 0xffb3c0, freq: 330, x: 480, y: 330 },
  { color: 0x3bdc7a, light: 0xc2ffd6, freq: 415, x: 800, y: 330 },
  { color: 0x3a7bff, light: 0xbfd6ff, freq: 500, x: 480, y: 570 },
  { color: 0xffd23f, light: 0xfff3b0, freq: 620, x: 800, y: 570 },
];

export class SequenciaScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.seq = [];
    this.inputIdx = 0;
    this.lives = 2;
    this.level = 0;
    this.accepting = false;
    this.buildPads();
    this.drawLives();
    this.setHint('Observe…');
    this.nextRound();
  }

  buildPads() {
    this.pads = PADS.map((p, i) => {
      const g = this.add.graphics().setDepth(12);
      const base = this.add.graphics().setDepth(11);
      const zone = this.add.zone(p.x, p.y, 280, 200).setInteractive({ useHandCursor: true });
      const label = this.add.text(p.x, p.y, '', { fontFamily: 'Arial Black', fontSize: '40px', color: '#000' }).setOrigin(0.5).setDepth(13);
      this.play.add([base, g, zone, label]);
      const pad = { p, g, base, zone, lit: 0 };
      this.drawPad(pad, 0);
      zone.on('pointerdown', () => this.press(i));
      return pad;
    });
    this.lifeText = this.add.text(W / 2, 110, '', { fontFamily: 'Trebuchet MS', fontSize: '26px', color: '#ff3b5c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.play.add(this.lifeText);
    this.statusText = this.add.text(W / 2, 170, '', { fontFamily: 'Trebuchet MS', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.play.add(this.statusText);
  }

  drawPad(pad, lit) {
    const { p } = pad;
    pad.base.clear();
    pad.base.fillStyle(0x000000, 0.45); pad.base.fillRoundedRect(p.x - 128, p.y - 90, 260, 186, 30);
    pad.g.clear();
    pad.g.fillStyle(lit ? p.light : p.color, lit ? 1 : 0.55);
    pad.g.fillRoundedRect(p.x - 130, p.y - 92, 260, 186, 30);
    pad.g.lineStyle(6, 0xffffff, lit ? 0.9 : 0.25);
    pad.g.strokeRoundedRect(p.x - 130, p.y - 92, 260, 186, 30);
    if (lit) { pad.g.fillStyle(0xffffff, 0.4); pad.g.fillCircle(p.x, p.y, 70); }
  }

  drawLives() {
    this.lifeText.setText('♥'.repeat(this.lives) + '♡'.repeat(2 - this.lives));
  }

  async flash(i, dur = 480) {
    const pad = this.pads[i];
    this.drawPad(pad, 1);
    ctx.audio && ctx.audio.tone && ctx.audio.tone({ freq: PADS[i].freq, type: 'triangle', dur: dur / 1000, vol: 0.3 });
    await wait(this, dur);
    this.drawPad(pad, 0);
  }

  async nextRound() {
    this.level++;
    this.accepting = false;
    this.seq.push(ctx.rng.int(0, 4));
    this.setHint(`Nível ${this.level} · ${this.seq.length} elemento(s)`);
    this.statusText.setText('Observe…');
    await wait(this, 700);
    for (const i of this.seq) {
      if (this.dead) return;
      await this.flash(i, Math.max(260, 480 - this.level * 18));
      await wait(this, Math.max(120, 260 - this.level * 10));
    }
    if (this.dead) return;
    this.inputIdx = 0;
    this.accepting = true;
    this.statusText.setText('Sua vez!');
  }

  async press(i) {
    if (this.state !== 'play' || !this.accepting) return;
    this.flash(i, 200);
    const expected = this.seq[this.inputIdx];
    if (i === expected) {
      this.inputIdx++;
      this.addScore(10 * this.level, PADS[i].x, PADS[i].y - 120, '#ffd23f');
      burst(this, PADS[i].x, PADS[i].y, { count: 12, tints: [PADS[i].light], speed: 160, life: 500 });
      ctx.audio && ctx.audio.sfx('pop');
      if (this.inputIdx === this.seq.length) {
        this.accepting = false;
        this.addScore(50, W / 2, 280, '#3bdc7a');
        this.statusText.setText('Muito bem!');
        ctx.audio && ctx.audio.sfx('success');
        await wait(this, 900);
        if (this.state === 'play') this.nextRound();
      }
    } else {
      this.accepting = false;
      this.lives--;
      this.drawLives();
      ctx.audio && ctx.audio.sfx('fail');
      if (this.lives <= 0) {
        this.statusText.setText('Fim da sequência!');
        await wait(this, 500);
        this.finish('lives');
        return;
      }
      this.statusText.setText('Errou! Mais uma chance: repita de novo.');
      await wait(this, 900);
      this.inputIdx = 0;
      // Repete a mesma sequência para a segunda tentativa
      for (const k of this.seq) {
        await this.flash(k, 380);
        await wait(this, 180);
      }
      this.accepting = true;
      this.statusText.setText('Sua vez!');
    }
  }
}
