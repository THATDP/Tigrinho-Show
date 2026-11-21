// A máquina de símbolos: o centro da experiência.
import Phaser from 'phaser';
import { BaseScene } from './BaseScene.js';
import { ctx } from '../context.js';
import { W, H, COLORS, FONT_TITLE } from '../config.js';
import { Tiger } from '../objects/Tiger.js';
import { Reel } from '../objects/Reel.js';
import { SYMBOLS, SYMBOL_IDS, BET_OPTIONS, PAYTABLE, PAYLINES, REELS, ROWS, REEL_STRIP } from '../logic/symbols.js';
import { spinGrid, evaluateSpin, rollMultiplier, symbolsInGrid, winTier, MULTIPLIER_TABLE } from '../logic/spin.js';
import { rollEvent, EVENTS } from '../logic/events.js';
import { CATALOG } from '../logic/catalog.js';
import { DAILY_SPIN_LIMIT, XP_PER_SPIN, XP_PER_WIN } from '../state/game.js';
import { levelInfo } from '../logic/progression.js';
import { cached, makeBackground, makeButton, text, fmt, makePanel, toast, banner, floatText, burst, confettiRain, shake, flash, tween, wait, sceneTheme, machineTheme, maybeBreakNudge } from '../ui/ui.js';

// Geometria da máquina
const CAB = { x: 390, y: 92, w: 500, h: 470 };
const WIN = { x: 408, y: 196, w: 464, h: 272 };
const CELL_W = 84, GAP = 10, ROW_H = 88;
const REEL_X0 = WIN.x + (WIN.w - (REELS * CELL_W + (REELS - 1) * GAP)) / 2;
const REEL_Y = WIN.y + 4;
const LINE_COLORS = [0xffd23f, 0x3ff3ff, 0xff2e9a, 0x3bdc7a, 0xc77dff];

export class MachineScene extends BaseScene {
  constructor() { super('MachineScene'); }

  create() {
    super.create();
    this.g = ctx.game;
    this.busy = false;
    this.dead = false;
    this.freeSpinsLeft = 0;
    this.sequenceBoost = false;
    this.spinCount = 0;
    this.tempSceneryLeft = 0;
    this.bet = BET_OPTIONS.includes(this.g.data.lastBet) ? this.g.data.lastBet : BET_OPTIONS[0];
    this.theme = sceneTheme();
    this.bgContainer = makeBackground(this, this.theme);
    this.drawCabinet();
    this.drawHUD();
    this.buildReels();
    this.buildTiger();
    this.buildRightPanel();
    this.buildBottomBar();
    this.lineGfx = this.add.graphics().setDepth(40);
    this.highlightGroup = this.add.container(0, 0).setDepth(45);
    this.refreshAll();
    ctx.audio && ctx.audio.startMusic('circo');
    this.input.keyboard && this.input.keyboard.on('keydown-SPACE', () => this.spin());
    this.input.keyboard && this.input.keyboard.on('keydown-ENTER', () => this.spin());
    this.input.keyboard && this.input.keyboard.on('keydown-PLUS', () => this.changeBet(1));
    this.input.keyboard && this.input.keyboard.on('keydown-MINUS', () => this.changeBet(-1));
    this.time.delayedCall(600, () => this.tiger.setMood('idle'));
    this.tiger.squash(0.05);
    this.time.addEvent({ delay: 60000, loop: true, callback: () => maybeBreakNudge(this) });
  }

  onLeave() {
    this.dead = true;
    this.g.save();
  }

