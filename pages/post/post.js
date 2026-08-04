const api = require('../../services/api.js')
const session = require('../../services/session.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    articleId: '',
    article: null,
    content: '',
    related: [],
    loading: true,
    isLiked: false,
    isCollected: false,
    isFollowed: false
  },

  onLoad(query) {
    const articleId = query.id || query.article_id || mock.articles[0].article_id
    this.setData({ articleId })
    this.loadDetail()
  },

  loadDetail() {
    const local = session.getList('articles').find((item) => item.article_id === this.data.articleId)
    const task = local ? Promise.resolve({ result: { data: Object.assign({}, local, { article_info: local }) } }) : api.articleDetail(this.data.articleId)
    task.then(({ result }) => {
      const detail = result.data || {}
      const raw = Object.assign({}, detail.article_info || detail, {
        author_user_info: detail.author_user_info || (detail.article_info && detail.article_info.author_user_info),
        tags: detail.tags || (detail.article_info && detail.article_info.tags)
      })
      const article = utils.normalizeArticle(raw)
      const content = detail.content || detail.article_content || '<p>文章内容暂不可用。</p>'
      session.addHistory(article)
      this.setData({
        article,
        content,
        related: mock.articles.filter((item) => item.article_id !== article.article_id).slice(0, 3).map(utils.normalizeArticle),
        isLiked: session.getList('likes').indexOf(article.article_id) !== -1,
        isCollected: session.getList('collections').indexOf(article.article_id) !== -1,
        isFollowed: session.getList('follows').indexOf(article.author.user_id) !== -1,
        loading: false
      })
      wx.setNavigationBarTitle({ title: article.title || '文章详情' })
    }).finally(() => this.setData({ loading: false }))
  },

  toggleLike() {
    const active = session.toggle('likes', this.data.article.article_id)
    this.setData({ isLiked: active })
    utils.toast(active ? '已点赞' : '已取消点赞')
  },

  toggleCollect() {
    const active = session.toggle('collections', this.data.article.article_id)
    this.setData({ isCollected: active })
    utils.toast(active ? '已收藏' : '已取消收藏')
  },

  toggleFollow() {
    const active = session.toggle('follows', this.data.article.author.user_id)
    this.setData({ isFollowed: active })
  },

  openAuthor() {
    wx.switchTab({ url: '/pages/my/my' })
  },

  openRelated(event) {
    wx.redirectTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  addComment() {
    wx.showModal({
      title: '写评论',
      editable: true,
      placeholderText: '友善交流，分享你的观点',
      success(result) {
        if (result.confirm && result.content) utils.toast('评论已保存在本机')
      }
    })
  },

  onShareAppMessage() {
    const article = this.data.article || {}
    return { title: article.title || '稀土掘金文章', path: `/pages/post/post?id=${this.data.articleId}` }
  }
})
