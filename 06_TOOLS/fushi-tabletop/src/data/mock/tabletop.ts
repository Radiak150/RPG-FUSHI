import type {
  TabletopBiome,
  TabletopData,
  TabletopMap,
  TabletopScene,
  TabletopSessionPlan,
  TabletopToken,
  TabletopTransitionAsset,
} from '../types'

const planicieCavernaMapPath =
  '/assets/maps/planicie/caverna-inicial/caverna_despertar.png'
const planicieAbertaMapPath = '/assets/maps/planicie/planicie_aberta.png'
const trilhaSobrevivenciaMapPath =
  '/assets/maps/planicie/trilha_sobrevivencia.png'
const regiaoVilaMapPath = '/assets/maps/planicie/regiao_vila.png'
const vilaCavernaPrimeiroCorpoTopdownPath =
  '/assets/maps/planicie/vila/interior/caverna-primeiro-corpo/caverna_primeiro_corpo_topdown_4000.png'
const vilaCavernaPrimeiroCorpoTopdownThumbPath =
  '/assets/maps/planicie/vila/interior/caverna-primeiro-corpo/caverna_primeiro_corpo_topdown_thumb_640.jpg'
const vilaClareiraLobosTopdownPath =
  '/assets/maps/planicie/vila/exterior/clareira-lobos/clareira_lobos_topdown_4000.png'
const vilaClareiraLobosTopdownThumbPath =
  '/assets/maps/planicie/vila/exterior/clareira-lobos/clareira_lobos_topdown_thumb_640.jpg'
const vilaArmazemComunitarioTopdownPath =
  '/assets/maps/planicie/vila/interior/armazem-comunitario/armazem_comunitario_interior_topdown_4000.png'
const vilaArmazemComunitarioTopdownThumbPath =
  '/assets/maps/planicie/vila/interior/armazem-comunitario/armazem_comunitario_interior_topdown_thumb_640.jpg'
const vilaCampoTreinoTopdownPath =
  '/assets/maps/planicie/vila/exterior/campo-treino-vila/campo_treino_vila_topdown_4000.png'
const vilaCampoTreinoTopdownThumbPath =
  '/assets/maps/planicie/vila/exterior/campo-treino-vila/campo_treino_vila_topdown_thumb_640.jpg'
const vilaPlanicieTopdownPath =
  '/assets/maps/planicie/vila/exterior/vila-planicie/vila_planicie_topdown_4000.png'
const vilaPlanicieTopdownThumbPath =
  '/assets/maps/planicie/vila/exterior/vila-planicie/vila_planicie_topdown_thumb_640.jpg'
const vilaBosqueBaixoTopdownPath =
  '/assets/maps/planicie/vila/exterior-grande/bosque-baixo/bosque_baixo_topdown_4000.png'
const vilaBosqueBaixoTopdownThumbPath =
  '/assets/maps/planicie/vila/exterior-grande/bosque-baixo/bosque_baixo_topdown_thumb_640.jpg'
const vilaRiachoClaroTopdownPath =
  '/assets/maps/planicie/vila/exterior-grande/riacho-claro/riacho_claro_topdown_4000.png'
const vilaRiachoClaroTopdownThumbPath =
  '/assets/maps/planicie/vila/exterior-grande/riacho-claro/riacho_claro_topdown_thumb_640.jpg'
const vilaRiachoClaroNiloLioraTopdownPath =
  '/assets/maps/planicie/vila/exterior-grande/riacho-claro/submapas/M5-S1_riacho_claro_nilo_liora_topdown_4000.png'
const vilaRiachoClaroNiloLioraTopdownThumbPath =
  '/assets/maps/planicie/vila/exterior-grande/riacho-claro/submapas/M5-S1_riacho_claro_nilo_liora_topdown_thumb_640.jpg'
const veuTorreObservacaoExteriorMapPath =
  '/assets/maps/veu-cinzento/torre-observacao/torre_observacao_exterior_topdown_4000.png'
const veuTorreObservacaoExteriorThumbPath =
  '/assets/maps/veu-cinzento/torre-observacao/torre_observacao_exterior_topdown_thumb_640.jpg'
const veuTorreObservacaoTopoMapPath =
  '/assets/maps/veu-cinzento/torre-observacao/torre_observacao_topo_observatorio_4000.png'
const veuTorreObservacaoTopoThumbPath =
  '/assets/maps/veu-cinzento/torre-observacao/torre_observacao_topo_observatorio_thumb_640.jpg'
const veuAcampamentoExteriorMapPath =
  '/assets/maps/veu-cinzento/base-faccao/acampamento-veu/acampamento_veu_exterior_topdown_4000.png'
const veuAcampamentoExteriorThumbPath =
  '/assets/maps/veu-cinzento/base-faccao/acampamento-veu/acampamento_veu_exterior_topdown_thumb_640.jpg'
const veuAcampamentoInteriorMapPath =
  '/assets/maps/veu-cinzento/base-faccao/acampamento-veu/acampamento_veu_base_interior_topdown_4000.png'
const veuAcampamentoInteriorThumbPath =
  '/assets/maps/veu-cinzento/base-faccao/acampamento-veu/acampamento_veu_base_interior_topdown_thumb_640.jpg'
const praiaNaufragosTopdownPath =
  '/assets/maps/praia/exterior-grande/praia-naufragos/praia_naufragos_topdown_4000.jpg'
const praiaNaufragosTopdownThumbPath =
  '/assets/maps/praia/exterior-grande/praia-naufragos/praia_naufragos_topdown_thumb_640.jpg'
const enseadaAzulTopdownPath =
  '/assets/maps/praia/exterior/enseada-azul/enseada_azul_topdown_4000.jpg'
const enseadaAzulTopdownThumbPath =
  '/assets/maps/praia/exterior/enseada-azul/enseada_azul_topdown_thumb_640.jpg'
const embarqueMareExteriorTopdownPath =
  '/assets/maps/praia/base-faccao/embarque-mare/embarque_mare_exterior_topdown_4000.jpg'
const embarqueMareExteriorTopdownThumbPath =
  '/assets/maps/praia/base-faccao/embarque-mare/embarque_mare_exterior_topdown_thumb_640.jpg'
const navioMareInteriorTopdownPath =
  '/assets/maps/praia/base-faccao/embarque-mare/interior/navio_mare_interior_topdown_4000.jpg'
const navioMareInteriorTopdownThumbPath =
  '/assets/maps/praia/base-faccao/embarque-mare/interior/navio_mare_interior_topdown_thumb_640.jpg'
const recifeCortanteTopdownPath =
  '/assets/maps/praia/exterior/recife-cortante/recife_cortante_topdown_4000.jpg'
const recifeCortanteTopdownThumbPath =
  '/assets/maps/praia/exterior/recife-cortante/recife_cortante_topdown_thumb_640.jpg'
const altoMarTopdownPath = '/assets/maps/praia/exterior/alto-mar/alto_mar_topdown_4000.jpg'
const altoMarTopdownThumbPath =
  '/assets/maps/praia/exterior/alto-mar/alto_mar_topdown_thumb_640.jpg'
const altoMarSantuarioSubmersoTopdownPath =
  '/assets/maps/praia/exterior/alto-mar/submerso/alto_mar_santuario_submerso_topdown_4000.jpg'
const altoMarSantuarioSubmersoTopdownThumbPath =
  '/assets/maps/praia/exterior/alto-mar/submerso/alto_mar_santuario_submerso_topdown_thumb_640.jpg'
const farolQuebradoExteriorTopdownPath =
  '/assets/maps/praia/exterior/farol-quebrado/farol_quebrado_exterior_topdown_4000.jpg'
const farolQuebradoExteriorTopdownThumbPath =
  '/assets/maps/praia/exterior/farol-quebrado/farol_quebrado_exterior_topdown_thumb_640.jpg'
const farolQuebradoInteriorTopdownPath =
  '/assets/maps/praia/exterior/farol-quebrado/interior/farol_quebrado_interior_topdown_4000.jpg'
const farolQuebradoInteriorTopdownThumbPath =
  '/assets/maps/praia/exterior/farol-quebrado/interior/farol_quebrado_interior_topdown_thumb_640.jpg'
const cavernaMareTopdownPath =
  '/assets/maps/praia/interior/caverna-mare/caverna_mare_topdown_4000.jpg'
const cavernaMareTopdownThumbPath =
  '/assets/maps/praia/interior/caverna-mare/caverna_mare_topdown_thumb_640.jpg'
const costaOssosExteriorTopdownPath =
  '/assets/maps/praia/dungeon/costa-ossos/costa_ossos_exterior_topdown_4000.jpg'
const costaOssosExteriorTopdownThumbPath =
  '/assets/maps/praia/dungeon/costa-ossos/costa_ossos_exterior_topdown_thumb_640.jpg'
const cavernaCachoeiraOssosTopdownPath =
  '/assets/maps/praia/dungeon/costa-ossos/interior/caverna_cachoeira_ossos_topdown_4000.jpg'
const cavernaCachoeiraOssosTopdownThumbPath =
  '/assets/maps/praia/dungeon/costa-ossos/interior/caverna_cachoeira_ossos_topdown_thumb_640.jpg'
const estatuasLitoralTopdownPath =
  '/assets/maps/praia/exterior/estatuas-litoral/estatuas_litoral_topdown_4000.jpg'
const estatuasLitoralTopdownThumbPath =
  '/assets/maps/praia/exterior/estatuas-litoral/estatuas_litoral_topdown_thumb_640.jpg'
const montanhaCavernaMeditacaoExteriorTopdownPath =
  '/assets/maps/montanha/exterior-grande/caverna-meditacao/caverna_meditacao_exterior_topdown_4000.jpg'
const montanhaCavernaMeditacaoExteriorTopdownThumbPath =
  '/assets/maps/montanha/exterior-grande/caverna-meditacao/caverna_meditacao_exterior_topdown_thumb_640.jpg'
const montanhaCavernaMeditacaoInteriorTopdownPath =
  '/assets/maps/montanha/exterior-grande/caverna-meditacao/interior/caverna_meditacao_interior_topdown_4000.jpg'
const montanhaCavernaMeditacaoInteriorTopdownThumbPath =
  '/assets/maps/montanha/exterior-grande/caverna-meditacao/interior/caverna_meditacao_interior_topdown_thumb_640.jpg'
const montanhaTemploVazioSerenoExteriorTopdownPath =
  '/assets/maps/montanha/base-faccao/templo-vazio-sereno/templo_vazio_sereno_exterior_topdown_4000.jpg'
const montanhaTemploVazioSerenoExteriorTopdownThumbPath =
  '/assets/maps/montanha/base-faccao/templo-vazio-sereno/templo_vazio_sereno_exterior_topdown_thumb_640.jpg'
const montanhaTemploVazioSerenoInteriorTopdownPath =
  '/assets/maps/montanha/base-faccao/templo-vazio-sereno/interior/templo_vazio_sereno_interior_topdown_4000.jpg'
const montanhaTemploVazioSerenoInteriorTopdownThumbPath =
  '/assets/maps/montanha/base-faccao/templo-vazio-sereno/interior/templo_vazio_sereno_interior_topdown_thumb_640.jpg'
const montanhaPonteSuspensaTopdownPath =
  '/assets/maps/montanha/exterior/ponte-suspensa/ponte_suspensa_topdown_4000.jpg'
const montanhaPonteSuspensaTopdownThumbPath =
  '/assets/maps/montanha/exterior/ponte-suspensa/ponte_suspensa_topdown_thumb_640.jpg'
const montanhaPocoYinYangTopdownPath =
  '/assets/maps/montanha/exterior/ponte-suspensa/poco-yin-yang/poco_yin_yang_topdown_4000.jpg'
const montanhaPocoYinYangTopdownThumbPath =
  '/assets/maps/montanha/exterior/ponte-suspensa/poco-yin-yang/poco_yin_yang_topdown_thumb_640.jpg'
const montanhaPicoQuatroVentosExteriorTopdownPath =
  '/assets/maps/montanha/exterior-grande/pico-quatro-ventos/pico_quatro_ventos_exterior_topdown_4000.jpg'
const montanhaPicoQuatroVentosExteriorTopdownThumbPath =
  '/assets/maps/montanha/exterior-grande/pico-quatro-ventos/pico_quatro_ventos_exterior_topdown_thumb_640.jpg'
const montanhaSantuarioQuatroVentosInteriorTopdownPath =
  '/assets/maps/montanha/exterior-grande/pico-quatro-ventos/interior/santuario_quatro_ventos_interior_topdown_4000.jpg'
const montanhaSantuarioQuatroVentosInteriorTopdownThumbPath =
  '/assets/maps/montanha/exterior-grande/pico-quatro-ventos/interior/santuario_quatro_ventos_interior_topdown_thumb_640.jpg'
const montanhaArenaNaturalPedraTopdownPath =
  '/assets/maps/montanha/exterior/arena-natural-pedra/arena_natural_pedra_topdown_4000.jpg'
const montanhaArenaNaturalPedraTopdownThumbPath =
  '/assets/maps/montanha/exterior/arena-natural-pedra/arena_natural_pedra_topdown_thumb_640.jpg'
const montanhaSaidaMontanhasTopdownPath =
  '/assets/maps/montanha/exterior-grande/saida-montanhas/saida_montanhas_topdown_4000.jpg'
const montanhaSaidaMontanhasTopdownThumbPath =
  '/assets/maps/montanha/exterior-grande/saida-montanhas/saida_montanhas_topdown_thumb_640.jpg'
const despertarTransitionPath =
  '/assets/transitions/planicie/despertar_placeholder.png'
const saidaCavernaTransitionPath =
  '/assets/transitions/planicie/saida_caverna.png'
const avistandoVilaTransitionPath =
  '/assets/transitions/planicie/avistando_vila.png'
const forestAmbienceAudioPath =
  '/assets/audio/session-01/forest_ambience_cc0.mp3'
const dungeonAmbienceAudioPath =
  '/assets/audio/session-01/dungeon_ambient_cc0.ogg'
const windWhooshAudioPath = '/assets/audio/session-01/wind_whoosh_loop_cc0.ogg'
const rainGentleAudioPath =
  '/assets/audio/ambience/weather/rain_window_gentle_01.ogg'
const rainSteadyAudioPath =
  '/assets/audio/ambience/weather/rain_window_steady_02.ogg'
const rainHeavyAudioPath =
  '/assets/audio/ambience/weather/rain_window_heavy_03.ogg'
