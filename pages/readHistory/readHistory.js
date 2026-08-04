const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    list: []
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/readHistory/readHistory')
  },

  onShow() {
    if (!this.authorized) return
    this.setData({ list: session.getList('history').map((item) => Object.assign({}, item, { readTime: utils.formatTime(item.readAt) })) })
  },

  clear() {
    const that = this
    wx.showModal({
      title: '清空浏览历史',
      content: '清空后无法恢复',
      success(result) {
        if (!result.confirm) return
        session.setList('history', [])
        that.setData({ list: [] })
      }
    })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  }
})
