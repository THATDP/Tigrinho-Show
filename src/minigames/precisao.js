// 6) Desafio de Precisão: pare o ponteiro giratório o mais perto possível do centro.
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W, H } from '../config.js';
import { burst, shake, floatText } from '../ui/ui.js';

export const CFG = {
  key: 'MG_precisao', id: 'precisao', name: 'Desafio de Precisão', accent: 0xff5fb0, accentHex: '#ff5fb0',
  desc: 'O ponteiro gira sem parar. Clique no momento certo!',
  rules: [
    'Aperte (clique ou ESPAÇO) para travar o ponteiro.',
    'Quanto mais perto do centro (0°), mais pontos.',
    'Acertar na mosca (±3°) vale 50 pontos extras.',
    'São 6 tentativas. Velocidade aumenta a cada rodada.',
  ],
  goals: { bronze: 280, silver: 400, gold: 480 }, duration: null, fichasPerPoint: 0.6, xpCap: 130,
};

const CX = W / 2, CY = 380, R = 230;
const TOTAL = 6;

export class PrecisaoScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.round = 0;
    this.angle = 0;
    this.speed = 0;
    this.spinning = false;
    this.drawDial();
    this.needle = this.add.graphics().setDepth(20);
    this.play.add(this.needle);
    this.onAction = () => this.stop();
    this.zone = this.add.zone(CX, CY, R * 2.4, R * 2.4).setInteractive({ useHandCursor: true });
    this.zone.on('pointerdown', () => this.stop());
    this.play.add(this.zone);
    this.resultMsg = this.add.text(W / 2, 640, '', { fontFamily: 'Arial Black', fontSize: '26px', color: '#ffd23f', stroke: '#2a0030', strokeWidth: 6 }).setOrigin(0.5).setDepth(20);
    this.play.add(this.resultMsg);
    this.roundText = this.add.text(W / 2, 110, '', { fontFamily: 'Arial Black', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setDepth(20);
    this.play.add(this.roundText);
    this.nextRound();
  }

  drawDial() {
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(0x000000, 0.35); g.fillCircle(CX + 8, CY + 10, R + 30);
    g.fillStyle(0x2a0f40, 1); g.fillCircle(CX, CY, R + 24);
    // Setores de pontuação
    const sector = (a0, a1, color, alpha) => {
      g.fillStyle(color, alpha);
      g.beginPath(); g.moveTo(CX, CY); g.arc(CX, CY, R, a0, a1, false); g.closePath(); g.fillPath();
    };
    sector(-Math.PI / 2 - 0.14, -Math.PI / 2 + 0.14, 0x3bdc7a, 0.25);
    sector(-Math.PI / 2 - 0.05, -Math.PI / 2 + 0.05, 0xffd23f, 0.35);
    g.lineStyle(4, 0xff5fb0, 1); g.strokeCircle(CX, CY, R);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      g.lineStyle(2, 0xc77dff, 0.7);
      g.lineBetween(CX + Math.cos(a) * (R - 14), CY + Math.sin(a) * (R - 14), CX + Math.cos(a) * R, CY + Math.sin(a) * R);
    }
    g.fillStyle(0xffd23f, 1); g.fillCircle(CX, CY, 10);
    this.play.add(g);
    this.dial = g;
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL) return this.finish('complete');
    this.roundText.setText(`Tentativa ${this.round} de ${TOTAL}`);
    this.resultMsg.setText('');
    this.angle = ctx.rng.next() * Math.PI * 2;
    this.speed = Phaser.Math.Linear(2.6, 5.2, (this.round - 1) / (TOTAL - 1)) * (ctx.rng.next() < 0.5 ? 1 : -1);
    this.spinning = true;
    this.setHint('Clique para travar!');
  }

  onUpdate(delta) {
    if (!this.spinning) return;
    this.angle += this.speed * (delta / 1000);
    this.drawNeedle(this.angle);
  }

  drawNeedle(a) {
    this.needle.clear();
    const x = CX + Math.cos(a - Math.PI / 2) * (R + 6);
    const y = CY + Math.sin(a - Math.PI / 2) * (R + 6);
    const tx = CX + Math.cos(a - Math.PI / 2) * (R - 180);
    const ty = CY + Math.sin(a - Math.PI / 2) * (R - 180);
    this.needle.lineStyle(10, 0xffffff, 1);
    this.needle.lineBetween(tx, ty, x, y);
    this.needle.lineStyle(4, 0xff5fb0, 1);
    this.needle.lineBetween(tx, ty, x, y);
    this.needle.fillStyle(0xff5fb0, 1);
    this.needle.fillCircle(x, y, 12);
  }

  stop() {
    if (!this.spinning || this.state !== 'play') return;
    this.spinning = false;
    // Diferença angular até o topo: o ponteiro aponta para o topo quando angle é múltiplo de 2π.
    let d = ((this.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (d > Math.PI) d = Math.PI * 2 - d;
    const deg = Phaser.Math.RadToDeg(d);
    let pts = Math.round(Math.max(0, 100 * (1 - deg / 90)));
    const bull = deg <= 3;
    if (bull) pts += 50;
    this.drawNeedle(this.angle);
    this.addScore(pts, CX, CY - R - 40, bull ? '#ffd23f' : '#ffffff');
    if (bull) {
      shake(this, 10, 300);
      burst(this, CX, CY - R, { count: 60, tints: [0xffd23f, 0xff5fb0, 0xffffff], speed: 360 });
      ctx.audio && ctx.audio.sfx('win-medium');
      this.resultMsg.setText('NA MOSCA!!');
      this.tweens.add({ targets: this.resultMsg, scale: { from: 1.6, to: 1 }, duration: 400, ease: 'Back.easeOut' });
    } else {
      ctx.audio && ctx.audio.sfx(pts >= 60 ? 'success' : 'click');
      this.resultMsg.setText(`${deg.toFixed(1)}° do centro — ${pts} pts`);
    }
    this.time.delayedCall(1100, () => { if (this.state === 'play') this.nextRound(); });
  }
}
