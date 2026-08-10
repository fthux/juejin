const theme = require("../../utils/theme.js")
const session = require('../../services/session.js')

Page(theme.withTheme({
  data: { activeTab: '未使用', tabs: ['未使用', '已使用', '已过期'] },

  onLoad() {
    this.authorized = session.requirePage('/features/coupon/coupon')
  },

  selectTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  }
}))
