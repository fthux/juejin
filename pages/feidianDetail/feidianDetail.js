const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    msgId: '',
    item: null,
    recommendations: [],
    comments: [],
    commentCursor: '0',
    commentsHasMore: true,
    commentsLoading: false,
    loading: true
  },

  onLoad(query) {
    const msgId = String(query.msgId || query.id || '')
    this.setData({ msgId })
    if (!msgId) {
      this.setData({ loading: false })
      return
    }
    this.loadDetail()
    this.loadRecommendations()
    this.loadComments(true)
  },

  onReachBottom() {
    if (this.data.commentsHasMore) this.loadComments(false)
  },

  loadDetail() {
    this.setData({ loading: true })
    api.pinDetail(this.data.msgId).then(({ result }) => {
      const item = utils.normalizePin(result.data || {})
      this.setData({ item: item.msg_id ? item : null, loading: false })
    }).catch(() => this.setData({ item: null, loading: false }))
  },

  loadRecommendations() {
    api.pinRecommendations(this.data.msgId, '0').then(({ result }) => {
      const recommendations = (result.data || []).map(utils.normalizePin).filter((item) => item.msg_id)
      this.setData({ recommendations })
    })
  },

  loadComments(reload) {
    if (this.data.commentsLoading && !reload) return
    const cursor = reload ? '0' : this.data.commentCursor
    this.setData({ commentsLoading: true })
    api.pinComments(this.data.msgId, cursor).then(({ result }) => {
      const rows = (result.data || []).map(utils.normalizeComment).filter((item) => item.id)
      this.setData({
        comments: reload ? rows : this.data.comments.concat(rows),
        commentCursor: result.cursor || '0',
        commentsHasMore: Boolean(result.has_more) && rows.length > 0,
        commentsLoading: false
      })
    }).catch(() => this.setData({ commentsLoading: false, commentsHasMore: false }))
  },

  requireAccount() {
    session.requireLogin()
  },

  openAuthor(event) {
    const author = event.detail && event.detail.author
    if (author && author.user_id) wx.navigateTo({ url: `/pages/profile/profile?id=${author.user_id}` })
  },

  openRecommendation(event) {
    const msgId = event.currentTarget.dataset.id
    if (msgId) wx.redirectTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${msgId}` })
  },

  back() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/feidian/feidian' }) })
  },

  showMore() {
    wx.showActionSheet({
      itemList: ['举报内容'],
      success: () => wx.navigateTo({ url: '/pages/feedback/feedback' })
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.item ? this.data.item.content : '稀土掘金沸点',
      path: `/pages/feidianDetail/feidianDetail?msgId=${this.data.msgId}`
    }
  }
})
