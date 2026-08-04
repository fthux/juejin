const session = require('../../services/session.js')

Page({
  data: { list: [] },
  onLoad() {
    this.authorized = session.requirePage('/pages/registrations/registrations')
  },
  onShow() {
    if (!this.authorized) return
    this.setData({ list: session.getList('registrations') })
  },
  cancel(event) {
    const activity = this.data.list.find((item) => item.id === event.currentTarget.dataset.id)
    if (!activity) return
    session.toggleRegistration(activity)
    this.setData({ list: session.getList('registrations') })
    wx.showToast({ title: '已取消报名', icon: 'none' })
  }
})
