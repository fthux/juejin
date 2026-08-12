const theme = require("../../utils/theme.js")
const mock = require('../../data/mockData.js')
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page(theme.withTheme({
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
    badges: [],
    showBadges: true,
    isFavorableAuthor: false,
    power: 0,
    articleCursor: '0',
    articleHasMore: true,
    articleLoading: false,
    articleFromCache: false
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
      avatar_large: '/assets/app/common/default_avatar.png'
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
    const badgeInfo = utils.normalizeUserBadges(user)

    this.setData({
      user,
      articles,
      pins,
      dynamics,
      followed: session.getList('follows').indexOf(user.user_id) !== -1,
      isCurrentUser,
      badgeCount: badgeInfo.obtainCount,
      badges: badgeInfo.obtainBadges.slice(0, 3),
      showBadges: badgeInfo.showBadge !== false,
      isFavorableAuthor: Number(user.favorable_author) === 1,
      power: Number(user.power || user.jpower || user.got_digg_count) || 0
    })
    wx.setNavigationBarTitle({ title: user.user_name })
    this.loadUserProfile()
    if (!isCurrentUser) this.loadArticles(true)
  },

  onPullDownRefresh() {
    if (!this.data.isCurrentUser) this.loadArticles(true)
    else wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.isCurrentUser && (this.data.activeTab === 'dynamic' || this.data.activeTab === 'article')) this.loadArticles(false)
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.id
    this.setData({ activeTab })
    if (!this.data.isCurrentUser && activeTab === 'article' && !this.data.articles.length) this.loadArticles(true)
  },

  loadUserProfile() {
    if (!this.data.user || !this.data.user.user_id) return
    const requestedUserId = String(this.data.user.user_id)
    api.userProfile(requestedUserId).then(({ result }) => {
      const remoteUser = result.data
      if (!remoteUser || requestedUserId !== String(this.data.user.user_id)) return
      const user = Object.assign({}, this.data.user, remoteUser, { user_id: requestedUserId })
      const badgeInfo = utils.normalizeUserBadges(user)
      this.setData({
        user,
        badgeCount: badgeInfo.obtainCount,
        badges: badgeInfo.obtainBadges.slice(0, 3),
        showBadges: badgeInfo.showBadge !== false,
        isFavorableAuthor: Number(user.favorable_author) === 1,
        power: Number(user.power || user.jpower || user.got_digg_count) || 0
      })
      wx.setNavigationBarTitle({ title: user.user_name })
    }).catch(() => {})
  },

  loadArticles(reload) {
    if (!this.data.user || this.data.articleLoading || (!reload && !this.data.articleHasMore)) return
    const cursor = reload ? '0' : this.data.articleCursor
    this.setData({ articleLoading: true })
    api.userArticles(this.data.user.user_id, cursor, 2).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeArticle).filter((item) => item.article_id)
      const profileAuthor = rows.map((item) => item.author).find((author) => (
        String(author.user_id) === String(this.data.user.user_id)
      ))
      const user = profileAuthor ? Object.assign({}, this.data.user, profileAuthor, {
        badges: profileAuthor.badges || this.data.user.badges,
        favorable_author: profileAuthor.favorable_author !== undefined ? profileAuthor.favorable_author : this.data.user.favorable_author
      }) : this.data.user
      const badgeInfo = utils.normalizeUserBadges(user)
      const seed = reload && rows.length ? [] : this.data.articles
      const known = new Set(seed.map((item) => String(item.article_id)))
      const additions = rows.filter((item) => !known.has(String(item.article_id)))
      const articles = seed.concat(additions)
      const articleDynamics = articles.map((item) => Object.assign({ kind: 'article' }, item))
      const pinDynamics = this.data.pins.map((item) => Object.assign({ kind: 'pin' }, item))
      this.setData({
        user,
        badgeCount: badgeInfo.obtainCount,
        badges: badgeInfo.obtainBadges.slice(0, 3),
        showBadges: badgeInfo.showBadge !== false,
        isFavorableAuthor: Number(user.favorable_author) === 1,
        power: Number(user.power || user.jpower || user.got_digg_count) || 0,
        articles,
        dynamics: articleDynamics.concat(pinDynamics),
        articleCursor: String(result.cursor || cursor),
        articleHasMore: Boolean(result.has_more) && additions.length > 0,
        articleLoading: false,
        articleFromCache: Boolean(fromCache)
      })
    }).catch(() => this.setData({ articleLoading: false, articleHasMore: false, articleFromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  toggleFollow() {
    if (!session.requireLogin()) return
    const followed = session.toggle('follows', this.data.user.user_id)
    this.setData({ followed })
  },

  openChat() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: `/features/chat/chat?id=${this.data.user.user_id}&name=${encodeURIComponent(this.data.user.user_name)}` })
  },

  editProfile() {
    wx.showToast({ title: '资料编辑请前往掘金 APP', icon: 'none' })
  },

  openBadges() {
    wx.showToast({ title: `已获得 ${this.data.badgeCount} 枚徽章`, icon: 'none' })
  },

  onBadgeImageError(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isInteger(index) || !this.data.badges[index]) return
    this.setData({ [`badges[${index}].hidden`]: true })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/features/post/post?id=${event.detail.item.article_id}` })
  },

  openPin(event) {
    wx.navigateTo({ url: `/features/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  }
}))