  // ---------- desenho ----------
  drawCabinet() {
    const t = machineTheme();
    this.cabinet = this.add.container(0, 0).setDepth(10);
    // Corpo + letreiro desenhados uma vez como textura (coordenadas locais ao gabinete).
    const bodyKey = cached(this, `cab-${t.body}-${t.trim}`, CAB.w + 24, CAB.h + 24, (g) => {
      g.fillStyle(0x000000, 0.4); g.fillRoundedRect(8, 12, CAB.w, CAB.h, 30);
      g.fillStyle(t.body, 1); g.fillRoundedRect(0, 0, CAB.w, CAB.h, 30);
      g.fillStyle(0xffffff, 0.08); g.fillRoundedRect(10, 10, CAB.w - 20, CAB.h * 0.35, 24);
      g.lineStyle(6, t.trim, 1); g.strokeRoundedRect(0, 0, CAB.w, CAB.h, 30);
      g.lineStyle(2, 0xffffff, 0.35); g.strokeRoundedRect(12, 12, CAB.w - 24, CAB.h - 24, 24);
      g.fillStyle(0x1a0a2e, 1); g.fillRoundedRect(40, 14, CAB.w - 80, 70, 16);
      g.lineStyle(4, t.trim, 1); g.strokeRoundedRect(40, 14, CAB.w - 80, 70, 16);
    });
    this.cabinet.add(this.add.image(CAB.x, CAB.y, bodyKey).setOrigin(0, 0));
    this.cabinet.add(text(this, CAB.x + CAB.w / 2, CAB.y + 50, 'TIGRINHO SHOW', { size: 36, color: '#ffd23f', font: FONT_TITLE, stroke: '#7a0041', strokeW: 8 }));
    // Lâmpadas da marquise (piscam em ondas)
    this.bulbs = [];
    const perim = [];
    for (let x = CAB.x + 44; x <= CAB.x + CAB.w - 44; x += 26) { perim.push([x, CAB.y + 14]); perim.push([x, CAB.y + 84]); }
    for (let i = 0; i < perim.length; i++) {
      const [x, y] = perim[i];
      const b = this.add.circle(x, y, 4, i % 2 ? 0xffd23f : 0xff2e9a).setDepth(11);
      this.bulbs.push(b);
    }
    this.time.addEvent({
      delay: 160, loop: true, callback: () => {
        this.bulbPhase = (this.bulbPhase || 0) + 1;
        this.bulbs.forEach((b, i) => b.setAlpha((i + this.bulbPhase) % 2 ? 1 : 0.25));
      },
    });
    // Janela das bobinas (moldura conforme o item equipado)
    const winKey = cached(this, `win-${machineTheme().trim}`, WIN.w + 12, WIN.h + 12, (g) => {
      g.fillStyle(0x0d0320, 1); g.fillRoundedRect(6, 6, WIN.w, WIN.h, 18);
      g.lineStyle(4, machineTheme().trim, 1); g.strokeRoundedRect(6, 6, WIN.w, WIN.h, 18);
      g.lineStyle(2, 0x4a1480, 1);
      for (let i = 1; i < REELS; i++) {
        const x = 6 + (REEL_X0 - WIN.x) + i * (CELL_W + GAP) - GAP / 2;
        g.lineBetween(x, 14, x, WIN.h - 2);
      }
    });
    this.add.image(WIN.x - 6, WIN.y - 6, winKey).setOrigin(0, 0).setDepth(12);
    this.windowG = this.add.graphics().setDepth(12);
    this.frameG = this.add.graphics().setDepth(13);
    this.drawWindowFrame();
    // Linha de status e mensagem
    this.statusText = text(this, CAB.x + CAB.w / 2, 492, '', { size: 16, color: '#d9c8ff', wrap: 460 }).setDepth(14);
    this.bigMsg = text(this, CAB.x + CAB.w / 2, 528, '', { size: 30, color: '#ffd23f', font: FONT_TITLE, stroke: '#2a0030', strokeW: 7 }).setDepth(14);
  }

  drawWindowFrame() {
    const frame = this.g.equippedId('moldura');
    this.frameG.clear();
    this.frameKind = (CATALOG.find((c) => c.id === frame) || {}).value || 'plain';
    if (this.frameKind === 'blink' && !this.blinkTimer) {
      this.blinkTimer = this.time.addEvent({ delay: 200, loop: true, callback: () => this.frameBlink() });
    }
    if (this.frameKind === 'rainbow' && !this.rainbowTween) {
      this.rainbowTween = this.tweens.addCounter({ from: 0, to: 360, duration: 3000, repeat: -1, onUpdate: (tw) => this.drawRainbow(tw.getValue()) });
    }
    if (this.frameKind === 'diamond') this.drawDiamondFrame();
  }

  drawRainbow(h) {
    this.frameG.clear();
    const c = Phaser.Display.Color.HSVToRGB(h / 360, 0.8, 1);
    this.frameG.lineStyle(8, Phaser.Display.Color.GetColor(c.r * 255, c.g * 255, c.b * 255), 1);
    this.frameG.strokeRoundedRect(WIN.x - 6, WIN.y - 6, WIN.w + 12, WIN.h + 12, 22);
  }

