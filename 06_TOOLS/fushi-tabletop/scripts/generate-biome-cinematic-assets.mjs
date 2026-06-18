import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputRoot = path.join(root, 'public', 'assets', 'biomes', '8-biomas')

const biomes = [
  {
    id: 'neutral',
    label: 'Neutro',
    base: '#071014',
    deep: '#020407',
    glow: '#7fc6ba',
    accent: '#d4b889',
    secondary: '#40545b',
    pattern: 'neutral',
  },
  {
    id: 'planicie_floresta_inicial',
    label: 'Planicie / Floresta Inicial',
    base: '#0f2212',
    deep: '#041006',
    glow: '#9ad06f',
    accent: '#e0bb64',
    secondary: '#426c3c',
    pattern: 'grass',
  },
  {
    id: 'praia_litoral_oceano',
    label: 'Praia / Litoral / Oceano',
    base: '#07364a',
    deep: '#021017',
    glow: '#24d8f2',
    accent: '#d4b36f',
    secondary: '#0c6f87',
    pattern: 'water',
  },
  {
    id: 'montanhas_vazio_sereno',
    label: 'Montanhas do Vazio Sereno',
    base: '#1b2228',
    deep: '#06080d',
    glow: '#dce7ef',
    accent: '#8ea4bd',
    secondary: '#34424f',
    pattern: 'mountain',
  },
  {
    id: 'floresta_mistica',
    label: 'Floresta Mistica',
    base: '#082011',
    deep: '#020b05',
    glow: '#92ff66',
    accent: '#56e5d3',
    secondary: '#244f35',
    pattern: 'forest',
  },
  {
    id: 'vulcao_terras_cinzentas',
    label: 'Vulcao / Terras Cinzentas',
    base: '#20100c',
    deep: '#080303',
    glow: '#ff5a22',
    accent: '#ffc34c',
    secondary: '#573127',
    pattern: 'volcano',
  },
  {
    id: 'regiao_congelada_neve',
    label: 'Regiao Congelada / Neve',
    base: '#0a2633',
    deep: '#030911',
    glow: '#bdf5ff',
    accent: '#edf8ff',
    secondary: '#2b6d89',
    pattern: 'ice',
  },
  {
    id: 'ruinas_antigas',
    label: 'Ruinas Antigas',
    base: '#17111f',
    deep: '#05030a',
    glow: '#b987ff',
    accent: '#d4bd7c',
    secondary: '#3f3350',
    pattern: 'ruins',
  },
  {
    id: 'vale_cinzento_veu',
    label: 'Vale Cinzento / Veu Cinza',
    base: '#161616',
    deep: '#050505',
    glow: '#b18f7c',
    accent: '#6fd2d5',
    secondary: '#3c3f42',
    pattern: 'veil',
  },
]

function pathBands(biome, seedOffset = 0) {
  return Array.from({ length: 9 }, (_, index) => {
    const y = 90 + index * 130 + ((index * 47 + seedOffset) % 70)
    const curve = 80 + ((index * 31 + seedOffset) % 120)
    const opacity = 0.08 + (index % 4) * 0.025
    return `<path d="M -80 ${y} C 260 ${y - curve}, 430 ${y + curve}, 720 ${y - 22} S 1190 ${y - curve}, 1450 ${y + 16} S 1780 ${y + curve}, 2160 ${y - 38}" fill="none" stroke="${biome.accent}" stroke-width="${18 + (index % 3) * 12}" stroke-linecap="round" opacity="${opacity.toFixed(3)}"/>`
  }).join('\n')
}

