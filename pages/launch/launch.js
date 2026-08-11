const theme = require("../../utils/theme.js")
const SPLASH_DURATION = 2000
const TAB_PATHS = [
  'pages/index/index',
  'pages/feidian/feidian',
  'pages/find/find',
  'pages/xiaoce/xiaoce',
  'pages/my/my'
]

Page(theme.withTheme({
  data: {
    theme: ''
  },

  onLoad() {
    const app = getApp()
    const theme = app.globalData.theme === 'dark' ? 'dark' : 'light'
    this.setData({ theme })
    this.splashTimer = setTimeout(() => this.openHome(), SPLASH_DURATION)
  },

  onUnload() {
    if (this.splashTimer) clearTimeout(this.splashTimer)
  },

  openHome() {
    this.splashTimer = null
    const app = getApp()
    const entry = app.consumePendingEntry()
    const path = String(entry.path || '').replace(/^\/+/, '')
    const url = app.createEntryUrl(entry)
    if (TAB_PATHS.indexOf(path) !== -1) {
      wx.switchTab({ url: `/${path}` })
      return
    }
    wx.reLaunch({
      url,
      fail: () => wx.switchTab({ url: '/pages/index/index' })
    })
  }
}))
