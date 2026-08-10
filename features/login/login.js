Page({
  copyWebsite() {
    wx.setClipboardData({
      data: 'https://juejin.cn/',
      success() {
        wx.showToast({ title: '官网地址已复制', icon: 'none' })
      }
    })
  },

  back() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  }
})
