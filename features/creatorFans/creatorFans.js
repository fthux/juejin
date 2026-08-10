const session = require('../../services/session.js')
const api = require('../../services/api.js')
const chart = require('../utils/chart.js')

const BASE_METRICS = [
  { id: 'total', label: '总粉丝', color: '#55a6ff', selected: true, values: [188, 188, 189, 190, 191, 192, 192] },
  { id: 'active', label: '互动粉丝', color: '#ff5a5f', selected: true, values: [0, 0, 1, 0, 0, 0, 0] },
  { id: 'new', label: '新增粉丝', color: '#9b4dff', selected: false, values: [1, 0, 2, 1, 1, 1, 0] },
  { id: 'lost', label: '取消关注', color: '#ff9f1a', selected: false, values: [0, 0, 1, 0, 0, 0, 0] },
  { id: 'net', label: '净增关注', color: '#00b578', selected: false, values: [1, 0, 1, 1, 1, 1, 0] }
]

Page({
  data: {
    activeTab: 'data',
    stats: [],
    followers: [],
    loading: false,
    periods: [7, 14, 30],
    activePeriod: 7,
    dates: [],
    metrics: BASE_METRICS,
    trendSeries: []
  },

  onLoad() {
    this.authorized = session.requirePage('/features/creatorFans/creatorFans')
  },

  onShow() {
    if (!this.authorized) return
    const current = session.getSession()
    const followers = current ? Number(current.user.follower_count) || 0 : 0
    const metrics = BASE_METRICS.map((item) => item.id === 'total'
      ? Object.assign({}, item, { values: item.values.map(() => followers) })
      : Object.assign({}, item))
    this.setData({
      stats: [
        { label: '总粉丝', value: followers }, { label: '互动粉丝', value: 0, help: true },
        { label: '新增关注', value: 0, help: true }, { label: '取消关注', value: 0 },
        { label: '净增关注', value: 0, help: true }
      ],
      metrics
    })
    this.updateTrend()
    if (this.data.activeTab === 'list') this.loadFollowers()
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.id
    this.setData({ activeTab })
    if (activeTab === 'list' && !this.data.followers.length) this.loadFollowers()
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

  updateTrend() {
    this.setData({
      dates: chart.recentDates(this.data.activePeriod, 7),
      trendSeries: this.data.metrics.filter((item) => item.selected).map((item) => ({ id: item.id, segments: chart.lineSegments(item.values, item.color, { max: 195 }) }))
    })
  },

  loadFollowers() {
    const current = session.getSession()
    if (!current || this.data.loading) return
    this.setData({ loading: true })
    api.followers(current.user.user_id, '0').then(({ result }) => {
      const payload = result.data || []
      const rows = Array.isArray(payload) ? payload : (payload.list || payload.data || [])
      const followers = rows.map((item) => item.user_info || item).filter((item) => item.user_id).map((item) => ({
        user_id: String(item.user_id), user_name: item.user_name || '掘金用户',
        avatar_large: item.avatar_large || '/assets/app/common/default_avatar.webp',
        description: item.job_title || item.description || '掘金用户'
      }))
      this.setData({ followers })
    }).finally(() => this.setData({ loading: false }))
  },

  openFollower(event) {
    wx.navigateTo({ url: `/features/profile/profile?id=${event.currentTarget.dataset.id}` })
  }
})
