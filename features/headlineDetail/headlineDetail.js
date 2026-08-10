const theme = require("../../utils/theme.js")
Page(theme.withTheme({
  data: {
    item: null
  },

  onLoad() {
    const item = wx.getStorageSync('jj:headline-current') || null
    this.setData({ item })
    if (item && item.title) wx.setNavigationBarTitle({ title: item.title })
  },

  copyOriginal() {
    const url = this.data.item && this.data.item.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '原文链接已复制', icon: 'none' })
      }
    })
  }
}))
