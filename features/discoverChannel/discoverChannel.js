const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')


const keywords = {
  guide: '掘金 使用指南',
  activity: '',
  game: '游戏开发',
  daily: '掘金一刻',
  pin: '精选沸点',
  team: '技术团队'
}

Page(theme.withTheme({
  data: {
    title: '发现',
    mode: 'article',
    articles: [],
    headlines: [],
    headlineCursor: '',
    headlineHasMore: true,
    headlineLoading: false,
    collections: [],
    liveTypes: [{ type: 0, name: '全部' }],
    liveStatuses: [
      { status: 0, name: '全部' },
      { status: 1, name: '直播中' },
      { status: 2, name: '预告' },
      { status: 3, name: '回放' },
      { status: 4, name: '已结束' }
    ],
    activeLiveType: 0,
    activeLiveStatus: 0,
    liveList: [],
    liveCursor: '0',
    liveHasMore: true,
    loading: true,
    fromCache: false
  },

  onLoad(query) {
    this.liveRequestId = 0
    let title = '发现'
    try {
      title = query.title ? decodeURIComponent(query.title) : title
    } catch (error) {
      title = '发现'
    }
    this.type = query.type || 'news'
    if (this.type === 'industry') {
      wx.redirectTo({ url: `/pages/industryExpress/industryExpress?title=${encodeURIComponent(title)}` })
      return
    }
    if (this.type === 'weekly') {
      wx.redirectTo({ url: `/pages/weekly/weekly?title=${encodeURIComponent(title)}` })
      return
    }
    const mode = this.type === 'live'
      ? 'live'
      : (this.type === 'news'
        ? 'headline'
        : (this.type === 'interview' || this.type === 'student' ? 'collection' : 'article'))
    this.setData({ title, mode })
    wx.setNavigationBarTitle({ title })
    this.load(true)
  },

  onPullDownRefresh() {
    this.load(true)
  },

  onReachBottom() {
    if (this.data.mode === 'live' && this.data.liveHasMore) this.loadLive(false)
    if (this.data.mode === 'headline' && this.data.headlineHasMore) this.loadHeadlines(false)
  },

  load(reload) {
    if (this.data.mode === 'live') return this.loadLive(reload)
    this.setData({ loading: true })
    let task
    if (this.data.mode === 'headline') return this.loadHeadlines(reload)
    else if (this.data.mode === 'collection') {
      task = api.recommendedCollectionSets('0', 20, { moduleType: this.type === 'interview' ? 2 : 3 })
    }
    else {
      const storedTheme = this.type === 'activity' ? wx.getStorageSync('jj:discover-theme-current') : null
      task = api.search((storedTheme && storedTheme.name) || keywords[this.type] || this.data.title, 'article')
    }
    return task.then(({ result, fromCache }) => {
      const raw = result.data || []
      this.setData({
        articles: this.data.mode === 'article' ? raw.map(utils.normalizeArticle).filter((item) => item.article_id) : [],
        headlines: this.data.mode === 'headline' ? raw.map(utils.normalizeHeadline).filter((item) => item.content_id) : [],
        collections: this.data.mode === 'collection' ? raw.map(utils.normalizeCollectionSet).filter((item) => item.collection_id) : [],
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).catch(() => this.setData({ articles: [], headlines: [], collections: [], fromCache: true, loading: false })).finally(() => wx.stopPullDownRefresh())
  },

  loadHeadlines(reload) {
    if (this.data.headlineLoading && !reload) return Promise.resolve()
    const cursor = reload ? '' : this.data.headlineCursor
    this.setData({ headlineLoading: true, loading: reload })
    return api.industryExpress(cursor).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeHeadline).filter((item) => item.content_id)
      const previous = reload ? [] : this.data.headlines
      const known = new Set(previous.map((item) => String(item.content_id)))
      const additions = rows.filter((item) => !known.has(String(item.content_id)))
      this.setData({
        headlines: previous.concat(additions),
        headlineCursor: String(result.cursor || cursor),
        headlineHasMore: Boolean(result.has_more) && additions.length > 0,
        headlineLoading: false,
        loading: false,
        fromCache: Boolean(fromCache)
      })
    }).catch(() => this.setData({ headlineLoading: false, headlineHasMore: false, loading: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  loadLive(reload) {
    if (this.data.loading && !reload) return Promise.resolve()
    const cursor = reload ? '0' : this.data.liveCursor
    const requestId = ++this.liveRequestId
    this.setData({ loading: true })
    const typeTask = this.data.liveTypes.length > 1 ? Promise.resolve(null) : api.liveTypes()
    return Promise.all([
      typeTask,
      api.liveActivities(cursor, {
        activityType: this.data.activeLiveType,
        status: this.data.activeLiveStatus,
        limit: 20
      })
    ]).then(([typeResponse, listResponse]) => {
      if (requestId !== this.liveRequestId) return
      const types = typeResponse
        ? [{ type: 0, name: '全部' }].concat((typeResponse.result.data || []).map((item) => ({ type: Number(item.type), name: item.name })))
        : this.data.liveTypes
      const rows = (listResponse.result.data || []).map(utils.normalizeLiveActivity).filter((item) => item.activity_id)
      this.setData({
        liveTypes: types,
        liveList: reload ? rows : this.data.liveList.concat(rows),
        liveCursor: listResponse.result.cursor || '0',
        liveHasMore: Boolean(listResponse.result.has_more) && rows.length > 0,
        fromCache: Boolean((typeResponse && typeResponse.fromCache) || listResponse.fromCache),
        loading: false
      })
    }).catch(() => {
      if (requestId === this.liveRequestId) this.setData({ liveList: [], liveHasMore: false, fromCache: true, loading: false })
    }).finally(() => wx.stopPullDownRefresh())
  },

  selectLiveType(event) {
    const activeLiveType = Number(event.currentTarget.dataset.id)
    if (activeLiveType === this.data.activeLiveType) return
    this.setData({ activeLiveType, liveList: [], liveCursor: '0', liveHasMore: true })
    this.loadLive(true)
  },

  selectLiveStatus(event) {
    const activeLiveStatus = Number(event.currentTarget.dataset.id)
    if (activeLiveStatus === this.data.activeLiveStatus) return
    this.setData({ activeLiveStatus, liveList: [], liveCursor: '0', liveHasMore: true })
    this.loadLive(true)
  },

  openLive(event) {
    const item = this.data.liveList[Number(event.currentTarget.dataset.index)]
    if (!item || !item.view_url) return
    wx.setStorageSync('jj:live-current', item)
    wx.navigateTo({ url: '/features/liveDetail/liveDetail' })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/features/post/post?id=${event.detail.item.article_id}` })
  },

  openHeadline(event) {
    const item = this.data.headlines[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:headline-current', item)
    wx.navigateTo({ url: '/features/headlineDetail/headlineDetail' })
  },

  goBack() { wx.navigateBack() },

  openCollection(event) {
    const item = this.data.collections[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:collection-current', item)
    wx.navigateTo({ url: `/features/collectionSquare/collectionSquare?id=${item.collection_id}` })
  },

  openCollectionArticle(event) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/features/post/post?id=${id}` })
  },

  subscribe() {
    session.requireLogin()
  }
}))
