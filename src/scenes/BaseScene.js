// Classe base das cenas: transições de fade e navegação segura.
import Phaser from 'phaser';
import { ctx } from '../context.js';

export class BaseScene extends Phaser.Scene {
  create() {
    // Cenas são reutilizadas pelo Phaser: o estado de transição precisa ser reiniciado a cada entrada.
    this.transitioning = false;
    this.cameras.main.fadeIn(280, 10, 2, 20);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.onLeave && this.onLeave());
    this.input.keyboard && this.input.keyboard.on('keydown-ESC', () => this.onEscape && this.onEscape());
  }

  goto(key, data = {}) {
    if (this.transitioning) return;
    this.transitioning = true;
    if (ctx.game) ctx.game.save();
    this.cameras.main.fadeOut(220, 10, 2, 20);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key, data);
    });
  }
}