const rainDistantAudioPath =
  '/assets/audio/ambience/weather/rain_window_distant_04.ogg'
const rainThunderInsideAudioPath =
  '/assets/audio/ambience/weather/rain_thunder_inside_ccby3.ogg'
const caveThemeAudioPath = '/assets/audio/session-01/cave_theme_cc0.ogg'
const townThemeAudioPath = '/assets/audio/session-01/town_theme_cc0.mp3'
const battleThemeAudioPath = '/assets/audio/session-01/battle_theme_cc0.mp3'
const fieldOfDreamsAudioPath = '/assets/audio/session-01/field_of_dreams_cc0.mp3'
const legendWillRiseAudioPath =
  '/assets/audio/session-01/legend_will_rise_cc0.mp3'
const bossBattleAudioPath = '/assets/audio/session-01/boss_battle_cc0.m4a'
const bossWhispersAbyssAudioPath =
  '/assets/audio/msc/boss/music__boss__whispers_abyss__high__alkakrab__001.ogg'
const domainShadowforgeIntroAudioPath =
  '/assets/audio/msc/domain/music__domain__shadowforge_intro__high__alkakrab__002.ogg'
const bossShadowforgeLoopAudioPath =
  '/assets/audio/msc/boss/music__boss__shadowforge_loop__high__alkakrab__003.ogg'
const domainShadowforgePhase2AudioPath =
  '/assets/audio/msc/domain/music__domain__shadowforge_after_intro__high__alkakrab__004.ogg'
const bossEclipsedDesolationAudioPath =
  '/assets/audio/msc/boss/music__boss__eclipsed_desolation__extreme__alkakrab__005.ogg'
const domainCursedCitadelIntroAudioPath =
  '/assets/audio/msc/domain/music__domain__cursed_citadel_intro__high__alkakrab__006.ogg'
const bossCursedCitadelLoopAudioPath =
  '/assets/audio/msc/boss/music__boss__cursed_citadel_loop__high__alkakrab__007.ogg'
const battleDreadMarchAudioPath =
  '/assets/audio/msc/battle/music__battle__dread_march__high__alkakrab__008.ogg'
const domainEternalNightfallAudioPath =
  '/assets/audio/msc/domain/music__domain__eternal_nightfall__extreme__alkakrab__009.ogg'

const baseUpgradePhaseSpecs = [
  {
    key: 'fase1_construcao',
    label: 'Fase 1 - Construcao',
    summary: 'Terreno em reforma com fundacao marcada, recursos expostos e abrigo improvisado.',
  },
  {
    key: 'fase2_meio_construida',
    label: 'Fase 2 - Meio Construida',
    summary: 'Base parcialmente erguida, com estruturas funcionais ainda abertas e andaimes.',
  },
  {
    key: 'fase3_completa',
    label: 'Fase 3 - Completa',
    summary: 'Base consolidada, protegida e pronta para ser usada como ponto seguro do bioma.',
  },
] as const

const baseUpgradeBiomeSpecs = [
  {
    baseId: 'base_planicie_nascente',
    biomeId: 'planicie_floresta_inicial',
    biome: 'Planicie / Floresta Inicial',
    name: 'Base da Nascente',
    summary: 'Abrigo verde perto de agua limpa, madeira e rotas iniciais da planicie.',
  },
  {
    baseId: 'base_praia_ancora',
    biomeId: 'praia_litoral_oceano',
    biome: 'Praia / Litoral / Oceano',
    name: 'Base da Ancora',
    summary: 'Refugio costeiro feito de madeira de naufragio, docas e controle de mare.',
  },
  {
    baseId: 'base_montanha_refugio',
    biomeId: 'montanhas_vazio_sereno',
    biome: 'Montanhas do Vazio Sereno',
    name: 'Base do Refugio Alto',
    summary: 'Refugio de altitude com pedra, vento, cristais e disciplina de montanha.',
  },
  {
    baseId: 'base_floresta_seiva',
    biomeId: 'floresta_mistica',
    biome: 'Floresta Mistica',
    name: 'Base da Seiva',
    summary: 'Santuario organico vivo entre raizes, cogumelos e FUSHI natural.',
  },
  {
    baseId: 'base_vulcao_obsidiana',
    biomeId: 'vulcao_terras_cinzentas',
    biome: 'Vulcao / Terras Cinzentas',
    name: 'Base de Obsidiana',
    summary: 'Posto de obsidiana em cinzas, calor e fendas de lava controladas.',
  },
  {
    baseId: 'base_gelo_abrigo',
    biomeId: 'regiao_congelada_neve',
    biome: 'Regiao Congelada / Neve',
    name: 'Base do Abrigo Branco',
    summary: 'Abrigo termico entre neve, gelo azul e sobrevivencia de frio extremo.',
  },
  {
    baseId: 'base_ruinas_memorial',
    biomeId: 'ruinas_antigas',
    biome: 'Ruinas Antigas',
    name: 'Base Memorial',
    summary: 'Base de memoria e contencao entre pedra antiga, reliquias e selos.',
  },
  {
    baseId: 'base_veu_esconderijo',
    biomeId: 'vale_cinzento_veu',
    biome: 'Vale Cinzento / Rotas do Veu',
    name: 'Base do Esconderijo Cinza',
    summary: 'Esconderijo tatico camuflado em nevoa, ruinas baixas e rotas discretas.',
  },
] as const

function getBaseUpgradeMapImagePath(baseId: string, phaseKey: string) {
  return `/assets/maps/base-upgrades/${baseId}/${baseId}_${phaseKey}_topdown.png`
}
function getBaseUpgradeMapThumbPath(baseId: string, phaseKey: string) {
  return `/assets/maps/base-upgrades/${baseId}/${baseId}_${phaseKey}_topdown_thumb_640.jpg`
}

function getBasePhaseArrivalImagePath(baseId: string, phaseKey = 'fase1_construcao') {
  if (phaseKey === 'fase1_construcao') {
    return `/assets/maps/base-upgrades/${baseId}/${baseId}_arrival_empty.png`
  }

  return `/assets/maps/base-upgrades/${baseId}/${baseId}_${phaseKey}_arrival.png`
}

function getBasePhaseArrivalThumbPath(baseId: string, phaseKey = 'fase1_construcao') {
  if (phaseKey === 'fase1_construcao') {
    return `/assets/maps/base-upgrades/${baseId}/${baseId}_arrival_empty_thumb_640.jpg`
  }

  return `/assets/maps/base-upgrades/${baseId}/${baseId}_${phaseKey}_arrival_thumb_640.jpg`
}

function getBaseArrivalTransitionId(baseId: string) {
  return `transicao_chegada_${baseId}`
}

function getBasePhaseArrivalTransitionId(baseId: string, phaseKey = 'fase1_construcao') {
  if (phaseKey === 'fase1_construcao') {
    return getBaseArrivalTransitionId(baseId)
  }

  return `transicao_chegada_${baseId}_${phaseKey}`
}

const baseUpgradeTopdownMaps: TabletopMap[] = baseUpgradeBiomeSpecs.flatMap((base) =>
  baseUpgradePhaseSpecs.map((phase, index) => {
    const image = getBaseUpgradeMapImagePath(base.baseId, phase.key)
    const previewImage = getBaseUpgradeMapThumbPath(base.baseId, phase.key)

    return {
      id: `${base.baseId}_${phase.key}_topdown`,
      biomeId: base.biomeId,
      folderId: 'virtual:maps:bases',
      munLocationId: base.baseId,
      name: `${base.name} - ${phase.label}`,
      type: 'base' as const,
      mapVisibility: 'mestre_apenas' as const,
      image,
      imageUrl: image,
      previewImage,
      thumbnailUrl: previewImage,
      biome: base.biome,
      summary: `${phase.summary} ${base.summary}`,
      transitions: [getBasePhaseArrivalTransitionId(base.baseId, phase.key)],
      stageWidth: 4000,
      stageHeight: 4000,
      gridColumns: 30,
      gridRows: 30,
      cellSize: 4000 / 30,
      defaultCamera: {
        zoom: index === 0 ? 0.48 : 0.44,
      },
    }
  }),
)

const baseArrivalTransitions: TabletopTransitionAsset[] = baseUpgradeBiomeSpecs.flatMap((base) =>
  baseUpgradePhaseSpecs.map((phase) => {
    const image = getBasePhaseArrivalImagePath(base.baseId, phase.key)
    const thumbnail = getBasePhaseArrivalThumbPath(base.baseId, phase.key)
    const phaseLead =
      phase.key === 'fase1_construcao'
        ? 'Chegada'
        : phase.key === 'fase2_meio_construida'
          ? 'Avanco'
          : 'Base completa'

    return {
      id: getBasePhaseArrivalTransitionId(base.baseId, phase.key),
      biomeId: base.biomeId,
      category: 'Bases',
      folderId: 'virtual:transitions:bases',
      toMapId: `${base.baseId}_${phase.key}_topdown`,
      name: `${phaseLead}: ${base.name}`,
      summary: `Interludio de ${phase.label.toLowerCase()} da ${base.name}.`,
      type: 'image',
      assetUrl: image,
      thumbnailUrl: thumbnail,
      description:
        phase.key === 'fase1_construcao'
          ? 'Cena frontal para narrar o grupo encontrando uma area plana e promissora antes de iniciar a construcao da base.'
          : `Cena frontal para narrar a ${phase.label.toLowerCase()} da base antes de abrir o topdown correspondente.`,
    }
  }),
)

const caveMap: TabletopMap = {
  id: 'planicie_caverna_nascimento',
  biomeId: 'planicie',
  name: 'Caverna do Despertar',
  type: 'interior',
  image: planicieCavernaMapPath,
  imageUrl: planicieCavernaMapPath,
  previewImage: planicieCavernaMapPath,
  thumbnailUrl: planicieCavernaMapPath,
  biome: 'Planicie Inicial',
  summary:
    'Primeiro mapa da sessao. Exploracao curta do corpo compartilhado e leitura do espaco antes da saida.',
  stageWidth: 2160,
  stageHeight: 1728,
  gridColumns: 20,
  gridRows: 16,
  cellSize: 108,
  defaultCamera: {
    zoom: 0.92,
  },
}

const plainMap: TabletopMap = {
  id: 'planicie_livre',
  biomeId: 'planicie',
  name: 'Planicie Aberta',
  type: 'livre',
  image: planicieAbertaMapPath,
  imageUrl: planicieAbertaMapPath,
  previewImage: planicieAbertaMapPath,
  thumbnailUrl: planicieAbertaMapPath,
  biome: 'Planicie Inicial',
  summary:
    'Mapa aberto da sessao 01 para tutorial de movimento, percepcao e leitura de rota.',
  stageWidth: 3136,
  stageHeight: 2240,
  gridColumns: 28,
  gridRows: 20,
  cellSize: 112,
  defaultCamera: {
    zoom: 0.8,
  },
}

const survivalMap: TabletopMap = {
  id: 'planicie_evento_sobrevivencia',
  biomeId: 'planicie',
  name: 'Trilha de Sobrevivencia',
  type: 'evento',
  image: trilhaSobrevivenciaMapPath,
  imageUrl: trilhaSobrevivenciaMapPath,
  previewImage: trilhaSobrevivenciaMapPath,
  thumbnailUrl: trilhaSobrevivenciaMapPath,
  biome: 'Planicie Inicial',
  summary:
    'Evento tutorial com lobos da planicie para validar movimento, ataque, defesa e dano.',
  stageWidth: 2496,
  stageHeight: 1872,
  gridColumns: 24,
  gridRows: 18,
  cellSize: 104,
  defaultCamera: {
    zoom: 0.84,
  },
}

const villageApproachMap: TabletopMap = {
  id: 'planicie_base_proxima',
  biomeId: 'planicie',
  name: 'Regiao Proxima da Vila',
  type: 'base',
  image: regiaoVilaMapPath,
  imageUrl: regiaoVilaMapPath,
  previewImage: regiaoVilaMapPath,
  thumbnailUrl: regiaoVilaMapPath,
  biome: 'Planicie Inicial',
  summary:
    'Mapa final da primeira sessao, usado como encerramento ou gancho imediato.',
  stageWidth: 2808,
  stageHeight: 1944,
  gridColumns: 26,
  gridRows: 18,
  cellSize: 108,
  defaultCamera: {
    zoom: 0.52,
  },
}

