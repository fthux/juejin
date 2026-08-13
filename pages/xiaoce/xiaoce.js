const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')
const session = require('../../services/session.js')

const bookletCategories = mock.categories
const byteCourseCategories = [
  { id: '', name: '全部' },
  { id: '6809637769959178254', name: '后端' },
  { id: '6809637767543259144', name: '前端' },
  { id: '6809635626879549454', name: 'Android' },
  { id: '6809635626661445640', name: 'iOS' },
  { id: '6809637776263217160', name: '代码人生' }
]

function mergeUniqueCourses(previous, additions) {
  const seen = new Set()
  return (previous || []).concat(additions || []).filter((item) => {
    const id = String(item && item.id || '')
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

Page(theme.withTheme({
  data: {
    courseTypes: [
      { id: 'booklet', name: '掘金小册' },
      { id: 'byte', name: '字节内部课', badge: 'VIP免费' }
    ],
    activeCourseType: 'booklet',
    categories: bookletCategories,
    activeCategory: '',
    sorts: [
      { id: 'all', name: '全部' },
      { id: 'latest', name: '最新' },
      { id: 'hot', name: '热销' },
      { id: 'price', name: '价格' }
    ],
    activeSort: 'all',
    priceDirection: '',
    onlyVip: false,
    allCourses: [],
    list: [],
    cursor: '0',
    hasMore: true,
    loading: true,
    loadError: false
  },

  onLoad() {
    this.load(true)
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 3 })
  },

  onPullDownRefresh() {
    this.load(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.load(false)
  },

  selectCategory(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeCategory) return
    this.setData({ activeCategory: id })
    this.load(true)
  },

  selectCourseType(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeCourseType) return
    this.setData({
      activeCourseType: id,
      categories: id === 'byte' ? byteCourseCategories : bookletCategories,
      activeCategory: '',
      activeSort: 'all',
      priceDirection: '',
      onlyVip: false
    })
    this.load(true)
  },

  toggleVip() {
    this.setData({ onlyVip: !this.data.onlyVip })
    this.load(true)
  },

  selectSort(event) {
    const id = event.currentTarget.dataset.id
    if (id === 'price') {
      const direction = this.data.activeSort !== 'price' || this.data.priceDirection === 'desc' ? 'asc' : 'desc'
      this.setData({ activeSort: id, priceDirection: direction })
      this.load(true)
      return
    }
    if (id === this.data.activeSort) return
    this.setData({ activeSort: id, priceDirection: '' })
    this.load(true)
  },

  load(reload) {
    if (this.data.loading && !reload) return
    const cursor = reload ? '0' : this.data.cursor
    const requestId = (this.courseRequestId || 0) + 1
    this.courseRequestId = requestId
    this.setData({ loading: true, loadError: false })
    api.courses(cursor, {
      categoryId: this.data.activeCategory,
      sort: this.data.activeSort,
      priceDirection: this.data.priceDirection,
      courseType: this.data.activeCourseType,
      onlyVip: this.data.activeCourseType === 'booklet' && this.data.onlyVip
    }).then(({ result, fromCache }) => {
      if (requestId !== this.courseRequestId) return
      const normalize = this.data.activeCourseType === 'byte' ? utils.normalizeByteCourse : utils.normalizeCourse
      const rows = (Array.isArray(result.data) ? result.data : []).map(normalize).filter((item) => item.id)
      const previous = reload ? [] : mergeUniqueCourses([], this.data.allCourses)
      const allCourses = mergeUniqueCourses(previous, rows)
      const addedCount = allCourses.length - previous.length
      const nextCursor = String(result.cursor || '0')
      const cacheKey = this.data.activeCourseType === 'byte' ? 'jj:byte-course-cache' : 'jj:course-cache'
      wx.setStorageSync(cacheKey, allCourses)
      this.setData({
        allCourses,
        cursor: nextCursor,
        hasMore: Boolean(result.has_more) && addedCount > 0 && nextCursor !== String(cursor),
        loadError: Boolean(fromCache && !rows.length),
        loading: false
      })
      this.applyFilter()
    }).catch(() => {
      if (requestId === this.courseRequestId) this.setData({ loadError: true, loading: false, hasMore: false })
    }).finally(() => {
      if (requestId === this.courseRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  applyFilter() {
    const list = this.data.allCourses.slice()
    if (this.data.activeSort === 'price') {
      const direction = this.data.priceDirection === 'desc' ? -1 : 1
      list.sort((a, b) => (a.priceValue - b.priceValue) * direction)
    }
    this.setData({ list })
  },

  openCourse(event) {
    const course = event.detail.item || {}
    const page = course.courseType === 'byte' ? 'byteCourseDetail' : 'courseDetail'
    wx.navigateTo({ url: `/features/${page}/${page}?id=${course.id}` })
  },

  openVip() {
    wx.navigateTo({ url: '/features/vip/vip' })
  },

  openCourseCenter() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/courseCenter/courseCenter' })
  }
}))
