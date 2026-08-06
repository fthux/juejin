const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')
const medals = [
  '/assets/app/rank/ic_rank_1.webp',
  '/assets/app/rank/ic_rank_2.webp',
  '/assets/app/rank/ic_rank_3.webp'
]

Page({
  data: {
    type: 'article',
    title: '文章榜',
    articles: [],
    authors: [],
    loading: true
  },

  onLoad(query) {
    const type = query.type === 'author' ? 'author' : (query.type === 'collect' ? 'collect' : 'article')
    const title = type === 'author' ? '作者榜' : (type === 'collect' ? '收藏榜' : '文章榜')
    this.setData({ type, title })
    wx.setNavigationBarTitle({ title })
    this.load()
  },

  load() {
    Promise.all([
      api.hotArticles({ type: this.data.type === 'collect' ? 'collect' : 'hot', count: 30 }),
      api.hotAuthors(30)
    ]).then(([collectionResponse, authorResponse]) => {
      const articles = (collectionResponse.result.data || []).map((item, index) => Object.assign(
        utils.normalizeHotRank(item),
        { medal: medals[index] || '' }
      ))
      const authors = (authorResponse.result.data || []).map((item, index) => Object.assign(
        utils.normalizeHotAuthor(item),
        { medal: medals[index] || '' }
      ))
      this.setData({ articles, authors, loading: false })
    }).finally(() => this.setData({ loading: false }))
  },

  openArticle(event) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/post/post?id=${id}` })
  },

  openAccountInfo() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  openAuthor(event) {
    const userId = event.currentTarget.dataset.id
    if (!userId) return
    const user = this.data.authors.find((item) => String(item.user_id) === String(userId))
    if (user) wx.setStorageSync('jj:user-current', user)
    wx.navigateTo({ url: `/pages/profile/profile?id=${userId}` })
  }
})
