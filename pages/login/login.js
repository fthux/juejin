const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    mobile: '',
    code: '',
    agreed: false,
    sending: false,
    loggingIn: false,
    countdown: 0
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

  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  },

  onMobileInput(event) {
    this.setData({ mobile: event.detail.value.replace(/\D/g, '').slice(0, 11) })
  },

  onCodeInput(event) {
    this.setData({ code: event.detail.value.replace(/\D/g, '').slice(0, 8) })
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  sendCode() {
    if (!this.data.agreed) {
      utils.toast('请先同意用户协议与隐私政策')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(this.data.mobile)) {
      utils.toast('请输入正确的手机号')
      return
    }
    if (this.data.sending || this.data.countdown) return
    this.setData({ sending: true })
    const passport = require('../../services/passport.js')
    passport.sendCode(this.data.mobile).then(() => {
      utils.toast('验证码已发送')
      this.startCountdown()
    }).catch((error) => this.showPassportError(error)).finally(() => this.setData({ sending: false }))
  },

  startCountdown() {
    this.setData({ countdown: 60 })
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    this.countdownTimer = setInterval(() => {
      const countdown = this.data.countdown - 1
      this.setData({ countdown })
      if (countdown <= 0) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
    }, 1000)
  },

  login() {
    if (!this.data.agreed) {
      utils.toast('请先同意用户协议与隐私政策')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(this.data.mobile)) {
      utils.toast('请输入正确的手机号')
      return
    }
    if (!/^\d{4,8}$/.test(this.data.code)) {
      utils.toast('请输入短信验证码')
      return
    }
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })
    session.loginWithSms(this.data.mobile, this.data.code).then(() => {
      getApp().refreshSession()
      utils.toast('登录成功')
      setTimeout(() => this.finishLogin(), 400)
    }).catch((error) => this.showPassportError(error)).finally(() => this.setData({ loggingIn: false }))
  },

  finishLogin() {
    if (this.redirect) {
      wx.redirectTo({ url: this.redirect })
      return
    }
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/my/my' }) })
  },

  showPassportError(error) {
    if (error && error.captcha) {
      wx.showModal({
        title: '需要安全验证',
        content: '掘金账号系统触发了安全验证。小程序无法加载该原生验证组件，请稍后重试或先在掘金官网完成验证。',
        showCancel: false
      })
      return
    }
    utils.toast((error && error.message) || '登录请求失败')
  }
})
