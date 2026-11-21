// Bobina animada: uma fita vertical de símbolos rolando dentro de uma janela com máscara.
// O resultado final já está gravado no fim da fita, então a parada é suave e exata.
import { ctx } from '../context.js';
import { REEL_STRIP, SYMBOL_IDS } from '../logic/symbols.js';

export class Reel {
  constructor(scene, x, y, cellW, rowH, rows = 3, length = 40) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.cellW = cellW;
    this.rowH = rowH;
    this.rows = rows;
    this.length = length;
    this.inner = scene.add.container(x, y);
    this.sprites = [];
    const scale = (cellW - 10) / 128;
    for (let i = 0; i < length; i++) {
      const id = i < rows ? ctx.rng.pick(REEL_STRIP) : ctx.rng.pick(REEL_STRIP);
      const s = scene.add.image(cellW / 2, i * rowH + rowH / 2, `sym-${id}`).setScale(scale);
      s.symId = id;
      this.sprites.push(s);
      this.inner.add(s);
    }
    const gm = scene.make.graphics({ x: 0, y: 0, add: false });
    gm.fillStyle(0xffffff, 1);
    gm.fillRect(x, y, cellW, rowH * rows);
    this.mask = gm.createGeometryMask();
    this.inner.setMask(this.mask);
    this.setVisible(rows);
  }

  // Coloca os símbolos visíveis atuais (sem animação).
  setVisible(rows = this.rows, ids = null) {
    for (let r = 0; r < rows; r++) {
      const id = ids ? ids[r] : (this.sprites[r] ? this.sprites[r].symId : 'limao');
      this.sprites[r].setTexture(`sym-${id}`);
      this.sprites[r].symId = id;
      this.sprites[r].y = r * this.rowH + this.rowH / 2;
    }
  }

  // Gira até parar nos símbolos `finalIds` (uma por linha visível).
  // Retorna Promise que resolve ao parar. `speed` é um fator de duração (menor = mais rápido).
  spin(finalIds, { duration = 1200, speed = 1, onTick = null } = {}) {
    const N = this.length;
    const rows = this.rows;
    // Preenche a fita: aleatório no miolo, resultado no final.
    for (let i = rows; i < N - rows; i++) {
      const id = ctx.rng.pick(REEL_STRIP);
      this.sprites[i].setTexture(`sym-${id}`).setVisible(true);
      this.sprites[i].symId = id;
    }
    for (let r = 0; r < rows; r++) {
      const idx = N - rows + r;
      this.sprites[idx].setTexture(`sym-${finalIds[r]}`);
      this.sprites[idx].symId = finalIds[r];
    }
    for (let i = 0; i < N; i++) this.sprites[i].y = i * this.rowH + this.rowH / 2;
    this.inner.y = this.y;

    const target = this.y - (N - rows) * this.rowH;
    const scene = this.scene;
    let lastIdx = 0;
    const dur = duration * speed;
    return new Promise((resolve) => {
      if (!scene.sys || !scene.sys.isActive()) return resolve();
      // Antecipação: o rolo volta um pouco antes de disparar.
      scene.tweens.add({
        targets: this.inner, y: this.y + 16 * speed + 6, duration: 110 * speed, ease: 'Sine.easeOut',
        onComplete: () => {
          scene.tweens.add({
            targets: this.inner,
            y: target,
            duration: dur,
            ease: 'Quad.easeOut',
            onUpdate: (tw, tgt) => {
              const idx = Math.floor((this.y - tgt.y) / this.rowH);
              if (idx !== lastIdx) {
                lastIdx = idx;
                if (onTick) onTick();
              }
            },
            onComplete: () => {
              this.inner.y = target;
              // Pequeno "pouso" com squash.
              scene.tweens.add({ targets: this.inner, scaleY: 0.93, duration: 70, yoyo: true, ease: 'Sine.easeOut' });
              resolve();
            },
          });
        },
      });
    }).then(() => {
      // Ao parar, a janela passa a mostrar as últimas N-rows posições da fita (resultado).
      // Reposiciona para a origem: sprites visíveis viram as linhas 0..rows-1.
      this.inner.y = this.y;
      // Reorganiza a fita para que o resultado fique nas posições 0..rows-1.
      const finalSyms = [];
      for (let r = 0; r < rows; r++) finalSyms.push(this.sprites[N - rows + r].symId);
      for (let i = 0; i < N; i++) {
        const id = i < rows ? finalSyms[i] : ctx.rng.pick(REEL_STRIP);
        this.sprites[i].setTexture(`sym-${id}`);
        this.sprites[i].symId = id;
        this.sprites[i].y = i * this.rowH + this.rowH / 2;
      }
      this.inner.y = this.y;
      return true;
    });
  }

  // Sprite de uma linha visível (0..rows-1).
  visibleSprite(row) {
    return this.sprites[row];
  }

  setVisibleAlpha(a) {
    this.inner.setAlpha(a);
  }

  destroy() {
    this.inner.destroy(true);
    this.mask && this.mask.destroy();
  }
}

export const ALL_SYMBOL_IDS = SYMBOL_IDS;
