// 3) Corrida do Tigre: pule cones e bolas, colete moedas, o mais longe possível.
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W, H } from '../config.js';
import { Tiger } from '../objects/Tiger.js';
import { burst, shake, floatText } from '../ui/ui.js';

export const CFG = {
  key: 'MG_corrida', id: 'corrida', name: 'Corrida do Tigre', accent: 0x3bdc7a, accentHex: '#3bdc7a',
  desc: 'O Tigrinho corre sem parar. Pule os obstáculos e colete moedas!',
  rules: [
    'Toque, clique ou aperte ESPAÇO / ↑ para pular.',
    'Cada metro percorrido vale 1 ponto. Moedas valem 5.',
    'Bater em um obstáculo termina a corrida.',
    'A velocidade aumenta com o tempo. Limite: 60 segundos.',
  ],
  goals: { bronze: 300, silver: 550, gold: 850 }, duration: 60000, fichasPerPoint: 0.5, xpCap: 150,
};

const GROUND = 580;
const TX = 240;

export class CorridaScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.vy = 0;
    this.onGround = true;
    this.dist = 0;
    this.obst = [];
    this.coins = [];
    this.spawnT = 900;
    this.coinT = 500;
    this.speed = 380;
    this.groundG = this.add.graphics().setDepth(4);
    this.play.add(this.groundG);
    this.tiger = new Tiger(this, TX, GROUND - 170 * 0.5, { scale: 0.5 });
    this.tiger.setDepth(20);
    this.play.add(this.tiger);
    this.scroll = 0;
    this.onAction = () => this.jump();
    this.input.on('pointerdown', () => { if (this.state === 'play') this.jump(); });
    this.input.keyboard.on('keydown-UP', () => this.jump());
    this.setHint('Toque ou ESPAÇO para pular');
    this.tiger.setMood('idle');
    this.dust = null;
  }

  jump() {
    if (!this.onGround || this.state !== 'play') return;
    this.vy = -900;
    this.onGround = false;
    this.tiger.squash(0.15, 140);
    ctx.audio && ctx.audio.sfx('pop');
  }

  onUpdate(delta) {
    if (this.crashing) return;
    const dt = delta / 1000;
    const d = Phaser.Math.Clamp(this.elapsed / CFG.duration, 0, 1);
    this.speed = Phaser.Math.Linear(380, 820, d);
    this.dist += this.speed * dt * 0.1;
    this.scroll = (this.scroll + this.speed * dt) % 80;

    // Física do pulo
    this.vy += 2600 * dt;
    this.tiger.y += this.vy * dt;
    const floor = GROUND - 85;
    if (this.tiger.y >= floor) {
      this.tiger.y = floor;
      if (!this.onGround) this.tiger.squash(0.12, 120);
      this.vy = 0;
      this.onGround = true;
    }
    this.tiger.angle = this.onGround ? 0 : Phaser.Math.Clamp(this.vy * 0.01, -14, 14);

    // Chão (faixas em movimento para sensação de velocidade)
    this.groundG.clear();
    this.groundG.fillStyle(0x2a0f40, 1); this.groundG.fillRect(0, GROUND, W, H - GROUND);
    this.groundG.fillStyle(0xff2e9a, 0.6); this.groundG.fillRect(0, GROUND, W, 6);
    this.groundG.lineStyle(3, 0x7b3ff2, 0.6);
    for (let x = -this.scroll; x < W; x += 80) this.groundG.lineBetween(x, GROUND + 26, x - 30, H);

    // Geração de obstáculos e moedas
    this.spawnT -= delta;
    if (this.spawnT <= 0) {
      this.spawnObstacle(d);
      this.spawnT = Phaser.Math.Linear(1100, 620, d) * Phaser.Math.FloatBetween(0.8, 1.25);
    }
    this.coinT -= delta;
    if (this.coinT <= 0) {
      this.spawnCoin();
      this.coinT = Phaser.Math.Between(500, 1000);
    }

    // Movimento e colisões
    for (const o of this.obst) {
      o.x -= this.speed * dt;
      o.img.x = o.x;
      if (!o.dead && Math.abs(o.x - TX) < 52 && this.tiger.y + 76 > o.y - o.h / 2 + 10) {
        o.dead = true;
        return this.crash(o);
      }
      if (o.x < -80) { o.img.destroy(); o.dead = true; }
    }
    this.obst = this.obst.filter((o) => !o.dead);
    for (const c of this.coins) {
      c.x -= this.speed * dt;
      c.img.x = c.x;
      c.img.rotation += 0.1;
      if (!c.dead && Math.abs(c.x - TX) < 50 && Math.abs(c.y - this.tiger.y) < 90) {
        c.dead = true;
        c.img.destroy();
        this.addScore(5, c.x, c.y - 30, '#ffd23f');
        ctx.audio && ctx.audio.sfx('coin');
      } else if (c.x < -40) { c.dead = true; c.img.destroy(); }
    }
    this.coins = this.coins.filter((c) => !c.dead);
    // Metros viram pontos continuamente
    const meters = Math.floor(this.dist);
    if (meters !== this._lastMeters) {
      this._lastMeters = meters;
      this.addScore(1, undefined, 0);
    }
  }

  spawnObstacle(d) {
    const kind = ctx.rng.next() < 0.6 ? 'obst-cone' : 'obst-bola';
    const img = this.add.image(W + 60, GROUND - 4, kind).setOrigin(0.5, 1).setDepth(15);
    if (kind === 'obst-bola') {
      img.setOrigin(0.5, 0.5);
      img.y = GROUND - 40;
      this.tweens.add({ targets: img, angle: 360, duration: 900, repeat: -1 });
    }
    this.play.add(img);
    const h = kind === 'obst-bola' ? 60 : 72;
    this.obst.push({ x: W + 60, y: kind === 'obst-bola' ? GROUND - 40 : GROUND, h, img, dead: false });
    // Às vezes, dois obstáculos próximos (mais difícil com o tempo)
    if (d > 0.4 && ctx.rng.next() < 0.3) {
      this.spawnT += 260;
    }
  }

  spawnCoin() {
    const y = Phaser.Math.Between(GROUND - 230, GROUND - 120);
    const img = this.add.image(W + 40, y, 'coin').setScale(0.7).setDepth(16);
    this.play.add(img);
    this.coins.push({ x: W + 40, y, img, dead: false });
  }

  crash(o) {
    if (this.crashing) return;
    this.crashing = true;
    shake(this, 18, 400);
    burst(this, TX, this.tiger.y, { count: 40, tints: [0xff3b5c, 0xffd23f, 0xffffff], speed: 320 });
    ctx.audio && ctx.audio.sfx('fail');
    this.tiger.lose();
    this.time.delayedCall(700, () => this.finish('crash'));
  }
}
