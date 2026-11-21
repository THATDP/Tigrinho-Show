// Eventos especiais: sorteados após giros, com cooldown para não atrapalhar o ritmo.
export const EVENTS = {
  mascote: { id: 'mascote', title: 'Entrada do Tigrinho!', desc: 'O mascote faz uma entrada triunfal.', weight: 3 },
  cenario: { id: 'cenario', title: 'Mudança de Cenário!', desc: 'O palco troca de cor e de clima.', weight: 3 },
  sequencia: { id: 'sequencia', title: 'Sequência Especial!', desc: 'Próximo giro com multiplicador mínimo ×3.', weight: 2 },
  bonus: { id: 'bonus', title: 'Rodada Bônus!', desc: 'Três giros grátis com multiplicador ×2.', weight: 2 },
  relampago: { id: 'relampago', title: 'Desafio Relâmpago!', desc: 'Toque no tigrinho dourado antes que ele fuja!', weight: 2 },
};

export const EVENT_CHANCE = 0.06;   // 6% por giro normal
export const EVENT_COOLDOWN = 10;   // no mínimo 10 giros entre eventos

// Decide se um evento acontece. `spinsSinceEvent` controla o cooldown.
export function rollEvent(rng, spinsSinceEvent) {
  if (spinsSinceEvent < EVENT_COOLDOWN) return null;
  if (rng.next() >= EVENT_CHANCE) return null;
  return rng.weighted(Object.values(EVENTS), (e) => e.weight);
}
