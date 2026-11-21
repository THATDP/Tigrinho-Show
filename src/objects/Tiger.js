// O Tigrinho: mascote desenhado com formas (sem sprites externos).
// Tem expressões (humor + estilo de olhos), roupas/acessórios equipáveis e animações exageradas
// com squash & stretch, antecipação, respiração e piscadas.
import Phaser from 'phaser';
import { ctx } from '../context.js';
import { CATALOG_BY_ID } from '../logic/catalog.js';

const ORANGE = 0xff8c1a;
const CREAM = 0xfff3d6;
const INK = 0x1a0a2e;
const PINK = 0xff6fa8;

export class Tiger extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { scale = 1 } = {}) {
    super(scene, x, y);
    this.mood = 'idle';
    this.moodTimer = null;
    this.baseScale = scale;
    this.setScale(scale);

    this.glow = scene.add.image(0, -20, 'glow').setTint(0xffd23f).setAlpha(0).setScale(2.6);
    this.add(this.glow);

    // Cauda (balança o tempo todo)
    this.tail = scene.add.container(72, 70);
    const tailBody = scene.add.ellipse(0, -40, 26, 150, ORANGE).setRotation(-0.35);
    const tailTip = scene.add.ellipse(0, -100, 30, 36, CREAM).setRotation(-0.35);
    this.tail.add([tailBody, tailTip]);
    this.add(this.tail);

    // Pernas e pés
    this.add(scene.add.ellipse(-46, 118, 62, 74, ORANGE));
    this.add(scene.add.ellipse(46, 118, 62, 74, ORANGE));
    this.add(scene.add.ellipse(-50, 150, 70, 36, CREAM));
    this.add(scene.add.ellipse(50, 150, 70, 36, CREAM));

    // Corpo e barriga
    this.body = scene.add.container(0, 0);
    this.body.add(scene.add.ellipse(0, 30, 178, 200, ORANGE));
    this.body.add(scene.add.ellipse(0, 50, 104, 136, CREAM));
    this.stripesBody = scene.add.graphics();
    this.drawBodyStripes(this.stripesBody);
    this.body.add(this.stripesBody);
    this.vest = scene.add.graphics();
    this.body.add(this.vest);
    this.add(this.body);

    // Braços (pivô no ombro para animar)
    this.armL = this.makeArm(-88, -6, -1);
    this.armR = this.makeArm(88, -6, 1);
    this.add([this.armL.c, this.armR.c]);

    // Cabeça
    this.head = scene.add.container(0, -102);
    this.buildHead(scene);
    this.add(this.head);

    this.accessory = scene.add.container(0, -102);
    this.add(this.accessory);

    this.setSize(200, 320);
    scene.add.existing(this);

