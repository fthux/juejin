const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    signed: false,
    totalDays: 0,
    mineral: 0,
    week: [],
    tasks: [
      { id: 'read', name: '阅读一篇文章', reward: '+10 矿石', done: false },
      { id: 'digg', name: '点赞优质内容', reward: '+5 矿石', done: false },
      { id: 'comment', name: '参与一次讨论', reward: '+10 矿石', done: false }
    ]
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/sign/sign')
  },

  onShow() {
    if (!this.authorized) return
    const signedDays = session.getList('signDays')
    const today = utils.dateKey()
    const labels = ['一', '二', '三', '四', '五', '六', '日']
    const offset = (new Date().getDay() + 6) % 7
    const week = labels.map((label, index) => {
      const date = new Date()
      date.setDate(date.getDate() - offset + index)
      const key = utils.dateKey(date)
      return { label, date: date.getDate(), signed: signedDays.indexOf(key) !== -1, today: key === today }
    })
    this.setData({ signed: signedDays.indexOf(today) !== -1, totalDays: signedDays.length, mineral: signedDays.length * 10, week })
  },

  signIn() {
    if (!session.requireLogin()) return
    if (this.data.signed) {
      utils.toast('今天已经签到过了')
      return
    }
    const result = session.signIn()
    this.setData({ signed: result.signed, totalDays: result.days, mineral: result.days * 10 })
    this.onShow()
    utils.toast('签到成功，矿石 +10')
  },

  doTask(event) {
    if (!session.requireLogin()) return
    const id = event.currentTarget.dataset.id
    const tasks = this.data.tasks.map((item) => item.id === id ? Object.assign({}, item, { done: true }) : item)
    this.setData({ tasks })
  }
})
