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
    const user = query.id === 'local-user' && currentSession ? currentSession.user : (mock.authors.find((item) => item.user_id === query.id) || mock.authors[0])
    const sourceArticles = user.user_id === 'local-user' ? session.getList('articles') : mock.articles
    const sourcePins = user.user_id === 'local-user' ? session.getList('pins') : mock.pins
    this.setData({
      user,
      articles: sourceArticles.filter((item) => item.author_user_info.user_id === user.user_id).map(utils.normalizeArticle),
      pins: sourcePins.filter((item) => item.author_user_info.user_id === user.user_id).map(utils.normalizePin),
      followed: session.getList('follows').indexOf(user.user_id) !== -1
    })
    wx.setNavigationBarTitle({ title: user.user_name })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
  },

  toggleFollow() {
    const followed = session.toggle('follows', this.data.user.user_id)
    this.setData({ followed })
  },

  openChat() {
    wx.navigateTo({ url: `/pages/chat/chat?id=${this.data.user.user_id}&name=${encodeURIComponent(this.data.user.user_name)}` })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  }
})