    this.refreshOutfit();
    this.startIdle();
    this.scheduleBlink();
  }

  makeArm(x, y, side) {
    const scene = this.scene;
    const c = scene.add.container(x, y);
    const limb = scene.add.ellipse(0, 46, 52, 112, ORANGE);
    const paw = scene.add.ellipse(0, 100, 50, 46, CREAM);
    c.add([limb, paw]);
    c.setRotation(side * 0.25);
    return { c, limb, paw, side, base: side * 0.25 };
  }

  drawBodyStripes(g) {
    g.lineStyle(9, INK, 0.75);
    for (const [x, y] of [[-70, 10], [70, 10], [-60, 80], [60, 80]]) {
      g.beginPath();
      g.arc(x, y, 34, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(40), false);
      g.strokePath();
    }
  }

  buildHead(scene) {
    const h = this.head;
    h.add(scene.add.circle(-72, -72, 34, ORANGE));
    h.add(scene.add.circle(72, -72, 34, ORANGE));
    h.add(scene.add.circle(-72, -72, 18, PINK));
    h.add(scene.add.circle(72, -72, 18, PINK));
    h.add(scene.add.circle(0, 0, 100, ORANGE));
    // Listras da testa
    const st = scene.add.graphics();
    st.fillStyle(INK, 0.8);
    for (const dx of [-30, 0, 30]) {
      st.fillTriangle(dx - 9, -100, dx + 9, -100, dx, -66 + Math.abs(dx) * 0.2);
    }
    st.fillTriangle(-100, -20, -74, -10, -92, 14);
    st.fillTriangle(100, -20, 74, -10, 92, 14);
    h.add(st);
    h.add(scene.add.ellipse(-44, 26, 52, 40, CREAM));
    h.add(scene.add.ellipse(44, 26, 52, 40, CREAM));
    h.add(scene.add.ellipse(0, 40, 118, 78, CREAM));
    // Focinho e nariz
    this.nose = scene.add.graphics();
    this.nose.fillStyle(PINK, 1);
    this.nose.fillTriangle(-16, 12, 16, 12, 0, 34);
    this.nose.lineStyle(3, INK, 1);
    this.nose.strokeTriangle(-16, 12, 16, 12, 0, 34);
    h.add(this.nose);
    // Olhos e sobrancelhas (container para piscar com scaleY)
    this.eyes = scene.add.container(0, -12);
    this.eyeG = scene.add.graphics();
    this.eyes.add(this.eyeG);
    h.add(this.eyes);
    this.mouthG = scene.add.graphics();
    h.add(this.mouthG);
    this.tear = scene.add.graphics();
    h.add(this.tear);
    this.drawFace();
  }

  // ---------- expressões ----------
  eyeStyle() {
    const eq = ctx.game ? ctx.game.equippedId('expressao') : 'exp-padrao';
    return (CATALOG_BY_ID[eq] && CATALOG_BY_ID[eq].value) || 'default';
  }

  drawFace() {
    const g = this.eyeG;
    g.clear();
    const mood = this.mood;
    const style = this.eyeStyle();
    const happyClosed = mood === 'happy' || mood === 'laugh' || mood === 'win';
    const lx = -38, rx = 38;
    const drawOpen = (x, r = 1) => {
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(x, 0, 36 * r, 42 * r);
      g.lineStyle(4, INK, 1);
      g.strokeEllipse(x, 0, 36 * r, 42 * r);
      g.fillStyle(INK, 1);
      g.fillCircle(x + (mood === 'sad' ? -2 : 2), mood === 'sad' ? 6 : 2, 9 * r);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(x + 5, -4 * r, 3.5 * r);
    };
    const drawClosed = (x) => {
      g.lineStyle(6, INK, 1);
      g.beginPath();
      g.arc(x, 4, 18, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.strokePath();
    };
    const drawStar = (x) => {
      g.fillStyle(0xffd23f, 1);
      g.lineStyle(3, INK, 1);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 22 : 9;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * r, Math.sin(a) * r));
      }
      g.fillPoints(pts, true);
      g.strokePoints(pts, true, true);
    };
    if (mood === 'win') {
      drawStar(lx); drawStar(rx);
    } else if (happyClosed) {
      drawClosed(lx); drawClosed(rx);
    } else if (style === 'wink') {
      drawClosed(lx);
      drawOpen(rx);
    } else if (style === 'star') {
      drawStar(lx); drawStar(rx);
    } else if (style === 'dreamy') {
      drawOpen(lx); drawOpen(rx);
      g.fillStyle(ORANGE, 1);
      g.fillRect(lx - 20, -26, 40, 22);
      g.fillRect(rx - 20, -26, 40, 22);
      g.lineStyle(4, INK, 1);
      g.lineBetween(lx - 18, -4, lx + 18, -4);
      g.lineBetween(rx - 18, -4, rx + 18, -4);
    } else if (mood === 'surprise') {
      drawOpen(lx, 1.25); drawOpen(rx, 1.25);
    } else {
      drawOpen(lx); drawOpen(rx);
    }
    // Sobrancelhas
    g.lineStyle(7, INK, 1);
    if (style === 'angry' || mood === 'angry') {
      g.lineBetween(lx - 18, -34, lx + 16, -22);
      g.lineBetween(rx + 18, -34, rx - 16, -22);
    } else if (mood === 'sad' || mood === 'lose') {
      g.lineBetween(lx - 16, -22, lx + 16, -34);
      g.lineBetween(rx - 16, -22, rx + 16, -34);
    } else if (mood === 'surprise') {
      g.lineBetween(lx - 16, -48, lx + 16, -50);
      g.lineBetween(rx - 16, -50, rx + 16, -48);
    }
    this.drawMouth();
    this.tear.clear();
    if (mood === 'lose' || mood === 'sad') {
      this.tear.fillStyle(0x3ff3ff, 0.95);
      this.tear.fillCircle(40, 10, 7);
      this.tear.fillTriangle(33, 8, 47, 8, 40, -10);
    }
  }

  drawMouth() {
    const m = this.mouthG;
    m.clear();
    m.lineStyle(5, INK, 1);
    const mood = this.mood;
    const rad = Phaser.Math.DegToRad;
    switch (mood) {
      case 'surprise':
        m.fillStyle(INK, 1);
        m.fillEllipse(0, 50, 22, 28);
        break;
      case 'sad':
      case 'lose':
        m.beginPath(); m.arc(0, 70, 22, rad(220), rad(320), false); m.strokePath();
        break;
      case 'happy':
        m.fillStyle(INK, 1);
        m.beginPath(); m.arc(0, 40, 26, rad(10), rad(170), false); m.closePath(); m.fillPath();
        m.fillStyle(PINK, 1);
        m.fillEllipse(0, 56, 22, 12);
        break;
      case 'laugh':
        m.fillStyle(INK, 1);
        m.fillEllipse(0, 52, 62, 46);
        m.fillStyle(PINK, 1);
        m.fillEllipse(0, 70, 36, 18);
        break;
      case 'win':
        m.fillStyle(INK, 1);
        m.fillEllipse(0, 50, 80, 52);
        m.fillStyle(0xffffff, 1);
        m.fillRect(-30, 30, 60, 14);
        m.fillStyle(PINK, 1);
        m.fillEllipse(0, 70, 40, 18);
        break;
      default: // idle: sorrisinho
        m.beginPath(); m.arc(-10, 36, 14, rad(0), rad(160), false); m.strokePath();
        m.beginPath(); m.arc(10, 36, 14, rad(20), rad(180), true); m.strokePath();
    }
  }

  // Define humor temporário; volta ao idle depois de `ms`.
  setMood(mood, ms = 0) {
    this.mood = mood;
    this.drawFace();
    if (this.moodTimer) this.moodTimer.remove(false);
    this.moodTimer = null;
    if (ms > 0) {
      this.moodTimer = this.scene.time.delayedCall(ms, () => this.setMood('idle'));
    }
  }

  // ---------- roupas e acessórios ----------
  refreshOutfit() {
    const vestId = ctx.game ? ctx.game.equippedId('roupa') : 'roupa-laranja';
    const vest = CATALOG_BY_ID[vestId];
    this.vest.clear();
    if (vest && vest.value !== ORANGE) {
      this.vest.fillStyle(vest.value, 1);
      this.vest.fillRoundedRect(-62, -20, 124, 140, 40);
      this.vest.lineStyle(4, INK, 0.7);
      this.vest.strokeRoundedRect(-62, -20, 124, 140, 40);
      this.vest.fillStyle(0xffd23f, 1);
      this.vest.fillCircle(0, 30, 6); this.vest.fillCircle(0, 60, 6); this.vest.fillCircle(0, 90, 6);
    }
    this.armL.limb.setFillStyle(vest && vest.value !== ORANGE ? vest.value : ORANGE);
    this.armR.limb.setFillStyle(vest && vest.value !== ORANGE ? vest.value : ORANGE);
    this.drawAccessory();
    this.drawFace();
  }

  drawAccessory() {
    const accId = ctx.game ? ctx.game.equippedId('acessorio') : 'acc-nenhum';
    const kind = (CATALOG_BY_ID[accId] || {}).value;
    this.accessory.removeAll(true);
    const g = this.scene.add.graphics();
    this.accessory.add(g);
    switch (kind) {
      case 'glasses':
        g.lineStyle(5, 0xffd23f, 1);
        g.strokeCircle(-38, -12, 26); g.strokeCircle(38, -12, 26);
        g.lineBetween(-12, -12, 12, -12);
        break;
      case 'bow':
        g.fillStyle(0xff2e9a, 1); g.lineStyle(4, INK, 1);
        g.fillTriangle(60, -130, 60, -100, 96, -115);
        g.fillTriangle(60, -130, 60, -100, 24, -115);
        g.fillCircle(60, -115, 9);
        g.strokeTriangle(60, -130, 60, -100, 96, -115);
        g.strokeTriangle(60, -130, 60, -100, 24, -115);
        break;
      case 'top':
        g.fillStyle(INK, 1);
        g.fillRect(-40, -190, 80, 60);
        g.fillEllipse(0, -130, 150, 30);
        g.fillStyle(0xff2e9a, 1);
        g.fillRect(-40, -146, 80, 12);
        break;
      case 'crown':
        g.fillStyle(0xffd23f, 1); g.lineStyle(4, 0x8a5a00, 1);
        {
          const pts = [[-60, -120], [-60, -160], [-30, -140], [0, -172], [30, -140], [60, -160], [60, -120]];
          g.fillPoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
          g.strokePoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true, true);
        }
        g.fillStyle(0xff2e9a, 1); g.fillCircle(0, -140, 7); g.fillCircle(-30, -128, 5); g.fillCircle(30, -128, 5);
        break;
      case 'tiara':
        g.fillStyle(0x3ff3ff, 1); g.lineStyle(3, 0xffffff, 1);
        for (const dx of [-50, -25, 0, 25, 50]) {
          g.fillTriangle(dx - 10, -106, dx + 10, -106, dx, -134);
          g.strokeTriangle(dx - 10, -106, dx + 10, -106, dx, -134);
        }
        g.lineStyle(5, 0xc9fbff, 1);
        g.lineBetween(-60, -104, 60, -104);
        break;
      default:
        break;
    }
  }

  // ---------- animações ----------
  startIdle() {
    const s = this.scene;
    this.idleTween = s.tweens.add({
      targets: this.body, scaleY: { from: 1, to: 1.025 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    s.tweens.add({ targets: this.head, y: { from: -102, to: -96 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: this.tail, rotation: { from: -0.25, to: 0.25 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: this.armL.c, rotation: { from: this.armL.base - 0.05, to: this.armL.base + 0.05 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: this.armR.c, rotation: { from: this.armR.base + 0.05, to: this.armR.base - 0.05 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(2200, 4500), () => {
      if (!this.active) return;
      this.scene.tweens.add({ targets: this.eyes, scaleY: 0.1, duration: 70, yoyo: true, onComplete: () => this.scheduleBlink() });
    });
  }

  // Squash & stretch genérico (k: intensidade).
  squash(k = 0.12, dur = 160) {
    this.scene.tweens.add({ targets: this, scaleX: this.baseScale * (1 + k), scaleY: this.baseScale * (1 - k), duration: dur, yoyo: true, ease: 'Sine.easeOut' });
  }

  // Antecipação + salto com esticada. Retorna Promise.
  async jump(height = 90, dur = 380) {
    const s = this.scene;
    await tweenP(s, { targets: this, scaleX: this.baseScale * 0.88, scaleY: this.baseScale * 1.1, duration: 120, ease: 'Sine.easeIn' });
    if (!this.active) return;
    const up = tweenP(s, { targets: this, y: this.y - height, scaleX: this.baseScale * 0.95, scaleY: this.baseScale * 1.08, duration: dur / 2, ease: 'Cubic.easeOut' });
    await up;
    await tweenP(s, { targets: this, y: this.y + height, scaleX: this.baseScale * 1.12, scaleY: this.baseScale * 0.9, duration: dur / 2, ease: 'Cubic.easeIn' });
    await tweenP(s, { targets: this, scaleX: this.baseScale, scaleY: this.baseScale, duration: 180, ease: 'Back.easeOut' });
  }

  async celebrate(style = 'jump') {
    const s = this.scene;
    this.setMood('win', 1200);
    this.glowOn(0.6, 900);
    if (ctx.audio) ctx.audio.sfx('laugh');
    if (style === 'samba') {
      for (let i = 0; i < 6; i++) {
        await tweenP(s, { targets: this, angle: i % 2 ? -10 : 10, duration: 140, ease: 'Sine.easeInOut' });
      }
      await tweenP(s, { targets: this, angle: 0, duration: 120 });
      this.armUp(true, 300);
    } else if (style === 'flip') {
      this.armUp(true, 500);
      const y0 = this.y;
      await tweenP(s, { targets: this, y: y0 - 130, angle: 360, scaleX: this.baseScale * 0.92, scaleY: this.baseScale * 1.08, duration: 620, ease: 'Cubic.easeOut' });
      this.angle = 0;
      await tweenP(s, { targets: this, y: y0, scaleX: this.baseScale, scaleY: this.baseScale, duration: 240, ease: 'Bounce.easeOut' });
    } else {
      this.armUp(true, 320);
      await this.jump(110, 420);
    }
    this.armUp(false, 200);
  }

  armUp(up, dur = 200) {
    const s = this.scene;
    const target = up ? -2.6 : 0;
    s.tweens.add({ targets: this.armL.c, rotation: up ? this.armL.base - 2.4 : this.armL.base, duration: dur, ease: 'Back.easeOut' });
    s.tweens.add({ targets: this.armR.c, rotation: up ? this.armR.base + 2.4 : this.armR.base, duration: dur, ease: 'Back.easeOut' });
    void target;
  }

  glowOn(alpha = 0.5, dur = 600) {
    this.scene.tweens.add({ targets: this.glow, alpha, duration: dur * 0.3, yoyo: true, hold: dur * 0.2, ease: 'Sine.easeOut' });
  }

  surprise() {
    this.setMood('surprise', 900);
    if (ctx.audio) ctx.audio.sfx('surprise');
    this.scene.tweens.add({ targets: this, scaleX: this.baseScale * 1.1, scaleY: this.baseScale * 1.1, duration: 90, yoyo: true, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: this.head, x: { from: -8, to: 0 }, duration: 380, ease: 'Bounce.easeOut' });
  }

  sad() {
    this.setMood('sad', 1600);
    if (ctx.audio) ctx.audio.sfx('sad');
    this.scene.tweens.add({ targets: this.head, y: -88, duration: 300, yoyo: true, hold: 900, ease: 'Sine.easeOut' });
    this.scene.tweens.add({ targets: this, scaleY: this.baseScale * 0.94, duration: 300, yoyo: true, hold: 800 });
  }

  laugh(ms = 1400) {
    this.setMood('laugh', ms);
    if (ctx.audio) ctx.audio.sfx('laugh');
    const rot = this.scene.tweens.add({ targets: this, angle: { from: -4, to: 4 }, duration: 110, yoyo: true, repeat: Math.floor(ms / 220), ease: 'Sine.easeInOut' });
    this.scene.time.delayedCall(ms, () => { rot.stop(); this.angle = 0; });
    this.squash(0.08, 180);
  }

  lose() {
    this.setMood('lose', 1800);
    if (ctx.audio) ctx.audio.sfx('lose');
    this.scene.tweens.add({ targets: this, y: this.y + 12, scaleY: this.baseScale * 0.94, duration: 320, yoyo: true, hold: 700 });
  }

  // Reação a um evento especial.
  reactEvent(id) {
    if (id === 'mascote' || id === 'bonus') this.celebrate('samba');
    else if (id === 'relampago') this.surprise();
    else if (id === 'sequencia') this.setMood('surprise', 1000);
    else this.squash(0.15);
  }

  destroy(fromScene) {
    this.active = false;
    super.destroy(fromScene);
  }
}

function tweenP(scene, cfg) {
  return new Promise((resolve) => {
    if (!scene.sys || !scene.sys.isActive()) return resolve();
    scene.tweens.add({ ...cfg, onComplete: () => resolve() });
  });
}
