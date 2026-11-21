// 4) Desafio de Memória: encontre os pares de símbolos. Três rodadas, cada vez maiores.
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W, H } from '../config.js';
import { burst, floatText, wait } from '../ui/ui.js';
import { SYMBOL_IDS } from '../logic/symbols.js';

export const CFG = {
  key: 'MG_memoria', id: 'memoria', name: 'Desafio de Memória', accent: 0xc77dff, accentHex: '#c77dff',
  desc: 'Vire as cartas e encontre os pares. Memorize bem!',
  rules: [
    'Vire duas cartas por vez. Se forem iguais, é um par!',
    'Cada par vale 100 pontos, menos 4 por jogada extra (mínimo 30).',
    'Três rodadas: 6, 8 e 10 pares. Rodada completa = bônus de 150.',
    'Limite de 120 segundos no total.',
  ],
  goals: { bronze: 500, silver: 800, gold: 1100 }, duration: 120000, fichasPerPoint: 0.5, xpCap: 150,
};

const ROUNDS = [
  { pairs: 6, cols: 4, rows: 3, scale: 0.92 },
  { pairs: 8, cols: 4, rows: 4, scale: 0.78 },
  { pairs: 10, cols: 5, rows: 4, scale: 0.7 },
];

export class MemoriaScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.round = 0;
    this.lock = false;
    this.flipped = [];
    this.moves = 0;
    this.setHint('Rodada 1 de 3');
    this.startRound();
  }

  async startRound() {
    const R = ROUNDS[this.round];
    this.cards = [];
    this.matched = 0;
    this.lock = true;
    this.moves = 0;
    const pool = ctx.rng.shuffle(SYMBOL_IDS.filter((id) => id !== 'bola')).slice(0, R.pairs);
    const ids = ctx.rng.shuffle([...pool, ...pool]);
    const cw = 110 * R.scale + 16, ch = 146 * R.scale + 16;
    const totalW = R.cols * cw, totalH = R.rows * ch;
    const ox = (W - totalW) / 2 + cw / 2;
    const oy = 150 + (H - 150 - totalH) / 2 + ch / 2 - 20;
    if (this.roundLabel) this.roundLabel.destroy();
    this.roundLabel = this.add.text(W / 2, 92, `RODADA ${this.round + 1} DE 3 · ${R.pairs} PARES`, { fontFamily: 'Arial Black', fontSize: '20px', color: '#ffd23f' }).setOrigin(0.5).setDepth(20);
    this.play.add(this.roundLabel);
    ids.forEach((id, i) => {
      const c = Math.floor(i % R.cols), r = Math.floor(i / R.cols);
      const x = ox + c * cw, y = oy + r * ch;
      const card = this.add.container(x, y).setDepth(15);
      const back = this.add.image(0, 0, 'card-back').setScale(R.scale);
      const face = this.add.image(0, 0, `sym-${id}`).setScale(R.scale * 0.6).setVisible(false);
      card.add([back, face]);
      card.setSize(110 * R.scale, 146 * R.scale);
      card.setInteractive(new Phaser.Geom.Rectangle(-55 * R.scale, -73 * R.scale, 110 * R.scale, 146 * R.scale), Phaser.Geom.Rectangle.Contains);
      this.play.add(card);
      const obj = { id, card, back, face, open: false, done: false };
      card.on('pointerdown', () => this.flip(obj));
      this.cards.push(obj);
      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, delay: i * 45, duration: 260, ease: 'Back.easeOut' });
    });
    await wait(this, 300 + ids.length * 45);
    // Memorização: mostra tudo por um momento
    for (const c of this.cards) this.reveal(c, true);
    await wait(this, 1400 + R.pairs * 60);
    for (const c of this.cards) this.reveal(c, false);
    await wait(this, 350);
    this.lock = false;
  }

  reveal(c, open) {
    this.tweens.add({
      targets: c.card, scaleX: 0, duration: 110, ease: 'Sine.easeIn',
      onComplete: () => {
        c.open = open;
        c.back.setVisible(!open);
        c.face.setVisible(open);
        this.tweens.add({ targets: c.card, scaleX: 1, duration: 140, ease: 'Sine.easeOut' });
      },
    });
    ctx.audio && ctx.audio.sfx('pop');
  }

  flip(c) {
    if (this.state !== 'play' || this.lock || c.open || c.done) return;
    if (this.flipped.length >= 2) return;
    this.reveal(c, true);
    this.flipped.push(c);
    if (this.flipped.length === 2) {
      this.moves++;
      this.lock = true;
      const [a, b] = this.flipped;
      this.time.delayedCall(520, () => this.check(a, b));
    }
  }

  check(a, b) {
    if (this.dead) return;
    if (a.id === b.id) {
      a.done = b.done = true;
      this.matched++;
      const pts = Math.max(30, 100 - (this.moves - 1) * 4);
      this.addScore(pts, (a.card.x + b.card.x) / 2, a.card.y - 60, '#c77dff');
      burst(this, a.card.x, a.card.y, { count: 22, tints: [0xc77dff, 0xffd23f, 0xffffff], speed: 220, life: 700 });
      ctx.audio && ctx.audio.sfx('coin');
      this.flipped = [];
      this.lock = false;
      if (this.matched === ROUNDS[this.round].pairs) this.roundDone();
    } else {
      this.reveal(a, false);
      this.reveal(b, false);
      ctx.audio && ctx.audio.sfx('error');
      this.flipped = [];
      this.time.delayedCall(200, () => { this.lock = false; });
    }
  }

  async roundDone() {
    this.addScore(150, W / 2, 300, '#3bdc7a');
    ctx.audio && ctx.audio.sfx('success');
    this.round++;
    this.cards.forEach((c) => this.tweens.add({ targets: c.card, alpha: 0, duration: 400 }));
    await wait(this, 500);
    this.cards.forEach((c) => c.card.destroy());
    if (this.round >= ROUNDS.length) {
      this.setHint('Todas as rodadas completas!');
      this.finish('complete');
      return;
    }
    this.setHint(`Rodada ${this.round + 1} de 3`);
    this.startRound();
  }
}
