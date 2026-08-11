const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const GUIDE_COURSES = [
  {
    id: 'free-writing-guide',
    title: '如何写一本掘金小册',
    cover: '/features/assets/app/course/bg_book_free.png',
    owned: true,
    vip: false,
    priceValue: 0,
    progress: 37,
    statusText: '已学 37%'
  },
  {
    id: 'free-community-guide',
    title: '如何使用掘金社区',
    cover: '/features/assets/app/course/bg_book_free.png',
    owned: true,
    vip: false,
    priceValue: 0,
    progress: 8,
    statusText: '已学 8%'
  }
]

Page(theme.withTheme({
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
    if (!session.requirePage('/features/courseCenter/courseCenter')) return
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
      const rows = Object.keys(byId).map((id) => byId[id])
      this.setData({ allCourses: rows.length ? rows : GUIDE_COURSES, loadError: Boolean(fromCache && rows.length) })
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
    wx.navigateTo({ url: `/features/courseDetail/courseDetail?id=${event.currentTarget.dataset.id}` })
  }
}))
