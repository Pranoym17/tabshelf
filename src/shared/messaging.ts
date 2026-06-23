import type { BackgroundMessage, GetCurrentTabsResponse } from '../types'

export function sendToBackground<R = { ok: boolean }>(
  message: BackgroundMessage,
): Promise<R> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: R) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(response)
      }
    })
  })
}

export function getCurrentTabs(): Promise<chrome.tabs.Tab[]> {
  return sendToBackground<GetCurrentTabsResponse>({ type: 'GET_CURRENT_TABS' }).then(
    (r) => r.tabs,
  )
}

export function closeTabs(tabIds: number[]): Promise<void> {
  return sendToBackground({ type: 'CLOSE_TABS', tabIds }).then(() => undefined)
}

export function openUrls(urls: string[], newWindow = false): Promise<void> {
  return sendToBackground({ type: 'OPEN_URLS', urls, newWindow }).then(() => undefined)
}
