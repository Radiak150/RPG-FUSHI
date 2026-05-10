import type { AttributeKey, CharacterSkill } from '../data/types'

interface SkillCatalogItem {
  id: string
  nome: string
  atributoBase: AttributeKey
  bonusPericia: number
}

const skillCatalog: SkillCatalogItem[] = [
  { id: 'skill-acrobacia', nome: 'Acrobacia+', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-adestramento', nome: 'Adestramento*', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-artes', nome: 'Artes*', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-atletismo', nome: 'Atletismo', atributoBase: 'forca', bonusPericia: 0 },
  { id: 'skill-atualidades', nome: 'Atualidades', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-ciencias', nome: 'Ciencias*', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-crime', nome: 'Crime*+', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-diplomacia', nome: 'Diplomacia', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-enganacao', nome: 'Enganacao', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-fortitude', nome: 'Fortitude', atributoBase: 'vigor', bonusPericia: 0 },
  { id: 'skill-furtividade', nome: 'Furtividade+', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-iniciativa', nome: 'Iniciativa', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-intimidacao', nome: 'Intimidacao', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-intuicao', nome: 'Intuicao', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-investigacao', nome: 'Investigacao', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-luta', nome: 'Luta', atributoBase: 'forca', bonusPericia: 0 },
  { id: 'skill-medicina', nome: 'Medicina', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-ocultismo', nome: 'Ocultismo*', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-percepcao', nome: 'Percepcao', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-pilotagem', nome: 'Pilotagem*', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-pontaria', nome: 'Pontaria', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-profissao', nome: 'Profissao*', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-reflexos', nome: 'Reflexos', atributoBase: 'agilidade', bonusPericia: 0 },
  { id: 'skill-religiao', nome: 'Religiao*', atributoBase: 'presenca', bonusPericia: 0 },
  { id: 'skill-sobrevivencia', nome: 'Sobrevivencia', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-tatica', nome: 'Tatica*', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-tecnologia', nome: 'Tecnologia*', atributoBase: 'intelecto', bonusPericia: 0 },
  { id: 'skill-vontade', nome: 'Vontade', atributoBase: 'presenca', bonusPericia: 0 },
]

function normalizeSkillName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function createDefaultSkills(): CharacterSkill[] {
  return skillCatalog.map((item) => ({
    id: item.id,
    nome: item.nome,
    atributoBase: item.atributoBase,
    bonusPericia: item.bonusPericia,
    resumo: '',
  }))
}

export function ensureGeneralSkills(skills: CharacterSkill[]) {
  const byId = new Map(skills.map((skill) => [skill.id, skill]))
  const byName = new Map(
    skills.map((skill) => [normalizeSkillName(skill.nome), skill]),
  )

  return skillCatalog.map((catalogSkill) => {
    const existingSkill =
      byId.get(catalogSkill.id) ??
      byName.get(normalizeSkillName(catalogSkill.nome)) ??
      null

    return {
      id: catalogSkill.id,
      nome: catalogSkill.nome,
      atributoBase: catalogSkill.atributoBase,
      bonusPericia: existingSkill?.bonusPericia ?? catalogSkill.bonusPericia,
      resumo: existingSkill?.resumo ?? '',
    }
  })
}