const planicieVillageTopdownMaps: TabletopMap[] = [
  {
    id: 'planicie_caverna_primeiro_corpo_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'caverna_primeiro_corpo',
    name: 'Caverna do Primeiro Corpo',
    type: 'interior' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaCavernaPrimeiroCorpoTopdownPath,
    imageUrl: vilaCavernaPrimeiroCorpoTopdownPath,
    previewImage: vilaCavernaPrimeiroCorpoTopdownThumbPath,
    thumbnailUrl: vilaCavernaPrimeiroCorpoTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Interior organico onde o corpo compartilhado desperta e precisa abrir a saida bloqueada.',
  },
  {
    id: 'planicie_clareira_lobos_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'clareira_lobos',
    name: 'Clareira dos Lobos',
    type: 'evento' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaClareiraLobosTopdownPath,
    imageUrl: vilaClareiraLobosTopdownPath,
    previewImage: vilaClareiraLobosTopdownThumbPath,
    thumbnailUrl: vilaClareiraLobosTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Clareira externa para o primeiro combate tutorial contra lobos e leitura de emboscada.',
  },
  {
    id: 'planicie_armazem_comunitario_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'armazem_comunitario',
    name: 'Armazem Comunitario',
    type: 'interior' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaArmazemComunitarioTopdownPath,
    imageUrl: vilaArmazemComunitarioTopdownPath,
    previewImage: vilaArmazemComunitarioTopdownThumbPath,
    thumbnailUrl: vilaArmazemComunitarioTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Interior de escambo e suprimentos da vila, com corredores claros e area de negociacao.',
  },
  {
    id: 'planicie_campo_treino_vila_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'campo_treino_vila',
    name: 'Campo de Treino da Vila',
    type: 'evento' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaCampoTreinoTopdownPath,
    imageUrl: vilaCampoTreinoTopdownPath,
    previewImage: vilaCampoTreinoTopdownThumbPath,
    thumbnailUrl: vilaCampoTreinoTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Campo de treino com bonecos, obstaculos e espacos para evolucao inicial dos protagonistas.',
  },
  {
    id: 'planicie_vila_conhecimento_absorvido_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'vila_conhecimento_absorvido',
    name: 'Vila do Conhecimento Absorvido',
    type: 'base' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaPlanicieTopdownPath,
    imageUrl: vilaPlanicieTopdownPath,
    previewImage: vilaPlanicieTopdownThumbPath,
    thumbnailUrl: vilaPlanicieTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Hub seguro inicial com cabanas abertas, praca, trilhas e pontos sociais para os personagens.',
  },
  {
    id: 'planicie_bosque_baixo_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'bosque_baixo',
    name: 'Bosque Baixo',
    type: 'livre' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaBosqueBaixoTopdownPath,
    imageUrl: vilaBosqueBaixoTopdownPath,
    previewImage: vilaBosqueBaixoTopdownThumbPath,
    thumbnailUrl: vilaBosqueBaixoTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Mapa grande de bifurcacao para Montanha ou Floresta Mistica, com desafios de trilha e terreno.',
  },
  {
    id: 'planicie_riacho_claro_topdown',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'riacho_claro',
    name: 'Riacho Claro',
    type: 'livre' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaRiachoClaroTopdownPath,
    imageUrl: vilaRiachoClaroTopdownPath,
    previewImage: vilaRiachoClaroTopdownThumbPath,
    thumbnailUrl: vilaRiachoClaroTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Mapa grande de bifurcacao para Floresta Mistica ou Praia, com correnteza, pedras e vinhas.',
  },
  {
    id: 'planicie_m5_s1_riacho_claro_nilo_liora',
    biomeId: 'planicie_floresta_inicial',
    munLocationId: 'riacho_claro_nilo_liora',
    name: 'M5-S1 - Riacho Claro: Nilo e Liora',
    type: 'evento' as const,
    mapVisibility: 'mestre_apenas' as const,
    image: vilaRiachoClaroNiloLioraTopdownPath,
    imageUrl: vilaRiachoClaroNiloLioraTopdownPath,
    previewImage: vilaRiachoClaroNiloLioraTopdownThumbPath,
    thumbnailUrl: vilaRiachoClaroNiloLioraTopdownThumbPath,
    biome: 'Planicie / Floresta Inicial',
    summary:
      'Submapa emocional do Riacho Claro com a plataforma secreta de Nilo, Liora e a Caixinha de Ontem.',
  },
].map((map) => ({
  ...map,
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  source: 'manual',
  stageHeight: 4000,
  stageWidth: 4000,
}))

const veilObservationTowerExteriorMap: TabletopMap = {
  id: 'veu_torre_observacao_exterior',
  biomeId: 'vale_cinzento_veu',
  munLocationId: 'torre_observacao',
  name: 'Torre de Observacao - Chegada',
  type: 'base',
  mapVisibility: 'mestre_apenas',
  image: veuTorreObservacaoExteriorMapPath,
  imageUrl: veuTorreObservacaoExteriorMapPath,
  previewImage: veuTorreObservacaoExteriorThumbPath,
  thumbnailUrl: veuTorreObservacaoExteriorThumbPath,
  biome: 'Vale Cinzento / Veu Cinza',
  summary:
    'Mapa tatico externo da chegada na Torre de Observacao, com a torre como objetivo central.',
  stageWidth: 4000,
  stageHeight: 4000,
  gridColumns: 30,
  gridRows: 30,
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
}

const veilObservationTowerRoofMap: TabletopMap = {
  id: 'veu_torre_observacao_topo',
  biomeId: 'vale_cinzento_veu',
  munLocationId: 'torre_observacao',
  name: 'Torre de Observacao - Topo',
  type: 'evento',
  mapVisibility: 'mestre_apenas',
  image: veuTorreObservacaoTopoMapPath,
  imageUrl: veuTorreObservacaoTopoMapPath,
  previewImage: veuTorreObservacaoTopoThumbPath,
  thumbnailUrl: veuTorreObservacaoTopoThumbPath,
  biome: 'Vale Cinzento / Veu Cinza',
  summary:
    'Plataforma superior da torre, centrada no telescopio gigante e nos mecanismos de observacao.',
  stageWidth: 4000,
  stageHeight: 4000,
  gridColumns: 30,
  gridRows: 30,
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
}

const veilCampExteriorMap: TabletopMap = {
  id: 'veu_acampamento_veu_exterior_topdown',
  biomeId: 'vale_cinzento_veu',
  munLocationId: 'acampamento_veu',
  name: 'Acampamento do Veu - Exterior',
  type: 'base',
  mapVisibility: 'mestre_apenas',
  image: veuAcampamentoExteriorMapPath,
  imageUrl: veuAcampamentoExteriorMapPath,
  previewImage: veuAcampamentoExteriorThumbPath,
  thumbnailUrl: veuAcampamentoExteriorThumbPath,
  biome: 'Vale Cinzento / Veu Cinza',
  summary:
    'Base circular da Ordem do Veu Cinza, com estrada central, casas pequenas e edificio principal de comando.',
  stageWidth: 4000,
  stageHeight: 4000,
  gridColumns: 30,
  gridRows: 30,
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
}

const veilCampInteriorMap: TabletopMap = {
  id: 'veu_acampamento_veu_base_interior_topdown',
  biomeId: 'vale_cinzento_veu',
  munLocationId: 'acampamento_veu',
  name: 'Acampamento do Veu - Interior da Base',
  type: 'interior',
  mapVisibility: 'mestre_apenas',
  image: veuAcampamentoInteriorMapPath,
  imageUrl: veuAcampamentoInteriorMapPath,
  previewImage: veuAcampamentoInteriorThumbPath,
  thumbnailUrl: veuAcampamentoInteriorThumbPath,
  biome: 'Vale Cinzento / Veu Cinza',
  summary:
    'Interior do edificio principal da base, preparado para comando, investigacao, reunioes e quartos da celula do Veu.',
  stageWidth: 4000,
  stageHeight: 4000,
  gridColumns: 30,
  gridRows: 30,
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
}

const veilGeneratedTopdownMaps: TabletopMap[] = [
  {
    id: 'veu_saida_portao_topdown',
    munLocationId: 'saida_portao',
    name: 'Saida do Portao',
    type: 'livre' as const,
    image: '/assets/maps/veu-cinzento/exterior-grande/saida-portao/saida_portao_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/exterior-grande/saida-portao/saida_portao_topdown_thumb_640.jpg',
    summary:
      'Exterior grande de bifurcacao entre o portao das Ruinas, Floresta Mistica, Deposito Camuflado e Acampamento do Veu.',
  },
  {
    id: 'veu_ruina_segura_topdown',
    munLocationId: 'ruina_segura',
    name: 'Ruina Segura',
    type: 'evento' as const,
    image: '/assets/maps/veu-cinzento/exterior/ruina-segura/ruina_segura_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/exterior/ruina-segura/ruina_segura_topdown_thumb_640.jpg',
    summary:
      'Ruina costeira de lore e oferenda, com estatuas, banco do casal, cachoeira pequena e espaco de investigacao.',
  },
  {
    id: 'veu_deposito_camuflado_exterior_topdown',
    munLocationId: 'deposito_camuflado',
    name: 'Deposito Camuflado - Exterior',
    type: 'evento' as const,
    image:
      '/assets/maps/veu-cinzento/recurso/deposito-camuflado/deposito_camuflado_exterior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/recurso/deposito-camuflado/deposito_camuflado_exterior_topdown_thumb_640.jpg',
    summary:
      'Descida de montanha ate a caverna escondida, com rotas de stealth, atalhos perigosos e suprimentos camuflados.',
  },
  {
    id: 'veu_deposito_camuflado_interior_topdown',
    munLocationId: 'deposito_camuflado',
    name: 'Deposito Camuflado - Interior',
    type: 'interior' as const,
    image:
      '/assets/maps/veu-cinzento/recurso/deposito-camuflado/interior/deposito_camuflado_interior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/recurso/deposito-camuflado/interior/deposito_camuflado_interior_topdown_thumb_640.jpg',
    summary:
      'Caverna de suprimentos e informacao do Veu, com armaria, esconderijo, camara alagada e saida de emergencia.',
  },
  {
    id: 'veu_trilha_espioes_topdown',
    munLocationId: 'trilha_espioes',
    name: 'Trilha dos Espioes',
    type: 'evento' as const,
    image: '/assets/maps/veu-cinzento/exterior/trilha-espioes/trilha_espioes_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/exterior/trilha-espioes/trilha_espioes_topdown_thumb_640.jpg',
    summary:
      'Trilha estreita em varios relevos, com cachoeiras, atalhos arriscados e nicho final para um item raro.',
  },
  {
    id: 'veu_posto_interceptacao_exterior_topdown',
    munLocationId: 'posto_interceptacao',
    name: 'Posto de Interceptacao - Exterior',
    type: 'base' as const,
    image:
      '/assets/maps/veu-cinzento/base-faccao/posto-interceptacao/posto_interceptacao_exterior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/base-faccao/posto-interceptacao/posto_interceptacao_exterior_topdown_thumb_640.jpg',
    summary:
      'Forte costeiro com perimetro de espinhos, entrada principal, rota lateral e defesa em camadas.',
  },
  {
    id: 'veu_posto_interceptacao_bunker_interior_topdown',
    munLocationId: 'posto_interceptacao',
    name: 'Posto de Interceptacao - Interior do Bunker',
    type: 'interior' as const,
    image:
      '/assets/maps/veu-cinzento/base-faccao/posto-interceptacao/interior/posto_interceptacao_bunker_interior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/base-faccao/posto-interceptacao/interior/posto_interceptacao_bunker_interior_topdown_thumb_640.jpg',
    summary:
      'Interior perigoso do bunker, com paiol explosivo, corredores estreitos, armaria e sala de comando.',
  },
  {
    id: 'veu_grande_lago_topdown',
    munLocationId: 'grande_lago',
    name: 'Grande Lago',
    type: 'livre' as const,
    image: '/assets/maps/veu-cinzento/exterior-grande/grande-lago/grande_lago_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/veu-cinzento/exterior-grande/grande-lago/grande_lago_topdown_thumb_640.jpg',
    summary:
      'Exterior grande de travessia e bifurcacao, com lago, correnteza forte, pedras de salto, caiaque e cachoeira.',
  },
].map((map) => ({
  ...map,
  biome: 'Vale Cinzento / Veu Cinza',
  biomeId: 'vale_cinzento_veu',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  imageUrl: map.image,
  mapVisibility: 'mestre_apenas' as const,
  previewImage: map.thumbnailUrl ?? map.image,
  source: 'manual' as const,
  stageHeight: 4000,
  stageWidth: 4000,
}))

const florestaMisticaTopdownMaps: TabletopMap[] = [
  {
    id: 'floresta_trilha_enraizada_topdown',
    munLocationId: 'trilha_enraizada',
    name: 'Trilha Enraizada',
    type: 'livre' as const,
    image: '/assets/maps/floresta-mistica/exterior-grande/trilha-enraizada/trilha_enraizada_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/exterior-grande/trilha-enraizada/trilha_enraizada_topdown_thumb_640.jpg',
    summary:
      'Travessia apertada por raizes entre a Floresta Mistica e o Veu Cinzento, com rota secreta para o laboratorio.',
  },
  {
    id: 'floresta_coracao_verde_topdown',
    munLocationId: 'coracao_verde',
    name: 'Coracao Verde',
    type: 'livre' as const,
    image: '/assets/maps/floresta-mistica/exterior-grande/coracao-verde/coracao_verde_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/exterior-grande/coracao-verde/coracao_verde_topdown_thumb_640.jpg',
    summary:
      'Entrada viva da arvore mae, com clareiras, raizes conscientes e energia FUSHI conectando a floresta.',
  },
  {
    id: 'floresta_arvore_fushi_vivo_interior_topdown',
    munLocationId: 'arvore_fushi_vivo',
    name: 'Arvore de FUSHI Vivo - Interior',
    type: 'dungeon' as const,
    image:
      '/assets/maps/floresta-mistica/interior/arvore-fushi-vivo/arvore_fushi_vivo_interior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/interior/arvore-fushi-vivo/arvore_fushi_vivo_interior_topdown_thumb_640.jpg',
    summary:
      'Interior boss da arvore mistica, com nucleo cristalino esmeralda, veias de raiz e defesas vivas do bioma.',
  },
  {
    id: 'floresta_laboratorio_abandonado_exterior_topdown',
    munLocationId: 'laboratorio_abandonado',
    name: 'Laboratorio Abandonado - Exterior',
    type: 'evento' as const,
    image:
      '/assets/maps/floresta-mistica/exterior/laboratorio-abandonado/laboratorio_abandonado_exterior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/exterior/laboratorio-abandonado/laboratorio_abandonado_exterior_topdown_thumb_640.jpg',
    summary:
      'Exterior escondido do laboratorio humano antigo, coberto por vegetacao e acessado por passagem secreta.',
  },
  {
    id: 'floresta_laboratorio_abandonado_interior_topdown',
    munLocationId: 'laboratorio_abandonado',
    name: 'Laboratorio Abandonado - Interior',
    type: 'interior' as const,
    image:
      '/assets/maps/floresta-mistica/interior/laboratorio-abandonado/laboratorio_abandonado_interior_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/interior/laboratorio-abandonado/laboratorio_abandonado_interior_topdown_thumb_640.jpg',
    summary:
      'Interior de lore com equipamentos antigos, salas tomadas por raizes e saida secreta continuando para a clareira.',
  },
  {
    id: 'floresta_clareira_animais_topdown',
    munLocationId: 'clareira_animais',
    name: 'Clareira dos Animais',
    type: 'evento' as const,
    image: '/assets/maps/floresta-mistica/exterior/clareira-animais/clareira_animais_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/exterior/clareira-animais/clareira_animais_topdown_thumb_640.jpg',
    summary:
      'Clareira com aviao caido, frutas FUSHI, trilhas de animais e area territorial do urso FUSHI.',
  },
  {
    id: 'floresta_lago_espelhado_topdown',
    munLocationId: 'lago_espelhado',
    name: 'Lago Espelhado',
    type: 'evento' as const,
    image: '/assets/maps/floresta-mistica/exterior/lago-espelhado/lago_espelhado_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/exterior/lago-espelhado/lago_espelhado_topdown_thumb_640.jpg',
    summary:
      'Arena alucinogena abaixo das cachoeiras, com lago refletivo, cogumelos, nevoa e ilhas de posicionamento.',
  },
  {
    id: 'floresta_arvore_bebe_topdown',
    munLocationId: 'arvore_bebe',
    name: 'Arvore Bebe',
    type: 'livre' as const,
    image: '/assets/maps/floresta-mistica/exterior-grande/arvore-bebe/arvore_bebe_topdown_4000.png',
    thumbnailUrl:
      '/assets/maps/floresta-mistica/exterior-grande/arvore-bebe/arvore_bebe_topdown_thumb_640.jpg',
    summary:
      'Bifurcacao para Coracao Verde, Lago Espelhado, Veu Cinzento e Praia, protegida por arvores rosadas.',
  },
].map((map) => ({
  ...map,
  biome: 'Floresta Mistica',
  biomeId: 'floresta_mistica',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  imageUrl: map.image,
  mapVisibility: 'mestre_apenas' as const,
  previewImage: map.thumbnailUrl ?? map.image,
  source: 'manual' as const,
  stageHeight: 4000,
  stageWidth: 4000,
}))

