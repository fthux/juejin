const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    nickname: '本地体验用户',
    agreed: true
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value })
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  login() {
    if (!this.data.agreed) {
      utils.toast('请先同意用户协议与隐私政策')
      return
    }
    const nickname = this.data.nickname.trim() || '本地体验用户'
    session.login({ user_name: nickname })
    getApp().refreshSession()
    utils.toast('登录成功')
    setTimeout(() => wx.navigateBack(), 400)
  }
})
