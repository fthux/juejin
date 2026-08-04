const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    type: 'article',
    articles: [],
    authors: [],
    loading: true
  },

  onLoad(query) {
    this.setData({ type: query.type === 'author' ? 'author' : 'article' })
    this.load()
  },

  switchType(event) {
    this.setData({ type: event.currentTarget.dataset.type })
  },

  load() {
    Promise.all([api.hotArticles(), api.hotAuthors()]).then(([articleResponse, authorResponse]) => {
      const articles = (articleResponse.result.data || []).map(utils.normalizeArticle)
      const authors = (authorResponse.result.data || []).map((item) => ({
        user_id: item.user_id || '',
        user_name: item.user_name || '掘金用户',
        avatar_large: item.avatar_large || '/assets/app/common/default_avatar.webp',
        job_title: item.job_title || '',
        company: item.company || '',
        follower_count: utils.formatCount(item.follower_count),
        got_digg_count: utils.formatCount(item.got_digg_count || item.follower_count)
      }))
      this.setData({ articles, authors, loading: false })
    }).finally(() => this.setData({ loading: false }))
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  }
})