const praiaTopdownMaps: TabletopMap[] = [
  {
    id: 'praia_naufragos_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'praia_naufragos',
    name: 'Praia dos Naufragos',
    type: 'livre' as const,
    image: praiaNaufragosTopdownPath,
    imageUrl: praiaNaufragosTopdownPath,
    previewImage: praiaNaufragosTopdownThumbPath,
    thumbnailUrl: praiaNaufragosTopdownThumbPath,
    summary:
      'Exterior grande de bifurcacao costeira para Planicie, Floresta Mistica, Veu Cinza e litoral.',
  },
  {
    id: 'praia_enseada_azul_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'enseada_azul',
    name: 'Enseada Azul',
    type: 'base' as const,
    image: enseadaAzulTopdownPath,
    imageUrl: enseadaAzulTopdownPath,
    previewImage: enseadaAzulTopdownThumbPath,
    thumbnailUrl: enseadaAzulTopdownThumbPath,
    summary:
      'Enseada escondida e acolhedora, boa para descanso, base improvisada e conflitos futuros.',
  },
  {
    id: 'praia_embarque_mare_exterior_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'embarque_faccao_mare',
    name: 'Embarque da Mare Livre - Exterior',
    type: 'base' as const,
    image: embarqueMareExteriorTopdownPath,
    imageUrl: embarqueMareExteriorTopdownPath,
    previewImage: embarqueMareExteriorTopdownThumbPath,
    thumbnailUrl: embarqueMareExteriorTopdownThumbPath,
    summary:
      'Chegada ao navio da Companhia da Mare Livre, com praia, passarela, carga e entrada para o conves.',
  },
  {
    id: 'praia_navio_mare_interior_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'embarque_faccao_mare',
    name: 'Navio da Mare Livre - Interior',
    type: 'interior' as const,
    image: navioMareInteriorTopdownPath,
    imageUrl: navioMareInteriorTopdownPath,
    previewImage: navioMareInteriorTopdownThumbPath,
    thumbnailUrl: navioMareInteriorTopdownThumbPath,
    summary:
      'Compartimentos do navio da faccao, com cozinha, enfermaria, laboratorio, cabines e area tecnica.',
  },
  {
    id: 'praia_recife_cortante_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'recife_cortante',
    name: 'Recife Cortante',
    type: 'evento' as const,
    image: recifeCortanteTopdownPath,
    imageUrl: recifeCortanteTopdownPath,
    previewImage: recifeCortanteTopdownThumbPath,
    thumbnailUrl: recifeCortanteTopdownThumbPath,
    summary:
      'Campo aquatico perigoso com rochedos afiados, correntes e uma plataforma central de recompensa.',
  },
  {
    id: 'praia_alto_mar_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'alto_mar',
    name: 'Alto Mar',
    type: 'evento' as const,
    image: altoMarTopdownPath,
    imageUrl: altoMarTopdownPath,
    previewImage: altoMarTopdownThumbPath,
    thumbnailUrl: altoMarTopdownThumbPath,
    summary:
      'Oceano aberto com brilho misterioso, redemoinhos e espaco para encontro contra criatura marinha.',
  },
  {
    id: 'praia_alto_mar_santuario_submerso_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'alto_mar',
    name: 'Alto Mar - Santuario Submerso',
    type: 'dungeon' as const,
    image: altoMarSantuarioSubmersoTopdownPath,
    imageUrl: altoMarSantuarioSubmersoTopdownPath,
    previewImage: altoMarSantuarioSubmersoTopdownThumbPath,
    thumbnailUrl: altoMarSantuarioSubmersoTopdownThumbPath,
    summary:
      'Mapa submerso sob o brilho do Alto Mar, com correntezas, cristais e objetivo raro no fundo.',
  },
  {
    id: 'praia_farol_quebrado_exterior_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'farol_quebrado',
    name: 'Farol Quebrado - Exterior',
    type: 'evento' as const,
    image: farolQuebradoExteriorTopdownPath,
    imageUrl: farolQuebradoExteriorTopdownPath,
    previewImage: farolQuebradoExteriorTopdownThumbPath,
    thumbnailUrl: farolQuebradoExteriorTopdownThumbPath,
    summary:
      'Ilhota rochosa com farol em ruinas, chegada por agua, ondas perigosas e entrada na estrutura.',
  },
  {
    id: 'praia_farol_quebrado_interior_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'farol_quebrado',
    name: 'Farol Quebrado - Interior',
    type: 'interior' as const,
    image: farolQuebradoInteriorTopdownPath,
    imageUrl: farolQuebradoInteriorTopdownPath,
    previewImage: farolQuebradoInteriorTopdownThumbPath,
    thumbnailUrl: farolQuebradoInteriorTopdownThumbPath,
    summary:
      'Interior circular do farol, com mecanismo quebrado, pistas antigas e alcapao para dungeon futura.',
  },
  {
    id: 'praia_caverna_mare_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'caverna_mare',
    name: 'Caverna da Mare',
    type: 'interior' as const,
    image: cavernaMareTopdownPath,
    imageUrl: cavernaMareTopdownPath,
    previewImage: cavernaMareTopdownThumbPath,
    thumbnailUrl: cavernaMareTopdownThumbPath,
    summary:
      'Caverna costeira inundada com cristais azuis, eco de FUSHI e poco de ressonancia no centro.',
  },
  {
    id: 'praia_costa_ossos_exterior_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'costa_ossos',
    name: 'Costa dos Ossos',
    type: 'evento' as const,
    image: costaOssosExteriorTopdownPath,
    imageUrl: costaOssosExteriorTopdownPath,
    previewImage: costaOssosExteriorTopdownThumbPath,
    thumbnailUrl: costaOssosExteriorTopdownThumbPath,
    summary:
      'Praia amaldiçoada com trilha de ossos, arena de carniceiro, naufragios e cachoeira escondida.',
  },
  {
    id: 'praia_caverna_cachoeira_ossos_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'costa_ossos',
    name: 'Costa dos Ossos - Caverna da Cachoeira',
    type: 'dungeon' as const,
    image: cavernaCachoeiraOssosTopdownPath,
    imageUrl: cavernaCachoeiraOssosTopdownPath,
    previewImage: cavernaCachoeiraOssosTopdownThumbPath,
    thumbnailUrl: cavernaCachoeiraOssosTopdownThumbPath,
    summary:
      'Dungeon atras da cachoeira, com camaras alagadas, altar de ossos, canais e recompensa secreta.',
  },
  {
    id: 'praia_estatuas_litoral_topdown',
    biomeId: 'praia_litoral_oceano',
    munLocationId: 'estatuas_litoral',
    name: 'Estatuas do Litoral',
    type: 'evento' as const,
    image: estatuasLitoralTopdownPath,
    imageUrl: estatuasLitoralTopdownPath,
    previewImage: estatuasLitoralTopdownThumbPath,
    thumbnailUrl: estatuasLitoralTopdownThumbPath,
    summary:
      'Arena costeira de puzzle, com estatuas, adagas acionaveis e espada rara selada no centro.',
  },
].map((map) => ({
  ...map,
  biome: 'Praia / Litoral / Oceano',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  mapVisibility: 'mestre_apenas',
  source: 'manual',
  stageHeight: 4000,
  stageWidth: 4000,
}))

const montanhaTopdownMaps: TabletopMap[] = [
  {
    id: 'montanha_caverna_meditacao_exterior_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'caverna_meditacao',
    name: 'Caverna de Meditacao - Chegada',
    type: 'livre' as const,
    image: montanhaCavernaMeditacaoExteriorTopdownPath,
    imageUrl: montanhaCavernaMeditacaoExteriorTopdownPath,
    previewImage: montanhaCavernaMeditacaoExteriorTopdownThumbPath,
    thumbnailUrl: montanhaCavernaMeditacaoExteriorTopdownThumbPath,
    summary:
      'Exterior grande de subida, parkour entre picos e entrada ritual da Caverna de Meditacao.',
  },
  {
    id: 'montanha_caverna_meditacao_interior_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'caverna_meditacao',
    name: 'Caverna de Meditacao - Interior',
    type: 'interior' as const,
    image: montanhaCavernaMeditacaoInteriorTopdownPath,
    imageUrl: montanhaCavernaMeditacaoInteriorTopdownPath,
    previewImage: montanhaCavernaMeditacaoInteriorTopdownThumbPath,
    thumbnailUrl: montanhaCavernaMeditacaoInteriorTopdownThumbPath,
    summary:
      'Interior sagrado com agua circular, estatua central e runas de FUSHI para meditacao.',
  },
  {
    id: 'montanha_templo_vazio_sereno_exterior_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'templo_vazio_sereno',
    name: 'Templo do Vazio Sereno - Exterior',
    type: 'base' as const,
    image: montanhaTemploVazioSerenoExteriorTopdownPath,
    imageUrl: montanhaTemploVazioSerenoExteriorTopdownPath,
    previewImage: montanhaTemploVazioSerenoExteriorTopdownThumbPath,
    thumbnailUrl: montanhaTemploVazioSerenoExteriorTopdownThumbPath,
    summary:
      'Base externa dos monges, com patios, pontes de vento e jardins de disciplina.',
  },
  {
    id: 'montanha_templo_vazio_sereno_interior_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'templo_vazio_sereno',
    name: 'Templo do Vazio Sereno - Interior',
    type: 'interior' as const,
    image: montanhaTemploVazioSerenoInteriorTopdownPath,
    imageUrl: montanhaTemploVazioSerenoInteriorTopdownPath,
    previewImage: montanhaTemploVazioSerenoInteriorTopdownThumbPath,
    thumbnailUrl: montanhaTemploVazioSerenoInteriorTopdownThumbPath,
    summary:
      'Sala principal dos monges, biblioteca, tatames e mandala de FUSHI puro.',
  },
  {
    id: 'montanha_ponte_suspensa_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'ponte_suspensa',
    name: 'Ponte Suspensa',
    type: 'evento' as const,
    image: montanhaPonteSuspensaTopdownPath,
    imageUrl: montanhaPonteSuspensaTopdownPath,
    previewImage: montanhaPonteSuspensaTopdownThumbPath,
    thumbnailUrl: montanhaPonteSuspensaTopdownThumbPath,
    summary:
      'Travessia alta com ponte quebrada, ventos violentos, plataformas de apoio e aves hostis.',
  },
  {
    id: 'montanha_poco_yin_yang_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'ponte_suspensa',
    name: 'Ponte Suspensa - Poco Yin-Yang',
    type: 'evento' as const,
    image: montanhaPocoYinYangTopdownPath,
    imageUrl: montanhaPocoYinYangTopdownPath,
    previewImage: montanhaPocoYinYangTopdownThumbPath,
    thumbnailUrl: montanhaPocoYinYangTopdownThumbPath,
    summary:
      'Area ritual alem da ponte, com estatuas gigantes, agua sagrada e despertar de poder.',
  },
  {
    id: 'montanha_pico_quatro_ventos_exterior_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'pico_quatro_ventos',
    name: 'Pico dos Quatro Ventos - Subida',
    type: 'livre' as const,
    image: montanhaPicoQuatroVentosExteriorTopdownPath,
    imageUrl: montanhaPicoQuatroVentosExteriorTopdownPath,
    previewImage: montanhaPicoQuatroVentosExteriorTopdownThumbPath,
    thumbnailUrl: montanhaPicoQuatroVentosExteriorTopdownThumbPath,
    summary:
      'Subida acima das nuvens, com correntes de vento, baixa altitude e santuario no topo.',
  },
  {
    id: 'montanha_santuario_quatro_ventos_interior_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'pico_quatro_ventos',
    name: 'Pico dos Quatro Ventos - Santuario',
    type: 'interior' as const,
    image: montanhaSantuarioQuatroVentosInteriorTopdownPath,
    imageUrl: montanhaSantuarioQuatroVentosInteriorTopdownPath,
    previewImage: montanhaSantuarioQuatroVentosInteriorTopdownThumbPath,
    thumbnailUrl: montanhaSantuarioQuatroVentosInteriorTopdownThumbPath,
    summary:
      'Pequeno santuario acima das nuvens, com altar de vento e agua, pergaminhos e sacada aberta.',
  },
  {
    id: 'montanha_arena_natural_pedra_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'arena_natural_pedra',
    name: 'Arena Natural de Pedra',
    type: 'evento' as const,
    image: montanhaArenaNaturalPedraTopdownPath,
    imageUrl: montanhaArenaNaturalPedraTopdownPath,
    previewImage: montanhaArenaNaturalPedraTopdownThumbPath,
    thumbnailUrl: montanhaArenaNaturalPedraTopdownThumbPath,
    summary:
      'Arena circular de duelo com simbolo yin-yang, pilares quebrados e precipicios em volta.',
  },
  {
    id: 'montanha_saida_montanhas_topdown',
    biomeId: 'montanhas_vazio_sereno',
    munLocationId: 'saida_montanhas',
    name: 'Saida das Montanhas',
    type: 'livre' as const,
    image: montanhaSaidaMontanhasTopdownPath,
    imageUrl: montanhaSaidaMontanhasTopdownPath,
    previewImage: montanhaSaidaMontanhasTopdownThumbPath,
    thumbnailUrl: montanhaSaidaMontanhasTopdownThumbPath,
    summary:
      'Descida perigosa onde neve, cinzas e rocha rachada bifurcam para Vulcao e Gelo.',
  },
].map((map) => ({
  ...map,
  biome: 'Montanhas do Vazio Sereno',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  mapVisibility: 'mestre_apenas',
  source: 'manual',
  stageHeight: 4000,
  stageWidth: 4000,
}))

