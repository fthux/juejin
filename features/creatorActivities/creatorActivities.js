const theme = require("../../utils/theme.js")
const session = require('../../services/session.js')

Page(theme.withTheme({
  data: {
    activeTab: 'article',
    status: 'active',
    category: 'hot',
    activities: [
      {
        id: 'trae-work-2026',
        type: 'article',
        category: 'hot',
        status: 'active',
        title: '「TRAE Work 实战帮」征文启动！你的经验，值得被看见！',
        description: '征集开发者解决日常工作难题的可复用经验',
        time: '2026-08-03 ~ 2026-08-23',
        image: '/features/assets/app/creator/activity_trae_work.webp'
      },
      {
        id: 'juejin-daily-share',
        type: 'pin',
        category: 'daily',
        status: 'active',
        title: '今日开发记录',
        description: '用一条沸点记录今天解决的技术问题',
        time: '长期活动',
        image: '/assets/app/find/find_page_bg_top.webp'
      },
      {
        id: 'open-source-stories',
        type: 'article',
        category: 'hot',
        status: 'ended',
        title: '开源项目成长记',
        description: '分享一个开源项目从想法到发布的过程',
        time: '已结束',
        image: '/features/assets/app/find/find_page_bg_article_recommend_card_selected.webp'
      }
    ],
    list: []
  },
  onLoad() {
    this.authorized = session.requirePage('/features/creatorActivities/creatorActivities')
  },

  onShow() {
    if (!this.authorized) return
    this.applyFilters()
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
    this.applyFilters()
  },

  changeStatus() {
    const next = this.data.status === 'active' ? 'ended' : 'active'
    this.setData({ status: next })
    this.applyFilters()
  },

  changeCategory() {
    const next = this.data.category === 'all' ? 'hot' : 'all'
    this.setData({ category: next })
    this.applyFilters()
  },

  applyFilters() {
    const registeredIds = session.getList('registrations').map((item) => item.id)
    const list = this.data.activities
      .filter((item) => item.type === this.data.activeTab)
      .filter((item) => item.status === this.data.status)
      .filter((item) => this.data.category === 'all' || item.category === this.data.category)
      .map((item) => Object.assign({}, item, { registered: registeredIds.indexOf(item.id) !== -1 }))
    this.setData({ list })
  },

  toggleRegistration(event) {
    const activity = this.data.activities.find((item) => item.id === event.currentTarget.dataset.id)
    if (!activity || activity.status !== 'active') return
    const active = session.toggleRegistration(activity)
    wx.showToast({ title: active ? '报名成功' : '已取消报名', icon: 'none' })
    this.applyFilters()
  }
}))
