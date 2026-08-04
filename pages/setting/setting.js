const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    darkMode: false,
    fontSize: '标准',
    loggedIn: false,
    version: '6.7.6'
  },

  onShow() {
    this.setData({
      darkMode: getApp().globalData.theme === 'dark',
      loggedIn: Boolean(session.getSession()),
      fontSize: wx.getStorageSync('jj:font-size') || '标准'
    })
  },

  toggleDark(event) {
    const darkMode = event.detail.value
    getApp().setTheme(darkMode ? 'dark' : 'light')
    this.setData({ darkMode })
    wx.setNavigationBarColor({ frontColor: darkMode ? '#ffffff' : '#000000', backgroundColor: darkMode ? '#1f2329' : '#ffffff' })
  },

  changeFont() {
    const that = this
    wx.showActionSheet({
      itemList: ['较小', '标准', '较大'],
      success(result) {
        const fontSize = ['较小', '标准', '较大'][result.tapIndex]
        wx.setStorageSync('jj:font-size', fontSize)
        that.setData({ fontSize })
      }
    })
  },

  clearCache() {
    session.setList('history', [])
    utils.toast('缓存已清理')
  },

  logout() {
    session.logout()
    getApp().refreshSession()
    this.setData({ loggedIn: false })
    utils.toast('已退出登录')
  }
})
