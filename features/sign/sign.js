const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    signed: false,
    continuousDays: 0,
    mineral: 0,
    year: 0,
    month: 0,
    calendar: [],
    reminder: false,
    showShare: false,
    fortune: '宜自行测试',
    fortuneNote: '少玩多学习，代码没问题'
  },

  onLoad() {
    this.authorized = session.requirePage('/features/sign/sign')
  },

  onShow() {
    if (!this.authorized) return
    const signedDays = session.getList('signDays')
    const today = new Date()
    const todayKey = utils.dateKey(today)
    const continuousDays = this.getContinuousDays(signedDays, today)
    const currentSession = session.getSession()
    const power = currentSession && currentSession.user ? Number(currentSession.user.power) || 0 : 0
    this.setData({
      signed: signedDays.indexOf(todayKey) !== -1,
      continuousDays,
      mineral: power || signedDays.length * 10,
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      calendar: this.buildCalendar(today, signedDays),
      reminder: Boolean(wx.getStorageSync('jj:sign-reminder'))
    })
  },

  getContinuousDays(signedDays, today) {
    let total = 0
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (signedDays.indexOf(utils.dateKey(cursor)) === -1) cursor.setDate(cursor.getDate() - 1)
    while (signedDays.indexOf(utils.dateKey(cursor)) !== -1) {
      total += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return total
  },

  buildCalendar(today, signedDays) {
    const year = today.getFullYear()
    const month = today.getMonth()
    const first = new Date(year, month, 1)
    const start = new Date(year, month, 1 - first.getDay())
    const todayKey = utils.dateKey(today)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const key = utils.dateKey(date)
      const currentMonth = date.getMonth() === month
      return {
        key,
        day: date.getDate(),
        currentMonth,
        today: key === todayKey,
        signed: signedDays.indexOf(key) !== -1,
        canReissue: currentMonth && key < todayKey && signedDays.indexOf(key) === -1
      }
    })
  },

  signIn() {
    if (!session.requireLogin()) return
    if (this.data.signed) {
      utils.toast('今天已经签到过了')
      return
    }
    session.signIn()
    this.onShow()
    utils.toast('签到成功，矿石 +10')
  },

  toggleReminder(event) {
    const reminder = event.detail.value
    wx.setStorageSync('jj:sign-reminder', reminder)
    this.setData({ reminder })
    utils.toast(reminder ? '已开启 10 点签到提醒' : '已关闭签到提醒')
  },

  showFortune() {
    wx.showModal({ title: this.data.fortune, content: this.data.fortuneNote, showCancel: false })
  },

  showRules() {
    wx.showModal({ title: '签到规则', content: '每日签到可获得矿石。连续签到天数越多，获得惊喜奖励的机会越多。', showCancel: false })
  },

  openReward(event) {
    utils.toast(event.currentTarget.dataset.type === 'draw' ? '幸运抽奖即将开放' : '福利兑换即将开放')
  },

  showDonation() {
    wx.showModal({ title: '公益计划', content: '使用矿石参与公益计划，为技术社区贡献一份力量。', showCancel: false })
  },

  openShare() {
    this.setData({ showShare: true })
  },

  closeShare() {
    this.setData({ showShare: false })
  },

  noop() {},

  onShareAppMessage() {
    this.setData({ showShare: false })
    return { title: `我已连续签到 ${this.data.continuousDays} 天`, path: '/features/sign/sign' }
  }
})
