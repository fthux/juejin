const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    type: 'article',
    articles: [],
    collections: [],
    authors: [],
    loading: true
  },

  onLoad(query) {
    const type = ['article', 'collect', 'author'].indexOf(query.type) === -1 ? 'article' : query.type
    this.setData({ type })
    this.load()
  },

  switchType(event) {
    this.setData({ type: event.currentTarget.dataset.type })
  },

  load() {
    Promise.all([
      api.hotArticles({ type: 'hot', count: 30 }),
      api.hotArticles({ type: 'collect', count: 30 }),
      api.hotAuthors(30)
    ]).then(([articleResponse, collectionResponse, authorResponse]) => {
      const articles = (articleResponse.result.data || []).map(utils.normalizeHotRank)
      const collections = (collectionResponse.result.data || []).map(utils.normalizeHotRank)
      const authors = (authorResponse.result.data || []).map(utils.normalizeHotAuthor)
      this.setData({ articles, collections, authors, loading: false })
    }).finally(() => this.setData({ loading: false }))
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openAccountInfo() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
