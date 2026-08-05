App({
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    const theme = wx.getStorageSync('jj:theme') || 'light'
    wx.removeStorageSync('jj:session')
    wx.removeStorageSync('jj:passport-cookies')

    this.globalData.systemInfo = systemInfo
    this.globalData.theme = theme
  },

  setTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light'
    this.globalData.theme = nextTheme
    wx.setStorageSync('jj:theme', nextTheme)
  },

  globalData: {
    appVersion: '6.7.6',
    apiBaseUrl: 'https://api.juejin.cn',
    systemInfo: {},
    theme: 'light'
  }
})
