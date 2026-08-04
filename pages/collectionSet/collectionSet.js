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

  onShow() {
    this.load()
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
    this.load()
  },

  load() {
    if (this.data.activeTab === 'bookshelf') {
      const ids = wx.getStorageSync('jj:bookshelf') || []
      const books = mock.courses.filter((item) => ids.indexOf(item.booklet_id) !== -1).map((item) => ({
        id: item.booklet_id,
        title: item.base_info.title,
        summary: item.base_info.summary,
        cover: item.base_info.cover_img,
        author: item.user_info.user_name,
        section_count: item.base_info.section_count,
        price: item.base_info.price ? (item.base_info.price / 100).toFixed(2) : '',
        is_finished: item.base_info.is_finished,
        owned: (wx.getStorageSync('jj:owned-courses') || []).indexOf(item.booklet_id) !== -1
      }))
      this.setData({ books, articles: [] })
      return
    }
    const ids = session.getList(this.data.activeTab === 'like' ? 'likes' : 'collections')
    const all = session.getList('articles').concat(mock.articles)
    this.setData({ articles: all.filter((item) => ids.indexOf(item.article_id) !== -1).map(utils.normalizeArticle), books: [] })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openCourse(event) {
    wx.navigateTo({ url: `/pages/courseDetail/courseDetail?id=${event.detail.item.id}` })
  }
})