  drawDiamondFrame() {
    const g = this.frameG;
    g.lineStyle(5, 0x3ff3ff, 0.9);
    g.strokeRoundedRect(WIN.x - 6, WIN.y - 6, WIN.w + 12, WIN.h + 12, 22);
    for (const [x, y] of [[WIN.x - 6, WIN.y - 6], [WIN.x + WIN.w + 6, WIN.y - 6], [WIN.x - 6, WIN.y + WIN.h + 6], [WIN.x + WIN.w + 6, WIN.y + WIN.h + 6]]) {
      g.fillStyle(0x3ff3ff, 1); g.fillPoints([new Phaser.Math.Vector2(x, y - 9), new Phaser.Math.Vector2(x + 7, y), new Phaser.Math.Vector2(x, y + 9), new Phaser.Math.Vector2(x - 7, y)], true);
    }
  }

  frameBlink() {
    if (this.frameKind !== 'blink') return;
    this.blinkPhase = !this.blinkPhase;
    this.frameG.clear();
    this.frameG.lineStyle(6, this.blinkPhase ? 0xffd23f : 0xff2e9a, 1);
    this.frameG.strokeRoundedRect(WIN.x - 6, WIN.y - 6, WIN.w + 12, WIN.h + 12, 22);
  }

  drawHUD() {
    this.hud = this.add.container(0, 0).setDepth(60);
    const hudKey = cached(this, 'hud-bar', W, 68, (g) => {
      g.fillStyle(0x0b0319, 0.92); g.fillRect(0, 0, W, 66);
      g.lineStyle(2, COLORS.gold, 0.6); g.lineBetween(0, 66, W, 66);
    });
    this.hud.add(this.add.image(0, 0, hudKey).setOrigin(0, 0));
    this.hud.add(text(this, 24, 20, 'FICHAS', { size: 12, color: '#b9a6dd', align: 'left', origin: 0 }));
    this.balanceText = text(this, 24, 34, '', { size: 26, color: '#ffd23f', font: FONT_TITLE, align: 'left', origin: 0 });
    this.hud.add(this.balanceText);
    // Nível
    this.levelText = text(this, 260, 18, '', { size: 14, color: '#3ff3ff', font: FONT_TITLE, align: 'left', origin: 0 });
    this.xpBar = this.add.graphics();
    this.hud.add([this.levelText, this.xpBar]);
    this.spinsText = text(this, 1040, 18, '', { size: 14, color: '#d9c8ff', align: 'right', origin: 1 });
    this.hud.add(this.spinsText);
    this.freeText = text(this, 640, 33, '', { size: 22, color: '#3bdc7a', font: FONT_TITLE, stroke: '#063b1c', strokeW: 6 });
    this.hud.add(this.freeText);
    const mute = makeButton(this, 1226, 33, 54, 40, '♪', () => this.toggleMute(), { color: COLORS.violet, size: 20 });
    this.muteBtn = mute;
    this.hud.add(mute);
  }

  toggleMute() {
    const s = this.g.data.settings;
    const on = s.master > 0;
    this.g.setSetting('master', on ? 0 : 0.8);
    ctx.audio && ctx.audio.applySettings({ master: on ? 0 : 0.8 });
    this.muteBtn.meta.setLabel(on ? 'x' : '♪');
    this.g.save();
  }

  buildReels() {
    this.reels = [];
    for (let i = 0; i < REELS; i++) {
      const r = new Reel(this, REEL_X0 + i * (CELL_W + GAP), REEL_Y, CELL_W, ROW_H, ROWS, 40);
      r.inner.setDepth(20);
      this.reels.push(r);
    }
    // Estado inicial: grade aleatória (sem resultado)
    const { grid } = spinGrid(ctx.rng);
    this.grid = grid;
    for (let c = 0; c < REELS; c++) {
      this.reels[c].setVisible(ROWS, [grid[0][c], grid[1][c], grid[2][c]]);
    }
  }

  buildTiger() {
    this.tiger = new Tiger(this, 190, 420, { scale: 0.98 });
    this.tiger.setDepth(30);
    this.add.image(190, 612, 'pedestal').setScale(0.8).setDepth(5);
  }

