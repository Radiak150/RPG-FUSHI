import { createMockAudioDataUri } from '../../lib/mockAudio'
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
const despertarTransitionPath =
  '/assets/transitions/planicie/despertar_placeholder.png'
const saidaCavernaTransitionPath =
  '/assets/transitions/planicie/saida_caverna.png'
const avistandoVilaTransitionPath =
  '/assets/transitions/planicie/avistando_vila.png'

const tensionTrackSource = createMockAudioDataUri({
  durationSeconds: 4.8,
  masterGain: 0.62,
  layers: [
    { frequency: 132, gain: 0.32, wobbleHz: 0.18, wobbleDepth: 0.008 },
    { frequency: 198, gain: 0.18, wobbleHz: 0.12, wobbleDepth: 0.012, phase: 0.7 },
    { frequency: 264, gain: 0.09, wobbleHz: 0.09, wobbleDepth: 0.016, phase: 1.2 },
  ],
})

const driftTrackSource = createMockAudioDataUri({
  durationSeconds: 5.4,
  masterGain: 0.58,
  layers: [
    { frequency: 176, gain: 0.2, wobbleHz: 0.1, wobbleDepth: 0.02 },
    { frequency: 220, gain: 0.12, wobbleHz: 0.14, wobbleDepth: 0.018, phase: 0.4 },
    { frequency: 330, gain: 0.08, wobbleHz: 0.16, wobbleDepth: 0.012, phase: 0.9 },
  ],
})

const pulseTrackSource = createMockAudioDataUri({
  durationSeconds: 5.2,
  masterGain: 0.66,
  layers: [
    { frequency: 92, gain: 0.34, wobbleHz: 0.22, wobbleDepth: 0.014 },
    { frequency: 184, gain: 0.16, wobbleHz: 0.11, wobbleDepth: 0.02, phase: 0.3 },
    { frequency: 276, gain: 0.09, wobbleHz: 0.2, wobbleDepth: 0.01, phase: 1 },
  ],
})

const forestAmbienceSource = createMockAudioDataUri({
  durationSeconds: 6,
  masterGain: 0.48,
  noiseGain: 0.16,
  noisePulseHz: 0.21,
  layers: [
    { frequency: 84, gain: 0.12, wobbleHz: 0.08, wobbleDepth: 0.02 },
    { frequency: 126, gain: 0.08, wobbleHz: 0.06, wobbleDepth: 0.018, phase: 0.6 },
  ],
})

const windAmbienceSource = createMockAudioDataUri({
  durationSeconds: 6,
  masterGain: 0.42,
  noiseGain: 0.22,
  noisePulseHz: 0.12,
  layers: [
    { frequency: 62, gain: 0.09, wobbleHz: 0.05, wobbleDepth: 0.024 },
    { frequency: 93, gain: 0.06, wobbleHz: 0.08, wobbleDepth: 0.02, phase: 1.1 },
  ],
})

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
    zoom: 0.82,
  },
}

const planicieBiome: TabletopBiome = {
  id: 'planicie',
  name: 'Planicie Inicial',
  description:
    'Regiao inicial proxima ao nascimento dos protagonistas e ao primeiro contato com exploracao.',
  themePresetId: 'ui-fushi-default',
  weatherPresetId: 'weather-none',
  maps: [caveMap.id, plainMap.id, survivalMap.id, villageApproachMap.id],
  transitions: [
    'transicao_despertar',
    'transicao_caverna_para_planicie',
    'transicao_planicie_para_vila',
  ],
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
      zoom: 0.82,
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
  maps: [caveMap, plainMap, survivalMap, villageApproachMap],
  biomes: [planicieBiome],
  transitions: [transitionAwakening, transitionCaveToPlain, transitionPlainToVillage],
  scenes: sessionScenes,
  sessions: sessionPlans,
  initialSceneId: 'scene-sessao-01-caverna',
  assetLibrary: {
    maps: [caveMap, plainMap, survivalMap, villageApproachMap],
    transitions: [transitionAwakening, transitionCaveToPlain, transitionPlainToVillage],
    musicTracks: [
      {
        id: 'music-planicie-calma',
        name: 'Respirar na Relva',
        summary:
          'Trilha baixa para exploracao aberta e leitura calma do primeiro bioma.',
        category: 'Exploracao',
        source: driftTrackSource,
      },
      {
        id: 'music-caverna-suspensa',
        name: 'Eco do Despertar',
        summary:
          'Camada curta para despertar, estranheza e suspense leve dentro da caverna.',
        category: 'Caverna',
        source: tensionTrackSource,
      },
      {
        id: 'music-tutorial-pressao',
        name: 'Primeira Pressao',
        summary:
          'Trilha enxuta para evento tutorial e subida leve de tensao sem excesso.',
        category: 'Evento',
        source: pulseTrackSource,
      },
    ],
    ambienceTracks: [
      {
        id: 'ambience-caverna-baixa',
        name: 'Caverna Baixa',
        summary: 'Ambiencia discreta para eco, gotejamento e silencio interno.',
        category: 'Caverna',
        source: windAmbienceSource,
      },
      {
        id: 'ambience-planicie-viva',
        name: 'Planicie Viva',
        summary: 'Ambiencia natural de vento leve e campo aberto.',
        category: 'Planicie',
        source: forestAmbienceSource,
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
