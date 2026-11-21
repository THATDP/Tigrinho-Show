// Helpers de interface: botões, painéis, fundo animado, textos flutuantes e transições.
import Phaser from 'phaser';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE, FONT_BODY } from '../config.js';

export const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');


// Desenha uma vez e reaproveita como textura (Graphics são retriangulados a cada quadro: caro).
export function cached(scene, key, w, h, draw) {
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, Math.ceil(w), Math.ceil(h));
    g.destroy();
  }
  return key;
}

export function tween(scene, cfg) {
  return new Promise((resolve) => {
    if (!scene.sys || !scene.sys.isActive()) return resolve();
    scene.tweens.add({ ...cfg, onComplete: () => resolve() });
  });
}

export function wait(scene, ms) {
  return new Promise((resolve) => {
    if (!scene.sys || !scene.sys.isActive()) return resolve();
    scene.time.delayedCall(ms, () => resolve());
  });
}

export function text(scene, x, y, str, opts = {}) {
  const {
    size = 22, color = '#ffffff', font = FONT_BODY, bold = false, align = 'center',
    stroke = '#1a0a2e', strokeW = 4, shadow = true, wrap = 0, origin = 0.5,
  } = opts;
  const t = scene.add.text(x, y, str, {
    fontFamily: font,
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    align,
    stroke,
    strokeThickness: strokeW,
    wordWrap: wrap ? { width: wrap, useAdvancedWrap: true } : undefined,
  });
  t.setOrigin(origin, origin === 0.5 ? 0.5 : 0);
  if (shadow) t.setShadow(0, 4, '#000000', 6, false, true);
  if (opts.depth !== undefined) t.setDepth(opts.depth);
  return t;
}

// Fundo com gradiente, raios de holofote girando e brilho (tudo em texturas cacheadas).
export function makeBackground(scene, theme = { top: 0x3a0b66, bottom: 0x12031f, glow: 0xff2e9a }) {
  const c = scene.add.container(0, 0).setDepth(-100);
  const gradKey = cached(scene, `bg-grad-${theme.top}-${theme.bottom}`, W, H, (g) => {
    const steps = 24;
    const a = Phaser.Display.Color.ValueToColor(theme.top);
    const b = Phaser.Display.Color.ValueToColor(theme.bottom);
    for (let i = 0; i < steps; i++) {
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, steps, i);
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      g.fillRect(0, (H / steps) * i, W, H / steps + 2);
    }
  });
  c.add(scene.add.image(0, 0, gradKey).setOrigin(0, 0));
  // Raios: uma textura quadrada com 12 feixes, girando lentamente em torno do centro.
  const raysKey = cached(scene, `bg-rays-${theme.glow}`, 1024, 1024, (g) => {
    g.fillStyle(theme.glow, 0.08);
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(512, 512);
      g.lineTo(512 + Math.cos(a0) * 740, 512 + Math.sin(a0) * 740);
      g.lineTo(512 + Math.cos(a0 + 0.2) * 740, 512 + Math.sin(a0 + 0.2) * 740);
      g.closePath();
      g.fillPath();
    }
  });
  const rays = scene.add.image(W / 2, H / 2 - 80, raysKey).setScale(2.2);
  c.add(rays);
  const reduced = !!(ctx.game && ctx.game.data.settings.reducedMotion);
  if (!reduced) {
    scene.tweens.add({ targets: rays, angle: 360, duration: 60000, repeat: -1, ease: 'Linear' });
  }
  const glow = scene.add.image(W / 2, H / 2 - 40, 'glow').setTint(theme.glow).setAlpha(0.3).setScale(5, 3.2);
  c.add(glow);
  scene.tweens.add({ targets: glow, alpha: 0.16, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  if (ctx.game && ctx.game.data.settings.particles === 'full' && !reduced) {
    const sp = scene.add.particles(0, 0, 'particle-spark', {
      x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: { min: 3000, max: 6000 },
      speedY: { min: -12, max: -30 }, speedX: { min: -6, max: 6 }, scale: { start: 0.25, end: 0 },
      alpha: { start: 0.7, end: 0 }, frequency: 260, tint: [theme.glow, 0xffffff, 0xffd23f],
    });
    sp.setDepth(-90);
    c.add(sp);
  }
  return c;
}

// Botão arcade: fundo em textura cacheada, hover e clique com squash.
export function makeButton(scene, x, y, w, h, label, onClick, opts = {}) {
  const { color = COLORS.pink, textColor = '#ffffff', size = 22, disabled = false, sound = true } = opts;
  const c = scene.add.container(x, y);
  const rim = disabled ? 0x2a2433 : 0xffffff;
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.45);
  shadow.fillRoundedRect(-w / 2 + 4, -h / 2 + 8, w, h, 18);
  const btnKey = (col) => cached(scene, `btn-${w}x${h}-${col}-${rim}`, w + 2, h + 2, (g) => {
    g.fillStyle(col, 1);
    g.fillRoundedRect(1, 1, w, h, 18);
    g.fillStyle(0xffffff, 0.18);
    g.fillRoundedRect(7, 6, w - 12, h * 0.42, 14);
    g.lineStyle(3, rim, 1);
    g.strokeRoundedRect(1, 1, w, h, 18);
  });
  const base = disabled ? 0x4a4458 : color;
  const bg = scene.add.image(-w / 2 - 1, -h / 2 - 1, btnKey(base)).setOrigin(0, 0);
  const t = text(scene, 0, 0, label, { size, color: disabled ? '#9a92ab' : textColor, bold: true, font: FONT_TITLE, strokeW: 5 });
  c.add([shadow, bg, t]);
  const hit = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: !disabled });
  c.add(hit);
  c.setSize(w, h);
  c.meta = {
    disabled,
    base,
    setLabel: (str) => t.setText(str),
    setColor: (col) => bg.setTexture(btnKey(col)),
  };
  if (!disabled) {
    hit.on('pointerover', () => {
      scene.tweens.add({ targets: c, scale: 1.05, duration: 120, ease: 'Sine.easeOut' });
      if (sound && ctx.audio) ctx.audio.sfx('hover');
    });
    hit.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120 }));
    hit.on('pointerdown', () => {
      scene.tweens.add({ targets: c, scaleX: 0.92, scaleY: 1.06, duration: 60, yoyo: true, ease: 'Sine.easeOut' });
      if (sound && ctx.audio) ctx.audio.sfx('click');
      onClick && onClick();
    });
  } else {
    hit.disableInteractive();
  }
  return c;
}

