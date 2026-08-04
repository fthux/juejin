const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    topTab: 'discover',
    sort: 'hot',
    topics: [],
    list: [],
    selectedPins: [],
    cursor: '0',
    loading: false,
    hasMore: true,
    fromCache: false
  },

  onLoad() {
    this.loadHeaderData()
    this.loadFeed(true)
  },

  onShow() {
    const globalData = getApp().globalData
    if (globalData.openSelectedPins) {
      globalData.openSelectedPins = false
      setTimeout(() => wx.pageScrollTo({ selector: '#selected-section', duration: 300 }), 120)
    }
    this.mergeLocalPins()
    this.syncInteractionState()
  },

  onPullDownRefresh() {
    this.loadHeaderData()
    this.loadFeed(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadFeed(false)
  },

  switchTopTab(event) {
    const topTab = event.currentTarget.dataset.id
    if (topTab === this.data.topTab) return
    if (topTab === 'following' && !session.requireLogin()) return
    this.setData({ topTab })
    this.loadFeed(true)
  },

  selectSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort })
    this.loadFeed(true)
  },

  loadHeaderData() {
    Promise.all([api.topics(), api.selectedPins('0')]).then(([topicResponse, pinResponse]) => {
      const topics = (topicResponse.result.data || []).slice(0, 10)
      const pins = (pinResponse.result.data || []).map(utils.normalizePin).slice(0, 8)
      this.setData({ topics, selectedPins: this.withInteractionState(pins) })
    }).finally(() => wx.stopPullDownRefresh())
  },

  loadFeed(reload) {
    if (this.data.loading) return
    const cursor = reload ? '0' : this.data.cursor
    const sortType = this.data.sort === 'latest' ? 200 : 300
    this.setData({ loading: true })

    api.pins(cursor, { sortType }).then(({ result, fromCache }) => {
      let rows = (result.data || []).map(utils.normalizePin)
      if (this.data.topTab === 'following') {
        const follows = session.getList('follows')
        rows = rows.filter((pin) => follows.indexOf(pin.author.user_id) !== -1)
      }
      rows = this.withInteractionState(rows)
      const local = reload && this.data.topTab === 'discover' ? this.getLocalPins() : []
      this.setData({
        list: reload ? local.concat(rows) : this.data.list.concat(rows),
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  withInteractionState(pins) {
    const likes = session.getList('likes')
    const follows = session.getList('follows')
    return pins.map((pin) => Object.assign({}, pin, {
      is_digg: likes.indexOf(pin.msg_id) !== -1 || pin.is_digg,
      followed: follows.indexOf(pin.author.user_id) !== -1
    }))
  },

  syncInteractionState() {
    this.setData({
      list: this.withInteractionState(this.data.list),
      selectedPins: this.withInteractionState(this.data.selectedPins)
    })
  },

  getLocalPins() {
    const current = session.getSession()
    if (!current) return []
    return session.getList('pins')
      .filter((item) => item.author_user_info && item.author_user_info.user_id === current.user.user_id)
      .map(utils.normalizePin)
  },

  mergeLocalPins() {
    if (this.data.topTab !== 'discover') return
    const local = this.getLocalPins()
    const remote = this.data.list.filter((item) => String(item.msg_id).indexOf('local-') !== 0)
    this.setData({ list: this.withInteractionState(local.concat(remote)) })
  },

  openDetail(event) {
    const item = event.detail ? event.detail.item : null
    const msgId = item ? item.msg_id : event.currentTarget.dataset.id
    if (msgId) wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${msgId}` })
  },

  openAuthor(event) {
    const author = event.detail ? event.detail.author : null
    const userId = author ? author.user_id : event.currentTarget.dataset.id
    if (userId) wx.navigateTo({ url: `/pages/profile/profile?id=${userId}` })
  },

  openTopic(event) {
    wx.navigateTo({ url: `/pages/topic/topic?id=${event.currentTarget.dataset.id}` })
  },

  toggleLike(event) {
    if (!session.requireLogin()) return
    const item = event.detail ? event.detail.item : null
    const msgId = item ? item.msg_id : event.currentTarget.dataset.id
    const active = session.toggle('likes', msgId)
    this.updatePins(msgId, { is_digg: active })
  },

  toggleFollow(event) {
    if (!session.requireLogin()) return
    const author = event.detail ? event.detail.author : null
    const userId = author ? author.user_id : event.currentTarget.dataset.id
    const followed = session.toggle('follows', userId)
    this.setData({
      list: this.data.list.map((pin) => pin.author.user_id === userId ? Object.assign({}, pin, { followed }) : pin),
      selectedPins: this.data.selectedPins.map((pin) => pin.author.user_id === userId ? Object.assign({}, pin, { followed }) : pin)
    })
    if (this.data.topTab === 'following' && !followed) this.loadFeed(true)
  },

  updatePins(msgId, patch) {
    this.setData({
      list: this.data.list.map((pin) => pin.msg_id === msgId ? Object.assign({}, pin, patch) : pin),
      selectedPins: this.data.selectedPins.map((pin) => pin.msg_id === msgId ? Object.assign({}, pin, patch) : pin)
    })
  },

  openPublish() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/pages/publish/publish?type=pin' })
  },

  onShareAppMessage(result) {
    const item = result.from === 'button' ? result.target.dataset.item : null
    if (item && item.msg_id) {
      return { title: item.content || '稀土掘金沸点', path: `/pages/feidianDetail/feidianDetail?msgId=${item.msg_id}` }
    }
    return { title: '稀土掘金沸点', path: '/pages/feidian/feidian' }
  }
})
