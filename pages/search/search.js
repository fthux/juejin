const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    keyword: '',
    type: 'article',
    types: [
      { id: 'article', name: '文章' },
      { id: 'user', name: '用户' }
    ],
    histories: [],
    results: [],
    searched: false,
    loading: false
  },

  onLoad(query) {
    const keyword = query.keyword || ''
    const courseMode = query.type === 'course'
    this.setData({
      keyword,
      type: courseMode ? 'course' : 'article',
      types: courseMode ? [{ id: 'course', name: '课程' }] : this.data.types,
      histories: wx.getStorageSync(courseMode ? 'jj:course-search-history' : 'jj:search-history') || []
    })
    if (keyword) this.submit()
  },

  onInput(event) {
    this.setData({ keyword: event.detail.value })
  },

  clearKeyword() {
    this.setData({ keyword: '' })
  },

  switchType(event) {
    const type = event.currentTarget.dataset.id
    this.setData({ type })
    if (this.data.searched) this.submit()
  },

  useHistory(event) {
    this.setData({ keyword: event.currentTarget.dataset.keyword })
    this.submit()
  },

  clearHistory() {
    wx.removeStorageSync(this.data.type === 'course' ? 'jj:course-search-history' : 'jj:search-history')
    this.setData({ histories: [] })
  },

  submit() {
    const keyword = this.data.keyword.trim()
    if (!keyword) return
    const histories = [keyword].concat(this.data.histories.filter((item) => item !== keyword)).slice(0, 10)
    wx.setStorageSync(this.data.type === 'course' ? 'jj:course-search-history' : 'jj:search-history', histories)
    this.setData({ histories, loading: true, searched: true })

    if (this.data.type === 'course') {
      const rows = (wx.getStorageSync('jj:course-cache') || []).concat(wx.getStorageSync('jj:course-history') || [])
      const byId = {}
      rows.forEach((item) => {
        const course = item.id ? item : utils.normalizeCourse(item)
        if (course.id) byId[String(course.id)] = course
      })
      const lowerKeyword = keyword.toLowerCase()
      const results = Object.keys(byId).map((id) => byId[id]).filter((item) => {
        return `${item.title}${item.summary}${item.author}`.toLowerCase().indexOf(lowerKeyword) !== -1
      })
      this.setData({ results, loading: false })
      return
    }

    api.search(keyword, this.data.type).then(({ result }) => {
      const raw = result.data || []
      const results = this.data.type === 'article' ? raw.map(utils.normalizeArticle) : raw.map((item) => ({
        user_id: item.user_id || '',
        user_name: item.user_name || '掘金用户',
        avatar_large: item.avatar_large || '/assets/app/common/default_avatar.webp',
        job_title: item.job_title || '',
        company: item.company || '',
        follower_count: utils.formatCount(item.follower_count)
      }))
      this.setData({ results, loading: false })
    }).finally(() => this.setData({ loading: false }))
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openUser(event) {
    wx.navigateTo({ url: `/pages/profile/profile?id=${event.currentTarget.dataset.id}` })
  },

  openCourse(event) {
    wx.navigateTo({ url: `/pages/courseDetail/courseDetail?id=${event.detail.item.id}` })
  }
})
