const passport = require('../../services/passport.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    mobile: '',
    maskedMobile: '',
    code: '',
    sending: false,
    loggingIn: false,
    countdown: 0,
    sendError: ''
  },

  onLoad(query) {
    const mobile = String(query.mobile || '').replace(/\D/g, '').slice(0, 11)
    if (!/^1[3-9]\d{9}$/.test(mobile)) {
      utils.toast('手机号无效，请重新输入')
      setTimeout(() => wx.navigateBack(), 300)
      return
    }

    let redirect = ''
    try {
      redirect = query.redirect ? decodeURIComponent(query.redirect) : ''
    } catch (error) {
      redirect = ''
    }
    this.redirect = /^\/pages\/[A-Za-z0-9_/-]+(?:\?.*)?$/.test(redirect) ? redirect : ''
    this.setData({
      mobile,
      maskedMobile: `${mobile.slice(0, 3)} ${mobile.slice(3, 7)} ${mobile.slice(7)}`
    })
    if (query.sent === '1') this.startCountdown()
    else this.sendCode()
  },

  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    if (this.loginTimer) clearTimeout(this.loginTimer)
  },

  onCodeInput(event) {
    const code = event.detail.value.replace(/\D/g, '').slice(0, 6)
    this.setData({ code })
    if (code.length === 6 && code !== this.lastSubmittedCode) {
      this.lastSubmittedCode = code
      if (this.loginTimer) clearTimeout(this.loginTimer)
      this.loginTimer = setTimeout(() => this.login(), 80)
    }
  },

  sendCode() {
    if (this.data.sending || this.data.countdown || !this.data.mobile) return
    this.setData({ sending: true, sendError: '' })
    passport.sendCode(this.data.mobile).then(() => {
      this.startCountdown()
    }).catch((error) => {
      this.setData({ sendError: (error && error.message) || '验证码发送失败' })
      utils.toast((error && error.message) || '验证码发送失败')
    }).finally(() => this.setData({ sending: false }))
  },

  startCountdown() {
    this.setData({ countdown: 60, sendError: '' })
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    this.countdownTimer = setInterval(() => {
      const countdown = Math.max(0, this.data.countdown - 1)
      this.setData({ countdown })
      if (!countdown) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
    }, 1000)
  },

  login() {
    if (this.data.loggingIn || this.data.code.length !== 6) return
    this.setData({ loggingIn: true })
    session.loginWithSms(this.data.mobile, this.data.code).then(() => {
      getApp().refreshSession()
      this.finishLogin()
    }).catch((error) => {
      this.lastSubmittedCode = ''
      this.setData({ code: '' })
      utils.toast((error && error.message) || '登录失败，请重新输入验证码')
    }).finally(() => this.setData({ loggingIn: false }))
  },

  changeMobile() {
    if (this.data.loggingIn) return
    wx.navigateBack()
  },

  finishLogin() {
    if (this.redirect) {
      wx.redirectTo({ url: this.redirect })
      return
    }
    wx.switchTab({ url: '/pages/my/my' })
  }
})
