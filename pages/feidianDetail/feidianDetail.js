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
        comments: [
          { id: 'comment-1', user: '前端森林', content: '这个观点很有启发，感谢分享。', time: '1小时前' },
          { id: 'comment-2', user: '代码与远方', content: '同感，实践之后再回来复盘会更清楚。', time: '3小时前' }
        ],
        loading: false
      })
    }).finally(() => this.setData({ loading: false }))
  },

  addComment() {
    const that = this
    wx.showModal({
      title: '发表评论',
      editable: true,
      placeholderText: '友善交流，分享你的观点',
      success(result) {
        if (!result.confirm || !result.content) return
        const comments = [{ id: `local-${Date.now()}`, user: '本地体验用户', content: result.content, time: '刚刚' }].concat(that.data.comments)
        that.setData({ comments })
      }
    })
  },

  toggleLike() {
    const active = session.toggle('likes', this.data.msgId)
    this.setData({ 'item.is_digg': active })
  },

  onShareAppMessage() {
    return { title: this.data.item ? this.data.item.content : '稀土掘金沸点', path: `/pages/feidianDetail/feidianDetail?msgId=${this.data.msgId}` }
  }
})
