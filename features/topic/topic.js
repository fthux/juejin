const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const TOPIC_CACHE_KEY = 'jj:topic-cache'
const DEFAULT_TOPIC = {
  topic_id: '',
  title: '圈子',
  description: '和掘友一起分享与讨论。',
  follower_count: '0',
  msg_count: '0',
  iconText: '#',
  iconUrl: ''
}

const CATEGORIES = [
  { id: 'recommend', name: '推荐圈子' },
  { id: '7006945368608866340', name: '技术' },
  { id: '7006945368617254942', name: '互动交流' },
  { id: '7006945368634032159', name: '职场' },
  { id: '7006945368646615047', name: '吃喝玩乐' },
  { id: '7006945368659197965', name: '资讯' },
  { id: '7006945368671780878', name: '理财' },
  { id: '7006945368684380173', name: '书影音' },
  { id: '7006945368696946718', name: '生活' },
  { id: '7006945368709529607', name: '搞笑' },
  { id: '7006945368717918222', name: '许愿池' },
  { id: '7006945368730501134', name: '情感' },
  { id: '7006945368743100423', name: '掘金一下' }
]

function normalizeTopic(raw) {
  const item = raw || {}
  const topic = item.topic || item
  const icon = utils.normalizeImageUrl(topic.icon || topic.icon_url || topic.topic_pic || '', 160)
  const followerCount = Number(topic.follower_count || item.follower_count) || 0
  const messageCount = Number(topic.msg_count || item.msg_count || item.short_msg_count) || 0
  return {
    topic_id: String(item.topic_id || topic.topic_id || ''),
    title: String(topic.title || '圈子').trim(),
    description: topic.description || topic.notice || '',
    notice: topic.notice || '',
    cate_id: String(topic.cate_id || ''),
    iconUrl: /^https?:\/\//.test(icon) || /^\//.test(icon) ? icon : '',
    iconText: icon && !/^https?:\/\//.test(icon) && !/^\//.test(icon) ? icon : (topic.title || '#').slice(0, 2),
    follower_count: followerCount,
    msg_count: messageCount,
    followerLabel: compactTopicCount(followerCount),
    msgLabel: compactTopicCount(messageCount)
  }
}

function compactTopicCount(value) {
  const count = Number(value) || 0
  if (count >= 10000) return `${Math.floor(count / 10000)}w`
  if (count >= 1000) return `${Math.floor(count / 1000)}k`
  return String(count)
}

function cacheTopic(topic) {
  if (!topic || !topic.topic_id) return
  const cache = wx.getStorageSync(TOPIC_CACHE_KEY) || {}
  cache[String(topic.topic_id)] = topic
  const ids = Object.keys(cache)
  if (ids.length > 80) delete cache[ids[0]]
  wx.setStorageSync(TOPIC_CACHE_KEY, cache)
}

