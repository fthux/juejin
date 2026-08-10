const theme = require('./utils/theme.js')

App({
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    wx.removeStorageSync('jj:session')
    wx.removeStorageSync('jj:passport-cookies')

    this.globalData.systemInfo = systemInfo
    theme.initialize(this, systemInfo)
  },

  setThemePreference(preference) {
    return theme.setPreference(preference)
  },

  globalData: {
    appVersion: '6.7.6',
    apiBaseUrl: 'https://api.juejin.cn',
    systemInfo: {},
    themePreference: { followSystem: true, selected: 'light' },
    theme: 'light'
  }
})
