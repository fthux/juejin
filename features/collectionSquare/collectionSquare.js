const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const PAGE_SIZE = 10

Page(theme.withTheme({
  data: {
    mode: 'list',
    sort: 'latest',
    sets: [],
    current: null,
    loading: true,
    cursor: '0',
    hasMore: true,
    detailCursor: '0',
    detailHasMore: true,
    followed: false,
    fromCache: false
  },

  onLoad(query) {
    const id = String(query.id || '')
    this.targetId = id
    if (id) {
      const cached = wx.getStorageSync('jj:collection-current')
      this.setData({ mode: 'detail', current: cached && String(cached.collection_id) === id ? cached : null })
    }
    if (id) this.loadDetail(true)
    else this.load(true)
  },

  onPullDownRefresh() {
    if (this.data.mode === 'detail') this.loadDetail(true)
    else this.load(true)
  },

  onReachBottom() {
    if (this.data.mode === 'list' && this.data.hasMore) this.load(false)
    if (this.data.mode === 'detail' && this.data.detailHasMore) this.loadDetail(false)
  },

  goBack() { wx.navigateBack() },
  showMore() { wx.showActionSheet({ itemList: ['分享收藏集', '举报'] }) },

  load(reload) {
    if (this.data.loading && !reload) return
    if (!reload && this.allSets && this.data.sets.length < this.allSets.length) {
      const next = this.allSets.slice(0, this.data.sets.length + PAGE_SIZE)
      this.setData({ sets: next, hasMore: next.length < this.allSets.length || this.remoteHasMore })
      return
    }
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })
    api.recommendedCollectionSets(cursor, 30, { moduleType: this.data.sort === 'latest' ? 0 : 1 }).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeCollectionSet).filter((item) => item.collection_id)
      const previous = reload ? [] : (this.allSets || [])
      const known = new Set(previous.map((item) => item.collection_id))
      this.allSets = previous.concat(rows.filter((item) => !known.has(item.collection_id)))
      this.remoteHasMore = Boolean(result.has_more) && rows.length > 0
      const visibleCount = reload ? PAGE_SIZE : this.data.sets.length + PAGE_SIZE
      this.setData({
        sets: this.allSets.slice(0, visibleCount),
        cursor: String(result.cursor || '0'),
        hasMore: visibleCount < this.allSets.length || this.remoteHasMore,
        loading: false,
        fromCache: Boolean(fromCache)
      })
    }).catch(() => this.setData({ loading: false, hasMore: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  loadDetail(reload) {
    if ((this.data.loading && !reload) || (!reload && !this.data.detailHasMore)) return
    const cursor = reload ? '0' : this.data.detailCursor
    this.setData({ loading: true })
    api.collectionSetDetail(this.targetId, cursor).then(({ result, fromCache }) => {
      const payload = result.data
      if (!payload) {
        this.setData({ loading: false, detailHasMore: false, fromCache: Boolean(fromCache) })
        return
      }
      const normalized = utils.normalizeCollectionSetDetail(payload)
      if (!normalized.collection_id) normalized.collection_id = this.targetId
      const previousArticles = reload ? [] : ((this.data.current && this.data.current.articles) || [])
      const known = new Set(previousArticles.map((item) => String(item.article_id)))
      const additions = normalized.articles.filter((item) => !known.has(String(item.article_id)))
      const current = Object.assign({}, this.data.current || {}, normalized, { articles: previousArticles.concat(additions) })
      this.setData({
        current,
        detailCursor: String(result.cursor || cursor),
        detailHasMore: Boolean(result.has_more) && additions.length > 0,
        loading: false,
        fromCache: Boolean(fromCache)
      })
    }).catch(() => this.setData({ loading: false, detailHasMore: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  switchSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.allSets = []
    this.remoteHasMore = false
    this.setData({ sort, sets: [], cursor: '0', hasMore: true })
    this.load(true)
  },

  openCollection(event) {
    const item = this.data.sets[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:collection-current', item)
    wx.navigateTo({ url: `/features/collectionSquare/collectionSquare?id=${item.collection_id}` })
  },

  openArticle(event) {
    const articles = this.data.current && this.data.current.articles || []
    const item = articles[Number(event.currentTarget.dataset.index)]
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
