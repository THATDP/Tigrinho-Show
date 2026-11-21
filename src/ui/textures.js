// Gera todas as texturas do jogo em tempo de execução (sem arquivos de imagem externos).
import Phaser from 'phaser';
import { SYMBOL_IDS } from '../logic/symbols.js';

const INK = 0x1a0a2e;

function make(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

function star(g, cx, cy, rOuter, rInner, points = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = rot + (i * Math.PI) / points;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}

function drawSymbol(g, id) {
  const c = 64;
  switch (id) {
    case 'tigre': {
      g.fillStyle(0xff8c1a, 1); g.fillCircle(c, c + 4, 46);
      g.fillCircle(c - 36, c - 30, 15); g.fillCircle(c + 36, c - 30, 15);
      g.fillStyle(0xfff3d6, 1); g.fillEllipse(c, c + 18, 50, 36);
      g.fillStyle(INK, 0.85);
      g.fillTriangle(c - 6, c - 36, c + 6, c - 36, c, c - 20);
      g.fillTriangle(c - 22, c - 30, c - 12, c - 30, c - 16, c - 14);
      g.fillTriangle(c + 22, c - 30, c + 12, c - 30, c + 16, c - 14);
      g.fillStyle(0xffffff, 1); g.fillCircle(c - 16, c - 2, 7); g.fillCircle(c + 16, c - 2, 7);
      g.fillStyle(INK, 1); g.fillCircle(c - 14, c - 1, 4); g.fillCircle(c + 18, c - 1, 4);
      g.fillStyle(0xff6fa8, 1); g.fillTriangle(c - 6, c + 10, c + 6, c + 10, c, c + 17);
      g.lineStyle(3, 0xffd23f, 1); g.strokeCircle(c, c + 4, 46);
      break;
    }
    case 'bola': {
      g.fillStyle(0x3b1a7a, 1); g.fillCircle(c, c, 44);
      g.fillStyle(0x8a5cff, 0.8); g.fillCircle(c - 8, c - 8, 30);
      g.fillStyle(0xffffff, 0.7); g.fillCircle(c - 16, c - 20, 9);
      g.lineStyle(4, 0xc77dff, 1); g.strokeCircle(c, c, 44);
      g.fillStyle(0xffd23f, 1); g.fillPoints(star(g, c + 40, c - 38, 9, 4), true);
      g.fillStyle(0xff2e9a, 1); g.fillPoints(star(g, c - 42, c + 36, 7, 3), true);
      break;
    }
    case 'diamante': {
      const pts = [[c, c - 46], [c + 44, c - 8], [c, c + 48], [c - 44, c - 8]].map(([x, y]) => new Phaser.Math.Vector2(x, y));
      g.fillStyle(0x3ff3ff, 1); g.fillPoints(pts, true);
      g.fillStyle(0xbffcff, 1); g.fillPoints([pts[0], pts[1], new Phaser.Math.Vector2(c, c - 8)], true);
      g.lineStyle(3, 0x0a4a66, 1); g.strokePoints(pts, true, true);
      g.lineBetween(c - 44, c - 8, c + 44, c - 8);
      g.lineBetween(c - 22, c - 8, c, c + 48); g.lineBetween(c + 22, c - 8, c, c + 48);
      break;
    }
    case 'sete': {
      g.lineStyle(26, 0xff2e9a, 1);
      g.lineBetween(c - 30, c - 36, c + 32, c - 36);
      g.lineBetween(c + 32, c - 36, c - 6, c + 42);
      g.lineStyle(14, 0xffd23f, 1);
      g.lineBetween(c - 30, c - 36, c + 32, c - 36);
      g.lineBetween(c + 32, c - 36, c - 6, c + 42);
      g.fillStyle(0xffffff, 0.8); g.fillCircle(c - 22, c - 42, 4);
      break;
    }
    case 'estrela': {
      const pts = star(g, c, c + 2, 50, 22);
      g.fillStyle(0xffd23f, 1); g.fillPoints(pts, true);
      g.lineStyle(4, 0xb36b00, 1); g.strokePoints(pts, true, true);
      g.fillStyle(0xfff7b0, 1); g.fillCircle(c - 10, c - 8, 7);
      break;
    }
    case 'sino': {
      g.fillStyle(0xffb300, 1);
      g.fillTriangle(c - 34, c + 26, c + 34, c + 26, c - 22, c - 30);
      g.fillTriangle(c - 34, c + 26, c + 34, c + 26, c + 22, c - 30);
      g.fillCircle(c, c - 32, 9);
      g.fillRoundedRect(c - 40, c + 22, 80, 14, 6);
      g.fillStyle(0xfff3a1, 0.9); g.fillRect(c - 24, c - 14, 8, 26);
      g.fillStyle(0x8a5a00, 1); g.fillCircle(c, c + 46, 9);
      g.lineStyle(3, 0x8a5a00, 1); g.strokeTriangle(c - 34, c + 26, c + 34, c + 26, c - 22, c - 30);
      break;
    }
    case 'cereja': {
      g.lineStyle(5, 0x2e8b3a, 1);
      g.lineBetween(c - 18, c + 24, c, c - 30); g.lineBetween(c + 20, c + 26, c, c - 30);
      g.fillStyle(0x3bdc7a, 1); g.fillEllipse(c + 12, c - 30, 28, 14);
      g.fillStyle(0xff3b5c, 1); g.fillCircle(c - 18, c + 26, 24); g.fillCircle(c + 20, c + 28, 24);
      g.fillStyle(0xffffff, 0.7); g.fillCircle(c - 26, c + 18, 6); g.fillCircle(c + 12, c + 20, 6);
      break;
    }
    case 'limao': {
      g.fillStyle(0xb8ff3b, 1); g.fillEllipse(c, c, 88, 66);
      g.fillStyle(0xe8ffb0, 0.8); g.fillEllipse(c - 14, c - 12, 26, 14);
      g.fillStyle(0x3bdc7a, 1); g.fillEllipse(c + 26, c - 26, 30, 14);
      g.lineStyle(3, 0x5a8a00, 1); g.strokeEllipse(c, c, 88, 66);
      break;
    }
    default: break;
  }
}

export function generateTextures(scene) {
  // Brilho radial suave
  make(scene, 'glow', 256, 256, (g) => {
    for (let r = 128; r > 0; r -= 4) {
      g.fillStyle(0xffffff, 0.06 + (1 - r / 128) * 0.18);
      g.fillCircle(128, 128, r);
    }
  });
  make(scene, 'particle-spark', 32, 32, (g) => {
    g.fillStyle(0xffffff, 0.25); g.fillCircle(16, 16, 16);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(16, 16, 9);
    g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 4);
  });
  make(scene, 'particle-circle', 16, 16, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); });
  make(scene, 'particle-star', 32, 32, (g) => { g.fillStyle(0xffffff, 1); g.fillPoints(star(g, 16, 16, 15, 6), true); });
  make(scene, 'particle-rect', 14, 8, (g) => { g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 14, 8); });
  make(scene, 'particle-heart', 32, 32, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 12, 8); g.fillCircle(21, 12, 8);
    g.fillTriangle(3.5, 14, 28.5, 14, 16, 30);
  });
  make(scene, 'bg-dot', 4, 4, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(2, 2, 2); });

  for (const id of SYMBOL_IDS) make(scene, `sym-${id}`, 128, 128, (g) => drawSymbol(g, id));

  // Itens dos minijogos
  make(scene, 'coin', 64, 64, (g) => {
    g.fillStyle(0xffb300, 1); g.fillCircle(32, 32, 28);
    g.lineStyle(5, 0xfff3a1, 1); g.strokeCircle(32, 32, 22);
    g.fillStyle(0xfff3a1, 1); g.fillPoints(star(g, 32, 33, 12, 5), true);
    g.lineStyle(3, 0x8a5a00, 1); g.strokeCircle(32, 32, 28);
  });
  make(scene, 'fish', 72, 48, (g) => {
    g.fillStyle(0x3ff3ff, 1); g.fillEllipse(30, 24, 52, 30);
    g.fillTriangle(54, 24, 72, 8, 72, 40);
    g.fillStyle(0xffffff, 1); g.fillCircle(18, 19, 5);
    g.fillStyle(INK, 1); g.fillCircle(18, 19, 2.5);
    g.lineStyle(3, 0x0a4a66, 1); g.strokeEllipse(30, 24, 52, 30);
  });
  make(scene, 'bomba', 64, 72, (g) => {
    g.fillStyle(INK, 1); g.fillCircle(32, 42, 24);
    g.fillStyle(0xffffff, 0.2); g.fillCircle(24, 34, 6);
    g.lineStyle(4, 0x8a5a00, 1); g.lineBetween(36, 22, 46, 8);
    g.fillStyle(0xff8c1a, 1); g.fillCircle(46, 8, 6);
  });
  make(scene, 'alvo-bom', 96, 96, (g) => {
    g.lineStyle(8, 0x3ff3ff, 1); g.strokeCircle(48, 48, 40);
    g.lineStyle(6, 0xffffff, 1); g.strokeCircle(48, 48, 22);
    g.fillStyle(0x3ff3ff, 1); g.fillCircle(48, 48, 9);
  });
  make(scene, 'alvo-ruim', 96, 96, (g) => {
    g.lineStyle(8, 0xff3b5c, 1); g.strokeCircle(48, 48, 40);
    g.lineStyle(10, 0xff3b5c, 1); g.lineBetween(30, 30, 66, 66); g.lineBetween(66, 30, 30, 66);
  });
  make(scene, 'tigre-cabeca', 128, 128, (g) => {
    g.fillStyle(0xff8c1a, 1); g.fillCircle(64, 66, 52);
    g.fillCircle(22, 22, 16); g.fillCircle(106, 22, 16);
    g.fillStyle(0xfff3d6, 1); g.fillEllipse(64, 84, 60, 40);
    g.fillStyle(INK, 1); g.fillCircle(46, 56, 7); g.fillCircle(82, 56, 7);
    g.fillTriangle(56, 74, 72, 74, 64, 84);
    g.lineStyle(3, 0xffffff, 0.5); g.strokeCircle(64, 66, 52);
  });
  make(scene, 'card-back', 110, 146, (g) => {
    g.fillStyle(0x4a1480, 1); g.fillRoundedRect(0, 0, 110, 146, 14);
    g.lineStyle(4, 0xffd23f, 1); g.strokeRoundedRect(4, 4, 102, 138, 12);
    g.fillStyle(0xff2e9a, 0.8); g.fillPoints(star(g, 55, 73, 24, 10), true);
    g.fillStyle(0xffd23f, 1); g.fillPoints(star(g, 55, 73, 12, 5), true);
  });
  make(scene, 'card-front', 110, 146, (g) => {
    g.fillStyle(0xfff3d6, 1); g.fillRoundedRect(0, 0, 110, 146, 14);
    g.lineStyle(4, 0xff2e9a, 1); g.strokeRoundedRect(4, 4, 102, 138, 12);
  });
  make(scene, 'bau', 120, 100, (g) => {
    g.fillStyle(0x8a4b12, 1); g.fillRoundedRect(4, 30, 112, 66, 10);
    g.fillStyle(0xb8661d, 1); g.fillRoundedRect(4, 6, 112, 40, 14);
    g.fillStyle(0xffd23f, 1); g.fillRoundedRect(50, 34, 20, 28, 4);
    g.lineStyle(4, 0xffd23f, 1); g.strokeRoundedRect(4, 6, 112, 90, 12);
    g.fillStyle(0xfff3a1, 1); g.fillCircle(60, 48, 5);
  });
  make(scene, 'tile-fog', 64, 64, (g) => {
    g.fillStyle(0x3a1a66, 1); g.fillRoundedRect(0, 0, 64, 64, 10);
    g.fillStyle(0x7b3ff2, 0.5); g.fillCircle(20, 22, 12); g.fillCircle(44, 40, 14);
    g.lineStyle(2, 0xc77dff, 0.6); g.strokeRoundedRect(2, 2, 60, 60, 9);
  });
  make(scene, 'tile-dug', 64, 64, (g) => {
    g.fillStyle(0x5a3a1e, 1); g.fillRoundedRect(0, 0, 64, 64, 10);
    g.fillStyle(0x3a2412, 1); g.fillCircle(18, 40, 5); g.fillCircle(42, 22, 4); g.fillCircle(44, 46, 3);
  });
  make(scene, 'obst-cone', 56, 72, (g) => {
    g.fillStyle(0xff6a00, 1); g.fillTriangle(28, 4, 4, 68, 52, 68);
    g.fillStyle(0xffffff, 1); g.fillRect(14, 36, 28, 8); g.fillRect(8, 52, 40, 8);
    g.fillStyle(INK, 1); g.fillRect(0, 66, 56, 6);
  });
  make(scene, 'obst-bola', 64, 64, (g) => {
    g.fillStyle(0xff3b5c, 1); g.fillCircle(32, 32, 28);
    g.fillStyle(0xffffff, 1); for (let i = 0; i < 4; i++) g.fillCircle(32 + Math.cos(i * 1.57) * 18, 32 + Math.sin(i * 1.57) * 18, 4);
    g.lineStyle(3, INK, 1); g.strokeCircle(32, 32, 28);
  });
  make(scene, 'pedestal', 360, 80, (g) => {
    g.fillStyle(0x000000, 0.4); g.fillEllipse(180, 40, 360, 70);
    g.fillStyle(0x2a0f40, 1); g.fillEllipse(180, 30, 340, 56);
    g.lineStyle(4, 0xff2e9a, 0.8); g.strokeEllipse(180, 30, 340, 56);
  });
}
