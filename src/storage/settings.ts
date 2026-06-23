export interface Settings {
  defaultSortOrder: 'lastOpened' | 'created' | 'name'
}

const DEFAULTS: Settings = {
  defaultSortOrder: 'lastOpened',
}

export function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      resolve({ ...DEFAULTS, ...(result['settings'] ?? {}) })
    })
  })
}

export function saveSettings(patch: Partial<Settings>): Promise<void> {
  return getSettings().then(
    (current) =>
      new Promise((resolve, reject) => {
        chrome.storage.local.set({ settings: { ...current, ...patch } }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      }),
  )
}
