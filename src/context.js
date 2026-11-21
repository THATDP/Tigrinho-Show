// Contexto global compartilhado entre as cenas (estado do jogo, áudio e RNG da máquina).
import { createRng } from './logic/rng.js';

export const ctx = {
  game: null,   // GameState
  audio: null,  // AudioManager
  rng: createRng(),
  sessionStart: Date.now(),
  lastBreakNudge: 0,
};
