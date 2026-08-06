const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
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
    fromCache: false
  },

  onLoad(query) {
    const id = String(query.id || '')
    this.targetId = id
    if (id) {
      const cached = wx.getStorageSync('jj:collection-current')
      this.setData({ mode: 'detail', current: cached && cached.collection_id === id ? cached : null })
      wx.setNavigationBarTitle({ title: cached && cached.name ? cached.name : '收藏集详情' })
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

  load(reload) {
    if (this.data.loading && !reload) return
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })
    api.recommendedCollectionSets(cursor, 20).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeCollectionSet).filter((item) => item.collection_id)
      this.setData({
        sets: reload ? rows : this.data.sets.concat(rows),
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        loading: false,
        fromCache: Boolean(fromCache)
      })
      this.applySort()
    }).catch(() => this.setData({ loading: false, hasMore: false, fromCache: true })).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  loadDetail(reload) {
    if (this.data.loading && !reload) return
    const cursor = reload ? '0' : this.data.detailCursor
    this.setData({ loading: true })
    api.collectionSetDetail(this.targetId, cursor).then(({ result, fromCache }) => {
      const payload = result.data
      if (!payload) {
        this.setData({ loading: false, detailHasMore: false, fromCache: Boolean(fromCache) })
        return
      }
      const normalized = utils.normalizeCollectionSet({
        collection_set: payload.collection_info,
        creator: payload.user_info,
        articles: payload.articles
      })
      const previousArticles = reload || !this.data.current ? [] : this.data.current.articles
      const current = Object.assign({}, normalized, { articles: previousArticles.concat(normalized.articles) })
      this.setData({
        current,
        detailCursor: result.cursor || '0',
        detailHasMore: Boolean(result.has_more) && normalized.articles.length > 0,
        loading: false,
        fromCache: Boolean(fromCache)
      })
      wx.setNavigationBarTitle({ title: current.name })
    }).catch(() => this.setData({ loading: false, detailHasMore: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  applySort() {
    const sets = this.data.sets.slice().sort((left, right) => {
      if (this.data.sort === 'hot') return right.follower_value - left.follower_value
      return right.update_time - left.update_time
    })
    this.setData({ sets })
  },

  switchSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort })
    this.applySort()
  },

  openCollection(event) {
    const item = this.data.sets[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:collection-current', item)
    wx.navigateTo({ url: `/pages/collectionSquare/collectionSquare?id=${item.collection_id}` })
  },

  openArticle(event) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/post/post?id=${id}` })
  },

  openCreator(event) {
    const id = event.currentTarget.dataset.id
    if (!id) return
    const user = this.data.current && this.data.current.creator
    if (user) wx.setStorageSync('jj:user-current', user)
    wx.navigateTo({ url: `/pages/profile/profile?id=${id}` })
  },

  subscribe() {
    session.requireLogin()
  }
})
