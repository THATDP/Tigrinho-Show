// 7) Caça ao Tesouro: cave no nevoeiro e encontre o baú com dicas de "quente e frio".
import Phaser from 'phaser';
import { MinigameBase } from './MinigameBase.js';
import { ctx } from '../context.js';
import { W } from '../config.js';
import { burst, floatText, shake } from '../ui/ui.js';

export const CFG = {
  key: 'MG_tesouro', id: 'tesouro', name: 'Caça ao Tesouro', accent: 0x8a5a00, accentHex: '#ffb300',
  desc: 'Um baú está escondido no mapa. Cave com cuidado e siga as dicas!',
  rules: [
    'Clique em um quadrado para cavar. Você tem 10 pás por baú.',
    'Dicas: "Quente" = perto, "Morno" = médio, "Frio" = longe.',
    'Achar o baú vale 100 pontos + 10 por pá sobrando.',
    'São 3 baús. Cavar em lugares vazios não custa pontos.',
  ],
  goals: { bronze: 220, silver: 330, gold: 420 }, duration: null, fichasPerPoint: 0.6, xpCap: 140,
};

const N = 8, CELL = 62, TOTAL_CHESTS = 3, SHOVELS = 10;
const GX = (W - N * CELL) / 2 + CELL / 2, GY = 150 + CELL / 2 - 6;

export class TesouroScene extends MinigameBase {
  constructor() { super(CFG.key, CFG); }

  onStart() {
    this.chest = 0;
    this.shovels = SHOVELS;
    this.onAction = null;
    this.hintText2 = this.add.text(W / 2, 606, '', { fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20);
    this.play.add(this.hintText2);
    this.shovelText = this.add.text(W / 2, 640, '', { fontFamily: 'Trebuchet MS', fontSize: '20px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.play.add(this.shovelText);
    this.buildGrid();
    this.newChest();
  }

  buildGrid() {
    this.tiles = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = GX + x * CELL, py = GY + y * CELL;
      const img = this.add.image(px, py, 'tile-fog').setScale((CELL - 4) / 64).setDepth(15).setInteractive({ useHandCursor: true });
      this.play.add(img);
      const t = { x, y, px, py, img, dug: false };
      img.on('pointerdown', () => this.dig(t));
      this.tiles.push(t);
    }
    this.hintLayer = this.add.container(0, 0).setDepth(18);
    this.play.add(this.hintLayer);
    this.chestImg = this.add.image(0, 0, 'bau').setScale(0.4).setVisible(false).setDepth(16);
    this.play.add(this.chestImg);
  }

  newChest() {
    this.chest++;
    this.shovels = SHOVELS;
    this.tiles.forEach((t) => { t.dug = false; t.img.setTexture('tile-fog').setAlpha(1).setInteractive({ useHandCursor: true }); });
    this.hintLayer.removeAll(true);
    const pos = ctx.rng.pick(this.tiles);
    this.target = pos;
    this.chestImg.setVisible(false);
    this.setHint(`Baú ${this.chest} de ${TOTAL_CHESTS}`);
    this.updateInfo('Cave para descobrir o baú!');
  }

  updateInfo(msg) {
    this.hintText2.setText(msg);
    this.shovelText.setText(`Pás restantes: ${this.shovels}`);
  }

  dig(t) {
    if (this.state !== 'play' || t.dug || this.shovels <= 0) return;
    t.dug = true;
    t.img.disableInteractive();
    this.shovels--;
    if (t === this.target) {
      t.img.setTexture('tile-dug');
      this.chestImg.setPosition(t.px, t.py).setVisible(true);
      this.tweens.add({ targets: this.chestImg, scale: { from: 0, to: 0.46 }, duration: 380, ease: 'Back.easeOut' });
      const pts = 100 + this.shovels * 10;
      this.addScore(pts, t.px, t.py - 60, '#ffd23f');
      burst(this, t.px, t.py, { count: 60, tints: [0xffd23f, 0xffffff, 0xff8c1a], speed: 340 });
      shake(this, 10, 300);
      ctx.audio && ctx.audio.sfx('win-medium');
      this.updateInfo(`Achou o baú! +${pts}`);
      this.time.delayedCall(1300, () => {
        if (this.state !== 'play') return;
        if (this.chest >= TOTAL_CHESTS) this.finish('complete');
        else this.newChest();
      });
      this.tiles.forEach((o) => { if (!o.dug) o.img.disableInteractive(); });
      return;
    }
    t.img.setTexture('tile-dug');
    const d = Math.max(Math.abs(t.x - this.target.x), Math.abs(t.y - this.target.y));
    const label = d <= 1 ? 'QUENTE!!' : d <= 3 ? 'Quente' : d <= 5 ? 'Morno' : 'Frio';
    const color = d <= 1 ? '#ff3b5c' : d <= 3 ? '#ff8c1a' : d <= 5 ? '#ffd23f' : '#3ff3ff';
    const hint = this.add.text(t.px, t.py, label, { fontFamily: 'Arial Black', fontSize: '11px', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(19);
    this.hintLayer.add(hint);
    ctx.audio && ctx.audio.sfx(d <= 1 ? 'pop' : 'tick');
    this.updateInfo(`${label} — ${this.shovels} pás`);
    if (this.shovels <= 0) {
      this.updateInfo('Sem pás! O baú fugiu…');
      this.chestImg.setPosition(this.target.px, this.target.py).setVisible(true).setAlpha(0.5);
      ctx.audio && ctx.audio.sfx('fail');
      this.time.delayedCall(1500, () => {
        if (this.state !== 'play') return;
        if (this.chest >= TOTAL_CHESTS) this.finish('complete');
        else this.newChest();
      });
    }
  }
}
