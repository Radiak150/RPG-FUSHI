# MUN Geography V1

Fonte visual: `C:\RPG FUSHI\RPG-FUSHI\MUN_REWORK\mun_base_ilha_sem_labels.png`, `mun_base_ilha_com_marcação.png`, `mun_base_ilha_com_rotas_interligadas.png`.

Estado atual implementado:
- Mapa principal usa a arte limpa da ilha.
- O mapa global mostra os 8 biomas por regioes clicaveis.
- Ao clicar em um bioma, o MUN entra na visao daquele bioma e mostra os pontos numerados.
- Locais sem asset final aparecem como `CONSTRUCAO`.
- O seed oficial agora possui 60 pontos e rotas oficiais do mapa de rotas.
- A revisao `rotas_mun_60_v7_montanha_thumbs` corrige as ligacoes manuais informadas e atualiza o Veu Cinzento, a Floresta Mistica e as thumbs oficiais de Montanha/Vila para a geografia real dos arquivos `INFOS IMPORTANTES` em `MUN_REWORK/Cada ponto de interesse+topdown`.
- A aba `Geral` e separada da aba `Mestre`: o mestre pode liberar o MUN para jogadores e revelar pontos de interesse progressivamente, sem enviar NPCs, segredos ou notas privadas.
- Estados salvos com o seed antigo migram automaticamente para a geografia oficial quando o MUN carregar.

## Biomas

- Planicie / Floresta Inicial: pontos 1-6 e 60.
- Montanhas do Vazio Sereno: pontos 7-12.
- Vulcao / Terras Cinzentas: pontos 13-21.
- Regiao Congelada / Neve: pontos 22-28.
- Ruinas Antigas: pontos 29-35.
- Floresta Mistica: pontos 36-42.
- Vale Cinzento / Veu Cinza: pontos 43-50.
- Praia / Litoral / Oceano: pontos 51-59.

## Pontos Com Asset Ja Vinculado

- 1: Caverna do Primeiro Corpo.
- 2: Clareira dos Lobos.
- 3: Armazem Comunitario.
- 4: Campo de Treino da Vila.
- 5: Vila do Conhecimento Absorvido.
- 6: Bosque Baixo.
- 7: Caverna de Meditacao.
- 8: Templo do Vazio Sereno.
- 9: Ponte Suspensa.
- 10: Pico dos Quatro Ventos.
- 11: Arena Natural de Pedra.
- 12: Saida das Montanhas.
- 36: Trilha Enraizada.
- 37: Coracao Verde.
- 38: Arvore de FUSHI Vivo.
- 39: Laboratorio Abandonado.
- 40: Clareira dos Animais.
- 41: Lago Espelhado.
- 42: Arvore Bebe.
- 51: Praia dos Naufragos.
- 52: Enseada Azul.
- 53: Embarque da Mare Livre.
- 54: Recife Cortante.
- 55: Alto Mar.
- 56: Farol Quebrado.
- 57: Caverna da Mare.
- 58: Costa dos Ossos, com tag `cachoeira_confirmar`.
- 59: Estatuas do Litoral.
- 60: Riacho Claro.
- 43: Saida do Portao.
- 44: Acampamento do Veu, com exterior e interior da base vinculados ao MAP.
- 45: Ruina Segura.
- 46: Deposito Camuflado.
- 47: Trilha dos Espioes.
- 48: Posto de Interceptacao.
- 49: Torre de Observacao, com exterior e topo vinculados ao MAP.
- 50: Grande Lago.

## Pontos A Confirmar Com Asset/Nome Final

- 5: Vila do Conhecimento Absorvido.
- 13-21: detalhes finais dos pontos vulcanicos extras.
- 22-28: detalhes finais dos pontos congelados extras.
- 35: ponto extra nas Ruinas Antigas.
- 58: o usuario mencionou cachoeira/dungeon interna; o arquivo atual esta como `loc_costa_ossos.png`, entao confirmar nome final antes de polir.

## Nota De Implementacao

O seed oficial fica em `src/lib/worldMundiState.ts`.
O overlay visual dos biomas e a alternancia global/bioma ficam em `src/components/tabletop/TabletopWorldMundiPanel.tsx`.
O estilo do MUN fica em `src/styles/globals.css`.