const regiaoCongeladaNeveTopdownMaps: TabletopMap[] = [
  {
    id: 'gelo_m22_vale_branco',
    munLocationId: 'vale_branco',
    name: 'M22 - Vale Branco',
    type: 'livre' as const,
    image: '/assets/maps/gelo/base/vale-branco/M22_vale_branco_topdown_4000.png',
    previewImage: '/assets/maps/gelo/base/vale-branco/M22_vale_branco_topdown_thumb_640.jpg',
    summary:
      'Vale gelado com neve, cinzas do Vulcao e bifurcacao natural para Ruinas e Vulcao.',
  },
  {
    id: 'gelo_m23_fortaleza_soterrada',
    munLocationId: 'fortaleza_soterrada',
    name: 'M23 - Fortaleza Soterrada',
    type: 'dungeon' as const,
    image:
      '/assets/maps/gelo/base/fortaleza-soterrada/M23_fortaleza_soterrada_topdown_4000.png',
    previewImage:
      '/assets/maps/gelo/base/fortaleza-soterrada/M23_fortaleza_soterrada_topdown_thumb_640.jpg',
    summary:
      'Fortaleza congelada e sem vida, com patio soterrado, muralhas quebradas e rotas de cerco.',
  },
  {
    id: 'gelo_m24_lago_congelado',
    munLocationId: 'lago_congelado',
    name: 'M24 - Lago Congelado',
    type: 'evento' as const,
    image: '/assets/maps/gelo/base/lago-congelado/M24_lago_congelado_topdown_4000.png',
    previewImage:
      '/assets/maps/gelo/base/lago-congelado/M24_lago_congelado_topdown_thumb_640.jpg',
    summary:
      'Arena circular de gelo com pista escorregadia e silhueta colossal congelada na montanha.',
  },
  {
    id: 'gelo_m25_grande_avalanche',
    munLocationId: 'grande_avalanche',
    name: 'M25 - Grande Avalanche',
    type: 'evento' as const,
    image:
      '/assets/maps/gelo/base/grande-avalanche/M25_grande_avalanche_topdown_4000.png',
    previewImage:
      '/assets/maps/gelo/base/grande-avalanche/M25_grande_avalanche_topdown_thumb_640.jpg',
    summary:
      'Encosta de fuga com trilhas de esqui, arvores carregadas de neve e zonas de avalanche.',
  },
  {
    id: 'gelo_m26_caverna_azul',
    munLocationId: 'caverna_azul',
    name: 'M26 - Caverna Azul',
    type: 'dungeon' as const,
    image: '/assets/maps/gelo/base/caverna-azul/M26_caverna_azul_topdown_4000.png',
    previewImage:
      '/assets/maps/gelo/base/caverna-azul/M26_caverna_azul_topdown_thumb_640.jpg',
    summary:
      'Caverna de gelo azul translucido, com cristais prismaticos, pontes naturais e rotas estreitas.',
  },
  {
    id: 'gelo_m27_bonecos_de_neve',
    munLocationId: 'bonecos_de_neve',
    name: 'M27 - Bonecos de Neve',
    type: 'evento' as const,
    image: '/assets/maps/gelo/base/bonecos-de-neve/M27_bonecos_de_neve_topdown_4000.png',
    previewImage:
      '/assets/maps/gelo/base/bonecos-de-neve/M27_bonecos_de_neve_topdown_thumb_640.jpg',
    summary:
      'Vale com bonecos de neve gigantes usados como marco, cobertura e pressao ambiental.',
  },
  {
    id: 'gelo_m28_santuario_sob_gelo',
    munLocationId: 'santuario_sob_gelo',
    name: 'M28 - Santuario Sob o Gelo',
    type: 'dungeon' as const,
    image:
      '/assets/maps/gelo/base/santuario-sob-gelo/M28_santuario_sob_gelo_topdown_4000.png',
    previewImage:
      '/assets/maps/gelo/base/santuario-sob-gelo/M28_santuario_sob_gelo_topdown_thumb_640.jpg',
    summary:
      'Discos de gelo sobre agua escura levando a um santuario menor com fonte brilhante de FUSHI.',
  },
].map((map) => ({
  ...map,
  biome: 'Regiao Congelada / Neve',
  biomeId: 'regiao_congelada_neve',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  imageUrl: map.image,
  mapVisibility: 'mestre_apenas',
  previewImage: map.previewImage ?? map.image,
  source: 'manual',
  stageHeight: 4000,
  stageWidth: 4000,
  thumbnailUrl: map.previewImage ?? map.image,
}))

const ruinasRyokuTopdownMaps: TabletopMap[] = [
  {
    id: 'ruinas_m29_terras_podres',
    munLocationId: 'terras_podres',
    name: 'M29 - Terras Podres',
    type: 'livre' as const,
    image: '/assets/maps/ruinas/base/terras-podres/M29_terras_podres_topdown_4000.png',
    previewImage: '/assets/maps/ruinas/base/terras-podres/M29_terras_podres_topdown_thumb_640.jpg',
    summary:
      'Transicao degradada para emboscada, rastros de Velkar e primeira corrupcao ambiental de Ryoku.',
  },
  {
    id: 'ruinas_m30_s1_portao_torre_abismo',
    munLocationId: 'torre_abismo',
    name: 'M30-S1 - Entrada da Torre do Abismo',
    type: 'evento' as const,
    image:
      '/assets/maps/ruinas/base/torre-abismo/M30-S1_portao_torre_abismo_topdown_4000.png',
    previewImage:
      '/assets/maps/ruinas/base/torre-abismo/M30-S1_portao_torre_abismo_topdown_thumb_640.jpg',
    summary:
      'Patio externo da prisao de Ryoku com portao selado, quatro chaves, canais e alavancas.',
  },
  {
    id: 'ruinas_m30_torre_abismo',
    munLocationId: 'torre_abismo',
    name: 'M30-S2 - Camara dos Fragmentos',
    type: 'dungeon' as const,
    image: '/assets/maps/ruinas/base/torre-abismo/M30_torre_abismo_topdown_4000.png',
    previewImage: '/assets/maps/ruinas/base/torre-abismo/M30_torre_abismo_topdown_thumb_640.jpg',
    summary:
      'Interior da Torre do Abismo com aneis de contencao, camara de fragmentos e pressao espiritual.',
  },
  {
    id: 'ruinas_m30_s3_corpo_petrificado_ryoku',
    munLocationId: 'torre_abismo',
    name: 'M30-S3 - Corpo Petrificado de Ryoku',
    type: 'interior' as const,
    image:
      '/assets/maps/ruinas/base/torre-abismo/M30-S3_corpo_petrificado_ryoku_topdown_4000.png',
    previewImage:
      '/assets/maps/ruinas/base/torre-abismo/M30-S3_corpo_petrificado_ryoku_topdown_thumb_640.jpg',
    summary:
      'Camara superior da prisao com Ryoku acorrentado em silhueta, dez encaixes de fragmento e selos.',
  },
  {
    id: 'ruinas_m30_s4_torre_despertando',
    munLocationId: 'torre_abismo',
    name: 'M30-S4 - Torre do Abismo Despertando',
    type: 'evento' as const,
    image:
      '/assets/maps/ruinas/base/torre-abismo/M30-S4_torre_abismo_despertando_topdown_4000.png',
    previewImage:
      '/assets/maps/ruinas/base/torre-abismo/M30-S4_torre_abismo_despertando_topdown_thumb_640.jpg',
    summary:
      'Versao de cataclisma da prisao de Ryoku, com correntes rompidas, selos quebrados e colapso.',
  },
  {
    id: 'ruinas_m31_corredor_vozes',
    munLocationId: 'corredor_vozes',
    name: 'M31 - Corredor das Vozes',
    type: 'dungeon' as const,
    image: '/assets/maps/ruinas/base/corredor-vozes/M31_corredor_vozes_topdown_4000.png',
    previewImage: '/assets/maps/ruinas/base/corredor-vozes/M31_corredor_vozes_topdown_thumb_640.jpg',
    summary:
      'Corredor de puzzle sonoro com cinco placas, portas laterais, estatuas sem boca e porta final.',
  },
  {
    id: 'ruinas_m32_altar_quebrado',
    munLocationId: 'altar_quebrado',
    name: 'M32 - Altar Quebrado',
    type: 'evento' as const,
    image: '/assets/maps/ruinas/base/altar-quebrado/M32_altar_quebrado_topdown_4000.png',
    previewImage: '/assets/maps/ruinas/base/altar-quebrado/M32_altar_quebrado_topdown_thumb_640.jpg',
    summary:
      'Altar incompleto com quatro salas de blocos, trilhos, armadilhas e encaixe ritual central.',
  },
  {
    id: 'ruinas_m33_s1_entrada_estruturas',
    munLocationId: 'estruturas_ruinas_abandonadas',
    name: 'M33-S1 - Entrada das Estruturas',
    type: 'evento' as const,
    image:
      '/assets/maps/ruinas/base/estruturas-ruinas-abandonadas/M33-S1_entrada_estruturas_topdown_4000.png',
    previewImage:
      '/assets/maps/ruinas/base/estruturas-ruinas-abandonadas/M33-S1_entrada_estruturas_topdown_thumb_640.jpg',
    summary:
      'Vestibulo externo das estruturas com portao, patio de leitura e preparacao para o parkour.',
  },
  {
    id: 'ruinas_m33_s2_parkour_forma_instavel',
    munLocationId: 'estruturas_ruinas_abandonadas',
    name: 'M33-S2 - Parkour da Forma Instavel',
    type: 'evento' as const,
    image:
      '/assets/maps/ruinas/base/estruturas-ruinas-abandonadas/M33-S2_parkour_forma_instavel_topdown_4000.png',
    previewImage:
      '/assets/maps/ruinas/base/estruturas-ruinas-abandonadas/M33-S2_parkour_forma_instavel_topdown_thumb_640.jpg',
    summary:
      'Submapa tatico de plataformas separadas por abismo para o puzzle de forma instavel.',
  },
  {
    id: 'ruinas_m34_biblioteca_morta',
    munLocationId: 'biblioteca_morta',
    name: 'M34 - Biblioteca Morta',
    type: 'interior' as const,
    image: '/assets/maps/ruinas/base/biblioteca-morta/M34_biblioteca_morta_topdown_4000.png',
    previewImage: '/assets/maps/ruinas/base/biblioteca-morta/M34_biblioteca_morta_topdown_thumb_640.jpg',
    summary:
      'Biblioteca de puzzle por cores, mesa central, quatro alas, mezanino e porta selada.',
  },
  {
    id: 'ruinas_m35_portao_sem_nome',
    munLocationId: 'portao_sem_nome',
    name: 'M35 - Portao Sem Nome',
    type: 'evento' as const,
    image: '/assets/maps/ruinas/base/portao-sem-nome/M35_portao_sem_nome_topdown_4000.png',
    previewImage: '/assets/maps/ruinas/base/portao-sem-nome/M35_portao_sem_nome_topdown_thumb_640.jpg',
    summary:
      'Passagem fortificada entre biomas, com gargalo tatico, portao ritual e cobertura nas laterais.',
  },
].map((map) => ({
  ...map,
  biome: 'Ruinas Antigas / Ryoku',
  biomeId: 'ruinas_antigas_ryoku',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  imageUrl: map.image,
  mapVisibility: 'mestre_apenas',
  previewImage: map.previewImage ?? map.image,
  source: 'manual',
  stageHeight: 4000,
  stageWidth: 4000,
  thumbnailUrl: map.previewImage ?? map.image,
}))

