const session = require('../../services/session.js')

Page({
  data: {
    activeTab: 'article',
    stats: [],
    bars: [42, 46, 68, 51, 38, 88, 76]
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/creatorData/creatorData')
  },

  onShow() {
    if (!this.authorized) return
    const current = session.getSession()
    if (!current) return
    const user = current.user
    const articles = session.getList('articles')
    const likes = session.getList('likes')
    const collections = session.getList('collections')
    this.setData({
      stats: [
        { label: '总文章数', value: user.post_article_count || articles.length },
        { label: '展示数', value: user.got_view_count || 0 },
        { label: '阅读数', value: user.got_view_count || 0 },
        { label: '收藏数', value: collections.length },
        { label: '点赞数', value: user.got_digg_count || likes.length },
        { label: '评论数', value: 0 }
      ]
    })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
  }
})
