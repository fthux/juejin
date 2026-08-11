const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

function accountCounts(user) {
  if (!user) return { likes: '-', collections: '-', follows: '-' }
  const liked = Number(user.digg_article_count || 0) + Number(user.digg_shortmsg_count || 0)
  return {
    likes: liked,
    collections: session.getList('collections').length,
    follows: Number(user.followee_count) || 0
  }
}

Page(theme.withTheme({
  data: {
    session: null,
    user: null,
    unread: 0,
    counts: {
      likes: '-',
      collections: '-',
      follows: '-'
    },
    activityNotices: [],
    featureEntries: [
      { name: '每日签到', icon: '/assets/app/user/ic_user_sign.png', url: '/features/sign/sign', auth: true },
      { name: '幸运转盘', icon: '/assets/app/user/ic_user_luck.png', url: '/features/lottery/lottery', auth: true },
      { name: 'Bug挑战赛', icon: '/assets/app/user/ic_user_bug.png', message: '当前暂无进行中的挑战赛', auth: true },
      { name: '福利兑换', icon: '/assets/app/user/ic_user_change.png', url: '/features/welfare/welfare', auth: true }
    ],
    creatorEntries: [
      { name: '内容数据', icon: '/assets/app/creator/ic_creator_data_center.png', url: '/features/creatorData/creatorData', auth: true },
      { name: '粉丝数据', icon: '/assets/app/creator/ic_creator_follow_data_center.png', url: '/features/creatorFans/creatorFans', auth: true },
      { name: '创作活动', icon: '/assets/app/creator/ic_creator_activity.png', url: '/features/creatorActivities/creatorActivities', auth: true },
      { name: '草稿箱', icon: '/assets/app/creator/ic_creator_draft_list.png', url: '/features/drafts/drafts', auth: true }
    ],
    moreEntries: [
      { name: '课程中心', icon: '/assets/app/user/ic_user_course.png', url: '/features/courseCenter/courseCenter', auth: true },
      { name: '推广中心', icon: '/assets/app/user/ic_user_popularize.png', url: '/features/popularize/popularize' },
      { name: '我的优惠券', icon: '/assets/app/user/ic_user_coupon.png', url: '/features/coupon/coupon', auth: true },
      { name: '我的圈子', icon: '/assets/app/user/ic_user_pins.png', url: '/features/topic/topic', auth: true },
      { name: '阅读记录', icon: '/assets/app/user/ic_user_history.png', url: '/features/readHistory/readHistory', auth: true },
      { name: '标签管理', icon: '/assets/app/user/ic_user_tag.png', url: '/features/tags/tags', auth: true },
      { name: '我的报名', icon: '/assets/app/user/ic_user_apply.png', url: '/features/registrations/registrations', auth: true },
      { name: '意见反馈', icon: '/assets/app/user/ic_user_suggest.png', url: '/features/feedback/feedback' }
    ]
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 4 })
    const currentSession = session.getSession()
    const notices = currentSession ? session.getList('notifications') : []
    this.setData({
      session: currentSession,
      user: currentSession ? currentSession.user : null,
      unread: notices.filter((item) => item.unread).length,
      counts: accountCounts(currentSession && currentSession.user)
    })
    this.loadActivityNotices()
  },

  loadActivityNotices() {
    if (this.activityLoading) return
    this.activityLoading = true
    const cached = wx.getStorageSync('jj:creator-activity-notices') || []
    if (cached.length && !this.data.activityNotices.length) this.setData({ activityNotices: cached })
    api.creatorActivities('0', { limit: 6, type: 1, status: 1, categoryId: '0' }).then(({ result, fromCache }) => {
      const notices = (result.data || []).map((item) => ({
        id: String(item.event_id || item.id || ''),
        title: item.title || '',
        type: '活动'
      })).filter((item) => item.id && item.title)
      if (notices.length) {
        this.setData({ activityNotices: notices })
        if (!fromCache) wx.setStorageSync('jj:creator-activity-notices', notices)
      }
    }).finally(() => { this.activityLoading = false })
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

  openTheme() {
    const currentTheme = theme.getResolvedTheme()
    theme.setPreference({
      followSystem: false,
      selected: currentTheme === 'dark' ? 'light' : 'dark'
    })
  },

  openCreator() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/creator/creator' })
  },

  openActivity() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/creatorActivities/creatorActivities' })
  },

  openActivityNotice() {
    this.openActivity()
  },

  openCollections() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/features/collectionSet/collectionSet' })
  },

  openVip() {
    wx.navigateTo({ url: '/features/vip/vip' })
  }
}))
