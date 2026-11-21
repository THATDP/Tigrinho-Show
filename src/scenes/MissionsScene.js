// Missões diárias: três por dia, progresso automático e resgate de recompensas.
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS } from '../config.js';
import { MISSION_POOL } from '../logic/progression.js';
import { makeBackground, makeButton, makePanel, text, fmt, toast, header, backButton, sceneTheme, burst, floatText } from '../ui/ui.js';

export class MissionsScene extends BaseScene {
  constructor() { super('MissionsScene'); }

  create() {
    super.create();
    makeBackground(this, sceneTheme());
    header(this, 'MISSÕES DIÁRIAS', 'Três missões novas todo dia (hora local). Complete e resgate!');
    backButton(this);
    this.render();
    text(this, W / 2, H - 22, 'Missões são sorteadas por data: todo mundo no mesmo dia recebe as mesmas.', { size: 14, color: '#b9a6dd', shadow: false });
  }

  render() {
    if (this.box) this.box.destroy(true);
    this.box = this.add.container(0, 0);
    const g = ctx.game;
    const missions = g.data.daily.missions;
    const doneCount = missions.filter((m) => m.claimed).length;
    this.box.add(text(this, W / 2, 124, `Resgatadas hoje: ${doneCount}/${missions.length}`, { size: 18, color: '#ffd23f' }));
    missions.forEach((m, i) => {
      const def = MISSION_POOL.find((p) => p.id === m.id);
      if (!def) return;
      const y = 200 + i * 160;
      const x = W / 2;
      const w = 900, h = 136;
      this.box.add(makePanel(this, x - w / 2, y - h / 2, w, h, { color: 0x140624, alpha: 0.95, stroke: m.claimed ? COLORS.green : (m.progress >= def.target ? COLORS.gold : COLORS.violet), radius: 18 }));
      this.box.add(text(this, x - w / 2 + 28, y - 40, def.desc, { size: 22, color: '#ffffff', bold: true, align: 'left', origin: 0 }));
      this.box.add(text(this, x - w / 2 + 28, y - 8, `Recompensa: +${fmt(def.reward)} fichas · +${def.xp} XP`, { size: 16, color: '#ffd23f', align: 'left', origin: 0 }));
      // Barra de progresso
      const bw = 520, bx = x - w / 2 + 28, by = y + 30;
      const frac = Math.min(1, m.progress / def.target);
      const bar = this.add.graphics();
      bar.fillStyle(0x2a0f40, 1).fillRoundedRect(bx, by, bw, 22, 11);
      bar.fillStyle(m.claimed ? 0x3bdc7a : 0x3ff3ff, 1).fillRoundedRect(bx, by, Math.max(10, bw * frac), 22, 11);
      this.box.add(bar);
      this.box.add(text(this, bx + bw / 2, by + 11, `${fmt(Math.min(m.progress, def.target))} / ${fmt(def.target)}`, { size: 14, color: '#ffffff', shadow: false }));
      // Botão
      let label = 'EM ANDAMENTO', disabled = true, color = 0x4a4458;
      if (m.claimed) { label = 'RESGATADA'; color = COLORS.green; }
      else if (m.progress >= def.target) { label = 'RESGATAR'; disabled = false; color = COLORS.gold; }
      this.box.add(makeButton(this, x + w / 2 - 130, y, 200, 56, label, () => this.claim(def.id), { color, textColor: m.progress >= def.target && !m.claimed ? '#1a0a2e' : '#ffffff', size: 15, disabled }));
    });
    if (missions.every((m) => m.claimed)) {
      this.box.add(text(this, W / 2, 660, 'Todas resgatadas! Volte amanhã para novas missões.', { size: 18, color: '#3bdc7a' }));
    }
  }

  claim(id) {
    const res = ctx.game.claimMission(id);
    if (!res) return;
    ctx.audio && ctx.audio.sfx('coin');
    floatText(this, W / 2, 150, `+${fmt(res.fichas)} fichas`, '#ffd23f', 30);
    toast(this, 'Missão resgatada!', '#3bdc7a', 110);
    for (const l of res.levelUps) toast(this, `Nível ${l.level}! +${fmt(l.fichas)} fichas`, '#3ff3ff', 150);
    const out = ctx.game.checkAchievements();
    for (const _ of out) toast(this, '🏆 Conquista desbloqueada!', '#ffd23f', 180);
    ctx.game.save();
    this.render();
  }
}
