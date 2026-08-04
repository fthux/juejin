const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    drafts: []
  },

  onShow() {
    const drafts = session.getList('drafts').map((item) => Object.assign({}, item, { displayTime: utils.formatTime(item.updatedAt) }))
    this.setData({ drafts })
  },

  create() {
    wx.navigateTo({ url: '/pages/publish/publish?type=article' })
  },

  remove(event) {
    const id = event.currentTarget.dataset.id
    const drafts = session.getList('drafts').filter((item) => item.id !== id)
    session.setList('drafts', drafts)
    this.setData({ drafts })
  }
})
