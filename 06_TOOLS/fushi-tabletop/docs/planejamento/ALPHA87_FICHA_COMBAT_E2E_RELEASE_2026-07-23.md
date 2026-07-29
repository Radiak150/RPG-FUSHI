# Alpha.87 - Ficha, Combate e Release

Data: 2026-07-23

## Escopo fechado

- Editor de ficha da Mesa usa rascunho local e so grava no Salvar.
- Ataques, habilidades, rituais e itens criados na Mesa persistem juntos na
  ficha canonica.
- Mestre e Jogador continuam usando a mesma ficha canonica, com protecao para
  campos reservados do Mestre.
- Edicao completa da ficha usa trava de prioridade; ajustes rapidos de recurso
  tambem entram no fluxo remoto com ACK e cooldown.
- O pedido de acao do Jogador para o Mestre e privado, tem cooldown de 10
  segundos e nao expoe habilidades de NPC ou de outros jogadores.
- A janela Resolver ataque abre depois que o dado assenta. Durante a rolagem a
  janela de dados minimiza e depois volta. A resolucao segue defesa, dano e
  resultado, com fechamento manual disponivel.
- Ver area tem fechamento por X fora da camada visual e marca o alvo escolhido
  em vermelho.
- O smoke de dados foi alinhado ao contrato real: a janela fica minimizada
  durante a rolagem e restaurada depois do resultado.

## Contratos preservados

- Lore e alertas de conteudo nao foram alterados.
- Movimento de token continua reservado ao Mestre.
- O protocolo multiplayer existente foi endurecido, nao substituido.
- Nenhum alerta foi convertido em falso OK.
- A Esquiva continua fixa como CA atual + AGI + Reflexos.

## Validacao executada

- `npm run lint -- --max-warnings=999`
- `npm run build`
- `npm run smoke:ui`
- `npm run smoke:multiplayer`
- `npm run smoke:combat-v2`
- `npm run smoke:builds`
- `npm run smoke:events`
- `npm run smoke:training`
- `npm run smoke:rulebooks`
- `npm run content:audit`
- `npm run release:close`
- `npm run release:dir`
- `npm run release:stamp`
- `npm run release:assets`
- `npm run smoke:release`
- `npm run smoke:release:deep` (11/11)
- `npm run release:distributables`

## Artefatos

- Executavel: `release/win-unpacked/RPG FUSHI.exe`
- Instalador: `release/RPG-FUSHI-Setup-0.1.0-alpha.87-x64.exe`
- Instalador web: `release/nsis-web/RPG-FUSHI-Web-Setup-0.1.0-alpha.87-x64.exe`
- Planilha unica: `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`

## Gate humano restante

A validacao automatica esta verde. Ainda falta o teste fisico Mestre/Jogador:

1. Abrir a alpha.87 em dois computadores.
2. Editar uma ficha de cada lado e observar a trava, o ACK e a atualizacao
   imediata nos dois lados.
3. Atribuir um item, uma habilidade e um ataque na Mesa; confirmar Fluxo
   Principal, Mesa e Jogador.
4. Rolar um ataque, aplicar defesa, calcular dano e repetir com habilidade que
   consome recurso.
5. Verificar area, alvo vermelho, fechar por X e pedido de manobra do Jogador.
6. Confirmar que segredo de Mestre, NPC e outros jogadores nao vaza.
