export type ThemeMode = 'obsidian' | 'mist'

export interface ProductPreferences {
  theme: ThemeMode
  showModuleDescriptions: boolean
}

const PRODUCT_PREFERENCES_STORAGE_KEY = 'fushi-tabletop:product-preferences:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function getDefaultProductPreferences(): ProductPreferences {
  return {
    theme: 'obsidian',
    showModuleDescriptions: false,
  }
}

export function readProductPreferences(): ProductPreferences {
  const rawValue = readStorageItem(PRODUCT_PREFERENCES_STORAGE_KEY)

  if (!rawValue) {
    return getDefaultProductPreferences()
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown

    if (!isRecord(parsedValue)) {
      return getDefaultProductPreferences()
    }

    return {
      theme: parsedValue.theme === 'mist' ? 'mist' : 'obsidian',
      showModuleDescriptions:
        typeof parsedValue.showModuleDescriptions === 'boolean'
          ? parsedValue.showModuleDescriptions
          : false,
    }
  } catch {
    return getDefaultProductPreferences()
  }
}

export function writeProductPreferences(preferences: ProductPreferences) {
  writeStorageItem(
    PRODUCT_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  )
}
