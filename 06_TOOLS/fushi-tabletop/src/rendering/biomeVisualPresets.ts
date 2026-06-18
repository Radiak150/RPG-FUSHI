export type BiomeVisualId =
  | 'planicie_floresta_inicial'
  | 'praia_litoral_oceano'
  | 'montanhas_vazio_sereno'
  | 'floresta_mistica'
  | 'vulcao_terras_cinzentas'
  | 'regiao_congelada_neve'
  | 'ruinas_antigas'
  | 'vale_cinzento_veu'
  | 'neutral'

export interface BiomeVisualPreset {
  id: BiomeVisualId
  label: string
  accent: number
  secondary: number
  wash: string
  moteCount: number
  moteSpeed: number
  moteSize: [number, number]
  drift: {
    x: number
    y: number
  }
}

const NEUTRAL_PRESET: BiomeVisualPreset = {
  id: 'neutral',
  label: 'Neutro',
  accent: 0x92c0b6,
  secondary: 0xd1b182,
  wash:
    'radial-gradient(circle at 52% 42%, rgba(146, 192, 182, 0.08), transparent 54%)',
  moteCount: 18,
  moteSpeed: 0.12,
  moteSize: [1.2, 3.4],
  drift: { x: 0.14, y: -0.06 },
}

export const BIOME_VISUAL_PRESETS: Record<BiomeVisualId, BiomeVisualPreset> = {
  neutral: NEUTRAL_PRESET,
  planicie_floresta_inicial: {
    id: 'planicie_floresta_inicial',
    label: 'Planicie / Floresta Inicial',
    accent: 0xb5d99a,
    secondary: 0xf1c978,
    wash:
      'radial-gradient(circle at 45% 68%, rgba(142, 188, 116, 0.14), transparent 56%)',
    moteCount: 24,
    moteSpeed: 0.1,
    moteSize: [1.4, 3.8],
    drift: { x: 0.16, y: -0.08 },
  },
  praia_litoral_oceano: {
    id: 'praia_litoral_oceano',
    label: 'Praia / Litoral / Oceano',
    accent: 0x7bd9e8,
    secondary: 0xe8d6a3,
    wash:
      'radial-gradient(circle at 24% 70%, rgba(101, 210, 224, 0.14), transparent 58%)',
    moteCount: 20,
    moteSpeed: 0.14,
    moteSize: [1.2, 3.2],
    drift: { x: 0.2, y: -0.03 },
  },
  montanhas_vazio_sereno: {
    id: 'montanhas_vazio_sereno',
    label: 'Montanhas do Vazio Sereno',
    accent: 0xdce7ef,
    secondary: 0xbec8d6,
    wash:
      'radial-gradient(circle at 50% 28%, rgba(220, 231, 239, 0.12), transparent 58%)',
    moteCount: 18,
    moteSpeed: 0.12,
    moteSize: [1, 2.8],
    drift: { x: 0.22, y: -0.1 },
  },
  floresta_mistica: {
    id: 'floresta_mistica',
    label: 'Floresta Mistica',
    accent: 0xa8ff62,
    secondary: 0x7de7dd,
    wash:
      'radial-gradient(circle at 50% 48%, rgba(160, 255, 98, 0.16), transparent 54%)',
    moteCount: 34,
    moteSpeed: 0.08,
    moteSize: [1.4, 4.2],
    drift: { x: 0.08, y: -0.1 },
  },
  vulcao_terras_cinzentas: {
    id: 'vulcao_terras_cinzentas',
    label: 'Vulcao / Terras Cinzentas',
    accent: 0xff7a3d,
    secondary: 0xffc857,
    wash:
      'radial-gradient(circle at 58% 42%, rgba(255, 111, 57, 0.16), transparent 56%)',
    moteCount: 32,
    moteSpeed: 0.2,
    moteSize: [1.6, 4.8],
    drift: { x: 0.12, y: -0.24 },
  },
  regiao_congelada_neve: {
    id: 'regiao_congelada_neve',
    label: 'Regiao Congelada / Neve',
    accent: 0xc9f7ff,
    secondary: 0x8fc7df,
    wash:
      'radial-gradient(circle at 62% 34%, rgba(201, 247, 255, 0.16), transparent 58%)',
    moteCount: 28,
    moteSpeed: 0.1,
    moteSize: [1.4, 4],
    drift: { x: 0.14, y: 0.08 },
  },
  ruinas_antigas: {
    id: 'ruinas_antigas',
    label: 'Ruinas Antigas',
    accent: 0xd2a7ff,
    secondary: 0x9a7be7,
    wash:
      'radial-gradient(circle at 52% 56%, rgba(187, 126, 255, 0.15), transparent 56%)',
    moteCount: 26,
    moteSpeed: 0.09,
    moteSize: [1.2, 3.8],
    drift: { x: -0.04, y: -0.12 },
  },
  vale_cinzento_veu: {
    id: 'vale_cinzento_veu',
    label: 'Vale Cinzento / Veu Cinza',
    accent: 0xc08f73,
    secondary: 0x9ea5ab,
    wash:
      'radial-gradient(circle at 50% 68%, rgba(192, 143, 115, 0.13), transparent 58%)',
    moteCount: 22,
    moteSpeed: 0.11,
    moteSize: [1.2, 3.4],
    drift: { x: 0.1, y: -0.08 },
  },
}

export function resolveBiomeVisualPreset(biomeId?: string): BiomeVisualPreset {
  if (!biomeId) {
    return NEUTRAL_PRESET
  }

  return BIOME_VISUAL_PRESETS[biomeId as BiomeVisualId] ?? NEUTRAL_PRESET
}
