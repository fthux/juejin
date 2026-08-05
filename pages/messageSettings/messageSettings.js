const STORAGE_KEY = 'jj:message-settings-v1'

Page({
  data: { allow: true },

  onShow() {
    this.setData({ allow: wx.getStorageSync(STORAGE_KEY) !== false })
  },

  toggle(event) {
    wx.setStorageSync(STORAGE_KEY, event.detail.value)
    this.setData({ allow: event.detail.value })
  }
})