  buildRightPanel() {
    const x = 920, y = 92, w = 342, h = 468;
    this.panelG = makePanel(this, x, y, w, h, { color: 0x14062b, alpha: 0.88, stroke: COLORS.cyan }).setDepth(9);
    text(this, x + w / 2, y + 22, 'TABELA DE PRÊMIOS', { size: 17, color: '#3ff3ff', font: FONT_TITLE, stroke: '#000', strokeW: 4 }).setDepth(15);
    // Lista de símbolos e prêmios (x3 / x5)
    const rowsY = y + 48;
    SYMBOL_IDS.forEach((id, i) => {
      const yy = rowsY + i * 26;
      this.add.image(x + 26, yy + 12, `sym-${id}`).setScale(0.18).setDepth(15);
      const pay = PAYTABLE[id];
      let label = SYMBOLS[id].name;
      if (SYMBOLS[id].scatter) label = 'Bola Mágica (dispersão)';
      if (pay) {
        this.add.text(x + 46, yy + 2, label, { fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#ffffff' }).setDepth(15);
        this.add.text(x + w - 16, yy + 2, `3×${pay[3]}  5×${pay[5]}`, { fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(15);
      } else {
        this.add.text(x + 46, yy + 2, label, { fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#ffffff' }).setDepth(15);
        this.add.text(x + w - 16, yy + 2, 'bolas: 3+ = giros grátis', { fontFamily: 'Trebuchet MS', fontSize: '12px', color: '#c77dff' }).setOrigin(1, 0).setDepth(15);
      }
    });
    text(this, x + 20, y + 280, 'Explicação do último giro', { size: 15, color: '#ffd23f', font: FONT_TITLE, align: 'left', origin: 0 }).setDepth(15);
    this.explainText = this.add.text(x + 20, y + 306, 'Gire para ver por que você ganhou (ou quase ganhou)!', {
      fontFamily: 'Trebuchet MS', fontSize: '14px', color: '#e8dcff', wordWrap: { width: w - 40 }, lineSpacing: 4,
    }).setDepth(15);
    this.multText = text(this, x + w / 2, y + h - 22, '', { size: 16, color: '#ff8c1a', font: FONT_TITLE }).setDepth(15);
  }

  buildBottomBar() {
    const y = 642;
    this.betMinus = makeButton(this, 330, y, 60, 56, '−', () => this.changeBet(-1), { color: COLORS.violet, size: 28 }).setDepth(20);
    this.betLabel = text(this, 400, y - 12, '', { size: 14, color: '#b9a6dd', font: FONT_TITLE }).setDepth(20);
    this.betValue = text(this, 400, y + 12, '', { size: 26, color: '#ffd23f', font: FONT_TITLE }).setDepth(20);
    this.betPlus = makeButton(this, 470, y, 60, 56, '+', () => this.changeBet(1), { color: COLORS.violet, size: 28 }).setDepth(20);
    this.spinBtn = makeButton(this, 640, y, 230, 88, 'GIRAR', () => this.spin(), { color: COLORS.pink, size: 34 }).setDepth(20);
    this.turboBtn = makeButton(this, 840, y, 150, 56, '', () => this.toggleTurbo(), { color: COLORS.violet, size: 17 }).setDepth(20);
    makeButton(this, 1010, y, 150, 56, 'MINIJOGOS', () => this.goto('MinigameMenuScene'), { color: COLORS.green, size: 16 }).setDepth(20);
    makeButton(this, 1170, y, 150, 56, 'MENU', () => this.goto('MenuScene'), { color: COLORS.orange, size: 18 }).setDepth(20);
    this.bottomHint = text(this, 640, 700, 'Espaço = girar · +/− = aposta · Tigrinho curinga substitui símbolos', { size: 13, color: '#9a86c6', shadow: false }).setDepth(20);
  }

  refreshAll() {
    const lv = levelInfo(this.g.data.xp);
    this.balanceText.setText(fmt(this.g.fichas));
    this.levelText.setText(`NÍVEL ${lv.level}`);
    this.xpBar.clear();
    this.xpBar.fillStyle(0x2a0f40, 1).fillRoundedRect(260, 40, 160, 10, 5);
    this.xpBar.fillStyle(0x3ff3ff, 1).fillRoundedRect(260, 40, Math.max(4, 160 * (lv.into / lv.need)), 10, 5);
    this.spinsText.setText(`Giros hoje: ${Math.max(0, DAILY_SPIN_LIMIT - this.g.data.spinsToday.count)}/${DAILY_SPIN_LIMIT}`);
    this.freeText.setText(this.freeSpinsLeft > 0 ? `GIROS GRÁTIS: ${this.freeSpinsLeft} (x2)` : '');
    this.betValue.setText(fmt(this.bet));
    this.betLabel.setText('APOSTA');
    this.statusText.setText(`${PAYLINES.length} linhas · aposta ${this.bet} · multiplicador sorteado em cada giro`);
    this.turboBtn.meta.setLabel(this.g.data.settings.fastSpin ? 'RÁPIDO: ON' : 'RÁPIDO: OFF');
    const free = this.freeSpinsLeft > 0;
    this.spinBtn.meta.setLabel(free ? `GRÁTIS (${this.freeSpinsLeft})` : 'GIRAR');
    this.spinBtn.meta.setColor(this.busy ? 0x6b5a80 : (free ? COLORS.green : COLORS.pink));
  }

  setBusy(b) {
    this.busy = b;
    this.spinBtn.meta.setColor(b ? 0x6b5a80 : (this.freeSpinsLeft > 0 ? COLORS.green : COLORS.pink));
  }

  changeBet(dir) {
    if (this.busy || this.freeSpinsLeft > 0) return;
    const i = BET_OPTIONS.indexOf(this.bet);
    const ni = Phaser.Math.Clamp(i + dir, 0, BET_OPTIONS.length - 1);
    if (ni === i) {
      toast(this, dir < 0 ? 'Aposta mínima atingida' : 'Aposta máxima atingida', '#ffd23f', 110);
      return;
    }
    this.bet = BET_OPTIONS[ni];
    this.g.data.lastBet = this.bet;
    ctx.audio && ctx.audio.sfx('click');
    this.refreshAll();
  }

  toggleTurbo() {
    this.g.setSetting('fastSpin', !this.g.data.settings.fastSpin);
    ctx.audio && ctx.audio.sfx('click');
    this.refreshAll();
  }

  // ---------- fluxo do giro ----------
  async spin() {
    if (this.busy || this.dead) return;
    const g = this.g;
    const isFree = this.freeSpinsLeft > 0;
    if (!isFree) {
      if (!g.canSpin(this.bet)) return this.cannotSpin();
      g.spend(this.bet);
      g.data.spinsToday.count++;
    } else {
      this.freeSpinsLeft--;
      this.trk('freeSpinsPlayed', 1);
    }
    this.setBusy(true);
    this.clearHighlights();
    this.bigMsg.setText('');
    this.spinCount++;
    if (this.tempSceneryLeft > 0 && --this.tempSceneryLeft === 0) this.restoreScenery();

    const { grid } = spinGrid(ctx.rng);
    let mult = rollMultiplier(ctx.rng).value;
    if (this.sequenceBoost) { mult = Math.max(mult, 3); this.sequenceBoost = false; }
    const res = evaluateSpin(grid, { bet: this.bet, multiplier: mult, freeSpinMultiplier: isFree ? 2 : 1 });
    this.grid = grid;
    this.lastRes = res;
    this.multValue = mult;

    this.tiger.setMood('idle');
    this.refreshAll();
    this.statusText.setText('Girando…');

    const fast = this.g.data.settings.fastSpin;
    const speed = fast ? 0.5 : 1;
    const spinPromises = this.reels.map((r, c) => {
      const col = [grid[0][c], grid[1][c], grid[2][c]];
      return r.spin(col, { duration: 1100 + c * 320, speed, onTick: () => ctx.audio && ctx.audio.sfx('reel-tick') });
    });
    // Quando a primeira bobina para, toca o som de parada.
    spinPromises.forEach((p, i) => p.then(() => ctx.audio && ctx.audio.sfx('reel-stop')));
    await Promise.all(spinPromises);
    if (this.dead) return;

    await this.resolveSpin(res, grid, isFree);
  }

  async resolveSpin(res, grid, isFree) {
    const g = this.g;
    // Coleção de símbolos
    const fresh = g.recordSymbols(symbolsInGrid(grid));
    if (fresh.length) {
      const names = fresh.map((id) => SYMBOLS[id].name).join(', ');
      toast(this, `Novo na coleção: ${names}!`, '#3ff3ff', 170);
      this.handleAchievements(g.checkAchievements());
    }
    this.trk('spins', 1);
    g.addXp(XP_PER_SPIN);

    this.renderExplanation(res, isFree);

    if (res.isWin) {
      const tier = winTier(res.total, this.bet);
      const lines = res.lines.length;
      this.trk('wins', lines);
      g.addXp(XP_PER_WIN * lines);
      this.highlightWins(res, grid);
      const won = g.gain(res.total);
      this.trk('fichasWon', won);
      g.setStat('biggestWin', won);
      if (tier === 'big' || tier === 'mega') this.trk('bigWins', 1);
      if (tier === 'mega') this.trk('megaWins', 1);
      await this.celebrateWin(res, tier, won);
    } else {
      if (res.nearMiss) {
        this.trk('nearMisses', 1);
        this.tiger.laugh(900);
        this.bigMsg.setText('Quase!! O Tigrinho ri de você.');
      } else {
        this.tiger.lose();
        this.bigMsg.setText('Nada desta vez. Tente de novo!');
      }
      this.statusText.setText('Sem prêmio neste giro.');
    }

    // Rodada bônus (dispersão)
    if (res.freeSpins > 0) {
      this.trk('freeSpinsTriggered', 1);
      this.freeSpinsLeft += res.freeSpins;
      ctx.audio && ctx.audio.sfx('bonus');
      banner(this, 'RODADA BÔNUS!', '#3bdc7a', `+${res.freeSpins} giros grátis com multiplicador ×2`);
      this.tiger.celebrate('samba');
      shake(this, 8, 380);
      await wait(this, 1200);
    }

    this.refreshAll();
    g.save();

    // Eventos especiais: só fora das rodadas grátis e sem outro evento logo em seguida.
    if (!isFree && this.freeSpinsLeft === 0 && !this.dead) {
      this.eventsSinceLast = (g.data.eventsSinceLast || 0) + 1;
      g.data.eventsSinceLast = this.eventsSinceLast;
      const ev = rollEvent(ctx.rng, this.eventsSinceLast);
      if (ev) {
        g.data.eventsSinceLast = 0;
        this.eventsSinceLast = 0;
        await this.runEvent(ev.id);
      }
    }

    if (this.dead) return;
    if (this.freeSpinsLeft > 0) {
      this.setBusy(false);
      await wait(this, this.g.data.settings.fastSpin ? 350 : 900);
      if (!this.dead) this.spin();
      return;
    }
    this.setBusy(false);
    this.refreshAll();
  }

  // Atualiza uma estatística e mostra missões/conquistas concluídas.
  trk(stat, amount) {
    const out = this.g.track(stat, amount);
    this.handleTrack(out);
    return out;
  }

  handleTrack(out) {
    if (!out) return;
    for (const id of out.missionsDone) {
      const d = this.g.missionDef(id);
      toast(this, `Missão concluída: ${d ? d.desc : id}! Resgate em MISSÕES`, '#3bdc7a', 130);
    }
    this.handleAchievements(out.achievements);
  }

  handleAchievements(ids = []) {
    for (const id of ids) {
      const name = ({ 'primeiro-giro': 'Primeiro Rugido' })[id] || 'Nova conquista';
      toast(this, `🏆 Conquista: ${name}!`, '#ffd23f', 100);
      ctx.audio && ctx.audio.sfx('success');
    }
  }

  renderExplanation(res, isFree) {
    const lines = [];
    if (isFree) lines.push('[Rodada grátis ×2]');
    if (res.explanation.length) lines.push(...res.explanation.slice(0, 6));
    else lines.push('Nenhuma linha vencedora (3 ou mais símbolos iguais a partir da 1ª bobina).');
    lines.push(`Multiplicador sorteado: ×${res.multiplier / (isFree ? 2 : 1)} ${this.multLabel(res.multiplier / (isFree ? 2 : 1))}`);
    this.explainText.setText(lines.join('\n'));
    this.multText.setText(`Multiplicador: ×${res.multiplier}`);
  }

  multLabel(v) {
    const m = MULTIPLIER_TABLE.find((x) => x.value === v);
    return m ? `(${m.label})` : '';
  }

  highlightWins(res, grid) {
    this.clearHighlights();
    this.lineGfx.clear();
    res.lines.forEach((l, i) => {
      const color = LINE_COLORS[i % LINE_COLORS.length];
      const pts = [];
      for (let c = 0; c < REELS; c++) {
        const row = l.rows[c];
        const x = REEL_X0 + c * (CELL_W + GAP) + CELL_W / 2;
        const y = REEL_Y + row * ROW_H + ROW_H / 2;
        pts.push(new Phaser.Math.Vector2(x, y));
        const glow = this.add.image(x, y, 'glow').setTint(color).setAlpha(0.7).setScale(0.9);
        this.highlightGroup.add(glow);
        this.tweens.add({ targets: glow, alpha: 0.25, duration: 500, yoyo: true, repeat: -1, delay: i * 120 });
        const sprite = this.reels[c].visibleSprite(row);
        this.tweens.add({ targets: sprite, scale: sprite.scale * 1.18, duration: 380, yoyo: true, repeat: -1, delay: c * 40 });
      }
      this.lineGfx.lineStyle(7, color, 0.85);
      this.lineGfx.strokePoints(pts, false, true);
      this.lineGfx.lineStyle(2, 0xffffff, 0.9);
      this.lineGfx.strokePoints(pts, false, true);
    });
    // Destaca linhas em sequência para clareza do "por quê"
  }

  clearHighlights() {
    this.lineGfx && this.lineGfx.clear();
    this.highlightGroup && this.highlightGroup.removeAll(true);
    this.tweens.killTweensOf(this.reels.flatMap((r) => r.sprites));
    for (const r of this.reels) for (const s of r.sprites) s.setScale((CELL_W - 10) / 128);
  }

  async celebrateWin(res, tier, won) {
    this.tweens.addCounter({
      from: 0, to: won, duration: tier === 'small' ? 500 : 1100,
      onUpdate: (tw) => { this.bigMsg.setText(`+${fmt(tw.getValue())} fichas!`); },
    });
    const sfx = { small: 'win-small', medium: 'win-medium', big: 'win-big', mega: 'jackpot' }[tier];
    ctx.audio && ctx.audio.sfx(sfx);
    const pos = { x: CAB.x + CAB.w / 2, y: 420 };
    if (tier === 'small') {
      this.tiger.celebrate(this.equippedAnim());
      this.bigMsg.setText(`+${fmt(won)} fichas`);
      floatText(this, pos.x, 300, `+${fmt(won)}`, '#ffd23f', 28);
    } else if (tier === 'medium') {
      burst(this, pos.x, pos.y, { count: 40, tints: this.effectTints() });
      this.tiger.celebrate(this.equippedAnim());
      banner(this, 'BOA!', '#ffd23f', `+${fmt(won)} fichas`);
    } else if (tier === 'big') {
      burst(this, pos.x, pos.y, { count: 70, tints: this.effectTints(), speed: 420 });
      shake(this, 10, 400);
      flash(this, 0xffffff, 200);
      this.tiger.celebrate('flip');
      banner(this, 'GRANDE VITÓRIA!', '#ff8c1a', `+${fmt(won)} fichas`);
    } else {
      burst(this, pos.x, pos.y, { count: 120, tints: this.effectTints(), speed: 520, life: 1400 });
      confettiRain(this, this.effectTints(), 2600);
      shake(this, 16, 600);
      flash(this, 0xffd23f, 350);
      this.tiger.celebrate('flip');
      banner(this, 'MEGA VITÓRIA!!!', '#ff2e9a', `+${fmt(won)} fichas · ×${res.multiplier}`);
    }
    await wait(this, tier === 'small' ? 450 : 900);
  }

  effectTints() {
    const it = this.g.equippedItem('efeito');
    return it && Array.isArray(it.value) ? it.value.map((c) => parseInt(c.slice(1), 16)) : [0xffd23f, 0xff2e9a, 0x3ff3ff];
  }

  equippedAnim() {
    const it = this.g.equippedItem('animacao');
    return it && it.value === 'samba' ? 'samba' : (it && it.value === 'flip' ? 'flip' : 'jump');
  }

  cannotSpin() {
    ctx.audio && ctx.audio.sfx('error');
    if (this.g.spinsLeftToday() <= 0) {
      toast(this, 'Limite diário de giros atingido! Volte amanhã — ou jogue um minijogo.', '#ff8c1a', 170);
      this.tiger.sad();
      return;
    }
    if (this.g.canRequestHelp()) {
      toast(this, 'Sem fichas! Use a AJUDA DO TIGRINHO no menu (3 por dia).', '#ff8c1a', 170);
    } else {
      toast(this, 'Sem fichas por hoje. Ganhe fichas nos minijogos e missões!', '#ff8c1a', 170);
    }
    this.tiger.sad();
  }

  // ---------- eventos especiais ----------
  async runEvent(id) {
    const ev = EVENTS[id];
    this.trk('events', 1);
    ctx.audio && ctx.audio.sfx('event');
    switch (id) {
      case 'mascote': return this.eventMascot(ev);
      case 'cenario': return this.eventScenery(ev);
      case 'sequencia':
        this.sequenceBoost = true;
        banner(this, ev.title, '#ff8c1a', ev.desc);
        burst(this, 640, 330, { count: 40, tints: [0xff8c1a, 0xffd23f], speed: 260 });
        this.tiger.setMood('surprise', 1000);
        await wait(this, 1400);
        return;
      case 'bonus':
        this.freeSpinsLeft += 3;
        this.trk('freeSpinsTriggered', 1);
        ctx.audio && ctx.audio.sfx('bonus');
        banner(this, ev.title, '#3bdc7a', ev.desc);
        this.tiger.celebrate('samba');
        await wait(this, 1300);
        return;
      case 'relampago': return this.eventLightning(ev);
      default: return;
    }
  }

  async eventMascot(ev) {
    const ov = this.add.container(0, 0).setDepth(700);
    const dark = this.add.rectangle(W / 2, H / 2, W, H, 0x07020f, 0.82).setAlpha(0);
    const rays = this.add.graphics();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rays.fillStyle(0xffd23f, 0.09);
      rays.beginPath(); rays.moveTo(0, 0);
      rays.lineTo(Math.cos(a) * 1500, Math.sin(a) * 1500);
      rays.lineTo(Math.cos(a + 0.14) * 1500, Math.sin(a + 0.14) * 1500);
      rays.closePath(); rays.fillPath();
    }
    rays.setPosition(W / 2, H / 2).setAlpha(0);
    ov.add([dark, rays]);
    this.tweens.add({ targets: dark, alpha: 1, duration: 300 });
    this.tweens.add({ targets: rays, alpha: 1, angle: 180, duration: 2400 });
    ctx.audio && ctx.audio.sfx('roar');
    // Mascote gigante entra com squash & stretch
    const big = new Tiger(this, W / 2 + 40, H + 260, { scale: 0.1 });
    big.setDepth(710);
    big.setMood('win');
    ov.add(big);
    await tween(this, { targets: big, y: H / 2 + 80, scale: 2.1, duration: 700, ease: 'Back.easeOut' });
    shake(this, 14, 450);
    burst(this, W / 2, H / 2, { count: 90, speed: 520, tints: this.effectTints(), life: 1300 });
    const b = banner(this, ev.title, '#ffd23f', ev.desc);
    b.setDepth(900);
    this.g.gain(100);
    this.g.save();
    floatText(this, W / 2, H / 2 - 220, '+100 fichas de cortesia!', '#3bdc7a', 30).setDepth(905);
    await tween(this, { targets: big, scale: 2.4, angle: 6, duration: 240, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
    await wait(this, 500);
    await tween(this, { targets: ov.list, alpha: 0, duration: 400 });
    ov.destroy(true);
    this.refreshAll();
  }

  async eventScenery(ev) {
    const palette = CATALOG.filter((c) => c.cat === 'cenario').map((c) => c.value);
    this.swapBackground(ctx.rng.pick(palette));
    this.tempSceneryLeft = 5; // volta ao cenário equipado após 5 giros
    banner(this, ev.title, '#3ff3ff', ev.desc);
    this.tiger.surprise();
    await wait(this, 1200);
  }

  swapBackground(theme) {
    const old = this.bgContainer;
    const fresh = makeBackground(this, theme).setAlpha(0);
    this.bgContainer = fresh;
    this.tweens.add({ targets: fresh, alpha: 1, duration: 800 });
    if (old) this.tweens.add({ targets: old, alpha: 0, duration: 800, onComplete: () => old.destroy(true) });
  }

  restoreScenery() {
    this.swapBackground(this.theme);
  }

  async eventLightning(ev) {
    const cx = Phaser.Math.Between(WIN.x + 60, WIN.x + WIN.w - 60);
    const cy = Phaser.Math.Between(WIN.y + 60, WIN.y + WIN.h - 60);
    banner(this, ev.title, '#ff2e9a', 'Toque no Tigrinho dourado!');
    ctx.audio && ctx.audio.sfx('relampago');
    const gold = this.add.image(cx, cy, 'tigre-cabeca').setTint(0xffd23f).setScale(0.1).setDepth(800).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: gold, scale: 0.7, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: gold, angle: { from: -12, to: 12 }, duration: 160, yoyo: true, repeat: -1 });
    const result = await new Promise((resolve) => {
      gold.once('pointerdown', () => resolve(true));
      this.time.delayedCall(3000, () => resolve(false));
    });
    this.tweens.killTweensOf(gold);
    if (result) {
      this.g.gain(150);
      this.g.save();
      burst(this, cx, cy, { count: 60, tints: [0xffd23f, 0xffffff], speed: 360 });
      ctx.audio && ctx.audio.sfx('coin');
      floatText(this, cx, cy - 40, '+150 fichas!', '#ffd23f', 30);
      this.tiger.celebrate('jump');
      this.handleAchievements(this.g.checkAchievements());
    } else {
      ctx.audio && ctx.audio.sfx('fail');
      floatText(this, cx, cy - 40, 'Ele fugiu!', '#ff3b5c', 28);
    }
    await tween(this, { targets: gold, alpha: 0, scale: 0, duration: 300 });
    gold.destroy();
    this.refreshAll();
  }

  onEscape() {
    this.goto('MenuScene');
  }
}
