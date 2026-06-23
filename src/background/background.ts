import type { BackgroundMessage, GetCurrentTabsResponse } from '../types'

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' })
})

// Keyboard shortcut: open the popup so the user can name and save tabs.
// Phase 2 will add a headless "silent save" mode here.
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-current-tabs') {
    chrome.action.openPopup()
  }
})

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'GET_CURRENT_TABS': {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          const response: GetCurrentTabsResponse = { tabs }
          sendResponse(response)
        })
        return true // keep channel open for async sendResponse
      }

      case 'CLOSE_TABS': {
        closeTabsSafely(message.tabIds).then(() => sendResponse({ ok: true }))
        return true
      }

      case 'OPEN_URLS': {
        openUrls(message.urls, message.newWindow ?? false).then(() =>
          sendResponse({ ok: true }),
        )
        return true
      }
    }
  },
)

async function closeTabsSafely(tabIds: number[]): Promise<void> {
  // Re-query which tabs still exist right before closing — a tab may have
  // closed itself between the user clicking "Save & Close" and now.
  const existing = await chrome.tabs.query({ currentWindow: true })
  const existingIds = new Set(existing.map((t) => t.id))
  const toClose = tabIds.filter((id) => existingIds.has(id))
  if (toClose.length > 0) {
    await chrome.tabs.remove(toClose)
  }
}

async function openUrls(urls: string[], newWindow: boolean): Promise<void> {
  if (urls.length === 0) return

  if (newWindow) {
    await chrome.windows.create({ url: urls, focused: true })
    return
  }

  const created = await Promise.all(urls.map((url) => chrome.tabs.create({ url, active: false })))
  const firstId = created[0]?.id
  if (firstId != null) {
    await chrome.tabs.update(firstId, { active: true })
  }
}
