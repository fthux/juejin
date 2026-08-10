const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const markdown = require('../utils/markdown.js')

function sortComments(comments, sort) {
  const rows = comments.slice()
  if (sort === 'hot') {
    return rows.sort((left, right) => right.digg_count_value - left.digg_count_value || right.ctime_value - left.ctime_value)
  }
  return rows.sort((left, right) => right.ctime_value - left.ctime_value)
}

function buildCatalog(source) {
  const headings = []
  const markdownHeadings = String(source || '').matchAll(/^#{1,3}\s+(.+)$/gm)
  for (const match of markdownHeadings) {
    const title = match[1].replace(/[*_`~\[\]]/g, '').trim()
    if (title) headings.push(title)
  }
  return headings.slice(0, 6)
}

Page({
  data: {
    articleId: '',
    article: null,
    content: '',
    related: [],
    featured: [],
    comments: [],
    commentTotal: '0',
    commentCursor: '0',
    commentsHasMore: false,
    commentsLoading: false,
    commentSort: 'hot',
    catalog: [],
    loading: true,
    isLiked: false,
    isCollected: false,
    isFollowed: false,
    loadError: false
  },

  onLoad(query) {
    const articleId = query.id || query.article_id || ''
    this.setData({ articleId })
    if (!articleId) {
      this.setData({ loading: false, loadError: true })
      return
    }
    this.loadDetail()
  },

  onReachBottom() {
    if (this.data.commentsHasMore) this.loadComments(false)
  },

  loadDetail() {
    this.setData({ loading: true, loadError: false })
    const local = session.getList('articles').find((item) => item.article_id === this.data.articleId)
    const task = local ? Promise.resolve({ result: { data: Object.assign({}, local, { article_info: local }) } }) : api.articleDetail(this.data.articleId)
    task.then(({ result }) => {
      const detail = result && result.data ? result.data : {}
      const cached = session.getCachedArticle(this.data.articleId)
      const raw = Object.assign({}, detail.article_info || cached || detail, {
        author_user_info: detail.author_user_info || (detail.article_info && detail.article_info.author_user_info),
        tags: detail.tags || (detail.article_info && detail.article_info.tags)
      })
      const article = utils.normalizeArticle(raw)
      if (!article.article_id || article.article_id !== this.data.articleId) throw new Error('文章详情不存在')
      const info = detail.article_info || {}
      const markdownContent = detail.mark_content || info.mark_content || (local && local.content)
      const htmlContent = detail.app_html_content || info.app_html_content || detail.web_html_content || info.web_html_content || detail.article_content || detail.content
      const content = markdownContent
        ? markdown.toHtml(markdownContent)
        : markdown.normalizeImageSources(htmlContent || '')
      article.tags = article.all_tags
      article.themes = (detail.theme_list || []).map((theme) => theme.name || theme.theme_name || '').filter(Boolean)
      session.addHistory(article)
      session.cacheArticle(article)
      this.setData({
        article,
        content,
        related: [],
        featured: [],
        comments: [],
        commentTotal: article.comment_count,
        catalog: buildCatalog(markdownContent || ''),
        isLiked: session.getList('likes').indexOf(article.article_id) !== -1,
        isCollected: session.getList('collections').indexOf(article.article_id) !== -1,
        isFollowed: session.getList('follows').indexOf(article.author.user_id) !== -1,
        loadError: !content,
        loading: false
      })
      wx.setNavigationBarTitle({ title: article.title || '文章详情' })
      this.loadSupplementary(detail, article)
    }).catch(() => {
      const cached = session.getCachedArticle(this.data.articleId)
      const article = cached ? utils.normalizeArticle(cached) : null
      this.setData({
        article,
        content: '',
        related: [],
        loadError: true,
        loading: false
      })
      wx.setNavigationBarTitle({ title: article ? article.title : '文章详情' })
    }).finally(() => this.setData({ loading: false }))
  },

  retry() {
    this.loadDetail()
  },

  loadSupplementary(detail, article) {
    const tagIds = (detail.tags || []).map((tag) => String(tag.tag_id || tag.id || '')).filter(Boolean)
    Promise.all([
      api.articleRecommendations(article.article_id, article.author.user_id, tagIds),
      api.articleFeatured(article.article_id)
    ]).then(([relatedResponse, featuredResponse]) => {
      if (article.article_id !== this.data.articleId) return
      const related = (relatedResponse.result.data || []).map(utils.normalizeArticle)
        .filter((item) => item.article_id && item.article_id !== article.article_id).slice(0, 5)
      const featured = (featuredResponse.result.data || []).map(utils.normalizeArticle)
        .filter((item) => item.article_id && item.article_id !== article.article_id).slice(0, 5)
      this.setData({ related, featured })
    })
    this.loadComments(true)
  },

  loadComments(reload) {
    if (this.data.commentsLoading && !reload) return
    const cursor = reload ? '0' : this.data.commentCursor
    this.setData({ commentsLoading: true })
    api.articleComments(this.data.articleId, cursor).then(({ result }) => {
      const rows = (result.data || []).map(utils.normalizeComment).filter((item) => item.id)
      const comments = reload ? rows : this.data.comments.concat(rows)
      this.setData({
        comments: sortComments(comments, this.data.commentSort),
        commentTotal: utils.formatCount(Number(result.count) || Number(this.data.article.comment_count_value) || comments.length),
        commentCursor: result.cursor || '0',
        commentsHasMore: Boolean(result.has_more) && rows.length > 0,
        commentsLoading: false
      })
    }).catch(() => this.setData({ commentsLoading: false, commentsHasMore: false }))
  },

  switchCommentSort(event) {
    const commentSort = event.currentTarget.dataset.sort === 'hot' ? 'hot' : 'latest'
    this.setData({ commentSort, comments: sortComments(this.data.comments, commentSort) })
  },

  loadCommentReplies(event) {
    const commentId = String(event.currentTarget.dataset.id || '')
    const index = this.data.comments.findIndex((comment) => String(comment.id) === commentId)
    if (index === -1 || this.data.comments[index].reply_loading) return

    const comment = this.data.comments[index]
    const cursor = comment.reply_cursor || '0'
    this.setData({ [`comments[${index}].reply_loading`]: true })
    api.articleCommentReplies(this.data.articleId, commentId, cursor).then(({ result, fromCache }) => {
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

  toggleLike() {
    if (!session.requireLogin()) return
    const active = session.toggle('likes', this.data.article.article_id)
    this.setData({ isLiked: active })
    utils.toast(active ? '已点赞' : '已取消点赞')
  },

  toggleCollect() {
    if (!session.requireLogin()) return
    const active = session.toggle('collections', this.data.article.article_id)
    this.setData({ isCollected: active })
    utils.toast(active ? '已收藏' : '已取消收藏')
  },

  toggleFollow() {
    if (!session.requireLogin()) return
    const active = session.toggle('follows', this.data.article.author.user_id)
    this.setData({ isFollowed: active })
  },

  openAuthor() {
    const author = this.data.article && this.data.article.author
    if (!author || !author.user_id) return
    wx.navigateTo({ url: `/features/profile/profile?id=${author.user_id}` })
  },

  openRelated(event) {
    const articleId = event.detail && event.detail.item ? event.detail.item.article_id : event.currentTarget.dataset.id
    if (articleId) wx.redirectTo({ url: `/features/post/post?id=${articleId}` })
  },

  scrollToComments() {
    wx.pageScrollTo({ selector: '#article-comments', duration: 250 })
  },

  showCatalog() {
    if (!this.data.catalog.length) {
      utils.toast('这篇文章暂无目录')
      return
    }
    wx.showActionSheet({ itemList: this.data.catalog })
  },

  addComment() {
    if (!session.requireLogin()) return
    const that = this
    wx.showModal({
      title: '写评论',
      editable: true,
      placeholderText: '友善交流，分享你的观点',
      success(result) {
        if (!result.confirm || !result.content) return
        try {
          session.addComment('article', that.data.articleId, result.content)
          that.setData({ comments: session.getComments('article', that.data.articleId) })
          utils.toast('评论已提交')
        } catch (error) {
          utils.toast(error.message || '评论提交失败')
        }
      }
    })
  },

  onShareAppMessage() {
    const article = this.data.article || {}
    return { title: article.title || '稀土掘金文章', path: `/features/post/post?id=${this.data.articleId}` }
  }
})