const vulcaoTerrasCinzentasTopdownMaps: TabletopMap[] = [
  {
    id: 'vulcao_m13_entrada',
    munLocationId: 'vulcao_entrada',
    name: 'M13 - Entrada do Vulcao',
    type: 'livre' as const,
    image: '/assets/maps/vulcao/base/vulcao-entrada/M13_vulcao_entrada_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/vulcao-entrada/M13_vulcao_entrada_topdown_thumb_640.jpg',
    summary:
      'Bifurcacao tensa entre Gelo, Ruinas, Montanha e nucleo do Vulcao, com cinzas e obsidiana.',
  },
  {
    id: 'vulcao_m14_campo_cinzas',
    munLocationId: 'campo_cinzas',
    name: 'M14 - Campo de Cinzas',
    type: 'livre' as const,
    image: '/assets/maps/vulcao/base/campo-cinzas/M14_campo_cinzas_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/campo-cinzas/M14_campo_cinzas_topdown_thumb_640.jpg',
    summary:
      'Nucleo paradoxal com orbe central, seis estatuas guardias e circulo de contencao.',
  },
  {
    id: 'vulcao_m14_s1_nucleo_rachado',
    munLocationId: 'campo_cinzas',
    name: 'M14-S1 - Nucleo Paradoxal Rachado',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/campo-cinzas/M14-S1_nucleo_rachado_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/campo-cinzas/M14-S1_nucleo_rachado_topdown_thumb_640.jpg',
    summary:
      'Variante de cataclisma do Campo de Cinzas com orbe rachado e brilho parcial dos guardioes.',
  },
  {
    id: 'vulcao_m14_s2_nucleo_desperto',
    munLocationId: 'campo_cinzas',
    name: 'M14-S2 - Nucleo Paradoxal Desperto',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/campo-cinzas/M14-S2_nucleo_desperto_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/campo-cinzas/M14-S2_nucleo_desperto_topdown_thumb_640.jpg',
    summary:
      'Variante de cataclisma com o orbe exposto, runas colapsando e energia do Dragao FUSHI.',
  },
  {
    id: 'vulcao_m15_rio_escuridao',
    munLocationId: 'rio_da_escuridao',
    name: 'M15 - Rio da Escuridao',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/rio-da-escuridao/M15_rio_da_escuridao_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/rio-da-escuridao/M15_rio_da_escuridao_topdown_thumb_640.jpg',
    summary:
      'Mapa de Morghast com rio sombrio, corrente viva, tres ancoras e travessias quebradas.',
  },
  {
    id: 'vulcao_m15_s1_corrida_abismo',
    munLocationId: 'rio_da_escuridao',
    name: 'M15-S1 - Corrida do Abismo',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/rio-da-escuridao/M15-S1_corrida_abismo_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/rio-da-escuridao/M15-S1_corrida_abismo_topdown_thumb_640.jpg',
    summary:
      'Fase de travessia contra o corredor colapsando, sombras perseguindo e rotas quebradas.',
  },
  {
    id: 'vulcao_m15_s2_nucleo_sombras',
    munLocationId: 'rio_da_escuridao',
    name: 'M15-S2 - Nucleo das Sombras',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/rio-da-escuridao/M15-S2_nucleo_sombras_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/rio-da-escuridao/M15-S2_nucleo_sombras_topdown_thumb_640.jpg',
    summary:
      'Arena direta de Morghast com nucleo sombrio, aneis de sombra, cobertura e neblina preta.',
  },
  {
    id: 'vulcao_m15_s3_takedown_mar_infinito',
    munLocationId: 'rio_da_escuridao',
    name: 'M15-S3 - Takedown: Mar Infinito',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/rio-da-escuridao/M15-S3_takedown_mar_infinito_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/rio-da-escuridao/M15-S3_takedown_mar_infinito_topdown_thumb_640.jpg',
    summary:
      'Fase final de Morghast com mar vivo de sombras, ilhas seguras e nucleo central atacavel.',
  },
  {
    id: 'vulcao_m16_s1_sala_estatuas_xadrez',
    munLocationId: 'vulcao_abandonado',
    name: 'M16-S1 - Sala das Estatuas e Tabuleiro',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/vulcao-abandonado/M16-S1_sala_estatuas_xadrez_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/vulcao-abandonado/M16-S1_sala_estatuas_xadrez_topdown_thumb_640.jpg',
    summary:
      'Arena inicial de Euryaleth com jardim petrificado, tabuleiro central e pecas de xadrez como cobertura.',
  },
  {
    id: 'vulcao_m16_s2_olhar_estagnacao',
    munLocationId: 'vulcao_abandonado',
    name: 'M16-S2 - Olhar da Estagnacao',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/vulcao-abandonado/M16-S2_olhar_estagnacao_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/vulcao-abandonado/M16-S2_olhar_estagnacao_topdown_thumb_640.jpg',
    summary:
      'Variante de Euryaleth com o tabuleiro reagindo, serpentes e petrificacao se espalhando pelo salao.',
  },
  {
    id: 'vulcao_m16_s3_escadaria_espiral_aberta',
    munLocationId: 'vulcao_abandonado',
    name: 'M16-S3 - Escadaria Espiral Aberta',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/vulcao-abandonado/M16-S3_escadaria_espiral_aberta_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/vulcao-abandonado/M16-S3_escadaria_espiral_aberta_topdown_thumb_640.jpg',
    summary:
      'Estado final de Euryaleth com o centro aberto, escadaria espiral e pressao da cabeca viva.',
  },
  {
    id: 'vulcao_m17_labirinto_quente_vorashk',
    munLocationId: 'labirinto_quente',
    name: 'M17 - Labirinto Quente / Vorashk',
    type: 'dungeon' as const,
    image: '/assets/maps/vulcao/base/labirinto-quente/M17_labirinto_quente_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/labirinto-quente/M17_labirinto_quente_topdown_thumb_640.jpg',
    summary:
      'Labirinto vivo com dez baus, quatro selos corretos, calor, cacada e arena revelavel.',
  },
  {
    id: 'vulcao_m17_s1_arena_vorashk_sem_muros',
    munLocationId: 'labirinto_quente',
    name: 'M17-S1 - Arena de Vorashk sem Muros',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/labirinto-quente/M17-S1_arena_vorashk_sem_muros_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/labirinto-quente/M17-S1_arena_vorashk_sem_muros_topdown_thumb_640.jpg',
    summary:
      'Arena revelada apos os quatro baus corretos, com muros do labirinto caidos e Vorashk exposto.',
  },
  {
    id: 'vulcao_m18_boca_inferno_aeronyx',
    munLocationId: 'boca_inferno',
    name: 'M18-S2 - Boca do Inferno / Arena de Aeronyx',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/boca-inferno/M18_boca_inferno_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/boca-inferno/M18_boca_inferno_topdown_thumb_640.jpg',
    summary:
      'Arena no topo do Vulcao para Aeronyx, com lava extrema, plataformas instaveis, quedas e dominio aereo.',
  },
  {
    id: 'vulcao_m18_s1_escadaria_erupcao',
    munLocationId: 'boca_inferno',
    name: 'M18-S1 - Subida da Boca do Inferno',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/escadaria-erupcao/M18-S1_escadaria_vulcao_erupcao_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/escadaria-erupcao/M18-S1_escadaria_vulcao_erupcao_topdown_thumb_640.jpg',
    summary:
      'Primeiro estado de M18: parkour por rochas e plataformas suspensas sobre lava para alcancar o topo.',
  },
  {
    id: 'vulcao_m18_s3_chuva_obsidiana',
    munLocationId: 'boca_inferno',
    name: 'M18-S3 - Chuva e Obsidiana',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/boca-inferno/M18-S3_chuva_obsidiana_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/boca-inferno/M18-S3_chuva_obsidiana_topdown_thumb_640.jpg',
    summary:
      'Estado final de Aeronyx com chuva intensa, lava resfriando em obsidiana e arena ruindo.',
  },
  {
    id: 'vulcao_m19_mar_inquieto_thalzhyr',
    munLocationId: 'mar_inquieto',
    name: "M19-S1 - Costa Tempestuosa / Preparacao do Navio",
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/mar-inquieto/M19_mar_inquieto_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/mar-inquieto/M19_mar_inquieto_topdown_thumb_640.jpg',
    summary:
      'Costa sob tempestade para construir/preparar o navio antes do confronto de Thal Zhyr em alto-mar.',
  },
  {
    id: 'vulcao_m19_s2_alto_mar_tempestade',
    munLocationId: 'mar_inquieto',
    name: 'M19-S2 - Alto Mar / Tempestade',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/mar-inquieto/M19-S2_alto_mar_tempestade_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/mar-inquieto/M19-S2_alto_mar_tempestade_topdown_thumb_640.jpg',
    summary:
      'Mapa de alto-mar com navio danificado, ondas gigantes, destrocos e vortices antes da Hidra emergir.',
  },
  {
    id: 'vulcao_m19_s3_hidra_thalzhyr',
    munLocationId: 'mar_inquieto',
    name: "M19-S3 - Hidra no Mar Aberto / Thal'Zhyr",
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/mar-inquieto/M19-S3_hidra_thalzhyr_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/mar-inquieto/M19-S3_hidra_thalzhyr_topdown_thumb_640.jpg',
    summary:
      'Arena principal em mar aberto com destrocos, ondas, vortices e presenca da Hidra cercando o grupo.',
  },
  {
    id: 'vulcao_m19_s4_mar_colapsando_costa',
    munLocationId: 'mar_inquieto',
    name: 'M19-S4 - Mar Colapsando ate a Costa',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/mar-inquieto/M19-S4_mar_colapsando_costa_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/mar-inquieto/M19-S4_mar_colapsando_costa_topdown_thumb_640.jpg',
    summary:
      'Fase de sobrevivencia com destrocos, faixas de onda e rota de fuga pelo mar em colapso.',
  },
  {
    id: 'vulcao_m20_transcendente_astrael',
    munLocationId: 'transcendente',
    name: 'M20 - Transcendente / Astrael',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/transcendente/M20_transcendente_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/transcendente/M20_transcendente_topdown_thumb_640.jpg',
    summary:
      'Dimensao de Astrael com plataformas orbitais, altar central, pilares vorpais e portais.',
  },
  {
    id: 'vulcao_m20_s1_observatorio_selo',
    munLocationId: 'transcendente',
    name: 'M20-S1 - Observatorio do Selo',
    type: 'evento' as const,
    image:
      '/assets/maps/vulcao/base/transcendente/M20-S1_observatorio_selo_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/transcendente/M20-S1_observatorio_selo_topdown_thumb_640.jpg',
    summary:
      'Fase 1 de Astrael com arena estavel, altar central e distorcoes espaciais controladas.',
  },
  {
    id: 'vulcao_m20_s2_seis_orbitas',
    munLocationId: 'transcendente',
    name: 'M20-S2 - Seis Orbitas do Vulcao',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/transcendente/M20-S2_seis_orbitas_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/transcendente/M20-S2_seis_orbitas_topdown_thumb_640.jpg',
    summary:
      'Fase 2 de Astrael com seis plataformas orbitais, gravidade instavel e vazios entre rotas.',
  },
  {
    id: 'vulcao_m20_s3_ciclo_vorpal',
    munLocationId: 'transcendente',
    name: 'M20-S3 - Ciclo Vorpal',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/transcendente/M20-S3_ciclo_vorpal_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/transcendente/M20-S3_ciclo_vorpal_topdown_thumb_640.jpg',
    summary:
      'Fase 3 de Astrael com tres pilares vorpais, horizonte de evento e linhas de atracao.',
  },
  {
    id: 'vulcao_m20_s4_colapso_selo',
    munLocationId: 'transcendente',
    name: 'M20-S4 - Colapso do Ultimo Selo',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/transcendente/M20-S4_colapso_selo_topdown_4000.png',
    previewImage:
      '/assets/maps/vulcao/base/transcendente/M20-S4_colapso_selo_topdown_thumb_640.jpg',
    summary:
      'Fase 4 de Astrael com dimensao desabando, portais, nucleo exposto e decisao final do selo.',
  },
  {
    id: 'vulcao_m21_deus_dragao',
    munLocationId: 'deus_dragao',
    name: 'M21 - Deus Dragao',
    type: 'evento' as const,
    image: '/assets/maps/vulcao/base/deus-dragao/M21_deus_dragao_topdown_4000.png',
    previewImage: '/assets/maps/vulcao/base/deus-dragao/M21_deus_dragao_topdown_thumb_640.jpg',
    summary:
      'Tabuleiro cataclismico do Dragao FUSHI, com ilha-catalisador, manifestacoes e energia suprema.',
  },
].map((map) => ({
  ...map,
  biome: 'Vulcao / Terras Cinzentas',
  biomeId: 'vulcao_terras_cinzentas',
  cellSize: 4000 / 30,
  defaultCamera: {
    zoom: 0.52,
  },
  gridColumns: 30,
  gridRows: 30,
  imageUrl: map.image,
  mapVisibility: 'mestre_apenas',
  previewImage: map.previewImage ?? map.image,
  source: 'manual',
  stageHeight: 4000,
  stageWidth: 4000,
  thumbnailUrl: map.previewImage ?? map.image,
}))

const planicieBiome: TabletopBiome = {
  id: 'planicie',
  name: 'Planicie Inicial',
  description:
    'Regiao inicial proxima ao nascimento dos protagonistas e ao primeiro contato com exploracao.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-leaves',
  maps: [caveMap.id, plainMap.id, survivalMap.id, villageApproachMap.id],
  transitions: [
    'transicao_despertar',
    'transicao_caverna_para_planicie',
    'transicao_planicie_para_vila',
  ],
}

const planicieFlorestaInicialBiome: TabletopBiome = {
  id: 'planicie_floresta_inicial',
  name: 'Planicie / Floresta Inicial',
  description:
    'Regiao oficial do MUN com a caverna inicial, vila, bosque, riacho e primeiras bifurcacoes da campanha.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-leaves',
  maps: planicieVillageTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_planicie_nascente')],
}

const veilGreyBiome: TabletopBiome = {
  id: 'vale_cinzento_veu',
  name: 'Vale Cinzento / Veu Cinza',
  description:
    'Rotas de observacao, espionagem e bases taticas da Ordem do Veu Cinza.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-fog',
  maps: [
    veilCampExteriorMap.id,
    veilCampInteriorMap.id,
    ...veilGeneratedTopdownMaps.map((map) => map.id),
    veilObservationTowerExteriorMap.id,
    veilObservationTowerRoofMap.id,
  ],
  transitions: [getBaseArrivalTransitionId('base_veu_esconderijo')],
}

const florestaMisticaBiome: TabletopBiome = {
  id: 'floresta_mistica',
  name: 'Floresta Mistica',
  description:
    'Bioma vivo conectado a arvore mae, com raizes conscientes, FUSHI natural, passagens secretas e bifurcacoes para Veu e Praia.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-leaves',
  maps: florestaMisticaTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_floresta_seiva')],
}

const praiaLitoralOceanoBiome: TabletopBiome = {
  id: 'praia_litoral_oceano',
  name: 'Praia / Litoral / Oceano',
  description:
    'Regiao costeira oficial do MUN com naufragios, recifes, alto-mar, bases moveis e dungeons submersas.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-mist',
  maps: praiaTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_praia_ancora')],
}

const montanhasVazioSerenoBiome: TabletopBiome = {
  id: 'montanhas_vazio_sereno',
  name: 'Montanhas do Vazio Sereno',
  description:
    'Regiao espiritual de altitude, travessias perigosas, base dos monges, arenas de treino e rotas para Vulcao e Gelo.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-wind',
  maps: montanhaTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_montanha_refugio')],
}

const regiaoCongeladaNeveBiome: TabletopBiome = {
  id: 'regiao_congelada_neve',
  name: 'Regiao Congelada / Neve',
  description:
    'Regiao de gelo extremo, nevasca, ruinas preservadas, cavernas azuis e santuarios sob agua congelada.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-snow',
  maps: regiaoCongeladaNeveTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_gelo_abrigo')],
}

const ruinasAntigasRyokuBiome: TabletopBiome = {
  id: 'ruinas_antigas_ryoku',
  name: 'Ruinas Antigas / Ryoku',
  description:
    'Area de FUSHI Escuro, memoria quebrada, rituais de consciencia e presenca historica de Ryoku.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-dust',
  maps: ruinasRyokuTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_ruinas_memorial')],
}

const vulcaoTerrasCinzentasBiome: TabletopBiome = {
  id: 'vulcao_terras_cinzentas',
  name: 'Vulcao / Terras Cinzentas',
  description:
    'Regiao de cataclismas, cinzas, FUSHI instavel e encontro estrutural com o Dragao FUSHI.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-ash',
  maps: vulcaoTerrasCinzentasTopdownMaps.map((map) => map.id),
  transitions: [getBaseArrivalTransitionId('base_vulcao_obsidiana')],
}

