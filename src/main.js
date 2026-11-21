// Ponto de entrada: cria o jogo Phaser, o estado salvo e o áudio.
import Phaser from 'phaser';
import { W, H } from './config.js';
import { ctx } from './context.js';
import { GameState } from './state/game.js';
import { AudioManager } from './systems/audio.js';
import { memoryStorage } from './logic/save.js';
import { createRng, seedFromString } from './logic/rng.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MachineScene } from './scenes/MachineScene.js';
import { MinigameMenuScene } from './scenes/MinigameMenuScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { MissionsScene } from './scenes/MissionsScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { ProfileScene } from './scenes/ProfileScene.js';
import { MINIGAME_SCENES } from './minigames/index.js';

function pickStorage() {
  try {
    const probe = '__tigrinho_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch (e) {
    return memoryStorage(); // navegador com armazenamento bloqueado: jogo segue, sem salvar entre sessões
  }
}

ctx.game = new GameState(pickStorage());
ctx.rng = createRng(seedFromString(`tigrinho-${Date.now()}`));
ctx.audio = new AudioManager();
ctx.audio.applySettings(ctx.game.data.settings);

// O áudio só é liberado após o primeiro gesto do jogador (regra dos navegadores).
const unlock = () => {
  ctx.audio.unlock();
  ctx.audio.applySettings(ctx.game.data.settings);
  if (!ctx.audio.musicMood) ctx.audio.startMusic('circo');
};
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('keydown', unlock);

// Salva ao sair ou esconder a aba.
const persist = () => ctx.game && ctx.game.save();
window.addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'app',
  backgroundColor: '#14062b',
  width: W,
  height: H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 2 },
  // smoothStep desligado: timers de minijogo seguem o tempo real mesmo com quedas de quadros.
  fps: { target: 60, forceSetTimeOut: false, smoothStep: false },
  scene: [
    BootScene, MenuScene, MachineScene, MinigameMenuScene, ResultScene,
    ShopScene, InventoryScene, CollectionScene, MissionsScene, AchievementsScene,
    SettingsScene, ProfileScene, ...MINIGAME_SCENES,
  ],
});

// Gancho de depuração (somente em desenvolvimento): inspeção no console do navegador.
if (import.meta.env.DEV) window.__TIGRINHO__ = { game, ctx };
