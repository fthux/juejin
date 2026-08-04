const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    tabs: [
      { id: 'recommend', name: '推荐' },
      { id: 'selected', name: '精选' },
      { id: 'topic', name: '圈子' }
    ],
    activeTab: 'recommend',
    list: [],
    topics: [],
    cursor: '0',
    loading: false,
    hasMore: true
  },

  onLoad() {
    this.load(true)
  },

  onShow() {
    if (this.data.activeTab !== 'topic') this.mergeLocalPins()
  },

  onPullDownRefresh() {
    this.load(true)
  },

  onReachBottom() {
    if (this.data.activeTab !== 'topic' && this.data.hasMore) this.load(false)
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.id
    if (activeTab === this.data.activeTab) return
    this.setData({ activeTab })
    this.load(true)
  },

  load(reload) {
    if (this.data.loading) return
    this.setData({ loading: true })
    if (this.data.activeTab === 'topic') {
      api.topics().then(({ result }) => {
        this.setData({ topics: result.data || [], loading: false })
      }).finally(() => {
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      })
      return
    }

    const cursor = reload ? '0' : this.data.cursor
    const task = this.data.activeTab === 'selected' ? api.selectedPins(cursor) : api.pins(cursor)
    task.then(({ result }) => {
      const list = (result.data || []).map(utils.normalizePin)
      const remote = reload ? list : this.data.list.concat(list)
      this.setData({
        list: reload ? this.getLocalPins().concat(remote) : remote,
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && list.length > 0,
        loading: false
      })
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
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
    const local = this.getLocalPins()
    const remote = this.data.list.filter((item) => String(item.msg_id).indexOf('local-') !== 0)
    this.setData({ list: local.concat(remote) })
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  },

  openAuthor(event) {
    wx.navigateTo({ url: `/pages/profile/profile?id=${event.detail.author.user_id}` })
  },

  toggleLike(event) {
    if (!session.requireLogin()) return
    const id = event.detail.item.msg_id
    const active = session.toggle('likes', id)
    const list = this.data.list.map((item) => item.msg_id === id ? Object.assign({}, item, { is_digg: active }) : item)
    this.setData({ list })
  },

  openTopic(event) {
    wx.navigateTo({ url: `/pages/topic/topic?id=${event.currentTarget.dataset.id}` })
  },

  openPublish() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/pages/publish/publish?type=pin' })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  onShareAppMessage() {
    return { title: '稀土掘金沸点', path: '/pages/feidian/feidian' }
  }
})
