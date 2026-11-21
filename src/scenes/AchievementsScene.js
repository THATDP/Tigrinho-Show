// Conquistas permanentes com progresso e recompensas.
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS } from '../config.js';
import { ACHIEVEMENTS } from '../logic/progression.js';
import { makeBackground, makePanel, text, fmt, header, backButton, sceneTheme } from '../ui/ui.js';

export class AchievementsScene extends BaseScene {
  constructor() { super('AchievementsScene'); }

  create() {
    super.create();
    const g = ctx.game;
    makeBackground(this, sceneTheme());
    const got = Object.keys(g.data.achievements).length;
    header(this, 'CONQUISTAS', `${got} de ${ACHIEVEMENTS.length} desbloqueadas`);
    backButton(this);
    ACHIEVEMENTS.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const w = 560, h = 84;
      const x = 330 + col * 600, y = 170 + row * 96;
      const unlocked = !!g.data.achievements[a.id];
      const val = Math.min(a.target, g.data.stats[a.stat] ?? 0);
      makePanel(this, x - w / 2, y - h / 2, w, h, { color: unlocked ? 0x1d1044 : 0x0b0319, alpha: 0.95, stroke: unlocked ? COLORS.gold : 0x3a3050, radius: 16, strokeW: unlocked ? 3 : 1 });
      this.add.text(x - w / 2 + 22, y - 26, unlocked ? '🏆' : '🔒', { fontSize: '26px' }).setOrigin(0, 0.5);
      text(this, x - w / 2 + 66, y - 22, a.name, { size: 18, color: unlocked ? '#ffd23f' : '#ffffff', bold: true, align: 'left', origin: 0 });
      text(this, x - w / 2 + 66, y + 2, a.desc, { size: 13, color: '#d9c8ff', align: 'left', origin: 0, wrap: 340 });
      // progresso
      const bx = x + w / 2 - 170, by = y - 8;
      const bar = this.add.graphics();
      bar.fillStyle(0x2a0f40, 1).fillRoundedRect(bx, by, 140, 14, 7);
      bar.fillStyle(unlocked ? 0xffd23f : 0x3ff3ff, 1).fillRoundedRect(bx, by, Math.max(6, 140 * (val / a.target)), 14, 7);
      text(this, bx + 70, by + 26, unlocked ? 'DESBLOQUEADA' : `${fmt(val)} / ${fmt(a.target)}`, { size: 12, color: unlocked ? '#3bdc7a' : '#b9a6dd', shadow: false });
      text(this, x + w / 2 - 22, y - 26, `+${fmt(a.reward)}`, { size: 14, color: '#ffd23f', align: 'right', origin: 1 });
    });
    text(this, W / 2, H - 22, 'Conquistas são automáticas. Recompensas em fichas são creditadas na hora.', { size: 14, color: '#b9a6dd', shadow: false });
  }
}
