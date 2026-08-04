const session = require('../../services/session.js')

Page({
  data: {
    activeTab: 'article',
    stats: [],
    bars: [42, 46, 68, 51, 38, 88, 76]
  },

  onShow() {
    const articles = session.getList('articles')
    const history = session.getList('history')
    const likes = session.getList('likes')
    const collections = session.getList('collections')
    this.setData({
      stats: [
        { label: '总文章数', value: articles.length },
        { label: '展示数', value: history.length * 18 },
        { label: '阅读数', value: history.length },
        { label: '收藏数', value: collections.length },
        { label: '点赞数', value: likes.length },
        { label: '评论数', value: 0 }
      ]
    })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
  }
})
