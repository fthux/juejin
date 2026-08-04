const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    greeting: '每天读一点，保持技术好奇心',
    dailyArticle: null,
    selectedPins: [],
    loading: true,
    loadError: false,
    channelEntries: [
      { title: '面试锦囊', icon: '/assets/app/find/find_page_ic_interview_kit.svg', url: '/pages/discoverChannel/discoverChannel?type=interview&title=面试锦囊' },
      { title: '行业速递', icon: '/assets/app/find/find_page_ic_industry_express.svg', url: '/pages/discoverChannel/discoverChannel?type=news&title=行业速递' },
      { title: '掘金一周', icon: '/assets/app/find/find_page_ic_juejin_weekly.svg', url: '/pages/discoverChannel/discoverChannel?type=weekly&title=掘金一周' },
      { title: '高校必读', icon: '/assets/app/find/find_page_ic_undergraduate_reading.svg', url: '/pages/discoverChannel/discoverChannel?type=student&title=高校必读' }
    ],
    quickEntries: [
      { name: '直播', icon: '/assets/app/find/find_page_ic_live.svg', url: '/pages/discoverChannel/discoverChannel?type=live&title=直播' },
      { name: '专栏', icon: '/assets/app/find/find_page_ic_column.svg', url: '/pages/column/column' },
      { name: '收藏集', icon: '/assets/app/find/find_page_ic_collection.svg', url: '/pages/collectionSet/collectionSet' },
      { name: '文章榜', icon: '/assets/app/find/find_page_ic_rank_article.svg', url: '/pages/rank/rank?type=article' },
      { name: '作者榜', icon: '/assets/app/find/find_page_ic_rank_author.svg', url: '/pages/rank/rank?type=author' }
    ]
  },

  onLoad() {
    this.loadAll()
  },

  onShow() {
    this.syncPinState()
  },

  onPullDownRefresh() {
    this.loadAll()
  },

  loadAll() {
    this.setData({ loading: true, loadError: false })
    Promise.all([api.daily(), api.selectedPins('0')]).then(([dailyResponse, pinResponse]) => {
      const dailyData = dailyResponse.result.data || {}
      const dailyRows = Array.isArray(dailyData)
        ? dailyData
        : (dailyData.article_info ? [dailyData] : (dailyData.articles || dailyData.article_list || []))
      const selectedPins = (pinResponse.result.data || []).map(utils.normalizePin).slice(0, 8)
      this.setData({
        greeting: dailyData.greeting || this.data.greeting,
        dailyArticle: dailyRows.length ? utils.normalizeArticle(dailyRows[0]) : null,
        selectedPins: this.withPinState(selectedPins),
        loading: false,
        loadError: dailyResponse.fromCache || pinResponse.fromCache
      })
    }).catch(() => this.setData({ loading: false, loadError: true })).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  withPinState(pins) {
    const likes = session.getList('likes')
    const follows = session.getList('follows')
    return pins.map((pin) => Object.assign({}, pin, {
      is_digg: likes.indexOf(pin.msg_id) !== -1 || pin.is_digg,
      followed: follows.indexOf(pin.author.user_id) !== -1
    }))
  },

  syncPinState() {
    if (this.data.selectedPins.length) this.setData({ selectedPins: this.withPinState(this.data.selectedPins) })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  openFeature(event) {
    const url = event.currentTarget.dataset.url
    if (url) wx.navigateTo({ url })
  },

  openLive() {
    wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=live&title=正在直播' })
  },

  openBanner() {
    wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=guide&title=掘金使用指南' })
  },

  openDaily() {
    if (this.data.dailyArticle) wx.navigateTo({ url: `/pages/post/post?id=${this.data.dailyArticle.article_id}` })
  },

  openDailyHistory() {
    wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=daily&title=每日掘金' })
  },

  openSelectedPins() {
    getApp().globalData.openSelectedPins = true
    wx.switchTab({ url: '/pages/feidian/feidian' })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.currentTarget.dataset.id}` })
  },

  openAuthor(event) {
    wx.navigateTo({ url: `/pages/profile/profile?id=${event.currentTarget.dataset.id}` })
  },

  toggleFollow(event) {
    if (!session.requireLogin()) return
    const userId = event.currentTarget.dataset.id
    const followed = session.toggle('follows', userId)
    this.setData({
      selectedPins: this.data.selectedPins.map((pin) => pin.author.user_id === userId ? Object.assign({}, pin, { followed }) : pin)
    })
  },

  toggleLike(event) {
    if (!session.requireLogin()) return
    const msgId = event.currentTarget.dataset.id
    const active = session.toggle('likes', msgId)
    this.setData({
      selectedPins: this.data.selectedPins.map((pin) => pin.msg_id === msgId ? Object.assign({}, pin, { is_digg: active }) : pin)
    })
  },

  onShareAppMessage() {
    return { title: '发现稀土掘金', path: '/pages/find/find' }
  }
})
