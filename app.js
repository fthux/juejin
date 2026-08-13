const theme = require('./utils/theme.js')

const DISCLAIMER_PATH = 'pages/disclaimer/disclaimer'
const LAUNCH_PATH = 'pages/launch/launch'
const HOME_PATH = 'pages/index/index'

function normalizePath(path) {
  return String(path || '').replace(/^\/+/, '')
}

function copyQuery(query) {
  return Object.keys(query || {}).reduce((result, key) => {
    const value = query[key]
    if (value !== undefined && value !== null) result[key] = String(value)
    return result
  }, {})
}

App({
  onLaunch(options) {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    wx.removeStorageSync('jj:session')
    wx.removeStorageSync('jj:passport-cookies')
    wx.removeStorageSync('jj:article-cache')

    this.globalData.systemInfo = systemInfo
    theme.initialize(this, systemInfo)
    this.captureEntry(options)
  },

  onShow(options) {
    this.globalData.foregroundSequence += 1
    this.captureEntry(options)
  },

  captureEntry(options) {
    if (this.globalData.disclaimerAcknowledged) return
    const path = normalizePath(options && options.path)
    if (!path || path === DISCLAIMER_PATH || path === LAUNCH_PATH) return
    this.globalData.pendingEntry = {
      path,
      query: copyQuery(options && options.query)
    }
  },

  requireDisclaimer(path, query) {
    const route = normalizePath(path)
    if (this.globalData.disclaimerAcknowledged || route === DISCLAIMER_PATH) return true

    if (route && route !== LAUNCH_PATH) {
      this.globalData.pendingEntry = { path: route, query: copyQuery(query) }
    }

    if (!this.globalData.disclaimerRedirecting) {
      this.globalData.disclaimerRedirecting = true
      wx.reLaunch({
        url: `/${DISCLAIMER_PATH}`,
        complete: () => {
          this.globalData.disclaimerRedirecting = false
        }
      })
    }
    return false
  },

  acknowledgeDisclaimer() {
    this.globalData.disclaimerAcknowledged = true
    this.globalData.disclaimerRedirecting = false
  },

  consumePendingEntry() {
    const entry = this.globalData.pendingEntry
    this.globalData.pendingEntry = null
    return entry || { path: HOME_PATH, query: {} }
  },

  createEntryUrl(entry) {
    const path = normalizePath(entry && entry.path) || HOME_PATH
    const query = entry && entry.query || {}
    const search = Object.keys(query)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&')
    return `/${path}${search ? `?${search}` : ''}`
  },

  setThemePreference(preference) {
    return theme.setPreference(preference)
  },

  globalData: {
    appVersion: '6.7.6',
    apiBaseUrl: 'https://api.juejin.cn',
    systemInfo: {},
    themePreference: { followSystem: true, selected: 'light' },
    theme: 'light',
    disclaimerAcknowledged: false,
    disclaimerRedirecting: false,
    pendingEntry: null,
    foregroundSequence: 0
  }
})
