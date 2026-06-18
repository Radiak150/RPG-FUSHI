import type { BiomeVisualId } from './biomeVisualPresets'
import type { VisualQualityMode } from '../lib/productPreferences'

export interface BiomeCinematicAsset {
  accentColor: string
  backdrop: string
  glowColor: string
  id: BiomeVisualId
  label: string
  ultraBackdrop: string
  voidColor: string
}

const BASE_PATH = '/assets/biomes/8-biomas'
const ULTRA_BASE_PATH = '/assets/biomes/8-biomas-ultra'

const NEUTRAL_ASSET: BiomeCinematicAsset = {
  accentColor: '#92c0b6',
  backdrop: `${BASE_PATH}/neutral/topdown_generic_neutral.svg`,
  glowColor: 'rgba(146, 192, 182, 0.2)',
  id: 'neutral',
  label: 'Neutro',
  ultraBackdrop: `${ULTRA_BASE_PATH}/neutral/cinematic_neutral_ultra.jpg`,
  voidColor: '#05070a',
}

export const BIOME_CINEMATIC_ASSETS: Record<BiomeVisualId, BiomeCinematicAsset> = {
  neutral: NEUTRAL_ASSET,
  planicie_floresta_inicial: {
    accentColor: '#b5d99a',
    backdrop: `${BASE_PATH}/planicie_floresta_inicial/topdown_generic_planicie_floresta_inicial.svg`,
    glowColor: 'rgba(145, 205, 128, 0.22)',
    id: 'planicie_floresta_inicial',
    label: 'Planicie / Floresta Inicial',
    ultraBackdrop: `${ULTRA_BASE_PATH}/planicie_floresta_inicial/cinematic_planicie_floresta_inicial_ultra.jpg`,
    voidColor: '#07100b',
  },
  praia_litoral_oceano: {
    accentColor: '#7bd9e8',
    backdrop: `${BASE_PATH}/praia_litoral_oceano/topdown_generic_praia_litoral_oceano.svg`,
    glowColor: 'rgba(102, 219, 239, 0.26)',
    id: 'praia_litoral_oceano',
    label: 'Praia / Litoral / Oceano',
    ultraBackdrop: `${ULTRA_BASE_PATH}/praia_litoral_oceano/cinematic_praia_litoral_oceano_ultra.jpg`,
    voidColor: '#031016',
  },
  montanhas_vazio_sereno: {
    accentColor: '#dce7ef',
    backdrop: `${BASE_PATH}/montanhas_vazio_sereno/topdown_generic_montanhas_vazio_sereno.svg`,
    glowColor: 'rgba(214, 228, 240, 0.2)',
    id: 'montanhas_vazio_sereno',
    label: 'Montanhas do Vazio Sereno',
    ultraBackdrop: `${ULTRA_BASE_PATH}/montanhas_vazio_sereno/cinematic_montanhas_vazio_sereno_ultra.jpg`,
    voidColor: '#070a0f',
  },
  floresta_mistica: {
    accentColor: '#a8ff62',
    backdrop: `${BASE_PATH}/floresta_mistica/topdown_generic_floresta_mistica.svg`,
    glowColor: 'rgba(138, 255, 112, 0.22)',
    id: 'floresta_mistica',
    label: 'Floresta Mistica',
    ultraBackdrop: `${ULTRA_BASE_PATH}/floresta_mistica/cinematic_floresta_mistica_ultra.jpg`,
    voidColor: '#061108',
  },
  vulcao_terras_cinzentas: {
    accentColor: '#ff7a3d',
    backdrop: `${BASE_PATH}/vulcao_terras_cinzentas/topdown_generic_vulcao_terras_cinzentas.svg`,
    glowColor: 'rgba(255, 103, 38, 0.25)',
    id: 'vulcao_terras_cinzentas',
    label: 'Vulcao / Terras Cinzentas',
    ultraBackdrop: `${ULTRA_BASE_PATH}/vulcao_terras_cinzentas/cinematic_vulcao_terras_cinzentas_ultra.jpg`,
    voidColor: '#120704',
  },
  regiao_congelada_neve: {
    accentColor: '#c9f7ff',
    backdrop: `${BASE_PATH}/regiao_congelada_neve/topdown_generic_regiao_congelada_neve.svg`,
    glowColor: 'rgba(188, 241, 255, 0.24)',
    id: 'regiao_congelada_neve',
    label: 'Regiao Congelada / Neve',
    ultraBackdrop: `${ULTRA_BASE_PATH}/regiao_congelada_neve/cinematic_regiao_congelada_neve_ultra.jpg`,
    voidColor: '#041018',
  },
  ruinas_antigas: {
    accentColor: '#d2a7ff',
    backdrop: `${BASE_PATH}/ruinas_antigas/topdown_generic_ruinas_antigas.svg`,
    glowColor: 'rgba(186, 126, 255, 0.22)',
    id: 'ruinas_antigas',
    label: 'Ruinas Antigas',
    ultraBackdrop: `${ULTRA_BASE_PATH}/ruinas_antigas/cinematic_ruinas_antigas_ultra.jpg`,
    voidColor: '#0a0711',
  },
  vale_cinzento_veu: {
    accentColor: '#c08f73',
    backdrop: `${BASE_PATH}/vale_cinzento_veu/topdown_generic_vale_cinzento_veu.svg`,
    glowColor: 'rgba(192, 143, 115, 0.2)',
    id: 'vale_cinzento_veu',
    label: 'Vale Cinzento / Veu Cinza',
    ultraBackdrop: `${ULTRA_BASE_PATH}/vale_cinzento_veu/cinematic_vale_cinzento_veu_ultra.jpg`,
    voidColor: '#0d0d0c',
  },
}

export function resolveBiomeCinematicAsset(biomeId?: string): BiomeCinematicAsset {
  if (!biomeId) {
    return NEUTRAL_ASSET
  }

  return BIOME_CINEMATIC_ASSETS[biomeId as BiomeVisualId] ?? NEUTRAL_ASSET
}

export function resolveBiomeCinematicBackdrop(
  asset: BiomeCinematicAsset,
  quality: VisualQualityMode,
) {
  return quality === 'ultra' ? asset.ultraBackdrop : asset.backdrop
}
