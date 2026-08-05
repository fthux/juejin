const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')
const medals = [
  '/assets/app/rank/ic_rank_1.webp',
  '/assets/app/rank/ic_rank_2.webp',
  '/assets/app/rank/ic_rank_3.webp'
]

Page({
  data: {
    type: 'collect',
    title: '收藏榜',
    collections: [],
    authors: [],
    loading: true
  },

  onLoad(query) {
    const type = query.type === 'author' ? 'author' : 'collect'
    const title = type === 'author' ? '作者榜' : '收藏榜'
    this.setData({ type, title })
    wx.setNavigationBarTitle({ title })
    this.load()
  },

  load() {
    Promise.all([
      api.hotArticles({ type: 'collect', count: 30 }),
      api.hotAuthors(30)
    ]).then(([collectionResponse, authorResponse]) => {
      const collections = (collectionResponse.result.data || []).map((item, index) => Object.assign(
        utils.normalizeHotRank(item),
        { medal: medals[index] || '' }
      ))
      const authors = (authorResponse.result.data || []).map((item, index) => Object.assign(
        utils.normalizeHotAuthor(item),
        { medal: medals[index] || '' }
      ))
      this.setData({ collections, authors, loading: false })
    }).finally(() => this.setData({ loading: false }))
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openAccountInfo() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  openAuthor(event) {
    const userId = event.currentTarget.dataset.id
    if (userId) wx.navigateTo({ url: `/pages/profile/profile?id=${userId}` })
  }
})
