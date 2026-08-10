const theme = require("../../utils/theme.js")
Page(theme.withTheme({
  data: {
    enabled: true
  },

  onShow() {
    this.setData({ enabled: wx.getStorageSync('jj:personalized') !== false })
  },

  toggle(event) {
    const enabled = event.detail.value
    wx.setStorageSync('jj:personalized', enabled)
    this.setData({ enabled })
  }
}))
