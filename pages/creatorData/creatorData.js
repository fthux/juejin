const session = require('../../services/session.js')

Page({
  data: {
    activeTab: 'article',
    stats: [],
    activePeriod: 7,
    periods: [7, 14, 30]
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/creatorData/creatorData')
  },

  onShow() {
    if (!this.authorized) return
    const current = session.getSession()
    if (!current) return
    this.user = current.user
    this.updateStats()
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
    this.updateStats()
  },

  selectPeriod(event) {
    this.setData({ activePeriod: Number(event.currentTarget.dataset.days) || 7 })
  },

  updateStats() {
    const user = this.user
    if (!user) return
    const articles = session.getList('articles')
    const pins = session.getList('pins')
    const likes = session.getList('likes')
    const collections = session.getList('collections')
    const statMap = {
      article: [
        { label: '总文章数', value: Number(user.post_article_count) || articles.length },
        { label: '展示数', value: Number(user.got_view_count) || 0 },
        { label: '阅读数', value: Number(user.got_view_count) || 0 },
        { label: '收藏数', value: Number(user.got_collect_count) || collections.length },
        { label: '点赞数', value: Number(user.got_digg_count) || likes.length },
        { label: '评论数', value: 0 }
      ],
      column: [
        { label: '总专栏数', value: Number(user.post_column_count) || 0 },
        { label: '专栏文章', value: 0 },
        { label: '订阅数', value: 0 },
        { label: '阅读数', value: 0 },
        { label: '点赞数', value: 0 },
        { label: '评论数', value: 0 }
      ],
      pin: [
        { label: '总沸点数', value: Number(user.post_shortmsg_count) || pins.length },
        { label: '展示数', value: 0 },
        { label: '阅读数', value: 0 },
        { label: '点赞数', value: 0 },
        { label: '评论数', value: 0 },
        { label: '分享数', value: 0 }
      ]
    }
    this.setData({ stats: statMap[this.data.activeTab] })
  }
})