Page({
  data: {
    mode: 'square',
    squareTab: 'square',
    categories: CATEGORIES,
    activeCategory: 'recommend',
    searchKeyword: '',
    topics: [],
    squareCursor: '0',
    squareHasMore: true,
    topicId: '',
    current: DEFAULT_TOPIC,
    pins: [],
    pinCursor: '0',
    pinHasMore: true,
    sort: 'hot',
    loading: false,
    squareLoading: false
  },

  onLoad(query) {
    this.squareRequestId = 0
    this.pinRequestId = 0
    this.searchTimer = null
    const topicId = String(query.id || '')
    const mode = topicId ? 'detail' : 'square'
    this.setData({ topicId, mode })
    if (mode === 'square') this.loadSquare(true)
    else this.loadTopicDetail()
  },

  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },

  onPullDownRefresh() {
    const task = this.data.mode === 'square' ? this.loadSquare(true) : this.loadPins(true)
    Promise.resolve(task).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.mode === 'detail' && this.data.pinHasMore) this.loadPins(false)
  },

  switchSquareTab(event) {
    const squareTab = event.currentTarget.dataset.id
    if (squareTab === this.data.squareTab) return
    this.setData({ squareTab })
    if (squareTab === 'square' && !this.data.topics.length) this.loadSquare(true)
  },

  selectCategory(event) {
    const activeCategory = event.currentTarget.dataset.id
    if (activeCategory === this.data.activeCategory && !this.data.searchKeyword) return
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.setData({
      activeCategory,
      searchKeyword: '',
      topics: [],
      squareCursor: '0',
      squareHasMore: true
    })
    this.loadSquare(true)
  },

  onSearchInput(event) {
    const searchKeyword = event.detail.value
    this.setData({ searchKeyword })
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => this.loadSquare(true), 320)
  },

  submitSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.loadSquare(true)
  },

  clearSearch() {
    if (!this.data.searchKeyword) return
    this.setData({ searchKeyword: '' })
    this.loadSquare(true)
  },

  loadSquare(reload) {
    if (this.data.squareLoading && !reload) return Promise.resolve()
    const cursor = reload ? '0' : this.data.squareCursor
    const keyword = this.data.searchKeyword.trim()
    const category = this.data.activeCategory
    const requestId = ++this.squareRequestId
    this.setData({ squareLoading: true })
    const task = keyword
      ? api.searchTopics(keyword, cursor)
      : (category === 'recommend' ? api.topics(cursor, 20) : api.topicsByCategory(category, cursor))

    return task.then(({ result }) => {
      if (requestId !== this.squareRequestId) return
      const rows = (result.data || []).map(normalizeTopic).filter((item) => item.topic_id)
      rows.forEach(cacheTopic)
      this.setData({
        topics: reload ? rows : this.data.topics.concat(rows),
        squareCursor: result.cursor || '0',
        squareHasMore: Boolean(result.has_more) && rows.length > 0,
        squareLoading: false
      })
    }).catch(() => {
      if (requestId === this.squareRequestId) this.setData({ squareLoading: false, squareHasMore: false })
    })
  },

  loadMoreTopics() {
    if (this.data.squareHasMore) this.loadSquare(false)
  },

  openTopic(event) {
    const topic = this.data.topics[Number(event.currentTarget.dataset.index)]
    if (!topic || !topic.topic_id) return
    cacheTopic(topic)
    wx.navigateTo({ url: `/features/topic/topic?id=${topic.topic_id}` })
  },

  openLogin() {
    session.requireLogin()
  },

  onTopicIconError(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isInteger(index) || !this.data.topics[index]) return
    this.setData({ [`topics[${index}].iconUrl`]: '' })
  },

  onDetailIconError() {
    this.setData({ 'current.iconUrl': '' })
  },

  loadTopicDetail() {
    const cache = wx.getStorageSync(TOPIC_CACHE_KEY) || {}
    const current = cache[this.data.topicId]
    if (current) this.setData({ current })
    this.loadPins(true)
  },

  loadPins(reload) {
    if (this.data.loading && !reload) return Promise.resolve()
    const cursor = reload ? '0' : this.data.pinCursor
    const requestId = ++this.pinRequestId
    this.setData({ loading: true })
    return api.topicPins(this.data.topicId, cursor, {
      sortType: this.data.sort === 'hot' ? 500 : 200
    }).then(({ result }) => {
      if (requestId !== this.pinRequestId) return
      const rawRows = result.data || []
      const pins = rawRows.map(utils.normalizePin).filter((item) => item.msg_id)
      const rawTopic = rawRows.find((item) => item.topic && String(item.topic.topic_id) === this.data.topicId)
      if (rawTopic) {
        const current = normalizeTopic(rawTopic.topic)
        cacheTopic(current)
        this.setData({ current })
      }
      this.setData({
        pins: reload ? pins : this.data.pins.concat(pins),
        pinCursor: result.cursor || '0',
        pinHasMore: Boolean(result.has_more) && pins.length > 0,
        loading: false
      })
    }).catch(() => {
      if (requestId === this.pinRequestId) this.setData({ loading: false, pinHasMore: false })
    })
  },

  changeSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort, pins: [], pinCursor: '0', pinHasMore: true })
    this.loadPins(true)
  },

  toggleFollow() {
    session.requireLogin()
  },

  showDetails() {
    wx.showModal({
      title: this.data.current.title,
      content: this.data.current.notice || this.data.current.description || DEFAULT_TOPIC.description,
      showCancel: false
    })
  },

  publish() {
    session.requireLogin()
  },

  back() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/feidian/feidian' }) })
  },

  openPin(event) {
    const item = event.detail && event.detail.item
    if (item && item.msg_id) wx.navigateTo({ url: `/features/feidianDetail/feidianDetail?msgId=${item.msg_id}` })
  },

  toggleLike() {
    session.requireLogin()
  },

  pinMore(event) {
    const pin = event.detail && event.detail.item
    if (!pin) return
    wx.showActionSheet({
      itemList: ['减少此类沸点', '举报内容'],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) this.setData({ pins: this.data.pins.filter((item) => item.msg_id !== pin.msg_id) })
        else wx.navigateTo({ url: '/features/feedback/feedback' })
      }
    })
  }
})
