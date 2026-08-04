const session = require('../../services/session.js')
const api = require('../../services/api.js')

Page({
  data: {
    activeTab: 'data',
    stats: [],
    followers: [],
    loading: false
  },
  onLoad() {
    this.authorized = session.requirePage('/pages/creatorFans/creatorFans')
  },
  onShow() {
    if (!this.authorized) return
    const current = session.getSession()
    const followers = current ? Number(current.user.follower_count) || 0 : 0
    this.setData({ stats: [
      { label: '总粉丝', value: followers },
      { label: '互动粉丝', value: 0 },
      { label: '新增关注', value: 0 },
      { label: '取消关注', value: 0 },
      { label: '净增关注', value: 0 }
    ] })
    if (this.data.activeTab === 'list') this.loadFollowers()
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.id
    this.setData({ activeTab })
    if (activeTab === 'list' && !this.data.followers.length) this.loadFollowers()
  },

  loadFollowers() {
    const current = session.getSession()
    if (!current || this.data.loading) return
    this.setData({ loading: true })
    api.followers(current.user.user_id, '0').then(({ result }) => {
      const payload = result.data || []
      const rows = Array.isArray(payload) ? payload : (payload.list || payload.data || [])
      const followers = rows.map((item) => item.user_info || item).filter((item) => item.user_id).map((item) => ({
        user_id: String(item.user_id),
        user_name: item.user_name || '掘金用户',
        avatar_large: item.avatar_large || '/assets/app/common/default_avatar.webp',
        description: item.job_title || item.description || '掘金用户'
      }))
      this.setData({ followers })
    }).finally(() => this.setData({ loading: false }))
  },

  openFollower(event) {
    wx.navigateTo({ url: `/pages/profile/profile?id=${event.currentTarget.dataset.id}` })
  }
})
