const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    drafts: []
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/drafts/drafts')
  },

  onShow() {
    if (!this.authorized) return
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
