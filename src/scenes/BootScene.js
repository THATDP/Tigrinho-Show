// Tela de carregamento: gera texturas e áudio, mostra progresso e vai para o menu.
import { BaseScene } from './BaseScene.js';
import { generateTextures } from '../ui/textures.js';
import { W, H, FONT_TITLE } from '../config.js';
import { text } from '../ui/ui.js';

export class BootScene extends BaseScene {
  constructor() { super('BootScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#14062b');
    this.bar = this.add.graphics();
    this.pct = text(this, W / 2, H / 2 + 60, '0%', { size: 22, color: '#ffd23f', font: FONT_TITLE });
    this.label = text(this, W / 2, H / 2 + 100, 'Montando o picadeiro…', { size: 18, color: '#d9c8ff' });
    this.stepIndex = 0;
    this.steps = [
      ['Pintando o tigrinho…', () => generateTextures(this)],
      ['Afinando os tambores…', () => this.registry.set('ready', true)],
      ['Acendendo os holofotes…', () => {}],
    ];
    this.time.delayedCall(120, () => this.runStep());
  }

  runStep() {
    if (this.stepIndex >= this.steps.length) return this.finish();
    const [label, fn] = this.steps[this.stepIndex];
    this.label.setText(label);
    fn();
    this.stepIndex++;
    this.setProgress(this.stepIndex / this.steps.length);
    this.time.delayedCall(180, () => this.runStep());
  }

  setProgress(p) {
    this.bar.clear();
    this.bar.fillStyle(0x2a0f40, 1);
    this.bar.fillRoundedRect(W / 2 - 220, H / 2 + 20, 440, 22, 11);
    this.bar.fillStyle(0xffd23f, 1);
    this.bar.fillRoundedRect(W / 2 - 220, H / 2 + 20, Math.max(8, 440 * p), 22, 11);
    this.pct.setText(Math.round(p * 100) + '%');
    const html = document.getElementById('loader-fill');
    if (html) html.style.width = Math.round(p * 100) + '%';
  }

  finish() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
    this.time.delayedCall(250, () => this.scene.start('MenuScene'));
  }
}
