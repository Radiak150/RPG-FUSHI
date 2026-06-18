# Assets Necessarios - Rework MUN

Coloque os arquivos em uma pasta de trabalho, por exemplo:

`C:\RPG FUSHI\RPG-FUSHI\03_ASSETS\MUN_REWORK\`

Depois eu importo/organizo no app e vinculo cada imagem ao ponto correto.

## Regras gerais

- Sem texto escrito dentro da arte principal do mapa.
- Sem labels fixos nos pontos; o app mostra nome via hover/click.
- Preferir PNG/WebP/JPG em alta qualidade.
- Para camadas/masks, usar PNG transparente ou SVG.
- Manter nomes de arquivo parecidos com os ids abaixo para automatizar.
- Imagens finais podem ser 16:9 ou ultrawide. Recomendado: 4096x2304, 5120x2880 ou 6000x3375.

## 1. Mapa base da ilha

Obrigatorio:

- `mun_base_ilha_sem_labels.png`

Descricao:

- Mapa mundi real da ilha, top-down/ilustrado, sem nomes.
- Deve mostrar os biomas de forma clara:
  - Planicie / Floresta Inicial;
  - Praia / Litoral / Oceano;
  - Montanhas do Vazio Sereno;
  - Floresta Mistica;
  - Vulcao / Terras Cinzentas;
  - Regiao Congelada / Neve;
  - Ruinas Antigas;
  - Vale Cinzento / Rotas do Veu.

Opcional:

- `mun_base_ilha_clean.webp`
- `mun_base_ilha_dark.webp`
- `mun_base_ilha_gridless.png`

## 2. Mascaras/areas dos biomas

Opcional, mas ideal para deixar o mapa profissional.

Cada arquivo deve ter a mesma dimensao do mapa base e transparencia fora da area.

- `mask_planicie_floresta_inicial.png`
- `mask_praia_litoral_oceano.png`
- `mask_montanhas_vazio_sereno.png`
- `mask_floresta_mistica.png`
- `mask_vulcao_terras_cinzentas.png`
- `mask_regiao_congelada_neve.png`
- `mask_ruinas_antigas.png`
- `mask_vale_cinzento_veu.png`

Uso:

- hover no bioma;
- brilho sutil;
- filtro visual;
- destaque de regiao.

## 3. Icones/sigilos de faccao

Formato: SVG ou PNG transparente.

- `faction_a_ordem_vazio_sereno.svg`
- `faction_b_fushi_escuro.svg`
- `faction_c_ordem_veu_cinza.svg`
- `faction_d_vila_conhecimento_absorvido.svg`
- `faction_e_companhia_mare_livre.svg`
- `faction_f_guardioes_vulcao.svg`

## 4. Thumbnails dos biomas

Usadas nos popovers, editor e futuros cards.

- `thumb_bioma_planicie_floresta_inicial.png`
- `thumb_bioma_praia_litoral_oceano.png`
- `thumb_bioma_montanhas_vazio_sereno.png`
- `thumb_bioma_floresta_mistica.png`
- `thumb_bioma_vulcao_terras_cinzentas.png`
- `thumb_bioma_regiao_congelada_neve.png`
- `thumb_bioma_ruinas_antigas.png`
- `thumb_bioma_vale_cinzento_veu.png`

## 5. Thumbnails dos locais

Essas imagens aparecem quando o mestre clica/hover no ponto.

Planicie / Floresta Inicial:

- `loc_caverna_primeiro_corpo.png`
- `loc_clareira_lobos.png`
- `loc_trilha_para_vila.png`
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

- `loc_templo_vazio_sereno.png`
- `loc_pico_quatro_ventos.png`
- `loc_ponte_suspensa.png`
- `loc_caverna_meditacao.png`
- `loc_arena_natural_pedra.png`
- `loc_santuario_primeiro_fluxo.png`

Floresta Mistica:

- `loc_coracao_verde.png`
- `loc_laboratorio_abandonado.png`
- `loc_clareira_animais.png`
- `loc_arvore_fushi_vivo.png`
- `loc_trilha_cacadores.png`
- `loc_lago_espelhado.png`

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
- `loc_torre_observacao.png`
- `loc_ruina_segura.png`
- `loc_deposito_camuflado.png`
- `loc_trilha_espioes.png`
- `loc_posto_interceptacao.png`
- `loc_grande_lago.png`

## 6. Mapas MAP vinculados

Esses sao mapas de cena/batalha/exploracao local, nao thumbnails.

Podem ser adicionados aos poucos. O rework do MUN so precisa saber vincular `mapId` corretamente.

Prioridade para primeira sessao:

- `map_caverna_primeiro_corpo.png`
- `map_clareira_lobos.png`
- `map_trilha_para_vila.png`
- `map_vila_conhecimento_absorvido.png`
- `map_campo_treino_vila.png`
- `map_bosque_baixo.png`
- `map_riacho_claro.png`

Depois:

- mapas de dungeons;
- interiores da vila;
- ruinas;
- vulcao;
- montanhas;
- litoral.

## 7. Texturas/overlays opcionais

Para polimento:

- `overlay_rota_tracejada.png` ou SVG path style.
- `texture_parchment_dark.png`
- `texture_fushi_noise.png`
- `overlay_fushi_distortion.png`
- `overlay_neblina_mundi.png`
- `overlay_brilho_poi.png`

Esses podem ser substituidos por programacao quando fizer mais sentido.

## 8. O que nao precisa vir como imagem

O app consegue gerar por programacao:

- glow de POI;
- tracejado de rotas;
- hover dourado;
- tooltip;
- pulsos de evento;
- selecao de bioma;
- contorno de risco;
- mini cards;
- filtros de zoom;
- marcadores de grupos.

Use imagem para o que precisa parecer mundo real. Use programacao para feedback, movimento e leitura.

## 9. Regra para mapas topdown "exterior grande"

Mapas de exterior grande servem para bifurcacoes importantes entre biomas, nao para virar labirinto.

Diretriz obrigatoria:

- mostrar claramente de onde o grupo veio;
- mostrar no maximo 1 ou 2 saidas principais novas, conforme as rotas reais do MUN;
- nao criar varias trilhas livres que confundem a rota;
- cada saida deve ter desafio visual claro e jogavel;
- manter coerencia com a imagem de referencia do ponto de interesse;
- se o desafio nao couber no mesmo mapa, criar um mapa de transicao separado.

Exemplo de bifurcacao:

- caminho de volta: Vila / ponto anterior;
- saida para Montanha: buracao enorme, passagem quebrada, salto, ponte improvisada ou escalada;
- saida para Floresta Mistica: vinhas densas, vegetacao viva, bloqueio natural ou teste de passagem.

O topdown precisa deixar a decisao obvia para o mestre e para os jogadores: "voltamos", "vamos para a montanha" ou "vamos para a floresta". Rotas extras so entram quando existirem no MUN.
