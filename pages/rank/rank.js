const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')
const mock = require('../../data/mockData.js')
const medals = ['/assets/app/rank/ic_rank_1.webp', '/assets/app/rank/ic_rank_2.webp', '/assets/app/rank/ic_rank_3.webp']

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
    loading: true
  },

  onLoad(query) {
    const type = query.type === 'author' ? 'author' : (query.type === 'collect' ? 'collect' : 'article')
    const title = type === 'author' ? '作者榜' : (type === 'collect' ? '收藏榜' : '文章榜')
    this.setData({ type, title })
    this.load()
  },

  onPullDownRefresh() { this.load() },
  goBack() { wx.navigateBack() },
  showRules() { wx.showToast({ title: '榜单按近期文章热度综合排序', icon: 'none' }) },

  load() {
    this.setData({ loading: true })
    if (this.data.type === 'author') {
      api.hotAuthors(30).then(({ result }) => {
        const authors = (result.data || []).map((item, index) => Object.assign(utils.normalizeHotAuthor(item), { medal: medals[index] || '' }))
        this.setData({ authors, loading: false })
      }).catch(() => this.setData({ loading: false })).finally(() => wx.stopPullDownRefresh())
      return
    }
    const category = this.data.categories[this.data.activeCategoryIndex] || { id: '0' }
    api.hotArticles({
      type: this.data.type === 'collect' ? 'collect' : 'hot',
      count: 40,
      categoryId: category.id,
      period: this.data.activePeriod
    }).then(({ result }) => {
      const articles = (result.data || []).map((item, index) => Object.assign(utils.normalizeHotRank(item), { medal: medals[index] || '' }))
      this.setData({ articles, loading: false })
    }).catch(() => this.setData({ loading: false })).finally(() => wx.stopPullDownRefresh())
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
