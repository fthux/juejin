const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    entries: [
      { type: 'digg', title: '赞和收藏', color: '#ff7d00', mark: '赞' },
      { type: 'follow', title: '新增关注', color: '#1e80ff', mark: '关' },
      { type: 'comment', title: '评论和回复', color: '#00b578', mark: '评' },
      { type: 'system', title: '系统消息', color: '#8a919f', mark: '系' }
    ],
    notices: []
  },

  onShow() {
    this.load()
  },

  load() {
    const notices = session.getList('notifications').map((item) => Object.assign({}, item, { displayTime: utils.formatTime(item.time) }))
    const entries = this.data.entries.map((entry) => Object.assign({}, entry, {
      unread: notices.filter((item) => item.type === entry.type && item.unread).length
    }))
    this.setData({ notices, entries })
  },

  markAllRead() {
    const notices = session.getList('notifications').map((item) => Object.assign({}, item, { unread: false }))
    session.setList('notifications', notices)
    this.load()
  },

  openChat() {
    wx.navigateTo({ url: '/pages/chat/chat?id=assistant&name=掘金小助手' })
  }
})
