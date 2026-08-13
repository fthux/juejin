const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

const HOME_FEED_HISTORY_KEY = 'jj:home-feed-history-v1'
const MAX_REFRESH_PAGES = 3
const MAX_RECENT_ARTICLE_IDS = 160
const MAX_LAST_LIST_IDS = 80

function findChannel(id) {
  return mock.homeChannels.find((item) => item.id === id)
}

function normalizeArticleCards(data, displayedIds) {
  const seen = new Set()
  return (data || []).reduce((rows, raw) => {
    const result = raw && raw.result_model ? raw.result_model : (raw || {})
    if (result.item_type !== undefined && Number(result.item_type) !== 2) return rows
    const item = result.item_info || result
    const info = item.article_info || {}
    const articleId = String(item.article_id || info.article_id || item.item_id || '')
    if (!articleId || seen.has(articleId) || (displayedIds && displayedIds.has(articleId))) return rows
    seen.add(articleId)
    rows.push(Object.assign(utils.normalizeArticle(raw), { article_id: articleId, feed_key: articleId }))
    return rows
  }, [])
}

function articleIds(rows) {
  return (rows || []).map((item) => String(item.article_id || '')).filter(Boolean)
}

function uniqueIds(ids) {
  return Array.from(new Set((ids || []).map(String).filter(Boolean)))
}

function feedHistoryKey(activeNav, activeFilter) {
  return `${activeNav}:${activeFilter || ''}`
}

function readFeedHistoryStore() {
  try {
    const stored = wx.getStorageSync(HOME_FEED_HISTORY_KEY)
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  } catch (error) {
    return {}
  }
}

function readFeedHistory(key) {
  const history = readFeedHistoryStore()[key]
  if (!history || typeof history !== 'object') return { recentIds: [], lastIds: [], cursor: '0', hasMore: false }
  return {
    recentIds: uniqueIds(history.recentIds),
    lastIds: uniqueIds(history.lastIds),
    cursor: String(history.cursor || '0'),
    hasMore: Boolean(history.hasMore)
  }
}

function saveFeedHistory(key, rows, cursor, hasMore) {
  const ids = uniqueIds(articleIds(rows))
  if (!ids.length) return
  try {
    const store = readFeedHistoryStore()
    const previous = store[key] && store[key].recentIds
    store[key] = {
      recentIds: uniqueIds(ids.concat(previous || [])).slice(0, MAX_RECENT_ARTICLE_IDS),
      lastIds: ids.slice(0, MAX_LAST_LIST_IDS),
      cursor: String(cursor || '0'),
      hasMore: Boolean(hasMore),
      updatedAt: Date.now()
    }
    wx.setStorageSync(HOME_FEED_HISTORY_KEY, store)
  } catch (error) {}
}

function selectReplacementRows(scannedRows, recentIds, lastIds, targetSize) {
  const recent = new Set(recentIds || [])
  const last = new Set(lastIds || [])
  const selected = []
  const selectedIds = new Set()
  const limit = Math.max(1, targetSize || scannedRows.length)

  scannedRows.forEach((item) => {
    if (selected.length >= limit || recent.has(item.article_id)) return
    selected.push(item)
    selectedIds.add(item.article_id)
  })
  scannedRows.forEach((item) => {
    if (selected.length >= limit || last.has(item.article_id) || selectedIds.has(item.article_id)) return
    selected.push(item)
    selectedIds.add(item.article_id)
  })
  return selected
}

function requestArticlePage(channel, activeFilter, cursor, reload) {
  if (!channel.categoryId) return api.homeFeed(cursor, { sortType: 200, reload })
  return activeFilter
    ? api.categoryTagFeed(channel.categoryId, activeFilter, cursor, { reload })
    : api.categoryFeed(channel.categoryId, cursor, { reload })
}

function requestFreshArticlePages(channel, activeNav, activeFilter, currentRows) {
  const history = readFeedHistory(feedHistoryKey(activeNav, activeFilter))
  const lastIds = uniqueIds(articleIds(currentRows).concat(history.lastIds))
  const recentIds = new Set(history.recentIds)
  const scannedRows = []
  const scannedIds = new Set()
  let targetSize = 0
  let cursor = '0'
  let responseCursor = '0'
  let firstResponseCursor = '0'
  let hasMore = false
  let pageCount = 0
  const requestedCursors = new Set()

  function loadPage() {
    const requestCursor = cursor
    const reload = pageCount === 0
    pageCount += 1
    requestedCursors.add(requestCursor)
    return requestArticlePage(channel, activeFilter, requestCursor, reload).then(({ result }) => {
      const pageRows = normalizeArticleCards(result.data)
      if (!targetSize) targetSize = pageRows.length
      pageRows.forEach((item) => {
        if (scannedIds.has(item.article_id)) return
        scannedIds.add(item.article_id)
        scannedRows.push(item)
      })

      responseCursor = String(result.cursor || '0')
      if (reload) firstResponseCursor = responseCursor
      hasMore = Boolean(result.has_more)
      const freshCount = scannedRows.reduce((count, item) => count + (recentIds.has(item.article_id) ? 0 : 1), 0)
      const savedCursor = reload && history.hasMore ? history.cursor : ''
      const nextCursor = savedCursor && savedCursor !== '0' ? savedCursor : responseCursor
      const cursorAdvanced = nextCursor && nextCursor !== '0' && !requestedCursors.has(nextCursor)
      if (freshCount >= Math.max(1, targetSize) || pageCount >= MAX_REFRESH_PAGES || !hasMore || !cursorAdvanced) return
      cursor = nextCursor
      return loadPage().catch((error) => {
        if (nextCursor === firstResponseCursor || !firstResponseCursor || requestedCursors.has(firstResponseCursor)) throw error
        cursor = firstResponseCursor
        return loadPage()
      })
    })
  }

  return loadPage().then(() => {
    let rows = selectReplacementRows(scannedRows, history.recentIds, lastIds, targetSize)
    if (!rows.length && !currentRows.length) rows = scannedRows.slice(0, Math.max(1, targetSize || scannedRows.length))
    if (!rows.length && currentRows.length) throw new Error('暂时没有新的推荐内容')
    return { rows, cursor: responseCursor, hasMore }
  })
}

