// Registro dos minijogos: cenas e lista usada pelo menu de minijogos.
import { CFG as reflexo, ReflexoScene } from './reflexo.js';
import { CFG as coleta, ColetaScene } from './coleta.js';
import { CFG as corrida, CorridaScene } from './corrida.js';
import { CFG as memoria, MemoriaScene } from './memoria.js';
import { CFG as sequencia, SequenciaScene } from './sequencia.js';
import { CFG as precisao, PrecisaoScene } from './precisao.js';
import { CFG as tesouro, TesouroScene } from './tesouro.js';

// Cada minijogo vira uma cena Phaser própria.
export const MINIGAME_SCENES = [
  ReflexoScene, ColetaScene, CorridaScene, MemoriaScene, SequenciaScene, PrecisaoScene, TesouroScene,
];

export const MINIGAME_LIST = [reflexo, coleta, corrida, memoria, sequencia, precisao, tesouro];
