const COMBAT_V2_BLOCK_CAP = 15

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCombatV2Profile(character) {
  const current = character?.combatProfile ?? {}
  const profile = {
    ...current,
    podeEsquivar: current.podeEsquivar !== false,
    versao: 2,
  }

  if (current.bloqueioCap !== undefined) {
    const requestedCap = Number(current.bloqueioCap) || COMBAT_V2_BLOCK_CAP
    profile.bloqueioCap = Math.max(0, Math.min(COMBAT_V2_BLOCK_CAP, Math.round(requestedCap)))
  }

  return profile
}

function getSkillBonus(character, skillName) {
  const target = normalizeText(skillName)
  const skill = (character?.pericias ?? []).find((entry) => normalizeText(entry?.nome) === target)

  return Math.max(0, Math.round(Number(skill?.bonusPericia ?? 0) || 0))
}

function getCombatV2Block(character) {
  const profile = getCombatV2Profile(character)
  const bonus = Math.max(0, Math.round(Number(profile.bloqueioBonus ?? 0) || 0))
  const buildBonus = Math.max(
    0,
    Math.round(
      Number(
        profile.build?.totals?.block ??
          profile.build?.item?.modifiers?.block ??
          0,
      ) || 0,
    ),
  )
  const cap = profile.bloqueioCap ?? COMBAT_V2_BLOCK_CAP

  return Math.max(0, Math.min(cap, getSkillBonus(character, 'Fortitude') + bonus) + buildBonus)
}

function getCombatV2Dodge(character) {
  const profile = getCombatV2Profile(character)
  if (profile.podeEsquivar === false) return null

  const ca = Math.max(0, Math.round(Number(character?.defesa ?? 0) || 0))
  const agility = Math.max(0, Math.round(Number(character?.atributos?.agilidade ?? 0) || 0))

  return ca + agility + getSkillBonus(character, 'Reflexos')
}

function getAttributeRollContract(attributeValue, skillBonus = 0) {
  const attribute = Math.max(0, Math.round(Number(attributeValue) || 0))

  return {
    bonus: Math.round(Number(skillBonus) || 0),
    mode: attribute === 0 ? 'lowest' : 'highest',
    quantity: attribute === 0 ? 2 : attribute,
    sides: 20,
  }
}

module.exports = {
  COMBAT_V2_BLOCK_CAP,
  getAttributeRollContract,
  getCombatV2Block,
  getCombatV2Dodge,
  getCombatV2Profile,
  getSkillBonus,
}
