const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const THEME_CACHE_KEY = 'jj:theme-cache'
const DEFAULT_THEME = {
  theme_id: '',
  name: '活动标签',
  cover: '',
  brief: '',
  view_count: '0',
  user_count: '0'
}

Page({
  data: {
    themeId: '',
    theme: DEFAULT_THEME,
    activeTab: 'pin',
    sort: 'hot',
    articles: [],
    pins: [],
    pinCursor: '0',
    pinHasMore: true,
    loading: true,
    contentLoading: false
  },

  onLoad(query) {
    this.pinRequestId = 0
    const themeId = String(query.id || '')
    this.setData({ themeId })
    if (!themeId) {
      this.setData({ loading: false })
      return
    }
    this.loadTheme()
  },

  onPullDownRefresh() {
    this.loadTheme(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.activeTab === 'pin' && this.data.pinHasMore) this.loadPins(false)
  },

  loadTheme(reload) {
    const cache = wx.getStorageSync(THEME_CACHE_KEY) || {}
    const cached = cache[this.data.themeId]
    if (cached) this.setData({ theme: Object.assign({}, DEFAULT_THEME, cached) })
    this.setData({ loading: true })

    return api.themeDetail(this.data.themeId).then(({ result }) => {
      const detail = result.data
      const theme = detail ? utils.normalizeTheme(detail) : (cached || DEFAULT_THEME)
      if (theme.theme_id) {
        cache[String(theme.theme_id)] = theme
        wx.setStorageSync(THEME_CACHE_KEY, cache)
      }
      this.setData({ theme: Object.assign({}, DEFAULT_THEME, theme), loading: false })
      wx.setNavigationBarTitle({ title: theme.name || DEFAULT_THEME.name })
      return this.data.activeTab === 'article' ? this.loadArticles() : this.loadPins(true)
    }).catch(() => {
      this.setData({ loading: false })
      return this.data.activeTab === 'article' ? this.loadArticles() : this.loadPins(true)
    })
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.id
    if (activeTab === this.data.activeTab) return
    this.setData({ activeTab })
    if (activeTab === 'article' && !this.data.articles.length) this.loadArticles()
    if (activeTab === 'pin' && !this.data.pins.length) this.loadPins(true)
  },

  changeSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort, pins: [], pinCursor: '0', pinHasMore: true })
    this.loadPins(true)
  },

  loadArticles() {
    const keyword = this.data.theme.name
    if (!keyword || keyword === DEFAULT_THEME.name) return Promise.resolve()
    this.setData({ contentLoading: true })
    return api.search(keyword, 'article').then(({ result }) => {
      const articles = (result.data || []).map(utils.normalizeArticle).filter((item) => item.article_id)
      this.setData({ articles, contentLoading: false })
    }).catch(() => this.setData({ articles: [], contentLoading: false }))
  },

  loadPins(reload) {
    if (this.data.contentLoading && !reload) return Promise.resolve()
    const cursor = reload ? '0' : this.data.pinCursor
    const requestId = ++this.pinRequestId
    this.setData({ contentLoading: true })
    return api.themePins(this.data.themeId, cursor, {
      sortType: this.data.sort === 'hot' ? 500 : 200
    }).then(({ result }) => {
      if (requestId !== this.pinRequestId) return
      const rows = (result.data || []).map(utils.normalizePin).filter((item) => item.msg_id)
      this.setData({
        pins: reload ? rows : this.data.pins.concat(rows),
        pinCursor: result.cursor || '0',
        pinHasMore: Boolean(result.has_more) && rows.length > 0,
        contentLoading: false
      })
    }).catch(() => {
      if (requestId === this.pinRequestId) this.setData({ contentLoading: false, pinHasMore: false })
    })
  },

  showDetails() {
    wx.showModal({
      title: `#${this.data.theme.name}#`,
      content: this.data.theme.brief || '暂无活动说明',
      showCancel: false
    })
  },

  openArticle(event) {
    const item = event.detail && event.detail.item
    if (item && item.article_id) wx.navigateTo({ url: `/pages/post/post?id=${item.article_id}` })
  },

  openPin(event) {
    const item = event.detail && event.detail.item
    if (item && item.msg_id) wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${item.msg_id}` })
  },

  requireAccount() {
    session.requireLogin()
  },

  pinMore() {
    wx.showActionSheet({ itemList: ['减少此类沸点', '举报内容'] })
  },

  back() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/feidian/feidian' }) })
  }
})
