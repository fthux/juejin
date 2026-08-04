const api = require('../../services/api.js')
const session = require('../../services/session.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')
const markdown = require('../../utils/markdown.js')

Page({
  data: {
    articleId: '',
    article: null,
    content: '',
    related: [],
    comments: [],
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
      const content = markdownContent ? markdown.toHtml(markdownContent) : (htmlContent || '')
      session.addHistory(article)
      session.cacheArticle(article)
      this.setData({
        article,
        content,
        related: mock.articles.filter((item) => item.article_id !== article.article_id).slice(0, 3).map(utils.normalizeArticle),
        comments: session.getComments('article', article.article_id),
        isLiked: session.getList('likes').indexOf(article.article_id) !== -1,
        isCollected: session.getList('collections').indexOf(article.article_id) !== -1,
        isFollowed: session.getList('follows').indexOf(article.author.user_id) !== -1,
        loadError: !content,
        loading: false
      })
      wx.setNavigationBarTitle({ title: article.title || '文章详情' })
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
    wx.navigateTo({ url: `/pages/profile/profile?id=${author.user_id}` })
  },

  openRelated(event) {
    wx.redirectTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
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
    return { title: article.title || '稀土掘金文章', path: `/pages/post/post?id=${this.data.articleId}` }
  }
})
