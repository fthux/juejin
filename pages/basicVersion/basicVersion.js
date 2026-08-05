const STORAGE_KEY = 'jj:full-version-enabled'

Page({
  data: {
    enabled: true
  },

  onShow() {
    this.setData({ enabled: wx.getStorageSync(STORAGE_KEY) !== false })
  },

  toggle(event) {
    const enabled = event.detail.value
    wx.setStorageSync(STORAGE_KEY, enabled)
    this.setData({ enabled })
  }
})
