const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const RECOMMENDED_TOPICS_CACHE_KEY = 'jj:recommended-topics'
const HEADER_RETRY_LIMIT = 2
const ICON_RETRY_LIMIT = 2

Page(theme.withTheme({
  data: {
    topTab: 'discover',
    sort: 'latest',
    topics: [],
    list: [],
    selectedPins: [],
    cursor: '0',
    loading: false,
    hasMore: true,
    fromCache: false,
    loadError: false
  },

  onLoad() {
    this.feedRequestId = 0
    this.headerRequestId = 0
    this.headerRetryCount = 0
    this.topicIconRetryTimers = {}
    this.loadHeaderData()
    this.loadFeed(true)
  },

  onUnload() {
    this.headerRequestId += 1
    if (this.headerRetryTimer) clearTimeout(this.headerRetryTimer)
    this.clearTopicIconRetryTimers()
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 1 })
    const globalData = getApp().globalData
    if (globalData.openSelectedPins) {
      globalData.openSelectedPins = false
      setTimeout(() => wx.pageScrollTo({ selector: '#selected-section', duration: 300 }), 120)
    }
  },

  onPullDownRefresh() {
    if (this.data.topTab === 'following') {
      wx.stopPullDownRefresh()
      return
    }
    this.headerRetryCount = 0
    if (this.headerRetryTimer) clearTimeout(this.headerRetryTimer)
    this.loadHeaderData()
    this.loadFeed(true)
  },

  onReachBottom() {
    if (this.data.topTab === 'discover' && this.data.hasMore) this.loadFeed(false)
  },

  switchTopTab(event) {
    const topTab = event.currentTarget.dataset.id
    if (topTab === this.data.topTab) return
    this.feedRequestId += 1
    this.setData({ topTab })
    if (topTab === 'discover' && !this.data.list.length) this.loadFeed(true)
  },

  selectSort(event) {
    if (this.data.loading) return
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort })
    this.loadFeed(true)
  },

  loadHeaderData() {
    const requestId = ++this.headerRequestId
    Promise.all([api.topics('0', 10), api.selectedPins('0')]).then(([topicResponse, pinResponse]) => {
      if (requestId !== this.headerRequestId) return
      const networkRows = (topicResponse.result.data || []).slice(0, 10)
      const storedRows = wx.getStorageSync(RECOMMENDED_TOPICS_CACHE_KEY)
      const cachedRows = Array.isArray(storedRows) ? storedRows.slice(0, 10) : []
      if (topicResponse.fromCache && !cachedRows.length && this.scheduleHeaderRetry()) return

      const topicRows = topicResponse.fromCache && cachedRows.length ? cachedRows : networkRows
      if (!topicResponse.fromCache && networkRows.length) {
        this.headerRetryCount = 0
        wx.setStorageSync(RECOMMENDED_TOPICS_CACHE_KEY, networkRows)
      }
      const topics = topicRows.map((item) => {
        const topic = item.topic || item
        const topicId = String(item.topic_id || topic.topic_id || '')
        const icon = utils.normalizeImageUrl(topic.icon || topic.icon_url || topic.topic_pic || '', 160)
        const iconUrl = /^https?:\/\//.test(icon) || /^\//.test(icon) ? icon : ''
        const msgCount = Number(topic.msg_count || item.msg_count) || 0
        const serverNewCount = Number(item.new_short_msg_count || topic.new_short_msg_count) || 0
        return Object.assign({}, topic, {
          topic_id: topicId,
          title: String(topic.title || '圈子').trim(),
          iconSource: iconUrl,
          iconUrl,
          iconRetryCount: 0,
          iconText: icon && !/^https?:\/\//.test(icon) && !/^\//.test(icon) ? icon : (topic.title || '#').slice(0, 2),
          follower_count: Number(topic.follower_count) || 0,
          msg_count: msgCount,
          newCount: serverNewCount
        })
      })
      const pinRows = pinResponse.result.data || []
      const selectedPins = pinRows.map(utils.normalizePin).slice(0, 8)
      this.clearTopicIconRetryTimers()
      this.setData({ topics, selectedPins })
    }).finally(() => wx.stopPullDownRefresh())
  },

  scheduleHeaderRetry() {
    if (this.headerRetryCount >= HEADER_RETRY_LIMIT) return false
    this.headerRetryCount += 1
    if (this.headerRetryTimer) clearTimeout(this.headerRetryTimer)
    this.headerRetryTimer = setTimeout(() => this.loadHeaderData(), this.headerRetryCount * 600)
    return true
  },

  clearTopicIconRetryTimers() {
    Object.keys(this.topicIconRetryTimers || {}).forEach((index) => {
      clearTimeout(this.topicIconRetryTimers[index])
    })
    this.topicIconRetryTimers = {}
  },

  onTopicIconError(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isInteger(index) || !this.data.topics[index]) return
    const topic = this.data.topics[index]
    const retryCount = Number(topic.iconRetryCount) || 0
    const iconSource = topic.iconSource || topic.iconUrl
    if (!iconSource || retryCount >= ICON_RETRY_LIMIT) {
      this.setData({ [`topics[${index}].iconUrl`]: '' })
      return
    }

    this.setData({
      [`topics[${index}].iconUrl`]: '',
      [`topics[${index}].iconRetryCount`]: retryCount + 1
    })
    if (this.topicIconRetryTimers[index]) clearTimeout(this.topicIconRetryTimers[index])
    this.topicIconRetryTimers[index] = setTimeout(() => {
      delete this.topicIconRetryTimers[index]
      const current = this.data.topics[index]
      if (!current || current.topic_id !== topic.topic_id || current.iconUrl) return
      this.setData({ [`topics[${index}].iconUrl`]: iconSource })
    }, (retryCount + 1) * 500)
  },

  onTopicIconLoad(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isInteger(index) || !this.data.topics[index]) return
    if (this.topicIconRetryTimers[index]) clearTimeout(this.topicIconRetryTimers[index])
    delete this.topicIconRetryTimers[index]
    if (this.data.topics[index].iconRetryCount) {
      this.setData({ [`topics[${index}].iconRetryCount`]: 0 })
    }
  },

  loadFeed(reload) {
    if (this.data.loading && !reload) return
    const cursor = reload ? '0' : this.data.cursor
    const requestId = ++this.feedRequestId
    this.setData({ loading: true, loadError: false })
    api.pins(cursor, { sort: this.data.sort }).then(({ result, fromCache }) => {
      if (requestId !== this.feedRequestId) return
      const rows = (result.data || []).map(utils.normalizePin).filter((item) => item.msg_id)
      this.setData({
        list: reload ? rows : this.data.list.concat(rows),
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loadError: false,
        loading: false
      })
    }).catch(() => {
      if (requestId === this.feedRequestId) this.setData({ loadError: true })
    }).finally(() => {
      if (requestId === this.feedRequestId) this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  openDetail(event) {
    const item = event.detail ? event.detail.item : null
    const msgId = item ? item.msg_id : event.currentTarget.dataset.id
    if (msgId) wx.navigateTo({ url: `/features/feidianDetail/feidianDetail?msgId=${msgId}` })
  },

  openAuthor(event) {
    const author = event.detail && event.detail.author
    if (author && author.user_id) wx.navigateTo({ url: `/features/profile/profile?id=${author.user_id}` })
  },

  openTopic(event) {
    const index = Number(event.currentTarget.dataset.index)
    const topic = this.data.topics[index]
    if (!topic || !topic.topic_id) return
    const cache = wx.getStorageSync('jj:topic-cache') || {}
    cache[topic.topic_id] = topic
    wx.setStorageSync('jj:topic-cache', cache)
    this.setData({ [`topics[${index}].newCount`]: 0 })
    wx.navigateTo({ url: `/features/topic/topic?id=${topic.topic_id}` })
  },

  openTopicSquare() {
    wx.navigateTo({ url: '/features/topic/topic' })
  },

  openSelectedPins() {
    wx.navigateTo({ url: '/features/selectedPins/selectedPins' })
  },

  retryLoad() {
    this.loadHeaderData()
    this.loadFeed(true)
  },

  requireAccount() {
    session.requireLogin()
  },

  openPublish() {
    session.requireLogin()
  },

  pinMore(event) {
    const item = event.detail && event.detail.item
    if (!item) return
    wx.showActionSheet({
      itemList: ['关注作者', '减少此类沸点', '举报内容'],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) session.requireLogin()
        else if (tapIndex === 1) {
          this.setData({ list: this.data.list.filter((pin) => pin.msg_id !== item.msg_id) })
          utils.toast('将减少此类内容推荐')
        } else wx.navigateTo({ url: '/features/feedback/feedback' })
      }
    })
  },

  onShareAppMessage(result) {
    const item = result.from === 'button' ? result.target.dataset.item : null
    if (item && item.msg_id) {
      return { title: item.content || '稀土掘金沸点', path: `/features/feidianDetail/feidianDetail?msgId=${item.msg_id}` }
    }
    return { title: '稀土掘金沸点', path: '/pages/feidian/feidian' }
  }
}))