export function makePanel(scene, x, y, w, h, { color = 0x1a0a2e, alpha = 0.85, stroke = COLORS.gold, radius = 22, strokeW = 3 } = {}) {
  const key = `panel-${Math.round(w)}x${Math.round(h)}-${color}-${alpha}-${stroke}-${radius}-${strokeW}`;
  cached(scene, key, w + 8, h + 10, (g) => {
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(5, 8, w, h, radius);
    g.fillStyle(color, alpha);
    g.fillRoundedRect(0, 0, w, h, radius);
    if (stroke !== null) {
      g.lineStyle(strokeW, stroke, 0.9);
      g.strokeRoundedRect(0, 0, w, h, radius);
    }
  });
  return scene.add.image(x, y, key).setOrigin(0, 0);
}

// Cabeçalho padrão das telas de menu.
export function header(scene, title, subtitle = '') {
  text(scene, W / 2, 48, title, { size: 46, color: '#ffd23f', font: FONT_TITLE, stroke: '#7a0041', strokeW: 8 });
  if (subtitle) text(scene, W / 2, 92, subtitle, { size: 18, color: '#d9c8ff' });
}

export function backButton(scene, onClick = () => scene.goto('MenuScene')) {
  return makeButton(scene, 110, 48, 170, 52, '◀ VOLTAR', onClick, { color: COLORS.violet, size: 18 });
}

export function toast(scene, msg, color = '#ffffff', y = 150) {
  const t = text(scene, W / 2, y, msg, { size: 22, color, font: FONT_TITLE, stroke: '#000', strokeW: 6, bold: true }).setDepth(900);
  scene.tweens.add({
    targets: t, y: y - 40, alpha: 0, duration: 1800, ease: 'Sine.easeIn',
    onComplete: () => t.destroy(),
  });
  return t;
}

