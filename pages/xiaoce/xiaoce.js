const api = require('../../services/api.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')
const session = require('../../services/session.js')

const bookletCategories = mock.categories
const byteCategoryIds = ['', '6809637769959178254', '6809637767543259144', '6809635626879549454', '6809635626661445640', '6809637776263217160']
const byteCategories = mock.categories.filter((item) => byteCategoryIds.indexOf(item.id) !== -1)

Page({
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
    vipOnly: false,
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

  onPullDownRefresh() {
    this.load(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.load(false)
  },

  switchCourseType(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeCourseType) return
    this.setData({
      activeCourseType: id,
      categories: id === 'byte' ? byteCategories : bookletCategories,
      activeCategory: '',
      activeSort: 'all',
      priceDirection: '',
      vipOnly: false
    })
    this.load(true)
  },

  selectCategory(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeCategory) return
    this.setData({ activeCategory: id })
    this.load(true)
  },

  selectSort(event) {
    const id = event.currentTarget.dataset.id
    if (id === 'price') {
      const direction = this.data.activeSort !== 'price' || this.data.priceDirection === 'desc' ? 'asc' : 'desc'
      this.setData({ activeSort: id, priceDirection: direction })
      this.applyFilter()
      return
    }
    if (id === this.data.activeSort) return
    this.setData({ activeSort: id, priceDirection: '' })
    this.load(true)
  },

  toggleVipOnly() {
    this.setData({ vipOnly: !this.data.vipOnly })
    this.applyFilter()
  },

  load(reload) {
    if (this.data.loading && !reload) return
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true, loadError: false })
    api.courses(cursor, {
      courseType: this.data.activeCourseType,
      categoryId: this.data.activeCategory,
      sort: this.data.activeSort
    }).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeCourse).filter((item) => item.id)
      const allCourses = reload ? rows : this.data.allCourses.concat(rows)
      wx.setStorageSync('jj:course-cache', allCourses)
      this.setData({
        allCourses,
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        loadError: Boolean(fromCache && this.data.activeCourseType === 'byte'),
        loading: false
      })
      this.applyFilter()
    }).catch(() => {
      this.setData({ loadError: true, loading: false, hasMore: false })
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  applyFilter() {
    let list = this.data.vipOnly ? this.data.allCourses.filter((item) => item.vip) : this.data.allCourses.slice()
    if (this.data.activeSort === 'price') {
      const direction = this.data.priceDirection === 'desc' ? -1 : 1
      list.sort((a, b) => (a.priceValue - b.priceValue) * direction)
    }
    this.setData({ list })
  },

  openCourse(event) {
    wx.navigateTo({ url: `/pages/courseDetail/courseDetail?id=${event.detail.item.id}` })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search?type=course' })
  },

  openVip() {
    wx.navigateTo({ url: '/pages/vip/vip' })
  },

  openCourseCenter() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/pages/courseCenter/courseCenter' })
  }
})
