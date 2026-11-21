// 2) Coleta de Objetos: o Tigrinho come peixes e moedas e foge de bombas.
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W, H } from '../config.js';
import { Tiger } from '../objects/Tiger.js';
import { burst, floatText, shake } from '../ui/ui.js';

export const CFG = {
  key: 'MG_coleta', id: 'coleta', name: 'Coleta do Tigrinho', accent: 0xff8c1a, accentHex: '#ff8c1a',
  desc: 'Mova o Tigrinho e pegue os itens que caem do céu.',
  rules: [
    'Mova o mouse (ou ← →) para posicionar o Tigrinho.',
    'Moedas valem 10 pontos. Peixes valem 30 pontos.',
    'Bombas tiram uma vida. Você tem 3 vidas.',
    'Dura 45 segundos. Quanto mais tempo, mais itens!',
  ],
  goals: { bronze: 300, silver: 520, gold: 780 }, duration: 45000, fichasPerPoint: 0.5, xpCap: 150,
};

export class ColetaScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.lives = 3;
    this.items = [];
    this.spawnT = 0;
    this.tigerX = W / 2;
    this.targetX = W / 2;
    this.basketY = 560;
    this.tiger = new Tiger(this, this.tigerX, this.basketY - 40, { scale: 0.5 });
    this.tiger.setDepth(20);
    this.play.add(this.tiger);
    this.livesText = this.add.text(W / 2, 96, '', { fontFamily: 'Trebuchet MS', fontSize: '26px', color: '#ff3b5c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.play.add(this.livesText);
    this.drawLives();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointermove', (p) => { this.targetX = p.x; });
    this.input.on('pointerdown', (p) => { this.targetX = p.x; });
    this.setHint('Mouse ou ← → para mover');
    this.add.rectangle(W / 2, 640, W, 80, 0x2a0f40, 0.6).setDepth(5);
  }

  drawLives() {
    this.livesText.setText('♥'.repeat(Math.max(0, this.lives)) + '♡'.repeat(Math.max(0, 3 - this.lives)));
  }

  onUpdate(delta) {
    const d = Phaser.Math.Clamp(this.elapsed / CFG.duration, 0, 1);
    // Movimento: teclado ou seguir o ponteiro
    if (this.cursors.left.isDown) this.targetX -= 0.6 * delta;
    if (this.cursors.right.isDown) this.targetX += 0.6 * delta;
    this.targetX = Phaser.Math.Clamp(this.targetX, 60, W - 60);
    this.tigerX = Phaser.Math.Linear(this.tigerX, this.targetX, Math.min(1, delta * 0.012));
    this.tiger.x = this.tigerX;
    this.tiger.angle = Phaser.Math.Clamp((this.targetX - this.tigerX) * 0.05, -12, 12);

    // Geração
    this.spawnT -= delta;
    if (this.spawnT <= 0) {
      this.spawnItem(d);
      this.spawnT = Phaser.Math.Linear(850, 330, d) * Phaser.Math.FloatBetween(0.7, 1.2);
    }

    // Queda e colisão
    for (const it of this.items) {
      it.y += it.speed * (delta / 1000);
      it.img.y = it.y;
      it.img.angle += it.spin * delta * 0.06;
      if (Math.abs(it.x - this.tigerX) < 66 && Math.abs(it.y - this.basketY) < 46) {
        this.collect(it);
      } else if (it.y > H + 40) {
        it.dead = true;
        it.img.destroy();
      }
    }
    this.items = this.items.filter((it) => !it.dead);
  }

  spawnItem(d) {
    const r = ctx.rng.next();
    let kind = 'coin';
    if (r < 0.2) kind = 'bomba';
    else if (r < 0.42) kind = 'fish';
    const x = Phaser.Math.Between(70, W - 70);
    const img = this.add.image(x, -40, kind).setScale(kind === 'fish' ? 0.9 : 0.85).setDepth(15);
    this.play.add(img);
    const speed = Phaser.Math.Linear(210, 420, d) * Phaser.Math.FloatBetween(0.85, 1.2);
    this.items.push({ kind, x, y: -40, speed, img, spin: Phaser.Math.FloatBetween(-1, 1), dead: false });
  }

  collect(it) {
    it.dead = true;
    it.img.destroy();
    if (it.kind === 'bomba') {
      this.lives--;
      this.drawLives();
      shake(this, 12, 320);
      burst(this, it.x, this.basketY - 20, { count: 30, tints: [0xff3b5c, 0x1a0a2e, 0xffd23f], speed: 300 });
      ctx.audio && ctx.audio.sfx('fail');
      this.tiger.sad();
      this.setHint(this.lives > 0 ? `Bomba! Vidas: ${this.lives}` : 'Fim de jogo!');
      if (this.lives <= 0) this.finish('lives');
      return;
    }
    const pts = it.kind === 'fish' ? 30 : 10;
    this.addScore(pts, it.x, this.basketY - 90, it.kind === 'fish' ? '#3ff3ff' : '#ffd23f');
    burst(this, it.x, this.basketY - 40, { count: 14, tints: it.kind === 'fish' ? [0x3ff3ff, 0xffffff] : [0xffd23f, 0xffffff], speed: 200, life: 500 });
    ctx.audio && ctx.audio.sfx('coin');
    this.tiger.squash(0.1, 120);
  }

  finish(reason) {
    if (this.tiger) this.tiger.setMood('idle');
    super.finish(reason);
  }
}
