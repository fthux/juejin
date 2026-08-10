const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')
const mock = require('../../data/mockData.js')
const medals = ['/assets/app/rank/ic_rank_1.webp', '/assets/app/rank/ic_rank_2.webp', '/assets/app/rank/ic_rank_3.webp']
const INITIAL_ARTICLE_COUNT = 40
const ARTICLE_PAGE_SIZE = 20

Page({
  data: {
    type: 'article',
    title: '文章榜',
    categories: mock.categories.filter((item) => item.id),
    activeCategoryIndex: 0,
    timeRanges: [
      { id: '3', name: '3日内' },
      { id: '7', name: '7日内' },
      { id: '30', name: '30日内' },
      { id: 'all', name: '全部' }
    ],
    activePeriod: '3',
    articles: [],
    authors: [],
    loading: true,
    loadingMore: false,
    articleRequestCount: INITIAL_ARTICLE_COUNT,
    articleHasMore: true,
    navOpacity: 0,
    navVisible: false
  },

  onLoad(query) {
    const type = query.type === 'author' ? 'author' : (query.type === 'collect' ? 'collect' : 'article')
    const title = type === 'author' ? '作者榜' : (type === 'collect' ? '收藏榜' : '文章榜')
    const categoryId = String(query.categoryId || '')
    const categoryIndex = type === 'article' && categoryId
      ? this.data.categories.findIndex((item) => String(item.id) === categoryId)
      : -1
    this.setData({
      type,
      title,
      activeCategoryIndex: categoryIndex >= 0 ? categoryIndex : 0
    }, () => this.load())
  },

  onPullDownRefresh() { this.load() },
  onReachBottom() {
    if (this.data.type === 'article') this.loadMoreArticles()
  },
  onPageScroll(event) {
    const opacity = Math.max(0, Math.min(1, Number(event.scrollTop) / 100))
    if (Math.abs(opacity - Number(this.data.navOpacity)) < 0.02) return
    this.setData({ navOpacity: opacity.toFixed(2), navVisible: opacity > 0.05 })
  },
  goBack() { wx.navigateBack() },
  showRules() { wx.navigateTo({ url: '/pages/rankRules/rankRules' }) },

  load() {
    this.setData({
      loading: true,
      loadingMore: false,
      articleRequestCount: INITIAL_ARTICLE_COUNT,
      articleHasMore: true
    })
    if (this.data.type === 'author') {
      api.hotAuthors(30).then(({ result }) => {
        const authors = (result.data || []).map((item, index) => Object.assign(utils.normalizeHotAuthor(item), { medal: medals[index] || '' }))
        this.setData({ authors, loading: false })
      }).catch(() => this.setData({ loading: false })).finally(() => wx.stopPullDownRefresh())
      return
    }
    this.loadArticles(true)
  },

  loadArticles(reload) {
    const category = this.data.categories[this.data.activeCategoryIndex] || { id: '0' }
    const requestCount = reload
      ? INITIAL_ARTICLE_COUNT
      : this.data.articleRequestCount + ARTICLE_PAGE_SIZE
    api.hotArticles({
      type: this.data.type === 'collect' ? 'collect' : 'hot',
      count: requestCount,
      categoryId: category.id,
      period: this.data.activePeriod
    }).then(({ result }) => {
      const rows = (result.data || []).map((item, index) => Object.assign(utils.normalizeHotRank(item), { medal: medals[index] || '' }))
      const previous = reload ? [] : this.data.articles
      const known = new Set(previous.map((item) => String(item.article_id)))
      const additions = rows.filter((item) => item.article_id && !known.has(String(item.article_id)))
      this.setData({
        articles: previous.concat(additions),
        articleRequestCount: requestCount,
        articleHasMore: rows.length >= requestCount && additions.length > 0,
        loading: false,
        loadingMore: false
      })
    }).catch(() => this.setData({
      loading: false,
      loadingMore: false,
      articleHasMore: reload ? this.data.articleHasMore : false
    })).finally(() => wx.stopPullDownRefresh())
  },

  loadMoreArticles() {
    if (this.data.loading || this.data.loadingMore || !this.data.articleHasMore) return
    this.setData({ loadingMore: true })
    this.loadArticles(false)
  },

  selectCategory(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isInteger(index) || index === this.data.activeCategoryIndex || !this.data.categories[index]) return
    this.setData({ activeCategoryIndex: index })
    this.load()
  },

  selectPeriod(event) {
    const period = String(event.currentTarget.dataset.id || '')
    if (!period || period === this.data.activePeriod) return
    this.setData({ activePeriod: period })
    this.load()
  },

  openArticle(event) {
    const item = this.data.articles[Number(event.currentTarget.dataset.index)]
    if (item) wx.navigateTo({ url: `/pages/post/post?id=${item.article_id}` })
  },

  openAccountInfo() { wx.navigateTo({ url: '/pages/login/login' }) },

  openAuthor(event) {
    const user = this.data.authors[Number(event.currentTarget.dataset.index)]
    if (!user) return
    wx.setStorageSync('jj:user-current', user)
    wx.navigateTo({ url: `/pages/profile/profile?id=${user.user_id}` })
  }
})
