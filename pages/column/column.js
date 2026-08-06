const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    mode: 'list',
    sort: 'latest',
    columns: [],
    current: null,
    loading: true,
    fromCache: false
  },

  onLoad(query) {
    const id = String(query.id || '')
    this.targetId = id
    if (id) {
      const cached = wx.getStorageSync('jj:column-current')
      this.setData({ mode: 'detail', current: cached && cached.column_id === id ? cached : null })
      wx.setNavigationBarTitle({ title: cached && cached.title ? cached.title : '专栏详情' })
    }
    this.load()
  },

  onPullDownRefresh() {
    this.load()
  },

  load() {
    this.setData({ loading: true })
    Promise.all([api.recommendedColumns('0', 30), api.recommendedAuthors('0', 20)]).then(([columnResponse, authorResponse]) => {
      const remoteColumns = (columnResponse.result.data || []).map(utils.normalizeColumn).filter((item) => item.column_id)
      const authors = (authorResponse.result.data || []).map(utils.normalizeRecommendedAuthor).filter((item) => item.user_id)
      const columns = remoteColumns.length ? remoteColumns : authors.map(utils.authorToColumn)
      const fromCache = columnResponse.fromCache || authorResponse.fromCache
      if (this.data.mode === 'detail') {
        const current = this.data.current || columns.find((item) => item.column_id === this.targetId) || null
        this.setData({ current, loading: false, fromCache: Boolean(fromCache) })
        if (current) wx.setNavigationBarTitle({ title: current.title })
        return
      }
      this.setData({ columns, loading: false, fromCache: Boolean(fromCache) })
      this.applySort()
    }).catch(() => this.setData({ columns: [], loading: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
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
    this.setData({ sort })
    this.applySort()
  },

  openColumn(event) {
    const item = this.data.columns[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:column-current', item)
    wx.navigateTo({ url: `/pages/column/column?id=${item.column_id}` })
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
