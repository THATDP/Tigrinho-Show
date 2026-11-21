// 1) Desafio de Reflexos: acerte os alvos azuis antes que sumam. Evite os vermelhos.
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W, H } from '../config.js';
import { burst, floatText } from '../ui/ui.js';

export const CFG = {
  key: 'MG_reflexo', id: 'reflexo', name: 'Desafio de Reflexos', accent: 0x3ff3ff, accentHex: '#3ff3ff',
  desc: 'Os alvos piscam na tela. Clique neles antes que desapareçam!',
  rules: [
    'Alvos AZUIS valem pontos. Quanto mais rápido, mais pontos.',
    'Acertos seguidos formam combo: até ×4 de multiplicador.',
    'Alvos VERMELHOS custam 15 pontos. Não clique neles!',
    'Ao final de 30 segundos a partida termina.',
  ],
  goals: { bronze: 220, silver: 380, gold: 560 }, duration: 30000, fichasPerPoint: 0.6, xpCap: 140,
};

const SLOTS = [];
for (const y of [220, 370, 520]) for (const x of [380, 540, 700, 860, 1020]) SLOTS.push({ x, y });

export class ReflexoScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.combo = 0;
    this.spawnTimer = 0;
    this.targets = [];
    this.busySlots = new Set();
    this.setHint('Acerte os azuis!');
  }

  difficulty() {
    const t = this.elapsed / CFG.duration;
    return Phaser.Math.Clamp(t, 0, 1);
  }

  onUpdate(delta) {
    const d = this.difficulty();
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = Phaser.Math.Linear(900, 380, d) * Phaser.Math.FloatBetween(0.8, 1.15);
    }
    for (const t of this.targets) {
      t.life -= delta;
      const frac = Phaser.Math.Clamp(t.life / t.maxLife, 0, 1);
      t.ring.clear();
      t.ring.lineStyle(6, t.good ? 0x3ff3ff : 0xff3b5c, 0.9);
      t.ring.beginPath();
      t.ring.arc(0, 0, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
      t.ring.strokePath();
      if (t.life <= 0) this.expire(t);
    }
  }

  spawn() {
    const free = SLOTS.map((s, i) => i).filter((i) => !this.busySlots.has(i));
    if (!free.length) return;
    const idx = ctx.rng.pick(free);
    const s = SLOTS[idx];
    const d = this.difficulty();
    const good = ctx.rng.next() < 0.78;
    const maxLife = Phaser.Math.Linear(1500, 750, d);
    const container = this.add.container(s.x, s.y).setDepth(12).setScale(0);
    const img = this.add.image(0, 0, good ? 'alvo-bom' : 'alvo-ruim').setScale(1.1);
    const ring = this.add.graphics();
    container.add([img, ring]);
    container.setSize(120, 120).setInteractive(new Phaser.Geom.Circle(0, 0, 58), Phaser.Geom.Circle.Contains);
    this.play.add(container);
    this.tweens.add({ targets: container, scale: 1, duration: 180, ease: 'Back.easeOut' });
    const t = { idx, good, life: maxLife, maxLife, container, ring, hit: false };
    container.on('pointerdown', () => this.hit(t));
    this.targets.push(t);
    this.busySlots.add(idx);
    ctx.audio && ctx.audio.sfx('pop');
  }

  remove(t) {
    this.targets = this.targets.filter((x) => x !== t);
    this.busySlots.delete(t.idx);
  }

  expire(t) {
    this.remove(t);
    if (t.good && !t.hit) {
      this.combo = 0;
      this.setHint('Perdeu o alvo! Combo zerado.');
    }
    this.tweens.add({ targets: t.container, scale: 0, alpha: 0, duration: 160, onComplete: () => t.container.destroy() });
  }

  hit(t) {
    if (this.state !== 'play' || t.hit) return;
    t.hit = true;
    this.remove(t);
    t.container.disableInteractive();
    const x = t.container.x, y = t.container.y;
    if (t.good) {
      this.combo = Math.min(this.combo + 1, 16);
      const mult = 1 + Math.floor(this.combo / 4);
      const speedBonus = Math.round(10 * (t.life / t.maxLife));
      const pts = (10 + speedBonus) * Math.min(4, mult);
      this.addScore(pts, x, y - 60, '#3ff3ff');
      burst(this, x, y, { count: 24, tints: [0x3ff3ff, 0xffffff], speed: 220, life: 600 });
      ctx.audio && ctx.audio.sfx('coin');
      this.setHint(`Combo ×${Math.min(4, mult)}!`);
    } else {
      this.combo = 0;
      this.addScore(-15, x, y - 60, '#ff3b5c');
      ctx.audio && ctx.audio.sfx('error');
      this.setHint('Ops! Era vermelho.');
    }
    this.score = Math.max(0, this.score);
    this.tweens.add({ targets: t.container, scale: 1.4, alpha: 0, duration: 200, onComplete: () => t.container.destroy() });
  }
}
