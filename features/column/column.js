const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const DETAIL_SORT_TYPES = { default: 2, latest: 0, earliest: 1 }

function sortArticlesByTime(articles, sort) {
  if (sort !== 'latest' && sort !== 'earliest') return articles
  const direction = sort === 'latest' ? -1 : 1
  return articles.slice().sort((left, right) => {
    const leftTime = Number(left.ctime_value) || 0
    const rightTime = Number(right.ctime_value) || 0
    if (!leftTime && !rightTime) return 0
    if (!leftTime) return 1
    if (!rightTime) return -1
    return (leftTime - rightTime) * direction
  })
}

Page(theme.withTheme({
  data: {
    mode: 'list',
    sort: 'latest',
    detailSort: 'default',
    detailSortLabel: '默认排序',
    sortMenuOpen: false,
    sortOptions: [
      { id: 'default', label: '默认排序' },
      { id: 'latest', label: '最新发布' },
      { id: 'earliest', label: '最早发布' }
    ],
    navOpacity: 0,
    navScrolled: false,
    columns: [],
    current: null,
    articles: [],
    detailCursor: '0',
    detailHasMore: true,
    followed: false,
    loading: true,
    fromCache: false
  },

  onLoad(query) {
    const id = String(query.id || '')
    this.targetId = id
    if (id) {
      const cached = wx.getStorageSync('jj:column-current')
      const current = cached && String(cached.column_id) === id ? cached : null
      this.setData({ mode: 'detail', current, articles: current && current.articles || [] })
    }
    this.load()
  },

  onPullDownRefresh() {
    if (this.data.mode === 'detail') this.loadDetailArticles(true)
    else this.load()
  },

  onReachBottom() {
    if (this.data.mode === 'detail' && this.data.detailHasMore) this.loadDetailArticles(false)
  },

  onPageScroll(event) {
    if (this.data.mode !== 'detail') return
    const opacity = Math.max(0, Math.min(1, (Number(event.scrollTop) - 80) / 120))
    if (Math.abs(opacity - Number(this.data.navOpacity)) < 0.02) return
    this.setData({ navOpacity: opacity.toFixed(2), navScrolled: opacity > 0.55 })
  },

  goBack() { wx.navigateBack() },

  load() {
    this.setData({ loading: true })
    Promise.all([api.recommendedColumns('0', 30), api.recommendedAuthors('0', 20)]).then(([columnResponse, authorResponse]) => {
      const remoteColumns = (columnResponse.result.data || []).map(utils.normalizeColumn).filter((item) => item.column_id)
      const authors = (authorResponse.result.data || []).map(utils.normalizeRecommendedAuthor).filter((item) => item.user_id)
      const columns = remoteColumns.length ? remoteColumns : authors.map(utils.authorToColumn)
      const fromCache = columnResponse.fromCache || authorResponse.fromCache
      if (this.data.mode === 'detail') {
        const current = columns.find((item) => item.column_id === this.targetId) || this.data.current || null
        this.setData({ current, loading: false, fromCache: Boolean(fromCache) })
        if (current) return this.loadDetailArticles(true)
        return
      }
      this.setData({ columns, loading: false, fromCache: Boolean(fromCache) })
      this.applySort()
    }).catch(() => this.setData({ columns: [], loading: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  loadDetailArticles(reload) {
    const current = this.data.current
    if (!current || (this.data.loading && !reload) || (!reload && !this.data.detailHasMore)) return Promise.resolve()
    const cursor = reload ? '0' : this.data.detailCursor
    const synthetic = String(current.column_id).indexOf('author-') === 0
    const sortType = DETAIL_SORT_TYPES[this.data.detailSort] || DETAIL_SORT_TYPES.default
    const request = synthetic
      ? api.userArticles(current.creator.user_id, cursor, DETAIL_SORT_TYPES.default)
      : api.columnArticles(current.column_id, cursor, sortType)
    this.setData({ loading: true })
    return request.then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeArticle).filter((item) => item.article_id)
      const previous = reload && rows.length ? [] : this.data.articles
      const known = new Set(previous.map((item) => String(item.article_id)))
      const additions = rows.filter((item) => !known.has(String(item.article_id)))
      const articles = sortArticlesByTime(previous.concat(additions), this.data.detailSort)
      const avatars = this.collectSubscriberAvatars(current, articles)
      this.setData({
        articles,
        'current.recent_users': avatars,
        detailCursor: String(result.cursor || cursor),
        detailHasMore: Boolean(result.has_more) && additions.length > 0,
        loading: false,
        fromCache: this.data.fromCache || Boolean(fromCache)
      })
    }).catch(() => this.setData({ loading: false, detailHasMore: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  collectSubscriberAvatars(current, articles) {
    const candidates = (current.recent_users || []).concat((articles || []).map((item) => item.author))
    const seen = new Set()
    return candidates.filter((item) => {
      const key = String(item && (item.user_id || item.avatar_large) || '')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return Boolean(item.avatar_large)
    }).slice(0, 4)
  },

  applySort() {
    const columns = this.data.columns.slice().sort((left, right) => {
      if (this.data.sort === 'hot') return right.follower_value - left.follower_value
      return right.article_count - left.article_count
    })
    this.setData({ columns })
  },

  switchSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort, detailCursor: '0', detailHasMore: true })
    if (this.data.mode === 'detail') this.loadDetailArticles(true)
    else this.applySort()
  },

  toggleSortMenu() {
    this.setData({ sortMenuOpen: !this.data.sortMenuOpen })
  },

  closeSortMenu() {
    if (this.data.sortMenuOpen) this.setData({ sortMenuOpen: false })
  },

  selectDetailSort(event) {
    const detailSort = String(event.currentTarget.dataset.id || '')
    const option = this.data.sortOptions.find((item) => item.id === detailSort)
    if (!option) return
    if (detailSort === this.data.detailSort) {
      this.setData({ sortMenuOpen: false })
      return
    }
    this.setData({
      detailSort,
      detailSortLabel: option.label,
      sortMenuOpen: false,
      detailCursor: '0',
      detailHasMore: true
    }, () => this.loadDetailArticles(true))
  },

  openColumn(event) {
    const item = this.data.columns[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:column-current', item)
    wx.navigateTo({ url: `/features/column/column?id=${item.column_id}` })
  },

  openArticle(event) {
    const item = this.data.articles[Number(event.currentTarget.dataset.index)]
    if (item) wx.navigateTo({ url: `/features/post/post?id=${item.article_id}` })
  },

  openCreator() {
    const user = this.data.current && this.data.current.creator
    if (!user || !user.user_id) return
    wx.setStorageSync('jj:user-current', user)
    wx.navigateTo({ url: `/features/profile/profile?id=${user.user_id}` })
  },

  subscribe() {
    if (!session.requireLogin()) return
    this.setData({ followed: !this.data.followed })
  }
}))
