const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    darkMode: false,
    personalized: true,
    pushEnabled: true,
    loggedIn: false,
    version: 'v6.7.6 (Build-73acaa583)'
  },

  onShow() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const storedDark = wx.getStorageSync('jj:dark-mode')
    this.setData({
      darkMode: storedDark === '' ? windowInfo.theme === 'dark' : Boolean(storedDark),
      personalized: wx.getStorageSync('jj:personalized') !== false,
      pushEnabled: wx.getStorageSync('jj:push-enabled') !== false,
      loggedIn: Boolean(session.getSession())
    })
  },

  requireAccount() {
    return session.requireLogin()
  },

  action(event) {
    const id = event.currentTarget.dataset.id
    if (id === 'edit' || id === 'account') {
      if (!this.requireAccount()) return
      utils.toast(id === 'edit' ? '请在稀土掘金 App 编辑资料' : '请在稀土掘金 App 管理账号')
      return
    }
    if (id === 'messages') {
      wx.navigateTo({ url: '/pages/messageSettings/messageSettings' })
      return
    }
    if (id === 'blocking') {
      wx.navigateTo({ url: '/pages/dislike/dislike' })
      return
    }
    if (id === 'personalized') {
      wx.navigateTo({ url: '/pages/personalized/personalized' })
      return
    }
    if (id === 'push') {
      wx.navigateTo({ url: '/pages/pushSettings/pushSettings' })
      return
    }
    if (id === 'dark') {
      wx.navigateTo({ url: '/pages/darkMode/darkMode' })
      return
    }
    if (id === 'privacy') {
      wx.navigateTo({ url: '/pages/personalInfo/personalInfo' })
      return
    }
    if (id === 'basic') {
      wx.navigateTo({ url: '/pages/basicVersion/basicVersion' })
      return
    }
    if (id === 'update') {
      wx.showModal({ title: '检查更新', content: '当前已是最新版本', showCancel: false })
      return
    }
    if (id === 'about') wx.navigateTo({ url: '/pages/about/about' })
  },

  toggleDark() {
    const darkMode = !this.data.darkMode
    wx.setStorageSync('jj:dark-mode', darkMode)
    this.setData({ darkMode })
    utils.toast(darkMode ? '已开启深色模式' : '已关闭深色模式')
  },

  logout() {
    const that = this
    wx.showModal({
      title: '退出登录',
      content: '退出后仍会保留本地浏览记录',
      success(result) {
        if (!result.confirm) return
        session.logout().finally(() => {
          getApp().refreshSession()
          that.setData({ loggedIn: false })
          utils.toast('已退出登录')
        })
      }
    })
  }
})
