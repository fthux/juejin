const mock = require('../../data/mockData.js')

Page({
  data: {
    channels: mock.homeChannels,
    editMode: false
  },

  toggleEdit() {
    this.setData({ editMode: !this.data.editMode })
  },

  chooseChannel(event) {
    if (this.data.editMode) return
    wx.setStorageSync('jj:home-channel', event.currentTarget.dataset.id)
    wx.navigateBack()
  }
})
