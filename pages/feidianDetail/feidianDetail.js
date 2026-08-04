const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    msgId: '',
    item: null,
    comments: [],
    loading: true
  },

  onLoad(query) {
    this.setData({ msgId: query.msgId || '' })
    this.loadDetail()
  },

  loadDetail() {
    const local = session.getList('pins').find((item) => item.msg_id === this.data.msgId)
    const task = local ? Promise.resolve({ result: { data: local } }) : api.pinDetail(this.data.msgId)
    task.then(({ result }) => {
      this.setData({
        item: utils.normalizePin(result.data || {}),
        comments: session.getComments('pin', this.data.msgId),
        loading: false
      })
    }).finally(() => this.setData({ loading: false }))
  },

  addComment() {
    if (!session.requireLogin()) return
    const that = this
    wx.showModal({
      title: '发表评论',
      editable: true,
      placeholderText: '友善交流，分享你的观点',
      success(result) {
        if (!result.confirm || !result.content) return
        session.addComment('pin', that.data.msgId, result.content)
        that.setData({ comments: session.getComments('pin', that.data.msgId) })
      }
    })
  },

  toggleLike() {
    if (!session.requireLogin()) return
    const active = session.toggle('likes', this.data.msgId)
    this.setData({ 'item.is_digg': active })
  },

  onShareAppMessage() {
    return { title: this.data.item ? this.data.item.content : '稀土掘金沸点', path: `/pages/feidianDetail/feidianDetail?msgId=${this.data.msgId}` }
  }
})
