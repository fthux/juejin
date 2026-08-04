const utils = require('../../utils/utils.js')
const passport = require('../../services/passport.js')

Page({
  data: {
    mobile: '',
    agreed: false,
    continuing: false
  },

  onLoad(query) {
    let redirect = ''
    try {
      redirect = query.redirect ? decodeURIComponent(query.redirect) : ''
    } catch (error) {
      redirect = ''
    }
    this.redirect = /^\/pages\/[A-Za-z0-9_/-]+(?:\?.*)?$/.test(redirect) ? redirect : ''
  },

  onMobileInput(event) {
    this.setData({ mobile: event.detail.value.replace(/\D/g, '').slice(0, 11) })
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  continue() {
    if (this.data.continuing) return
    if (!this.data.agreed) {
      utils.toast('请先同意用户协议与隐私政策')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(this.data.mobile)) {
      utils.toast('请输入正确的手机号')
      return
    }

    this.setData({ continuing: true })
    passport.sendCode(this.data.mobile).then(() => {
      const query = [
        `mobile=${encodeURIComponent(this.data.mobile)}`,
        'sent=1',
        this.redirect ? `redirect=${encodeURIComponent(this.redirect)}` : ''
      ].filter(Boolean).join('&')
      wx.navigateTo({ url: `/pages/loginCode/loginCode?${query}` })
    }).catch((error) => {
      utils.toast((error && error.message) || '验证码发送失败，请稍后重试')
    }).finally(() => this.setData({ continuing: false }))
  }
})
