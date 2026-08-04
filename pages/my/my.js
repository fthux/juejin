const session = require('../../services/session.js')

Page({
  data: {
    session: null,
    user: null,
    unread: 0,
    counts: {
      collections: 0,
      history: 0,
      drafts: 0,
      notes: 0
    },
    featureEntries: [
      { name: '每日签到', icon: '/assets/app/user/ic_user_sign.webp', url: '/pages/sign/sign' },
      { name: '成长等级', icon: '/assets/app/user/ic_user_lv1.webp', url: '/pages/level/level' },
      { name: '创作者中心', icon: '/assets/app/user/ic_user_builder.webp', url: '/pages/creator/creator' },
      { name: 'VIP 权益', icon: '/assets/app/user/ic_user_luck.webp', url: '/pages/vip/vip' }
    ],
    menuEntries: [
      { name: '我的收藏', mark: '收', url: '/pages/collectionSet/collectionSet', countKey: 'collections' },
      { name: '浏览历史', mark: '历', url: '/pages/readHistory/readHistory', countKey: 'history' },
      { name: '我的课程', mark: '课', url: '/pages/xiaoce/xiaoce', tab: true },
      { name: '创作草稿', mark: '稿', url: '/pages/drafts/drafts', countKey: 'drafts' },
      { name: '我的笔记', mark: '记', url: '/pages/notes/notes', countKey: 'notes' },
      { name: '消息中心', mark: '消', url: '/pages/notifications/notifications' },
      { name: '设置', mark: '设', url: '/pages/setting/setting' }
    ]
  },

  onShow() {
    const currentSession = session.getSession()
    const notices = session.getList('notifications')
    this.setData({
      session: currentSession,
      user: currentSession ? currentSession.user : null,
      unread: notices.filter((item) => item.unread).length,
      counts: {
        collections: session.getList('collections').length,
        history: session.getList('history').length,
        drafts: session.getList('drafts').length,
        notes: session.getList('notes').length
      }
    })
  },

  openLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  openProfile() {
    if (!this.data.session) {
      this.openLogin()
      return
    }
    wx.navigateTo({ url: '/pages/profile/profile?id=local-user' })
  },

  openEntry(event) {
    const url = event.currentTarget.dataset.url
    const isTab = event.currentTarget.dataset.tab
    if (isTab) wx.switchTab({ url })
    else wx.navigateTo({ url })
  },

  openPublish() {
    wx.navigateTo({ url: '/pages/publish/publish?type=article' })
  },

  openNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' })
  }
})
