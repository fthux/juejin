const api = require('../../services/api.js')
const session = require('../../services/session.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    categories: mock.categories,
    activeCategory: '',
    activeSort: 'recommend',
    sortTypes: [
      { id: 'recommend', name: '推荐', value: 200 },
      { id: 'latest', name: '最新', value: 300 },
      { id: 'hot', name: '热榜', value: 3 }
    ],
    list: [],
    cursor: '0',
    loading: false,
    hasMore: true,
    fromCache: false,
    session: null
  },

  onLoad() {
    this.loadFeed(true)
  },

  onShow() {
    const localArticles = session.getList('articles').map(utils.normalizeArticle)
    const remoteArticles = this.data.list.filter((item) => String(item.article_id).indexOf('local-article-') !== 0)
    this.setData({ session: session.getSession(), list: localArticles.concat(remoteArticles) })
  },

  onPullDownRefresh() {
    this.loadFeed(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadFeed(false)
  },

  selectCategory(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeCategory) return
    this.setData({ activeCategory: id })
    this.loadFeed(true)
  },

  selectSort(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeSort) return
    this.setData({ activeSort: id })
    this.loadFeed(true)
  },

  loadFeed(reload) {
    if (this.data.loading) return
    const sort = this.data.sortTypes.find((item) => item.id === this.data.activeSort)
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })

    const task = this.data.activeCategory
      ? api.categoryFeed(this.data.activeCategory, cursor)
      : api.homeFeed(cursor, { sortType: sort.value })

    task.then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeArticle)
      const localArticles = reload ? session.getList('articles').map(utils.normalizeArticle) : []
      this.setData({
        list: reload ? localArticles.concat(rows) : this.data.list.concat(rows),
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache,
        loading: false
      })
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  openNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' })
  },

  openArticle(event) {
    const item = event.detail.item
    wx.navigateTo({ url: `/pages/post/post?id=${item.article_id}` })
  },

  openAuthor(event) {
    const author = event.detail.author
    wx.navigateTo({ url: `/pages/profile/profile?id=${author.user_id}` })
  },

  onShareAppMessage() {
    return { title: '稀土掘金 · 帮助开发者成长的社区', path: '/pages/index/index' }
  }
})
