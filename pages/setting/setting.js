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
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({
      darkMode: windowInfo.theme === 'dark',
      loggedIn: Boolean(session.getSession()),
      fontSize: wx.getStorageSync('jj:font-size') || '标准'
    })
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
