// Níveis, missões diárias, conquistas e recompensas. Tudo em fichas fictícias.
import { createRng, seedFromString } from './rng.js';

// XP necessário para subir do nível L para L+1.
export function xpToNext(level) {
  return 100 + 40 * (level - 1);
}

// Converte XP total em { level, into, need }.
export function levelInfo(totalXp) {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}

export function levelUpReward(newLevel) {
  return 200 * newLevel;
}

// Modelos de missões diárias. `stat` é a chave de progresso acumulada no dia.
export const MISSION_POOL = [
  { id: 'giros-15', desc: 'Dê 15 giros na máquina', stat: 'spins', target: 15, reward: 150, xp: 40 },
  { id: 'giros-30', desc: 'Dê 30 giros na máquina', stat: 'spins', target: 30, reward: 300, xp: 70 },
  { id: 'vitorias-5', desc: 'Consiga 5 linhas vencedoras', stat: 'wins', target: 5, reward: 200, xp: 50 },
  { id: 'grandes-1', desc: 'Faça uma vitória grande (x5 ou mais)', stat: 'bigWins', target: 1, reward: 250, xp: 60 },
  { id: 'eventos-1', desc: 'Presencie 1 evento especial', stat: 'events', target: 1, reward: 180, xp: 50 },
  { id: 'minijogo-2', desc: 'Jogue 2 minijogos', stat: 'minigames', target: 2, reward: 220, xp: 60 },
  { id: 'reflexo-1', desc: 'Jogue o Desafio de Reflexos', stat: 'minigame:reflexo', target: 1, reward: 150, xp: 35 },
  { id: 'memoria-1', desc: 'Jogue o Desafio de Memória', stat: 'minigame:memoria', target: 1, reward: 150, xp: 35 },
  { id: 'corrida-1', desc: 'Jogue a Corrida do Tigre', stat: 'minigame:corrida', target: 1, reward: 150, xp: 35 },
  { id: 'tesouro-1', desc: 'Jogue a Caça ao Tesouro', stat: 'minigame:tesouro', target: 1, reward: 150, xp: 35 },
  { id: 'ganhos-1000', desc: 'Ganhe 1000 fichas em prêmios', stat: 'fichasWon', target: 1000, reward: 300, xp: 80 },
  { id: 'bonus-1', desc: 'Ative 1 rodada bônus (dispersão)', stat: 'freeSpinsTriggered', target: 1, reward: 250, xp: 60 },
];

// Escolhe 3 missões do dia, de forma estável para a mesma data (mesmo dia = mesmas missões).
export function dailyMissionsFor(dateKey) {
  const rng = createRng(seedFromString('missions-' + dateKey));
  return rng.shuffle(MISSION_POOL).slice(0, 3).map((m) => ({ id: m.id, progress: 0, claimed: false }));
}

// Conquistas permanentes. `stat` é a chave da estatística global e `target` o limite.
export const ACHIEVEMENTS = [
  { id: 'primeiro-giro', name: 'Primeiro Rugido', desc: 'Dê seu primeiro giro.', stat: 'spins', target: 1, reward: 100 },
  { id: 'giros-100', name: 'Ritmo de Samba', desc: 'Dê 100 giros no total.', stat: 'spins', target: 100, reward: 300 },
  { id: 'vitorias-50', name: 'Mão Quente', desc: 'Consiga 50 linhas vencedoras.', stat: 'wins', target: 50, reward: 400 },
  { id: 'grande-vitoria', name: 'Show de Verdade', desc: 'Faça uma vitória épica (x25 ou mais).', stat: 'bigWins', target: 1, reward: 300 },
  { id: 'mestre-sorte', name: 'Mestre da Sorte', desc: 'Ative 5 rodadas bônus.', stat: 'freeSpinsTriggered', target: 5, reward: 500 },
  { id: 'colecionador', name: 'Colecionador', desc: 'Veja todos os 8 símbolos da máquina.', stat: 'symbolsSeen', target: 8, reward: 400 },
  { id: 'eventos-10', name: 'Caçador de Eventos', desc: 'Presencie 10 eventos especiais.', stat: 'events', target: 10, reward: 350 },
  { id: 'minijogos-10', name: 'Jogador de Arcade', desc: 'Jogue 10 minijogos.', stat: 'minigames', target: 10, reward: 350 },
  { id: 'minijogos-win', name: 'Campeão Relâmpago', desc: 'Conquiste 3 medalhas de ouro em minijogos.', stat: 'goldMedals', target: 3, reward: 500 },
  { id: 'nivel-5', name: 'Veterano do Palco', desc: 'Chegue ao nível 5.', stat: 'level', target: 5, reward: 300 },
  { id: 'nivel-10', name: 'Astro do Circo', desc: 'Chegue ao nível 10.', stat: 'level', target: 10, reward: 600 },
  { id: 'loja-3', name: 'Cliente VIP Fictício', desc: 'Compre 3 cosméticos na loja.', stat: 'itemsBought', target: 3, reward: 250 },
  { id: 'cosmetico-10', name: 'Guarda-Roupa Cheio', desc: 'Tenha 10 cosméticos no inventário.', stat: 'itemsOwned', target: 10, reward: 350 },
];

// Medalha conforme a fração da meta atingida (0..1+).
export function medalFor(score, goals) {
  if (!goals) return 'none';
  if (score >= goals.gold) return 'gold';
  if (score >= goals.silver) return 'silver';
  if (score >= goals.bronze) return 'bronze';
  return 'none';
}