const transitionAwakening: TabletopTransitionAsset = {
  id: 'transicao_despertar',
  biomeId: 'planicie',
  toMapId: caveMap.id,
  name: 'Despertar',
  summary:
    'Tela escura, sensacoes quebradas e consciencias tentando entender um corpo unico.',
  type: 'image',
  assetUrl: despertarTransitionPath,
  thumbnailUrl: despertarTransitionPath,
  description:
    'Interludio inicial da sessao 01. Ao concluir, o fluxo pode entrar automaticamente na Caverna do Despertar.',
}

const transitionCaveToPlain: TabletopTransitionAsset = {
  id: 'transicao_caverna_para_planicie',
  biomeId: 'planicie',
  fromMapId: caveMap.id,
  toMapId: plainMap.id,
  name: 'Saida da Caverna',
  summary:
    'Primeira visao ao sair do interior escuro para a abertura da planicie.',
  type: 'image',
  assetUrl: saidaCavernaTransitionPath,
  thumbnailUrl: saidaCavernaTransitionPath,
  description:
    'Interludio frontal para marcar a chegada na planicie antes da leitura tatica do mapa.',
}

const transitionPlainToVillage: TabletopTransitionAsset = {
  id: 'transicao_planicie_para_vila',
  biomeId: 'planicie',
  fromMapId: survivalMap.id,
  toMapId: villageApproachMap.id,
  name: 'Avistando a Vila',
  summary:
    'Primeira leitura do hub proximo, ainda como visao de chegada e nao como mapa tatico.',
  type: 'image',
  assetUrl: avistandoVilaTransitionPath,
  thumbnailUrl: avistandoVilaTransitionPath,
  description:
    'Interludio usado antes da aproximacao da vila inicial para sustentar ritmo de sessao.',
}

const sharedStarterControl = {
  controlledByPlayerIds: ['player-fragmento-01', 'player-fragmento-02'],
  primaryControllerId: 'player-fragmento-01',
  sharedControl: true,
}

const cavernaPlayerToken: TabletopToken = {
  id: 'token-fragmento-p01-caverna',
  characterId: 'fragmento-p01',
  label: 'CF',
  color: '#92c0b6',
  cell: {
    column: 9,
    row: 11,
  },
  size: 1,
  visibility: 'public',
  control: { ...sharedStarterControl },
}

const planiciePlayerToken: TabletopToken = {
  ...cavernaPlayerToken,
  id: 'token-fragmento-p01-planicie',
  cell: {
    column: 8,
    row: 11,
  },
}

const tutorialPlayerToken: TabletopToken = {
  ...cavernaPlayerToken,
  id: 'token-fragmento-p01-tutorial',
  cell: {
    column: 6,
    row: 12,
  },
}

const villagePlayerToken: TabletopToken = {
  ...cavernaPlayerToken,
  id: 'token-fragmento-p01-vila',
  cell: {
    column: 10,
    row: 10,
  },
}

const sessionScenes: TabletopScene[] = [
  {
    id: 'scene-sessao-01-caverna',
    name: 'Caverna do Despertar',
    mapId: caveMap.id,
    tokens: [cavernaPlayerToken],
    gridCellSize: 112,
    cameraState: {
      zoom: 0.92,
    },
    metadata: {
      musicTrackId: '',
      ambienceTrackId: '',
      lightingPresetId: 'lighting-cave',
      weatherPresetId: 'weather-none',
      uiThemePresetId: 'ui-fushi-default',
      introCardId: 'intro-caverna-01',
      cinematicId: '',
      cameraPresetId: 'camera-default',
      notes:
        'Primeiro mapa da sessao. O grupo ainda nao combate aqui; so explora, testa movimento e percebe o corpo.',
    },
  },
  {
    id: 'scene-sessao-01-planicie',
    name: 'Planicie Aberta',
    mapId: plainMap.id,
    tokens: [planiciePlayerToken],
    gridCellSize: 112,
    cameraState: {
      zoom: 0.8,
    },
    metadata: {
      musicTrackId: '',
      ambienceTrackId: '',
      lightingPresetId: 'lighting-neutral',
      weatherPresetId: 'weather-none',
      uiThemePresetId: 'ui-fushi-default',
      introCardId: 'intro-planicie-01',
      cinematicId: '',
      cameraPresetId: 'camera-wide',
      notes:
        'Tutorial de movimento, percepcao e reconhecimento da planicie antes do combate com lobos.',
    },
  },
  {
    id: 'scene-sessao-01-tutorial',
    name: 'Combate com Lobos',
    mapId: survivalMap.id,
    tokens: [tutorialPlayerToken],
    gridCellSize: 104,
    cameraState: {
      zoom: 0.86,
    },
    metadata: {
      musicTrackId: '',
      ambienceTrackId: '',
      lightingPresetId: 'lighting-neutral',
      weatherPresetId: 'weather-none',
      uiThemePresetId: 'ui-fushi-default',
      introCardId: 'intro-evento-01',
      cinematicId: '',
      cameraPresetId: 'camera-default',
      notes:
        'Cena tutorial de combate. O mestre pode adicionar manualmente o Lobo da Planicie pela biblioteca conforme o desempenho do grupo.',
    },
  },
  {
    id: 'scene-sessao-01-vila',
    name: 'Regiao Proxima da Vila',
    mapId: villageApproachMap.id,
    tokens: [villagePlayerToken],
    gridCellSize: 108,
    cameraState: {
      zoom: 0.52,
    },
    metadata: {
      musicTrackId: '',
      ambienceTrackId: '',
      lightingPresetId: 'lighting-neutral',
      weatherPresetId: 'weather-none',
      uiThemePresetId: 'ui-fushi-default',
      introCardId: 'intro-vila-01',
      cinematicId: '',
      cameraPresetId: 'camera-wide',
      notes:
        'Mapa final da sessao depois do interludio de chegada. Pode fechar a sessao ou puxar a continuacao.',
    },
  },
]

const sessionPlans: TabletopSessionPlan[] = [
  {
    id: 'sessao_01',
    name: 'Sessao 01 - Despertar na Ilha',
    objective:
      'Players despertam no corpo compartilhado, saem da caverna, vencem o tutorial dos lobos e chegam a regiao proxima da vila.',
    summary:
      'Sequencia base da primeira sessao com interludios, mapas e encontro tutorial ja alinhados ao core jogavel.',
    scenes: [
      {
        id: 'sessao_01_cena_01',
        order: 1,
        name: 'Interludio: Despertar',
        mode: 'transition',
        transitionId: transitionAwakening.id,
        nextMapId: caveMap.id,
        intro: 'Tela escura, sensacoes e nenhum mapa ainda.',
        notes: 'Abre a sessao antes da Caverna do Despertar.',
      },
      {
        id: 'sessao_01_cena_02',
        order: 2,
        name: 'Mapa: Caverna do Despertar',
        mode: 'map',
        sceneId: 'scene-sessao-01-caverna',
        mapId: caveMap.id,
        intro: 'Exploracao curta sem combate.',
        notes: 'Players aparecem no token/corpo inicial compartilhado.',
      },
      {
        id: 'sessao_01_cena_03',
        order: 3,
        name: 'Interludio: Saida da Caverna',
        mode: 'transition',
        transitionId: transitionCaveToPlain.id,
        nextMapId: plainMap.id,
        notes: 'Imagem placeholder da saida antes do mapa aberto.',
      },
      {
        id: 'sessao_01_cena_04',
        order: 4,
        name: 'Mapa: Planicie Aberta',
        mode: 'map',
        sceneId: 'scene-sessao-01-planicie',
        mapId: plainMap.id,
        themePresetId: 'ui-fushi-default',
        weatherPresetId: 'weather-none',
        notes: 'Tutorial de movimento e percepcao antes do encontro.',
      },
      {
        id: 'sessao_01_cena_05',
        order: 5,
        name: 'Encontro: Lobos da Planicie',
        mode: 'map',
        sceneId: 'scene-sessao-01-tutorial',
        mapId: survivalMap.id,
        notes: 'Combate tutorial com adicao manual do Lobo da Planicie pela biblioteca.',
      },
      {
        id: 'sessao_01_cena_06',
        order: 6,
        name: 'Interludio: Avistando a Vila',
        mode: 'transition',
        transitionId: transitionPlainToVillage.id,
        nextMapId: villageApproachMap.id,
        notes: 'Fecha o combate tutorial e leva para a aproximacao da vila.',
      },
      {
        id: 'sessao_01_cena_07',
        order: 7,
        name: 'Mapa: Regiao Proxima da Vila',
        mode: 'map',
        sceneId: 'scene-sessao-01-vila',
        mapId: villageApproachMap.id,
        notes: 'Encerramento da sessao 01 ou gancho para continuidade.',
      },
    ],
  },
]

