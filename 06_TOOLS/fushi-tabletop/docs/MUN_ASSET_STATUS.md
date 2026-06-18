# Status dos Assets do MUN

Fonte recebida:

`C:\RPG FUSHI\RPG-FUSHI\MUN_REWORK`

Destino usado pelo app:

`public/assets/mundi`

## Importado nesta etapa

- `mun_base_ilha_sem_labels.png`
- 8 thumbnails de biomas.
- 3 thumbnails de locais:
  - `loc_caverna_primeiro_corpo.png`
  - `loc_clareira_lobos.png`
  - `loc_trilha_para_vila.png`
- 6 sigilos de faccao, normalizados de `.svg.svg` para `.svg`.

## Nao importado como imagem

- `loc_vila_conhecimento_absorvido.txt`

Motivo: o arquivo e texto, nao imagem. O app nao cria imagem placeholder permanente para esse local. Enquanto a imagem da vila nao existir, o popover usa thumbnail do bioma.

Atualizacao: a thumb `loc_vila_planicie.png` foi entregue depois em `MUN_REWORK` e normalizada no app como `loc_vila_conhecimento_absorvido.png`.

## Locais ainda sem thumbnail propria

Planicie / Floresta Inicial:

- `loc_vila_conhecimento_absorvido.png`
- `loc_campo_treino_vila.png`
- `loc_armazem_comunitario.png`
- `loc_bosque_baixo.png`
- `loc_riacho_claro.png`

Praia / Litoral / Oceano:

- `loc_praia_naufragos.png`
- `loc_enseada_azul.png`
- `loc_recife_cortante.png`
- `loc_farol_quebrado.png`
- `loc_caverna_mare.png`
- `loc_costa_ossos.png`

Montanhas do Vazio Sereno:

- Todos os pontos 7-12 foram importados nesta etapa.

Floresta Mistica:

- Todos os pontos 36-42 foram importados nesta etapa.

Vulcao / Terras Cinzentas:

- `loc_vulcao_adormecido.png`
- `loc_campo_cinzas.png`
- `loc_rio_lava_antiga.png`
- `loc_forja_abandonada.png`
- `loc_tuneis_quentes.png`
- `loc_boca_inferno.png`

Regiao Congelada / Neve:

- `loc_vale_branco.png`
- `loc_lago_congelado.png`
- `loc_fortaleza_soterrada.png`
- `loc_floresta_pinheiros_negros.png`
- `loc_caverna_azul.png`
- `loc_santuario_sob_gelo.png`

Ruinas Antigas:

- `loc_camara_primeiro_selo.png`
- `loc_corredor_vozes.png`
- `loc_altar_quebrado.png`
- `loc_cidade_afundada.png`
- `loc_biblioteca_morta.png`
- `loc_portao_sem_nome.png`

Vale Cinzento / Veu Cinza:

- `loc_saida_portao.png`
- `loc_acampamento_veu.png`
- `loc_ruina_segura.png`
- `loc_deposito_camuflado.png`
- `loc_trilha_espioes.png`
- `loc_posto_interceptacao.png`
- `loc_torre_observacao.png`
- `loc_grande_lago.png`

## Regra aplicada

Se existe thumbnail real do local, o MUN usa ela.

Se nao existe thumbnail real do local, o MUN usa thumbnail real do bioma.

Se nao existe nenhuma imagem real, usa fallback visual temporario apenas em renderizacao, sem salvar placeholder como dado da campanha.

## Topdowns configurados no MAP

Praia / Litoral / Oceano - V1:

- `praia_naufragos_topdown` -> ponto 51, bifurcacao costeira para Planicie, Mistica e Veu.
- `praia_enseada_azul_topdown` -> ponto 52, enseada segura/base improvisada.
- `praia_embarque_mare_exterior_topdown` -> ponto 53, chegada ao navio/base da Mare Livre.
- `praia_navio_mare_interior_topdown` -> submapa do ponto 53, interior do navio da Mare Livre.
- `praia_recife_cortante_topdown` -> ponto 54, recife de combate e item em rocha central.
- `praia_alto_mar_topdown` -> ponto 55, alto-mar com redemoinhos e criatura marinha.
- `praia_alto_mar_santuario_submerso_topdown` -> submapa do ponto 55, dungeon submersa.
- `praia_farol_quebrado_exterior_topdown` -> ponto 56, chegada ao farol quebrado.
- `praia_farol_quebrado_interior_topdown` -> submapa do ponto 56, interior do farol.
- `praia_caverna_mare_topdown` -> ponto 57, caverna de ressonancia da mare.
- `praia_costa_ossos_exterior_topdown` -> ponto 58, costa amaldicoada com cachoeira.
- `praia_caverna_cachoeira_ossos_topdown` -> submapa do ponto 58, dungeon atras da cachoeira.
- `praia_estatuas_litoral_topdown` -> ponto 59, arena de puzzle das estatuas/adagas.

