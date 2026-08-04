const session = require('../../services/session.js')

Page({
  data: {
    level: 1,
    current: 0,
    next: 0,
    progress: 0,
    nextLevel: 2,
    remaining: 0,
    privileges: [
      { level: 1, title: '点亮等级标识', description: '主页展示成长等级' },
      { level: 2, title: '评论专属标识', description: '参与讨论时展示等级' },
      { level: 3, title: '内容推荐机会', description: '优质内容获得更多曝光' },
      { level: 4, title: '社区活动权益', description: '参与开发者专属活动' }
    ]
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/level/level')
  },

  onShow() {
    if (!this.authorized) return
    const currentSession = session.getSession()
    if (!currentSession) return
    const user = currentSession.user
    const level = Number(user.level) || 1
    const current = Number(user.power) || 0
    const next = Number(user.next_level_power) || 0
    this.setData({
      level,
      current,
      next,
      nextLevel: level + 1,
      remaining: next > current ? next - current : 0,
      progress: next > current ? Math.round(current / next * 100) : 0
    })
  }
})
