const SPLASH_DURATION = 3000

Page({
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
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
