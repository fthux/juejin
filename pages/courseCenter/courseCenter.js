const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    topTab: 'mine',
    filter: 'all',
    filters: [
      { id: 'all', name: '全部' },
      { id: 'owned', name: '已购' },
      { id: 'vip', name: 'VIP借阅' }
    ],
    allCourses: [],
    list: [],
    loading: false,
    loadError: false
  },

  onLoad() {
    if (!session.requirePage('/pages/courseCenter/courseCenter')) return
    this.loadShelf()
  },

  switchTop(event) {
    const topTab = event.currentTarget.dataset.id
    this.setData({ topTab, filter: 'all', loadError: false })
    if (topTab === 'history') {
      this.setData({ allCourses: wx.getStorageSync('jj:course-history') || [] })
      this.applyFilter()
    } else {
      this.loadShelf()
    }
  },

  selectFilter(event) {
    this.setData({ filter: event.currentTarget.dataset.id })
    this.applyFilter()
  },

  loadShelf() {
    this.setData({ loading: true, loadError: false })
    api.courseShelf('0').then(({ result, fromCache }) => {
      const payload = result.data || []
      const remoteRows = Array.isArray(payload)
        ? payload
        : (payload.booklets || payload.booklet_list || payload.list || payload.data || [])
      const localIds = wx.getStorageSync('jj:bookshelf') || []
      const localRows = (wx.getStorageSync('jj:course-cache') || []).concat(wx.getStorageSync('jj:course-history') || [])
        .filter((item) => localIds.map(String).indexOf(String(item.id)) !== -1)
      const byId = {}
      remoteRows.concat(localRows).map((item) => item.id ? item : utils.normalizeCourse(item)).forEach((item) => {
        if (item.id) byId[String(item.id)] = item
      })
      this.setData({ allCourses: Object.keys(byId).map((id) => byId[id]), loadError: Boolean(fromCache) })
      this.applyFilter()
    }).catch(() => this.setData({ allCourses: [], list: [], loadError: true }))
      .finally(() => this.setData({ loading: false }))
  },

  applyFilter() {
    let list = this.data.allCourses.slice()
    if (this.data.filter === 'owned') list = list.filter((item) => item.owned)
    if (this.data.filter === 'vip') list = list.filter((item) => item.vip && !item.owned)
    this.setData({ list })
  },

  openCourse(event) {
    wx.navigateTo({ url: `/pages/courseDetail/courseDetail?id=${event.currentTarget.dataset.id}` })
  }
})
