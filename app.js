const session = require('./services/session.js')

App({
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    const theme = wx.getStorageSync('jj:theme') || 'light'
    session.ensureLocalData()

    this.globalData.systemInfo = systemInfo
    this.globalData.theme = theme
    this.globalData.session = session.getSession()
  },

  setTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light'
    this.globalData.theme = nextTheme
    wx.setStorageSync('jj:theme', nextTheme)
  },

  refreshSession() {
    this.globalData.session = session.getSession()
    return this.globalData.session
  },

  globalData: {
    appVersion: '6.7.6',
    apiBaseUrl: 'https://api.juejin.cn',
    systemInfo: {},
    theme: 'light',
    session: null
  }
})
