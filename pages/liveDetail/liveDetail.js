Page({
  data: {
    item: null,
    showWeb: false
  },

  onLoad() {
    const item = wx.getStorageSync('jj:live-current') || null
    this.setData({ item })
    if (item && item.name) wx.setNavigationBarTitle({ title: item.name })
  },

  watch() {
    if (this.data.item && this.data.item.view_url) this.setData({ showWeb: true })
  },

  copyLink() {
    if (!this.data.item || !this.data.item.view_url) return
    wx.setClipboardData({ data: this.data.item.view_url })
  }
})
