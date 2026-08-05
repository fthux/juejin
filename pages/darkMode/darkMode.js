const STORAGE_KEY = 'jj:dark-mode-v2'

Page({
  data: { followSystem: false, selected: 'dark' },

  onShow() {
    const stored = wx.getStorageSync(STORAGE_KEY) || {}
    this.setData({ followSystem: Boolean(stored.followSystem), selected: stored.selected || 'dark' })
  },

  toggleSystem(event) {
    const next = Object.assign({}, this.data, { followSystem: event.detail.value })
    wx.setStorageSync(STORAGE_KEY, { followSystem: next.followSystem, selected: next.selected })
    wx.setStorageSync('jj:dark-mode', next.followSystem || next.selected === 'dark')
    this.setData({ followSystem: next.followSystem })
  },

  chooseMode(event) {
    const selected = event.currentTarget.dataset.mode
    wx.setStorageSync(STORAGE_KEY, { followSystem: false, selected })
    wx.setStorageSync('jj:dark-mode', selected === 'dark')
    this.setData({ followSystem: false, selected })
  }
})
