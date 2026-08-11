const STORAGE_KEY = 'jj:dark-mode-v2'
const LEGACY_STORAGE_KEY = 'jj:dark-mode'

const TOKENS = {
  light: {
    '--jj-blue-soft': '#eaf2ff',
    '--jj-text': '#252933',
    '--jj-text-2': '#515767',
    '--jj-text-3': '#8a919f',
    '--jj-text-4': '#c9cdd4',
    '--jj-line': '#e5e6eb',
    '--jj-surface': '#ffffff',
    '--jj-bg': '#f4f5f5',
    '--jj-fill': '#f2f3f5',
    '--jj-fill-2': '#f7f8fa'
  },
  dark: {
    '--jj-blue-soft': 'rgba(30, 128, 255, 0.18)',
    '--jj-text': '#f2f3f5',
    '--jj-text-2': '#c9cdd4',
    '--jj-text-3': '#8f959e',
    '--jj-text-4': '#6b7280',
    '--jj-line': '#333438',
    '--jj-surface': '#17181a',
    '--jj-bg': '#111214',
    '--jj-fill': '#25262a',
    '--jj-fill-2': '#202125'
  }
}

function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

function getSystemTheme() {
  const system = wx.getAppBaseInfo
    ? wx.getAppBaseInfo()
    : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : {})
  return normalizeTheme(system.theme)
}

function getPreference() {
  const stored = wx.getStorageSync(STORAGE_KEY)
  if (stored && typeof stored === 'object') {
    return {
      followSystem: Boolean(stored.followSystem),
      selected: normalizeTheme(stored.selected)
    }
  }

  const legacy = wx.getStorageSync(LEGACY_STORAGE_KEY)
  if (legacy !== '') {
    return { followSystem: false, selected: legacy ? 'dark' : 'light' }
  }
  return { followSystem: true, selected: getSystemTheme() }
}

function resolveTheme(preference, systemTheme) {
  const current = preference || { followSystem: true, selected: 'light' }
  return current.followSystem
    ? normalizeTheme(systemTheme)
    : normalizeTheme(current.selected)
}

function getResolvedTheme() {
  return resolveTheme(getPreference(), getSystemTheme())
}

function createThemeData(theme, data) {
  const nextTheme = normalizeTheme(theme)
  const tokens = TOKENS[nextTheme]
  const themeData = {
    themeName: nextTheme,
    themePageStyle: Object.keys(tokens).map((name) => `${name}:${tokens[name]}`).join(';'),
    themeBackgroundColor: tokens['--jj-bg'],
    themeBackgroundTextStyle: nextTheme === 'dark' ? 'light' : 'dark'
  }
  if (data && Object.prototype.hasOwnProperty.call(data, 'darkMode')) {
    themeData.darkMode = nextTheme === 'dark'
  }
  return themeData
}

function applyNativeTheme(theme) {
  const dark = normalizeTheme(theme) === 'dark'
  wx.setNavigationBarColor({
    backgroundColor: dark ? '#17181a' : '#ffffff',
    frontColor: dark ? '#ffffff' : '#000000'
  })
  if (wx.setBackgroundColor) {
    wx.setBackgroundColor({
      backgroundColor: dark ? '#111214' : '#f4f5f5',
      backgroundColorTop: dark ? '#111214' : '#f4f5f5',
      backgroundColorBottom: dark ? '#111214' : '#f4f5f5'
    })
  }
}

function syncPage(page, theme) {
  if (!page || !page.setData) return
  const nextTheme = normalizeTheme(theme || getResolvedTheme())
  page.setData(createThemeData(nextTheme, page.data))
  const tabBar = page.getTabBar && page.getTabBar()
  if (tabBar && tabBar.syncSelected) tabBar.syncSelected()
}

function broadcastTheme(theme) {
  const nextTheme = normalizeTheme(theme)
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  pages.forEach((page) => syncPage(page, nextTheme))
  applyNativeTheme(nextTheme)
}

function updateAppTheme(theme, preference) {
  if (typeof getApp !== 'function') return
  const app = getApp()
  if (!app || !app.globalData) return
  app.globalData.theme = normalizeTheme(theme)
  app.globalData.themePreference = preference || getPreference()
}

function setPreference(preference) {
  const current = getPreference()
  const next = {
    followSystem: Boolean(preference && preference.followSystem),
    selected: normalizeTheme(preference && preference.selected || current.selected)
  }
  wx.setStorageSync(STORAGE_KEY, next)
  wx.setStorageSync(LEGACY_STORAGE_KEY, resolveTheme(next, getSystemTheme()) === 'dark')
  const theme = resolveTheme(next, getSystemTheme())
  updateAppTheme(theme, next)
  broadcastTheme(theme)
  return theme
}

function initialize(app, systemInfo) {
  const preference = getPreference()
  const systemTheme = normalizeTheme(systemInfo && systemInfo.theme || getSystemTheme())
  const theme = resolveTheme(preference, systemTheme)
  app.globalData.themePreference = preference
  app.globalData.theme = theme

  if (wx.onThemeChange) {
    wx.onThemeChange(({ theme: changedTheme }) => {
      const latestPreference = getPreference()
      if (!latestPreference.followSystem) return
      const nextTheme = resolveTheme(latestPreference, changedTheme)
      updateAppTheme(nextTheme, latestPreference)
      broadcastTheme(nextTheme)
    })
  }
}

function withTheme(options, settings) {
  const config = Object.assign({}, options)
  config.data = Object.assign({}, options.data, createThemeData(getResolvedTheme(), options.data))
  const onLoad = options.onLoad
  const onShow = options.onShow
  config.onLoad = function themedOnLoad(query) {
    const app = typeof getApp === 'function' ? getApp() : null
    if (!(settings && settings.skipDisclaimer) && app && app.requireDisclaimer && !app.requireDisclaimer(this.route, query)) {
      this.__disclaimerBlocked = true
      return
    }
    if (onLoad) return onLoad.apply(this, arguments)
  }
  config.onShow = function themedOnShow() {
    if (this.__disclaimerBlocked) {
      const app = typeof getApp === 'function' ? getApp() : null
      if (app && app.requireDisclaimer) app.requireDisclaimer(this.route)
      return
    }
    const theme = getResolvedTheme()
    syncPage(this, theme)
    applyNativeTheme(theme)
    if (onShow) return onShow.apply(this, arguments)
  }
  return config
}

module.exports = {
  STORAGE_KEY,
  createThemeData,
  getPreference,
  getResolvedTheme,
  initialize,
  resolveTheme,
  setPreference,
  syncPage,
  withTheme
}
