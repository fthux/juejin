const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    session: null,
    user: null,
    unread: 0,
    counts: {
      likes: 0,
      collections: 0,
      follows: 0,
      history: 0
    },
    featureEntries: [
      { name: '每日签到', icon: '/assets/app/user/ic_user_sign.webp', url: '/features/sign/sign', auth: true },
      { name: '幸运转盘', icon: '/assets/app/user/ic_user_luck.webp', url: '/features/lottery/lottery', auth: true },
      { name: 'Bug 挑战赛', icon: '/assets/app/user/ic_user_bug.webp', message: '当前暂无进行中的挑战赛' },
      { name: '福利兑换', icon: '/assets/app/user/ic_user_change.webp', url: '/features/welfare/welfare', auth: true }
    ],
    creatorEntries: [
      { name: '内容数据', icon: '/assets/app/creator/ic_creator_data_center.webp', url: '/features/creatorData/creatorData', auth: true },
      { name: '粉丝数据', icon: '/assets/app/creator/ic_creator_follow_data_center.webp', url: '/features/creatorFans/creatorFans', auth: true },
      { name: '创作活动', icon: '/assets/app/creator/ic_creator_activity.webp', url: '/features/creatorActivities/creatorActivities', auth: true },
      { name: '草稿箱', icon: '/assets/app/creator/ic_creator_draft_list.webp', url: '/features/drafts/drafts', auth: true }
    ],
    moreEntries: [
      { name: '课程中心', icon: '/assets/app/user/ic_user_course.svg', url: '/features/courseCenter/courseCenter', auth: true },
      { name: '推广中心', icon: '/assets/app/user/ic_user_popularize.svg', url: '/features/popularize/popularize', auth: true },
      { name: '我的优惠券', icon: '/assets/app/user/ic_user_coupon.svg', url: '/features/coupon/coupon', auth: true },
      { name: '我的圈子', icon: '/assets/app/user/ic_user_pins.svg', url: '/features/topic/topic', auth: true },
      { name: '阅读记录', icon: '/assets/app/user/ic_user_history.svg', url: '/features/readHistory/readHistory', auth: true },
      { name: '标签管理', icon: '/assets/app/user/ic_user_tag.svg', url: '/features/tags/tags', auth: true },
      { name: '我的报名', icon: '/assets/app/user/ic_user_apply.svg', url: '/features/registrations/registrations', auth: true },
      { name: '意见反馈', icon: '/assets/app/user/ic_user_suggest.svg', url: '/features/feedback/feedback' }
    ]
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 4 })
    const currentSession = session.getSession()
    const notices = session.getList('notifications')
    this.setData({
      session: currentSession,
      user: currentSession ? currentSession.user : null,
      unread: notices.filter((item) => item.unread).length,
      counts: {
        likes: session.getList('likes').length,
        collections: session.getList('collections').length,
        follows: session.getList('follows').length,
        history: session.getList('history').length
      }
    })
  },

  openLogin() {
    wx.navigateTo({ url: '/features/login/login' })
  },

  openProfile() {
    if (!this.data.session) {
      this.openLogin()
      return
    }
    wx.navigateTo({ url: `/features/profile/profile?id=${this.data.user.user_id}` })
  },

  openEntry(event) {
    const data = event.currentTarget.dataset
    if (data.auth && !session.requireLogin()) return
    if (!data.url) {
      utils.toast(data.message || '该功能暂不可用')
      return
    }
    if (data.tab) wx.switchTab({ url: data.url })
    else wx.navigateTo({ url: data.url })
  },

  openNotifications() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/notifications/notifications' })
  },

  openSettings() {
    wx.navigateTo({ url: '/features/setting/setting' })
  },

  openScan() {
    utils.toast('扫码需要设备权限，小程序版本不提供')
  },

  openTheme() {
    utils.toast('外观跟随微信系统设置')
  },

  openCreator() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/creator/creator' })
  },

  openActivity() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/creatorActivities/creatorActivities' })
  },

  openCollections() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/collectionSet/collectionSet' })
  },

  openVip() {
    wx.navigateTo({ url: '/features/vip/vip' })
  }
})