export const tabletopData: TabletopData = {
  map: caveMap,
  initialTokens: [cavernaPlayerToken],
  maps: [
    caveMap,
    plainMap,
    survivalMap,
    villageApproachMap,
    ...baseUpgradeTopdownMaps,
    ...planicieVillageTopdownMaps,
    veilCampExteriorMap,
    veilCampInteriorMap,
    ...veilGeneratedTopdownMaps,
    veilObservationTowerExteriorMap,
    veilObservationTowerRoofMap,
    ...florestaMisticaTopdownMaps,
    ...praiaTopdownMaps,
    ...montanhaTopdownMaps,
    ...regiaoCongeladaNeveTopdownMaps,
    ...ruinasRyokuTopdownMaps,
    ...vulcaoTerrasCinzentasTopdownMaps,
  ],
  biomes: [
    planicieBiome,
    planicieFlorestaInicialBiome,
    veilGreyBiome,
    florestaMisticaBiome,
    praiaLitoralOceanoBiome,
    montanhasVazioSerenoBiome,
    regiaoCongeladaNeveBiome,
    ruinasAntigasRyokuBiome,
    vulcaoTerrasCinzentasBiome,
  ],
  transitions: [
    transitionAwakening,
    transitionCaveToPlain,
    transitionPlainToVillage,
    ...baseArrivalTransitions,
  ],
  scenes: sessionScenes,
  sessions: sessionPlans,
  initialSceneId: 'scene-sessao-01-caverna',
  assetLibrary: {
    maps: [
      caveMap,
      plainMap,
      survivalMap,
      villageApproachMap,
      ...baseUpgradeTopdownMaps,
      ...planicieVillageTopdownMaps,
      veilCampExteriorMap,
      veilCampInteriorMap,
      ...veilGeneratedTopdownMaps,
      veilObservationTowerExteriorMap,
      veilObservationTowerRoofMap,
      ...florestaMisticaTopdownMaps,
      ...praiaTopdownMaps,
      ...montanhaTopdownMaps,
      ...regiaoCongeladaNeveTopdownMaps,
      ...ruinasRyokuTopdownMaps,
      ...vulcaoTerrasCinzentasTopdownMaps,
    ],
    transitions: [
      transitionAwakening,
      transitionCaveToPlain,
      transitionPlainToVillage,
      ...baseArrivalTransitions,
    ],
    musicTracks: [
      {
        id: 'music-planicie-calma',
        name: 'Respirar na Relva',
        summary:
          'Trilha CC0 para exploracao aberta, deslocamento na planicie e respiro entre cenas.',
        category: 'Musicas de trilha',
        source: fieldOfDreamsAudioPath,
      },
      {
        id: 'music-caverna-suspensa',
        name: 'Eco do Despertar',
        summary:
          'Trilha CC0 para despertar, estranheza e misterio leve dentro da caverna.',
        category: 'Musicas Cinematicas',
        source: caveThemeAudioPath,
      },
      {
        id: 'music-tutorial-pressao',
        name: 'Primeira Pressao',
        summary:
          'Trilha CC0 para tutorial, tensao crescente e primeiras waves de lobos.',
        category: 'Musicas para batalhas',
        source: battleThemeAudioPath,
      },
      {
        id: 'music-vila-tema-calmo',
        name: 'Tema da Vila',
        summary:
          'Trilha CC0 para descanso, conversa com NPCs e apresentacao segura da vila.',
        category: 'Musicas de trilha',
        source: townThemeAudioPath,
      },
      {
        id: 'music-cinematica-lenda',
        name: 'Lenda em Ascensao',
        summary:
          'Trilha CC0 curta para revelacao, memoria importante, promessa ou encerramento de sessao.',
        category: 'Musicas Cinematicas',
        source: legendWillRiseAudioPath,
      },
      {
        id: 'music-expansao-boss-fase',
        name: 'Ruptura de Dominio',
        summary:
          'Trilha CC0 convertida para fase de chefe, expansao de dominio ou habilidade especial.',
        category: 'Musicas para Expansao de dominio e habilidades especiais',
        source: bossBattleAudioPath,
      },
      {
        id: 'music-boss-whispers-abyss',
        name: 'Sussurros do Abismo',
        summary:
          'Loop dark fantasy para boss pesado, entrada ascendente e combate longo.',
        category: 'Musicas para batalhas',
        source: bossWhispersAbyssAudioPath,
      },
      {
        id: 'music-domain-shadowforge-intro',
        name: 'Convergencia Sombria - Intro',
        summary:
          'Intro curta para abertura de boss, dominio ou mudanca de fase.',
        category: 'Musicas para Expansao de dominio e habilidades especiais',
        source: domainShadowforgeIntroAudioPath,
      },
      {
        id: 'music-boss-shadowforge-loop',
        name: 'Convergencia Sombria - Loop',
        summary:
          'Loop principal para boss ascendente, forja sombria e combate sustentado.',
        category: 'Musicas para batalhas',
        source: bossShadowforgeLoopAudioPath,
      },
      {
        id: 'music-domain-shadowforge-phase2',
        name: 'Convergencia Sombria - Fase 2',
        summary:
          'Loop de fase 2 para boss depois de uma intro ou quebra de ritmo.',
        category: 'Musicas para Expansao de dominio e habilidades especiais',
        source: domainShadowforgePhase2AudioPath,
      },
      {
        id: 'music-boss-eclipsed-desolation',
        name: 'Desolacao Eclipse',
        summary:
          'Loop extremo para boss cataclismico, ascendente instavel ou fase final.',
        category: 'Musicas para batalhas',
        source: bossEclipsedDesolationAudioPath,
      },
      {
        id: 'music-domain-cursed-citadel-intro',
        name: 'Cidadela Amaldicoada - Intro',
        summary:
          'Intro de impacto para revelar arena, porta de boss ou expansao de dominio.',
        category: 'Musicas para Expansao de dominio e habilidades especiais',
        source: domainCursedCitadelIntroAudioPath,
      },
      {
        id: 'music-boss-cursed-citadel-loop',
        name: 'Cidadela Amaldicoada - Loop',
        summary:
          'Loop de boss base para dungeon final, fortaleza e combate ritual.',
        category: 'Musicas para batalhas',
        source: bossCursedCitadelLoopAudioPath,
      },
      {
        id: 'music-battle-dread-march',
        name: 'Marcha do Pavor',
        summary:
          'Loop para faccoes, cerco, patrulha hostil e combate organizado.',
        category: 'Musicas para batalhas',
        source: battleDreadMarchAudioPath,
      },
      {
        id: 'music-domain-eternal-nightfall',
        name: 'Veu da Noite Eterna',
        summary:
          'Loop extremo para FUSHI Escuro, pacto, dominio e boss emocional.',
        category: 'Musicas para Expansao de dominio e habilidades especiais',
        source: domainEternalNightfallAudioPath,
      },
    ],
    ambienceTracks: [
      {
        id: 'ambience-caverna-baixa',
        name: 'Caverna Baixa',
        summary: 'Ambiencia CC0 em loop para eco, vento grave e gotejamento de caverna.',
        category: 'efeitos de trilha',
        source: dungeonAmbienceAudioPath,
      },
      {
        id: 'ambience-planicie-viva',
        name: 'Planicie Viva',
        summary: 'Ambiencia CC0 natural para bosque, campo aberto e viagem calma.',
        category: 'efeitos de trilha',
        source: forestAmbienceAudioPath,
      },
      {
        id: 'ambience-vento-pressao',
        name: 'Vento de Pressao',
        summary: 'Loop CC0 curto para rajadas, chegada de perigo ou mudanca de cena.',
        category: 'efeitos de trilha',
        source: windWhooshAudioPath,
      },
      {
        id: 'ambience-chuva-suave',
        name: 'Chuva Suave na Janela',
        summary:
          'Gravacao CC0 em loop para descanso, conversa, madrugada e abrigo.',
        category: 'Clima e textura',
        source: rainGentleAudioPath,
      },
      {
        id: 'ambience-chuva-constante',
        name: 'Chuva Constante',
        summary:
          'Gravacao CC0 em loop para exploracao molhada, floresta e tensao baixa.',
        category: 'Clima e textura',
        source: rainSteadyAudioPath,
      },
      {
        id: 'ambience-chuva-pesada',
        name: 'Chuva Pesada',
        summary:
          'Gravacao CC0 em loop para tempestade, fuga, cerco e pressao de cena.',
        category: 'Clima e textura',
        source: rainHeavyAudioPath,
      },
      {
        id: 'ambience-chuva-distante',
        name: 'Chuva Distante',
        summary:
          'Gravacao CC0 em loop para horizonte fechado, viagem e transicao.',
        category: 'Clima e textura',
        source: rainDistantAudioPath,
      },
      {
        id: 'ambience-trovao-abrigo',
        name: 'Trovao Visto do Abrigo',
        summary:
          'Tempestade em loop para interior, pressagio e cenas de revelacao.',
        category: 'Clima e textura',
        source: rainThunderInsideAudioPath,
      },
    ],
    images: [
      {
        id: 'image-despertar',
        name: 'Despertar',
        summary: 'Interludio placeholder para a abertura da sessao 01.',
        source: despertarTransitionPath,
        previewImage: despertarTransitionPath,
      },
      {
        id: 'image-planicie-caverna',
        name: 'Caverna do Despertar',
        summary: 'Imagem placeholder local para o mapa inicial da caverna.',
        source: planicieCavernaMapPath,
        previewImage: planicieCavernaMapPath,
      },
      {
        id: 'image-planicie-aberta',
        name: 'Planicie Aberta',
        summary: 'Imagem placeholder local do mapa livre do bioma inicial.',
        source: planicieAbertaMapPath,
        previewImage: planicieAbertaMapPath,
      },
      {
        id: 'image-planicie-tutorial',
        name: 'Trilha de Sobrevivencia',
        summary: 'Imagem placeholder local do evento tutorial.',
        source: trilhaSobrevivenciaMapPath,
        previewImage: trilhaSobrevivenciaMapPath,
      },
      {
        id: 'image-planicie-vila',
        name: 'Regiao Proxima da Vila',
        summary: 'Imagem placeholder local da aproximacao da vila.',
        source: regiaoVilaMapPath,
        previewImage: regiaoVilaMapPath,
      },
      ...baseUpgradeTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa topdown de base de bioma.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      {
        id: 'image-planicie-caverna-primeiro-corpo-topdown',
        name: 'Caverna do Primeiro Corpo',
        summary: 'Topdown 4000x4000 do interior organico inicial.',
        source: vilaCavernaPrimeiroCorpoTopdownPath,
        previewImage: vilaCavernaPrimeiroCorpoTopdownThumbPath,
      },
      {
        id: 'image-planicie-clareira-lobos-topdown',
        name: 'Clareira dos Lobos',
        summary: 'Topdown 4000x4000 do primeiro encontro com lobos.',
        source: vilaClareiraLobosTopdownPath,
        previewImage: vilaClareiraLobosTopdownThumbPath,
      },
      {
        id: 'image-planicie-armazem-comunitario-topdown',
        name: 'Armazem Comunitario',
        summary: 'Topdown 4000x4000 do armazem e mercado de escambo.',
        source: vilaArmazemComunitarioTopdownPath,
        previewImage: vilaArmazemComunitarioTopdownThumbPath,
      },
      {
        id: 'image-planicie-campo-treino-topdown',
        name: 'Campo de Treino da Vila',
        summary: 'Topdown 4000x4000 do campo de treino inicial.',
        source: vilaCampoTreinoTopdownPath,
        previewImage: vilaCampoTreinoTopdownThumbPath,
      },
      {
        id: 'image-planicie-vila-conhecimento-topdown',
        name: 'Vila do Conhecimento Absorvido',
        summary: 'Topdown 4000x4000 do hub seguro inicial.',
        source: vilaPlanicieTopdownPath,
        previewImage: vilaPlanicieTopdownThumbPath,
      },
      {
        id: 'image-planicie-bosque-baixo-topdown',
        name: 'Bosque Baixo',
        summary: 'Topdown 4000x4000 da bifurcacao Montanha / Floresta Mistica.',
        source: vilaBosqueBaixoTopdownPath,
        previewImage: vilaBosqueBaixoTopdownThumbPath,
      },
      {
        id: 'image-planicie-riacho-claro-topdown',
        name: 'Riacho Claro',
        summary: 'Topdown 4000x4000 da bifurcacao Floresta Mistica / Praia.',
        source: vilaRiachoClaroTopdownPath,
        previewImage: vilaRiachoClaroTopdownThumbPath,
      },
      {
        id: 'image-veu-acampamento-exterior',
        name: 'Acampamento do Veu - Exterior',
        summary: 'Topdown do acampamento circular da Ordem do Veu Cinza.',
        source: veuAcampamentoExteriorMapPath,
        previewImage: veuAcampamentoExteriorThumbPath,
      },
      {
        id: 'image-veu-acampamento-interior',
        name: 'Acampamento do Veu - Interior da Base',
        summary: 'Topdown do edificio principal da base do Veu Cinza.',
        source: veuAcampamentoInteriorMapPath,
        previewImage: veuAcampamentoInteriorThumbPath,
      },
      ...veilGeneratedTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa topdown do Vale Cinzento / Veu Cinza.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      {
        id: 'image-veu-torre-observacao-exterior',
        name: 'Torre de Observacao - Chegada',
        summary: 'Mapa externo top-down da chegada na torre do Veu Cinza.',
        source: veuTorreObservacaoExteriorMapPath,
        previewImage: veuTorreObservacaoExteriorThumbPath,
      },
      {
        id: 'image-veu-torre-observacao-topo',
        name: 'Torre de Observacao - Topo',
        summary: 'Mapa top-down da plataforma do telescopio da torre.',
        source: veuTorreObservacaoTopoMapPath,
        previewImage: veuTorreObservacaoTopoThumbPath,
      },
      ...florestaMisticaTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa topdown da Floresta Mistica.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      ...praiaTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa topdown da Praia / Litoral / Oceano.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      ...montanhaTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa topdown das Montanhas do Vazio Sereno.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      ...ruinasRyokuTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa-base das Ruinas Antigas / Ryoku.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      ...vulcaoTerrasCinzentasTopdownMaps.map((map) => ({
        id: `image-${map.id}`,
        name: map.name,
        summary: map.summary ?? 'Mapa-base do Vulcao / Terras Cinzentas.',
        source: map.image,
        previewImage: map.thumbnailUrl ?? map.previewImage ?? map.image,
      })),
      {
        id: 'image-transicao-caverna',
        name: 'Saida da Caverna',
        summary: 'Interludio frontal da primeira abertura da planicie.',
        source: saidaCavernaTransitionPath,
        previewImage: saidaCavernaTransitionPath,
      },
      {
        id: 'image-transicao-vila',
        name: 'Avistando a Vila',
        summary: 'Interludio frontal da primeira visao da vila inicial.',
        source: avistandoVilaTransitionPath,
        previewImage: avistandoVilaTransitionPath,
      },
    ],
    videoClips: [
      {
        id: 'video-planicie-placeholder',
        name: 'Video placeholder local',
        summary:
          'Reserva para video real futuro em /assets/video sem depender de backend.',
        source: '',
        previewImage: avistandoVilaTransitionPath,
      },
    ],
    fxPresets: [
      {
        id: 'fx-soft-fog',
        name: 'Glow suave',
        summary: 'Reserva discreta para efeitos visuais locais da mesa.',
      },
    ],
    uiThemes: [
      {
        id: 'ui-fushi-default',
        name: 'FUSHI Base',
        summary: 'Tema padrao da mesa para o bioma inicial.',
      },
      {
        id: 'ui-fushi-cold',
        name: 'FUSHI Frio',
        summary: 'Tema frio mantido para futuros biomas.',
      },
      {
        id: 'ui-fushi-warm',
        name: 'FUSHI Calor',
        summary: 'Tema quente mantido para futuros eventos de pressao.',
      },
    ],
    lightingPresets: [
      {
        id: 'lighting-neutral',
        name: 'Neutro',
        summary: 'Luz base equilibrada para exploracao normal.',
      },
      {
        id: 'lighting-cave',
        name: 'Interior de caverna',
        summary: 'Luz baixa para interiores e leitura mais fechada.',
      },
      {
        id: 'lighting-warm',
        name: 'Pressao',
        summary: 'Leitura mais quente para combate ou tensao.',
      },
    ],
    weatherPresets: [
      {
        id: 'weather-none',
        name: 'Nenhum',
        summary: 'Sem clima automatico para a sessao inicial.',
      },
      {
        id: 'weather-dust',
        name: 'Po leve',
        summary: 'Preset futuro para trilhas secas e eventos curtos.',
      },
      {
        id: 'weather-leaves',
        name: 'Folhas ao vento',
        summary: 'Folhas pequenas e vento suave para planicie e floresta sem cobrir o tabuleiro.',
      },
      {
        id: 'weather-ash',
        name: 'Cinzas do vulcao',
        summary: 'Cinza e brasas sutis para regioes vulcanicas em leitura topdown.',
      },
      {
        id: 'weather-wind',
        name: 'Rajadas de vento',
        summary: 'Linhas de vento rapidas para montanhas e travessias de altitude.',
      },
      {
        id: 'weather-mist',
        name: 'Bruma costeira',
        summary: 'Nevoa baixa e particulas discretas para praia, litoral e oceano.',
      },
      {
        id: 'weather-fog',
        name: 'Nevoa do Veu',
        summary: 'Bruma cinzenta baixa para regioes sombrias sem apagar o mapa.',
      },
      {
        id: 'weather-rain',
        name: 'Chuva cinematica',
        summary: 'Chuva com particulas Pixi e leitura topdown sobre o tabuleiro.',
      },
      {
        id: 'weather-snow',
        name: 'Neve cinematica',
        summary: 'Neve suave com particulas Pixi para regioes frias.',
      },
    ],
    introCards: [
      {
        id: 'intro-caverna-01',
        name: 'Despertar na Caverna',
        summary: 'Abertura simples para o local de nascimento dos protagonistas.',
        source: planicieCavernaMapPath,
        previewImage: planicieCavernaMapPath,
      },
      {
        id: 'intro-planicie-01',
        name: 'Primeiro Horizonte',
        summary: 'Entrada curta para a primeira leitura da planicie aberta.',
        source: planicieAbertaMapPath,
        previewImage: planicieAbertaMapPath,
      },
      {
        id: 'intro-evento-01',
        name: 'Combate com Lobos',
        summary: 'Introducao curta para o combate tutorial dos lobos.',
        source: trilhaSobrevivenciaMapPath,
        previewImage: trilhaSobrevivenciaMapPath,
      },
      {
        id: 'intro-vila-01',
        name: 'Porta de Entrada da Vila',
        summary: 'Abertura da aproximacao ao hub inicial.',
        source: regiaoVilaMapPath,
        previewImage: regiaoVilaMapPath,
      },
    ],
    cinematics: [
      {
        id: 'cinematic-scene-intro',
        name: 'Intro de cena',
        summary: 'Overlay visual simples para abertura manual de cena.',
        category: 'intro',
        previewImage: planicieCavernaMapPath,
      },
      {
        id: 'cinematic-domain-shift',
        name: 'Corte de dominio',
        summary: 'Placeholder visual para quebra de ritmo ou corte forte.',
        category: 'domain',
        previewImage: avistandoVilaTransitionPath,
      },
      {
        id: 'cinematic-transition',
        name: 'Transicao curta',
        summary: 'Overlay curto separado do sistema de transicoes por bioma.',
        category: 'transition',
        previewImage: saidaCavernaTransitionPath,
      },
    ],
    cameraPresets: [
      {
        id: 'camera-default',
        name: 'Padrao',
        summary: 'Camera equilibrada para leitura tatica.',
      },
      {
        id: 'camera-wide',
        name: 'Aberta',
        summary: 'Camera mais aberta para mapas grandes e leitura geral.',
      },
      {
        id: 'camera-close',
        name: 'Fechada',
        summary: 'Camera mais proxima para pressao localizada.',
      },
      {
        id: 'camera-north',
        name: 'Norte',
        summary: 'Preset mantido para focos mais altos do mapa.',
      },
    ],
  },
}
