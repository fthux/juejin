const session = require('../../services/session.js')

Page({
  data: { stats: [] },
  onShow() {
    const current = session.getSession()
    const followers = current ? Number(current.user.follower_count) || 0 : 0
    this.setData({ stats: [
      { label: '总粉丝', value: followers },
      { label: '互动粉丝', value: 0 },
      { label: '新增关注', value: 0 },
      { label: '取消关注', value: 0 },
      { label: '净增关注', value: 0 }
    ] })
  }
})