// Texto que sobe e some (ganhos, pontos).
export function floatText(scene, x, y, msg, color = '#ffd23f', size = 26) {
  const t = text(scene, x, y, msg, { size, color, font: FONT_TITLE, bold: true, stroke: '#000', strokeW: 6 }).setDepth(800);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, scale: 1.25, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
}

// Banner grande de destaque (eventos e vitórias).
export function banner(scene, msg, color = '#ffd23f', sub = '') {
  const c = scene.add.container(W / 2, H / 2 - 40).setDepth(950).setAlpha(0);
  const bgG = scene.add.graphics();
  bgG.fillStyle(0x000000, 0.55);
  bgG.fillRect(-W / 2, -70, W, 140);
  const t = text(scene, 0, -10, msg, { size: 60, color, font: FONT_TITLE, stroke: '#2a0030', strokeW: 10 });
  c.add([bgG, t]);
  if (sub) c.add(text(scene, 0, 50, sub, { size: 22, color: '#ffffff' }));
  c.setScale(0.4);
  scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 300, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: c, alpha: 0, delay: 1600, duration: 350, onComplete: () => c.destroy() });
  return c;
}

export function shake(scene, intensity = 6, duration = 260) {
  if (!ctx.game || !ctx.game.data.settings.shake || ctx.game.data.settings.reducedMotion) return;
  scene.cameras.main.shake(duration, intensity / 1000);
}

export function flash(scene, color = 0xffffff, duration = 220) {
  const r = Phaser.Display.Color.ValueToColor(color);
  if (ctx.game && ctx.game.data.settings.reducedMotion) return;
  scene.cameras.main.flash(duration, r.red, r.green, r.blue);
}

// Partículas de efeito pontual usando a textura indicada.
export function burst(scene, x, y, { key = 'particle-spark', tints = [0xffd23f, 0xff2e9a, 0x3ff3ff], count = 30, speed = 320, life = 900, scale = 0.6, gravity = 300 } = {}) {
  const low = ctx.game && ctx.game.data.settings.particles === 'low';
  const n = low ? Math.ceil(count / 3) : count;
  const em = scene.add.particles(x, y, key, {
    speed: { min: speed * 0.3, max: speed },
    angle: { min: 0, max: 360 },
    scale: { start: scale, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: life,
    gravityY: gravity,
    tint: tints,
    emitting: false,
  });
  em.setDepth(700);
  em.explode(n, x, y);
  scene.time.delayedCall(life + 200, () => em.destroy());
  return em;
}

export function confettiRain(scene, colors, duration = 2000) {
  if (ctx.game && ctx.game.data.settings.particles === 'low') return;
  const em = scene.add.particles(0, -20, 'particle-rect', {
    x: { min: 0, max: W }, lifespan: { min: 2200, max: 3200 },
    speedY: { min: 160, max: 320 }, speedX: { min: -60, max: 60 },
    rotate: { min: 0, max: 360 }, scale: { min: 0.6, max: 1.2 }, tint: colors,
    frequency: 25, quantity: 2,
  });
  em.setDepth(960);
  scene.time.delayedCall(duration, () => em.stop());
  scene.time.delayedCall(duration + 3500, () => em.destroy());
}

// Pausa leve sugerida depois de muito tempo de jogo (anti-compulsão).
export function maybeBreakNudge(scene) {
  const minutes = (Date.now() - ctx.sessionStart) / 60000;
  if (minutes < 45 || Date.now() - ctx.lastBreakNudge < 20 * 60000) return;
  ctx.lastBreakNudge = Date.now();
  toast(scene, 'Já faz um tempão! Que tal um lanche e um alongamento? 🐯', '#3ff3ff', 200);
}

export { W, H };

// Tema de cenário (fundo) conforme o item equipado.
export function sceneTheme() {
  const it = ctx.game ? ctx.game.equippedItem('cenario') : null;
  return (it && it.value && typeof it.value === 'object') ? it.value : { top: 0x3a0b66, bottom: 0x12031f, glow: 0xff2e9a };
}

// Tema de gabinete (cores da máquina) conforme o item equipado.
export function machineTheme() {
  const it = ctx.game ? ctx.game.equippedItem('tema') : null;
  return (it && it.value && typeof it.value === 'object') ? it.value : { body: 0xb3123a, trim: 0xffd23f };
}
