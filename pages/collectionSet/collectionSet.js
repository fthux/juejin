const session = require('../../services/session.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    activeTab: 'collection',
    tabs: [
      { id: 'collection', name: '收藏' },
      { id: 'like', name: '赞过' },
      { id: 'bookshelf', name: '书架' }
    ],
    articles: [],
    books: []
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/collectionSet/collectionSet')
  },

  onShow() {
    if (!this.authorized) return
    this.load()
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
    this.load()
  },

  load() {
    if (this.data.activeTab === 'bookshelf') {
      const ids = wx.getStorageSync('jj:bookshelf') || []
      const cached = (wx.getStorageSync('jj:course-cache') || []).concat(wx.getStorageSync('jj:course-history') || [])
      const byId = {}
      cached.concat(mock.courses.map(utils.normalizeCourse)).forEach((item) => {
        const course = item.id ? item : utils.normalizeCourse(item)
        if (course.id) byId[String(course.id)] = course
      })
      const books = ids.map((id) => byId[String(id)]).filter(Boolean)
      this.setData({ books, articles: [] })
      return
    }
    const ids = session.getList(this.data.activeTab === 'like' ? 'likes' : 'collections')
    const all = session.getList('articles').concat(session.getCachedArticles(), mock.articles)
    const byId = {}
    all.forEach((item) => { byId[item.article_id] = item })
    this.setData({ articles: ids.map((id) => byId[id]).filter(Boolean).map(utils.normalizeArticle), books: [] })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openCourse(event) {
    wx.navigateTo({ url: `/pages/courseDetail/courseDetail?id=${event.detail.item.id}` })
  }
})