Page(theme.withTheme({
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
    fromCache: false,
    loadError: false
  },

  onLoad() {
    this.feedRequestId = 0
    this.displayedArticleIds = new Set()
    const app = typeof getApp === 'function' ? getApp() : null
    this.lastForegroundSequence = app && app.globalData ? app.globalData.foregroundSequence : 0
    this.loadRecommendationRanks()
    this.loadArticleFeed(true)
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 0 })
    const channel = wx.getStorageSync('jj:home-channel')
    const app = typeof getApp === 'function' ? getApp() : null
    const foregroundSequence = app && app.globalData ? app.globalData.foregroundSequence : 0
    if (channel) {
      wx.removeStorageSync('jj:home-channel')
      this.lastForegroundSequence = foregroundSequence
      return this.switchChannel(channel)
    }
    if (foregroundSequence === this.lastForegroundSequence) return
    this.lastForegroundSequence = foregroundSequence
    if (this.data.activeNav === 'recommend') this.loadRecommendationRanks()
    return this.loadCurrent(true)
  },

  onPullDownRefresh() {
    if (this.data.activeNav === 'recommend') this.loadRecommendationRanks()
    return this.loadCurrent(true)
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
      fromCache: false,
      loadError: false
    })
    if (id === 'recommend') this.loadRecommendationRanks()
    return this.loadCurrent(true)
  },

  selectFilter(event) {
    if (this.data.loading) return
    const id = event.currentTarget.dataset.id || ''
    if (this.data.activeNav === 'hot') {
      if (id === this.data.hotCategoryId) return
      this.setData({ hotCategoryId: id, hotList: [], loadError: false })
      this.loadHotRanking()
      return
    }
    if (id === this.data.activeFilter) return
    this.setData({ activeFilter: id, list: [], cursor: '0', hasMore: true, loadError: false })
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
      return this.loadHeadlines(reload)
    }
    return this.loadArticleFeed(reload)
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
    this.setData({ loading: true, hasMore: false, loadError: false })
    api.hotArticles({ categoryId, count: 40 }).then(({ result, fromCache }) => {
      if (requestId !== this.feedRequestId || this.data.activeNav !== 'hot') return
      this.setData({
        hotList: (result.data || []).map(utils.normalizeHotRank),
        fromCache: Boolean(fromCache),
        loadError: false,
        loading: false
      })
    }).catch(() => {
      if (requestId === this.feedRequestId) this.setData({ loadError: true })
    }).finally(() => {
      if (requestId === this.feedRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  loadHeadlines(reload) {
    if (this.data.loading) return
    const cursor = reload ? '' : this.data.cursor
    const requestId = ++this.feedRequestId
    this.setData({ loading: true, loadError: false })
    api.headlineFeed(cursor).then(({ result, fromCache }) => {
      if (requestId !== this.feedRequestId || this.data.activeNav !== 'headline') return
      const rows = (result.data || []).map(utils.normalizeHeadline)
      this.setData({
        headlineList: reload ? rows : this.data.headlineList.concat(rows),
        cursor: result.cursor || '',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loadError: false,
        loading: false
      })
    }).catch(() => {
      if (requestId === this.feedRequestId) this.setData({ loadError: true })
    }).finally(() => {
      if (requestId === this.feedRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  loadArticleFeed(reload) {
    if (this.data.loading && !reload) return
    const activeNav = this.data.activeNav
    const channel = findChannel(activeNav)
    if (!channel || activeNav === 'following' || activeNav === 'hot' || activeNav === 'headline') return
    const cursor = reload ? '0' : this.data.cursor
    const requestId = ++this.feedRequestId
    const activeFilter = this.data.activeFilter
    const historyKey = feedHistoryKey(activeNav, activeFilter)
    this.setData({ loading: true, loadError: false })

    const task = reload
      ? requestFreshArticlePages(channel, activeNav, activeFilter, this.data.list.slice())
      : requestArticlePage(channel, activeFilter, cursor, false).then(({ result, fromCache }) => ({
        rows: normalizeArticleCards(result.data, this.displayedArticleIds),
        cursor: String(result.cursor || cursor || '0'),
        hasMore: Boolean(result.has_more),
        fromCache: Boolean(fromCache)
      }))

    return task.then(({ rows, cursor: nextCursor, hasMore, fromCache }) => {
      if (requestId !== this.feedRequestId || this.data.activeNav !== activeNav) return
      const nextList = reload ? rows : this.data.list.concat(rows)
      this.displayedArticleIds = new Set(articleIds(nextList))
      saveFeedHistory(historyKey, nextList, nextCursor, hasMore)
      this.setData({
        list: nextList,
        cursor: nextCursor,
        hasMore: Boolean(hasMore),
        fromCache: Boolean(fromCache),
        loadError: false,
        loading: false
      })
    }).catch((error) => {
      if (requestId !== this.feedRequestId) return
      this.setData({ loadError: true, fromCache: false })
      if (reload && this.data.list.length) {
        wx.showToast({ title: error.message || '刷新失败，请稍后重试', icon: 'none' })
      }
    }).finally(() => {
      if (requestId === this.feedRequestId) {
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
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

  retryLoad() {
    this.loadCurrent(true)
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
}))
