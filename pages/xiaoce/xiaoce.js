const api = require('../../services/api.js')

Page({
  data: {
    tabs: [
      { id: 'recommend', name: '推荐' },
      { id: 'free', name: '免费' },
      { id: 'owned', name: '已购' }
    ],
    activeTab: 'recommend',
    allCourses: [],
    list: [],
    loading: true,
    ownedIds: []
  },

  onLoad() {
    let ownedIds = wx.getStorageSync('jj:owned-courses')
    if (!ownedIds) {
      ownedIds = ['course-1']
      wx.setStorageSync('jj:owned-courses', ownedIds)
    }
    this.setData({ ownedIds })
    this.load()
  },

  onPullDownRefresh() {
    this.load()
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
    this.applyFilter()
  },

  load() {
    this.setData({ loading: true })
    api.courses('0').then(({ result }) => {
      const allCourses = (result.data || []).map((item) => {
        const info = item.base_info || item.booklet_info || item
        const id = item.booklet_id || info.booklet_id || ''
        return {
          id,
          title: info.title || '掘金课程',
          summary: info.summary || info.introduction || '',
          cover: info.cover_img || '/assets/app/common/default_booklet_cover_image.webp',
          price: info.price ? (Number(info.price) / 100).toFixed(2) : '',
          section_count: info.section_count || 0,
          is_finished: info.is_finished !== false,
          author: (item.user_info && item.user_info.user_name) || '稀土掘金',
          owned: this.data.ownedIds.indexOf(id) !== -1
        }
      })
      wx.setStorageSync('jj:course-cache', allCourses)
      this.setData({ allCourses, loading: false })
      this.applyFilter()
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  applyFilter() {
    const type = this.data.activeTab
    let list = this.data.allCourses
    if (type === 'free') list = list.filter((item) => !item.price)
    if (type === 'owned') list = list.filter((item) => item.owned)
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
  }
})
