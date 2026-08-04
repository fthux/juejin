const mock = require('../../data/mockData.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    user: null,
    activeTab: 'article',
    articles: [],
    pins: [],
    followed: false
  },

  onLoad(query) {
    const currentSession = session.getSession()
    const cachedArticles = session.getCachedArticles()
    const cachedUser = cachedArticles.map((item) => item.author).find((item) => item && item.user_id === query.id)
    const isCurrentUser = currentSession && currentSession.user.user_id === query.id
    const user = isCurrentUser ? currentSession.user : (mock.authors.find((item) => item.user_id === query.id) || cachedUser || mock.authors[0])
    const sourceArticles = isCurrentUser ? session.getList('articles') : cachedArticles.concat(mock.articles)
    const sourcePins = isCurrentUser ? session.getList('pins') : mock.pins
    this.setData({
      user,
      articles: sourceArticles.filter((item) => {
        const author = item.author_user_info || item.author || {}
        return String(author.user_id) === String(user.user_id)
      }).map(utils.normalizeArticle),
      pins: sourcePins.filter((item) => {
        const author = item.author_user_info || (item.msg_Info && item.msg_Info.author_user_info) || {}
        return String(author.user_id) === String(user.user_id)
      }).map(utils.normalizePin),
      followed: session.getList('follows').indexOf(user.user_id) !== -1
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

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  }
})
