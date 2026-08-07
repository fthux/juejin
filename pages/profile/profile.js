const mock = require('../../data/mockData.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    user: null,
    activeTab: 'dynamic',
    tabs: [
      { id: 'dynamic', name: '动态' },
      { id: 'article', name: '文章' },
      { id: 'column', name: '专栏' },
      { id: 'pin', name: '沸点' },
      { id: 'other', name: '其他' }
    ],
    articles: [],
    pins: [],
    dynamics: [],
    followed: false,
    isCurrentUser: false,
    badgeCount: 0,
    power: 0
  },

  onLoad(query) {
    const currentSession = session.getSession()
    const cachedArticles = session.getCachedArticles()
    const cachedUser = cachedArticles.map((item) => item.author).find((item) => item && item.user_id === query.id)
    const discoverUser = wx.getStorageSync('jj:user-current')
    const matchedDiscoverUser = discoverUser && String(discoverUser.user_id) === String(query.id) ? discoverUser : null
    const isCurrentUser = currentSession && currentSession.user.user_id === query.id
    const user = isCurrentUser ? currentSession.user : (matchedDiscoverUser || mock.authors.find((item) => item.user_id === query.id) || cachedUser || {
      user_id: query.id,
      user_name: '掘金用户',
      avatar_large: '/assets/app/common/default_avatar.webp'
    })
    const sourceArticles = isCurrentUser ? session.getList('articles') : (matchedDiscoverUser && matchedDiscoverUser.articles || []).concat(cachedArticles, mock.articles)
    const sourcePins = isCurrentUser ? session.getList('pins') : mock.pins
    const articles = sourceArticles.filter((item) => {
      const author = item.author_user_info || item.author || {}
      return String(author.user_id) === String(user.user_id)
    }).map(utils.normalizeArticle)
    const pins = sourcePins.filter((item) => {
      const author = item.author_user_info || (item.msg_Info && item.msg_Info.author_user_info) || {}
      return String(author.user_id) === String(user.user_id)
    }).map(utils.normalizePin)
    const dynamics = articles.map((item) => Object.assign({ kind: 'article' }, item))
      .concat(pins.map((item) => Object.assign({ kind: 'pin' }, item)))

    this.setData({
      user,
      articles,
      pins,
      dynamics,
      followed: session.getList('follows').indexOf(user.user_id) !== -1,
      isCurrentUser,
      badgeCount: Number(user.badge_count) || 5,
      power: Number(user.power || user.jpower || user.got_digg_count) || 0
    })
    wx.setNavigationBarTitle({ title: user.user_name })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
  },

  toggleFollow() {
    if (!session.requireLogin()) return
    const followed = session.toggle('follows', this.data.user.user_id)
    this.setData({ followed })
  },

  openChat() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: `/pages/chat/chat?id=${this.data.user.user_id}&name=${encodeURIComponent(this.data.user.user_name)}` })
  },

  editProfile() {
    wx.showToast({ title: '资料编辑请前往掘金 APP', icon: 'none' })
  },

  openBadges() {
    wx.showToast({ title: `已获得 ${this.data.badgeCount} 枚徽章`, icon: 'none' })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  }
})
