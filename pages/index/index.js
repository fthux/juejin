const api = require('../../services/api.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

function findChannel(id) {
  return mock.homeChannels.find((item) => item.id === id)
}

Page({
  data: {
    navTabs: mock.homeChannels,
    activeNav: 'recommend',
    filters: [],
    activeFilter: '',
    hotCategories: mock.hotCategories,
    hotCategoryId: mock.hotCategories[0].id,
    hotRankArticles: [],
    hotRankAuthors: [],
    hotSwiper: 0,
    hotList: [],
    headlineList: [],
    list: [],
    cursor: '0',
    loading: false,
    hasMore: true,
    fromCache: false
  },

  onLoad() {
    this.feedRequestId = 0
    this.loadRecommendationRanks()
    this.loadArticleFeed(true)
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 0 })
    const channel = wx.getStorageSync('jj:home-channel')
    if (!channel) return
    wx.removeStorageSync('jj:home-channel')
    this.switchChannel(channel)
  },

  onPullDownRefresh() {
    if (this.data.activeNav === 'recommend') this.loadRecommendationRanks()
    this.loadCurrent(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadCurrent(false)
  },

  selectNav(event) {
    this.switchChannel(event.currentTarget.dataset.id)
  },

  switchChannel(id) {
    if (!findChannel(id) || id === this.data.activeNav) return
    const filters = mock.categoryFilters[id] || []
    this.feedRequestId += 1
    this.setData({
      activeNav: id,
      filters,
      activeFilter: '',
      list: [],
      headlineList: [],
      cursor: '0',
      hasMore: id !== 'following' && id !== 'hot',
      loading: false,
      fromCache: false
    })
    if (id === 'recommend') this.loadRecommendationRanks()
    this.loadCurrent(true)
  },

  selectFilter(event) {
    const id = event.currentTarget.dataset.id || ''
    if (this.data.activeNav === 'hot') {
      if (id === this.data.hotCategoryId) return
      this.setData({ hotCategoryId: id, hotList: [] })
      this.loadHotRanking()
      return
    }
    if (id === this.data.activeFilter) return
    this.setData({ activeFilter: id, list: [], cursor: '0', hasMore: true })
    this.loadArticleFeed(true)
  },

  loadCurrent(reload) {
    if (this.data.activeNav === 'following') {
      this.setData({ loading: false, hasMore: false, list: [] })
      wx.stopPullDownRefresh()
      return
    }
    if (this.data.activeNav === 'hot') {
      if (reload) this.loadHotRanking()
      else wx.stopPullDownRefresh()
      return
    }
    if (this.data.activeNav === 'headline') {
      this.loadHeadlines(reload)
      return
    }
    this.loadArticleFeed(reload)
  },

  loadRecommendationRanks() {
    api.recommendationRanks().then(({ result }) => {
      const groups = result.data || []
      this.setData({
        hotRankArticles: (groups[0] || []).map(utils.normalizeHotRank),
        hotRankAuthors: (groups[1] || []).map(utils.normalizeHotAuthor)
      })
    })
  },

  hotSwiperChanged(event) {
    this.setData({ hotSwiper: event.detail.current })
  },

  loadHotRanking() {
    if (this.data.loading) return
    const categoryId = this.data.hotCategoryId
    const requestId = ++this.feedRequestId
    this.setData({ loading: true, hasMore: false })
    api.hotArticles({ categoryId, count: 40 }).then(({ result, fromCache }) => {
      if (requestId !== this.feedRequestId || this.data.activeNav !== 'hot') return
      this.setData({
        hotList: (result.data || []).map(utils.normalizeHotRank),
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).finally(() => {
      if (requestId === this.feedRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  loadHeadlines(reload) {
    if (this.data.loading) return
    const cursor = reload ? '' : this.data.cursor
    const requestId = ++this.feedRequestId
    this.setData({ loading: true })
    api.headlineFeed(cursor).then(({ result, fromCache }) => {
      if (requestId !== this.feedRequestId || this.data.activeNav !== 'headline') return
      const rows = (result.data || []).map(utils.normalizeHeadline)
      this.setData({
        headlineList: reload ? rows : this.data.headlineList.concat(rows),
        cursor: result.cursor || '',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).finally(() => {
      if (requestId === this.feedRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  loadArticleFeed(reload) {
    if (this.data.loading) return
    const activeNav = this.data.activeNav
    const channel = findChannel(activeNav)
    if (!channel || activeNav === 'following' || activeNav === 'hot' || activeNav === 'headline') return
    const cursor = reload ? '0' : this.data.cursor
    const requestId = ++this.feedRequestId
    this.setData({ loading: true })

    let task = api.homeFeed(cursor, { sortType: 200 })
    if (channel.categoryId) {
      task = this.data.activeFilter
        ? api.categoryTagFeed(channel.categoryId, this.data.activeFilter, cursor)
        : api.categoryFeed(channel.categoryId, cursor)
    }

    task.then(({ result, fromCache }) => {
      if (requestId !== this.feedRequestId || this.data.activeNav !== activeNav) return
      const rows = (result.data || []).map(utils.normalizeArticle)
      this.setData({
        list: reload ? rows : this.data.list.concat(rows),
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).finally(() => {
      if (requestId === this.feedRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  openSearch() {
    wx.navigateTo({ url: '/features/search/search' })
  },

  openSign() {
    this.openAccountInfo()
  },

  openAccountInfo() {
    wx.navigateTo({ url: '/features/login/login' })
  },

  openCategoryMenu() {
    wx.navigateTo({ url: '/features/homeChannels/homeChannels' })
  },

  openRank(event) {
    wx.navigateTo({ url: `/features/rank/rank?type=${event.currentTarget.dataset.type}` })
  },

  openArticle(event) {
    const item = event.detail ? event.detail.item : null
    const articleId = item ? item.article_id : event.currentTarget.dataset.id
    if (articleId) wx.navigateTo({ url: `/features/post/post?id=${articleId}` })
  },

  openAuthor(event) {
    const author = event.detail ? event.detail.author : null
    const userId = author ? author.user_id : event.currentTarget.dataset.id
    if (userId) wx.navigateTo({ url: `/features/profile/profile?id=${userId}` })
  },

  dislikeArticle(event) {
    const item = event.detail && event.detail.item
    if (!item) return
    this.setData({ list: this.data.list.filter((article) => article.article_id !== item.article_id) })
    wx.showToast({ title: '将减少此类内容推荐', icon: 'none' })
  },

  openHeadline(event) {
    const item = this.data.headlineList[event.currentTarget.dataset.index]
    if (!item) return
    wx.setStorageSync('jj:headline-current', item)
    wx.navigateTo({ url: '/features/headlineDetail/headlineDetail' })
  },

  onShareAppMessage() {
    return { title: '稀土掘金 · 帮助开发者成长的社区', path: '/pages/index/index' }
  }
})