Montanhas do Vazio Sereno - V1:

- `montanha_caverna_meditacao_exterior_topdown` -> ponto 7, subida/parkour ate a Caverna de Meditacao.
- `montanha_caverna_meditacao_interior_topdown` -> submapa do ponto 7, interior ritual da meditacao.
- `montanha_templo_vazio_sereno_exterior_topdown` -> ponto 8, exterior/base dos monges.
- `montanha_templo_vazio_sereno_interior_topdown` -> submapa do ponto 8, interior do templo.
- `montanha_ponte_suspensa_topdown` -> ponto 9, travessia da ponte suspensa.
- `montanha_poco_yin_yang_topdown` -> submapa do ponto 9, poco/estatuas de despertar.
- `montanha_pico_quatro_ventos_exterior_topdown` -> ponto 10, subida ao Pico dos Quatro Ventos.
- `montanha_santuario_quatro_ventos_interior_topdown` -> submapa do ponto 10, santuario acima das nuvens.
- `montanha_arena_natural_pedra_topdown` -> ponto 11, arena de duelo/espelho.
- `montanha_saida_montanhas_topdown` -> ponto 12, descida/bifurcacao para Vulcao e Gelo.

Regiao Congelada / Neve - V1:

- `gelo_m22_vale_branco` -> ponto 22, vale branco com neve, cinzas e bifurcacao para Ruinas/Vulcao.
- `gelo_m23_fortaleza_soterrada` -> ponto 23, fortaleza congelada e soterrada.
- `gelo_m24_lago_congelado` -> ponto 24, arena circular de gelo com silhueta colossal congelada.
- `gelo_m25_grande_avalanche` -> ponto 25, descida perigosa para fuga de avalanche.
- `gelo_m26_caverna_azul` -> ponto 26, caverna azul com gelo translucido e cristais.
- `gelo_m27_bonecos_de_neve` -> ponto 27, vale com bonecos de neve gigantes.
- `gelo_m28_santuario_sob_gelo` -> ponto 28, discos de gelo sobre agua e santuario final.

Vale Cinzento / Veu Cinza - V1:

- `veu_saida_portao_topdown` -> ponto 43, exterior grande de bifurcacao entre Ruinas, Floresta Mistica, Deposito e Acampamento.
- `veu_acampamento_veu_exterior_topdown` -> ponto 44, exterior circular da base da Ordem do Veu Cinza.
- `veu_acampamento_veu_base_interior_topdown` -> submapa do ponto 44, interior do edificio principal da base.
- `veu_ruina_segura_topdown` -> ponto 45, ruina costeira de lore, oferenda, estatuas e pequena cachoeira.
- `veu_deposito_camuflado_exterior_topdown` -> ponto 46, descida ate a caverna escondida e recursos camuflados.
- `veu_deposito_camuflado_interior_topdown` -> submapa do ponto 46, interior da caverna de suprimentos e informacoes.
- `veu_trilha_espioes_topdown` -> ponto 47, trilha estreita de cachoeiras, relevos e item raro.
- `veu_posto_interceptacao_exterior_topdown` -> ponto 48, exterior fortificado do posto de interceptacao.
- `veu_posto_interceptacao_bunker_interior_topdown` -> submapa do ponto 48, bunker interno com paiol explosivo.
- `veu_torre_observacao_exterior` -> ponto 49, chegada externa na Torre de Observacao.
- `veu_torre_observacao_topo` -> submapa do ponto 49, topo com telescopio e mecanismos de observacao.
- `veu_grande_lago_topdown` -> ponto 50, exterior grande de travessia por lago, pedras, caiaque e cachoeira.

Floresta Mistica - V1:

- `floresta_trilha_enraizada_topdown` -> ponto 36, travessia por raizes entre Floresta Mistica e Veu Cinzento, com acesso secreto ao laboratorio.
- `floresta_coracao_verde_topdown` -> ponto 37, exterior grande da arvore mae e centro vivo do bioma.
- `floresta_arvore_fushi_vivo_interior_topdown` -> ponto 38, interior boss da arvore com nucleo cristalino de FUSHI.
- `floresta_laboratorio_abandonado_exterior_topdown` -> ponto 39, exterior escondido do laboratorio humano antigo.
- `floresta_laboratorio_abandonado_interior_topdown` -> submapa do ponto 39, interior de lore e passagem secreta para o ponto 40.
- `floresta_clareira_animais_topdown` -> ponto 40, clareira com aviao caido, frutas FUSHI e territorio do urso FUSHI.
- `floresta_lago_espelhado_topdown` -> ponto 41, lago alucinogeno abaixo das cachoeiras da arvore central.
- `floresta_arvore_bebe_topdown` -> ponto 42, bifurcacao para Coracao Verde, Lago Espelhado, Veu Cinzento e Praia.
