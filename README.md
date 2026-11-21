# TIGRINHO SHOW

Arcade cartunesco de sorte **fictícia**, feito com Phaser 3 + Vite + JavaScript.
Um jogo single-player, sem backend, que roda no navegador.

> **Paródia.** Não há apostas com dinheiro real, depósitos, saques, pagamentos,
> prêmios financeiros nem integração com cassino. A economia usa apenas **fichas
> fictícias** e **XP**, que servem para desbloqueios cosméticos e progressão.

## O que tem no jogo

- **Máquina de bobinas**: 5 bobinas × 3 linhas, 5 linhas de pagamento, tigre curinga,
  bola mágica (scatter) com giros grátis, multiplicadores e eventos raros.
- **7 minijogos**: reflexo, coleta, corrida, memória, sequência, precisão e caça ao tesouro,
  com contagem regressiva, medalhas (bronze, prata, ouro) e tela de resultado.
- **Mascote Tigrinho** com animações de idle, surpresa, comemoração, tristeza e vitória.
- **Personalização cosmética** com raridades (comum, raro, épico, lendário).
- **Progressão**: níveis, 12 missões diárias, 12 conquistas, coleção de símbolos,
  estatísticas e perfil local.
- **Áudio** com volumes independentes (geral, música e efeitos), sintetizado no navegador.
- **Salvamento** em `localStorage`. Dados corrompidos são copiados para um backup e o jogo
  recomeça de um estado seguro.

## Rodar localmente

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev        # servidor de desenvolvimento em http://localhost:5173
npm test           # testes de lógica (máquina, combinações, RTP, progressão, salvamento)
npm run build      # gera a versão de produção em dist/
npm run preview    # serve dist/ em http://localhost:4173
```

## Publicação (GitHub Pages)

O workflow `.github/workflows/pages.yml` roda os testes, gera o build e publica a pasta
`dist/` no GitHub Pages a cada push na branch `main`.

Configuração única no repositório:
1. No GitHub, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.

## Estrutura

```
src/logic/     regras puras (RNG, símbolos, combinações, eventos, progressão, salvamento)
src/state/     estado do jogador (fichas, XP, missões, conquistas, loja)
src/scenes/    cenas Phaser (menu, máquina, minijogos, loja, inventário, etc.)
src/minigames/ minijogos e base comum
src/objects/   Tigrinho e bobinas
src/systems/   áudio
src/ui/        componentes de interface e texturas procedurais
tests/         testes automatizados (node:test)
```

Todas as imagens são geradas por código; não há arte de outros jogos ou marcas.
