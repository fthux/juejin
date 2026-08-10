const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page(theme.withTheme({
  data: {
    msgId: '',
    item: null,
    recommendations: [],
    comments: [],
    commentTotal: '0',
    commentCursor: '0',
    commentsHasMore: true,
    commentsLoading: false,
    commentSort: 'hot',
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
      this.setData({
        item: item.msg_id ? item : null,
        commentTotal: item.msg_id ? item.comment_count : '0',
        loading: false
      })
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
    const sort = this.data.commentSort
    const requestId = (this.commentRequestId || 0) + 1
    this.commentRequestId = requestId
    this.setData({ commentsLoading: true })
    api.pinComments(this.data.msgId, cursor, sort).then(({ result }) => {
      if (requestId !== this.commentRequestId || sort !== this.data.commentSort) return
      const rows = (result.data || []).map(utils.normalizeComment).filter((item) => item.id)
      const comments = reload ? rows : this.data.comments.concat(rows)
      this.setData({
        comments,
        commentTotal: utils.formatCount(Number(result.count) || Number(this.data.item && this.data.item.comment_count) || comments.length),
        commentCursor: result.cursor || '0',
        commentsHasMore: Boolean(result.has_more) && rows.length > 0,
        commentsLoading: false
      })
    }).catch(() => {
      if (requestId === this.commentRequestId) this.setData({ commentsLoading: false, commentsHasMore: false })
    })
  },

  switchCommentSort(event) {
    const commentSort = event.currentTarget.dataset.sort === 'latest' ? 'latest' : 'hot'
    if (commentSort === this.data.commentSort) return
    this.setData({
      commentSort,
      comments: [],
      commentCursor: '0',
      commentsHasMore: true
    }, () => this.loadComments(true))
  },

  loadCommentReplies(event) {
    const commentId = String(event.currentTarget.dataset.id || '')
    const index = this.data.comments.findIndex((comment) => String(comment.id) === commentId)
    if (index === -1 || this.data.comments[index].reply_loading) return

    const comment = this.data.comments[index]
    const cursor = comment.reply_cursor || '0'
    this.setData({ [`comments[${index}].reply_loading`]: true })
    api.pinCommentReplies(this.data.msgId, commentId, cursor).then(({ result, fromCache }) => {
      if (fromCache) throw new Error('reply request failed')
      const currentIndex = this.data.comments.findIndex((item) => String(item.id) === commentId)
      if (currentIndex === -1) return
      const currentComment = this.data.comments[currentIndex]
      const rows = (result.data || []).map(utils.normalizeReply).filter((reply) => reply.id)
      const existing = cursor === '0' ? [] : currentComment.replies
      const repliesById = {}
      existing.concat(rows).forEach((reply) => { repliesById[reply.id] = reply })
      const replies = Object.keys(repliesById).map((id) => repliesById[id])
        .sort((left, right) => left.ctime_value - right.ctime_value)
      this.setData({
        [`comments[${currentIndex}].replies`]: replies,
        [`comments[${currentIndex}].reply_cursor`]: result.cursor || '0',
        [`comments[${currentIndex}].reply_has_more`]: Boolean(result.has_more),
        [`comments[${currentIndex}].reply_loading`]: false
      })
    }).catch(() => {
      const currentIndex = this.data.comments.findIndex((item) => String(item.id) === commentId)
      if (currentIndex !== -1) this.setData({ [`comments[${currentIndex}].reply_loading`]: false })
      utils.toast('回复加载失败，请稍后重试')
    })
  },

  requireAccount() {
    session.requireLogin()
  },

  openAuthor(event) {
    const author = event.detail && event.detail.author
    if (author && author.user_id) wx.navigateTo({ url: `/features/profile/profile?id=${author.user_id}` })
  },

  openRecommendation(event) {
    const msgId = event.currentTarget.dataset.id
    if (msgId) wx.redirectTo({ url: `/features/feidianDetail/feidianDetail?msgId=${msgId}` })
  },

  onShareAppMessage() {
    return {
      title: this.data.item ? this.data.item.content : '稀土掘金沸点',
      path: `/features/feidianDetail/feidianDetail?msgId=${this.data.msgId}`
    }
  }
}))
