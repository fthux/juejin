const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const theme = require('../../utils/theme.js')

Page(theme.withTheme({
  data: {
    darkMode: false,
    personalized: true,
    pushEnabled: true,
    version: 'v6.7.6 (Build-73acaa583)'
  },

  onShow() {
    this.setData({
      darkMode: theme.getResolvedTheme() === 'dark',
      personalized: wx.getStorageSync('jj:personalized') !== false,
      pushEnabled: wx.getStorageSync('jj:push-enabled') !== false
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
      if (!this.requireAccount()) return
      wx.navigateTo({ url: '/features/messageSettings/messageSettings' })
      return
    }
    if (id === 'blocking') {
      if (!this.requireAccount()) return
      wx.navigateTo({ url: '/features/dislike/dislike' })
      return
    }
    if (id === 'personalized') {
      wx.navigateTo({ url: '/features/personalized/personalized' })
      return
    }
    if (id === 'push') {
      wx.navigateTo({ url: '/features/pushSettings/pushSettings' })
      return
    }
    if (id === 'dark') {
      wx.navigateTo({ url: '/features/darkMode/darkMode' })
      return
    }
    if (id === 'privacy') {
      if (!this.requireAccount()) return
      wx.navigateTo({ url: '/features/personalInfo/personalInfo' })
      return
    }
    if (id === 'basic') {
      wx.navigateTo({ url: '/features/basicVersion/basicVersion' })
      return
    }
    if (id === 'update') {
      wx.showModal({ title: '检查更新', content: '当前已是最新版本', showCancel: false })
      return
    }
    if (id === 'about') wx.navigateTo({ url: '/features/about/about' })
  },

  toggleDark() {
    const darkMode = !this.data.darkMode
    theme.setPreference({ followSystem: false, selected: darkMode ? 'dark' : 'light' })
    this.setData({ darkMode })
    utils.toast(darkMode ? '已开启深色模式' : '已关闭深色模式')
  }
}))