function scatter(biome, shape) {
  return Array.from({ length: 44 }, (_, index) => {
    const x = (index * 181) % 2048
    const y = (index * 313) % 1280
    const size = 16 + ((index * 37) % 86)
    const opacity = 0.05 + ((index * 19) % 24) / 200

    if (shape === 'crack') {
      return `<path d="M ${x} ${y} l ${size * 0.35} ${-size * 0.18} l ${size * 0.22} ${size * 0.12} l ${size * 0.4} ${-size * 0.26}" fill="none" stroke="${index % 3 === 0 ? biome.glow : biome.accent}" stroke-width="${1.2 + (index % 4)}" opacity="${opacity.toFixed(3)}"/>`
    }

    if (shape === 'ring') {
      return `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size * 0.42}" fill="none" stroke="${index % 2 === 0 ? biome.glow : biome.secondary}" stroke-width="${2 + (index % 4)}" opacity="${opacity.toFixed(3)}" transform="rotate(${(index * 29) % 180} ${x} ${y})"/>`
    }

    return `<circle cx="${x}" cy="${y}" r="${size * 0.35}" fill="${index % 2 === 0 ? biome.secondary : biome.glow}" opacity="${opacity.toFixed(3)}"/>`
  }).join('\n')
}

function patternLayer(biome) {
  if (biome.pattern === 'water') {
    return `
      <g filter="url(#softGlow)">
        ${pathBands(biome, 13)}
        ${scatter(biome, 'ring')}
      </g>
      <g opacity="0.38">
        <path d="M 80 1100 C 360 930, 600 1200, 930 980 S 1520 900, 1990 1120" fill="none" stroke="#f4fbff" stroke-width="11" stroke-linecap="round" opacity="0.16"/>
        <path d="M 110 180 C 480 300, 700 40, 1040 210 S 1560 340, 1960 160" fill="none" stroke="#f4fbff" stroke-width="9" stroke-linecap="round" opacity="0.12"/>
        <ellipse cx="340" cy="1060" rx="155" ry="82" fill="none" stroke="#ffffff" stroke-width="9" opacity="0.11" transform="rotate(-28 340 1060)"/>
        <ellipse cx="1680" cy="260" rx="170" ry="92" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.1" transform="rotate(32 1680 260)"/>
      </g>`
  }

  if (biome.pattern === 'volcano') {
    return `
      <g filter="url(#moltenGlow)">
        <path d="M -30 830 C 310 660, 530 850, 790 700 S 1340 480, 2090 610" fill="none" stroke="${biome.glow}" stroke-width="74" stroke-linecap="round" opacity="0.38"/>
        <path d="M 240 -60 C 420 230, 280 420, 510 650 S 860 960, 720 1360" fill="none" stroke="${biome.accent}" stroke-width="42" stroke-linecap="round" opacity="0.34"/>
        ${scatter(biome, 'crack')}
      </g>`
  }

  if (biome.pattern === 'ice') {
    return `
      <g filter="url(#softGlow)">
        ${scatter(biome, 'crack')}
        <path d="M 120 1040 L 510 700 L 480 430 L 880 720 L 1260 340 L 1330 690 L 1900 480" fill="none" stroke="#ecfbff" stroke-width="5" opacity="0.2"/>
        <path d="M 160 210 L 520 360 L 840 160 L 1090 420 L 1540 180 L 1900 300" fill="none" stroke="${biome.glow}" stroke-width="4" opacity="0.18"/>
      </g>`
  }

  if (biome.pattern === 'ruins') {
    return `
      <g opacity="0.34">
        ${Array.from({ length: 11 }, (_, index) => `<rect x="${160 + index * 170}" y="${180 + ((index * 53) % 740)}" width="${120 + (index % 3) * 60}" height="${80 + (index % 4) * 30}" fill="none" stroke="${biome.accent}" stroke-width="5" opacity="${0.08 + (index % 4) * 0.03}" transform="rotate(${(index * 17) % 24 - 12} ${220 + index * 170} ${220 + ((index * 53) % 740)})"/>`).join('\n')}
        ${scatter(biome, 'ring')}
      </g>`
  }

  if (biome.pattern === 'mountain') {
    return `
      <g opacity="0.42">
        ${Array.from({ length: 14 }, (_, index) => {
          const x = -80 + index * 165
          const y = 220 + ((index * 97) % 760)
          return `<path d="M ${x} ${y + 210} L ${x + 140} ${y - 90} L ${x + 300} ${y + 230} Z" fill="${index % 2 === 0 ? biome.secondary : biome.base}" stroke="${biome.glow}" stroke-width="3" opacity="${0.12 + (index % 3) * 0.035}"/>`
        }).join('\n')}
        ${pathBands(biome, 41)}
      </g>`
  }

  if (biome.pattern === 'forest') {
    return `
      <g filter="url(#softGlow)">
        ${pathBands(biome, 77)}
        ${Array.from({ length: 58 }, (_, index) => {
          const x = (index * 151) % 2048
          const y = (index * 269) % 1280
          const r = 28 + ((index * 17) % 82)
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 3 === 0 ? biome.glow : biome.secondary}" opacity="${0.035 + (index % 5) * 0.012}"/>`
        }).join('\n')}
      </g>`
  }

  if (biome.pattern === 'grass') {
    return `
      <g>
        ${pathBands(biome, 5)}
        <path d="M 0 780 C 360 640, 720 690, 1040 520 S 1620 390, 2070 510" fill="none" stroke="${biome.secondary}" stroke-width="120" stroke-linecap="round" opacity="0.16"/>
        ${scatter(biome, 'dot')}
      </g>`
  }

  if (biome.pattern === 'veil') {
    return `
      <g filter="url(#softGlow)">
        ${pathBands(biome, 99)}
        <path d="M -40 260 C 330 520, 520 220, 880 410 S 1430 690, 2100 460" fill="none" stroke="${biome.glow}" stroke-width="34" stroke-linecap="round" opacity="0.16"/>
        ${scatter(biome, 'crack')}
      </g>`
  }

  return `${pathBands(biome, 31)}${scatter(biome, 'ring')}`
}

function svgForBiome(biome) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1280" role="img" aria-label="${biome.label}">
  <defs>
    <radialGradient id="core" cx="50%" cy="50%" r="68%">
      <stop offset="0%" stop-color="${biome.glow}" stop-opacity="0.48"/>
      <stop offset="34%" stop-color="${biome.base}" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="${biome.deep}" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="edge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${biome.deep}" stop-opacity="0.88"/>
      <stop offset="42%" stop-color="${biome.base}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${biome.deep}" stop-opacity="0.86"/>
    </linearGradient>
    <filter id="terrainNoise" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.017" numOctaves="5" seed="37"/>
      <feColorMatrix type="saturate" values="0.7"/>
      <feBlend mode="screen" in2="SourceGraphic"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="moltenGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1.4 0 0 0 0 0 0.8 0 0 0 0 0 0.2 0 0 0 0 0 0.85 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="gridHint" width="128" height="128" patternUnits="userSpaceOnUse">
      <path d="M 128 0 L 0 0 0 128" fill="none" stroke="#f4efe5" stroke-width="1.2" opacity="0.055"/>
    </pattern>
  </defs>
  <rect width="2048" height="1280" fill="url(#core)"/>
  <rect width="2048" height="1280" fill="${biome.base}" filter="url(#terrainNoise)" opacity="0.38"/>
  ${patternLayer(biome)}
  <ellipse cx="1024" cy="640" rx="770" ry="420" fill="${biome.glow}" opacity="0.07"/>
  <rect width="2048" height="1280" fill="url(#gridHint)"/>
  <rect width="2048" height="1280" fill="url(#edge)"/>
</svg>`
}

await mkdir(outputRoot, { recursive: true })

await Promise.all(
  biomes.map(async (biome) => {
    const biomeDir = path.join(outputRoot, biome.id)
    await mkdir(biomeDir, { recursive: true })
    await writeFile(
      path.join(biomeDir, `topdown_generic_${biome.id}.svg`),
      svgForBiome(biome),
      'utf8',
    )
  }),
)

const readme = `# Oito biomas cinematics

Assets genericos e leves para fundo/ambientacao por bioma no tabletop.
Eles nao representam pontos oficiais do MUN; servem como base visual, fundo e material de expansao de dominio.

Gerado por scripts/generate-biome-cinematic-assets.mjs.
`

await writeFile(path.join(outputRoot, 'README.md'), readme, 'utf8')
