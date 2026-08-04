const session = require('../../services/session.js')
const chart = require('../../utils/chart.js')

const SERIES = {
  article: [
    { id: 'show', label: '展现', color: '#9b4dff', selected: true, values: [106, 108, 135, 106, 98, 180, 160] },
    { id: 'read', label: '阅读', color: '#1e80ff', selected: false, values: [64, 72, 81, 76, 70, 93, 88] },
    { id: 'digg', label: '点赞', color: '#ff7d00', selected: false, values: [12, 18, 20, 15, 16, 24, 21] },
    { id: 'comment', label: '评论', color: '#00b578', selected: false, values: [3, 5, 4, 6, 2, 7, 5] },
    { id: 'collect', label: '收藏', color: '#f53f3f', selected: false, values: [8, 7, 11, 9, 10, 13, 12] }
  ],
  column: [
    { id: 'read', label: '阅读', color: '#1e80ff', selected: true, values: [24, 28, 25, 31, 36, 38, 42] },
    { id: 'subscribe', label: '订阅', color: '#9b4dff', selected: false, values: [2, 3, 3, 4, 5, 5, 6] },
    { id: 'digg', label: '点赞', color: '#ff7d00', selected: false, values: [4, 6, 5, 8, 7, 9, 11] }
  ],
  pin: [
    { id: 'show', label: '展现', color: '#9b4dff', selected: true, values: [52, 60, 57, 68, 72, 81, 76] },
    { id: 'digg', label: '点赞', color: '#1e80ff', selected: false, values: [8, 12, 10, 15, 13, 18, 17] },
    { id: 'comment', label: '评论', color: '#00b578', selected: false, values: [2, 4, 3, 5, 4, 7, 6] },
    { id: 'share', label: '分享', color: '#f53f3f', selected: false, values: [0, 1, 1, 2, 1, 3, 2] }
  ]
}

Page({
  data: {
    activeTab: 'article',
    stats: [],
    activePeriod: 7,
    periods: [7, 14, 30],
    dates: [],
    metrics: [],
    trendSeries: []
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
    this.updateTrend()
  },

  toggleMetric(event) {
    const id = event.currentTarget.dataset.id
    const metrics = this.data.metrics.map((item) => item.id === id ? Object.assign({}, item, { selected: !item.selected }) : item)
    if (!metrics.some((item) => item.selected)) return
    this.setData({ metrics })
    this.updateTrend()
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
        { label: '展现数', value: chart.formatMetric(user.got_view_count) },
        { label: '阅读数', value: chart.formatMetric(user.got_view_count) },
        { label: '收藏数', value: Number(user.got_collect_count) || collections.length },
        { label: '点赞数', value: Number(user.got_digg_count) || likes.length },
        { label: '评论数', value: Number(user.got_comment_count) || 0 }
      ],
      column: [
        { label: '总专栏数', value: Number(user.post_column_count) || 0 },
        { label: '专栏文章', value: 0 }, { label: '订阅数', value: 0 },
        { label: '阅读数', value: 0 }, { label: '点赞数', value: 0 }, { label: '评论数', value: 0 }
      ],
      pin: [
        { label: '总沸点数', value: Number(user.post_shortmsg_count) || pins.length },
        { label: '展现数', value: 0 }, { label: '阅读数', value: 0 },
        { label: '点赞数', value: 0 }, { label: '评论数', value: 0 }, { label: '分享数', value: 0 }
      ]
    }
    this.setData({ stats: statMap[this.data.activeTab], metrics: SERIES[this.data.activeTab].map((item) => Object.assign({}, item)) })
    this.updateTrend()
  },

  updateTrend() {
    const metrics = this.data.metrics
    this.setData({
      dates: chart.recentDates(this.data.activePeriod, 7),
      trendSeries: metrics.filter((item) => item.selected).map((item) => ({ id: item.id, segments: chart.lineSegments(item.values, item.color, { max: 180 }) }))
    })
  }
})
