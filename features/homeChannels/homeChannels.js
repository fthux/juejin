const theme = require("../../utils/theme.js")
const mock = require('../../data/mockData.js')

Page(theme.withTheme({
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
}))
