const session = require('../../services/session.js')

Page({
  data: { activeTab: '未使用', tabs: ['未使用', '已使用', '已过期'] },

  onLoad() {
    this.authorized = session.requirePage('/pages/coupon/coupon')
  },

  selectTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  }
})
