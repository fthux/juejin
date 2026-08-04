const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const DEFAULT_TOPIC = {
  topic_id: 'feedback',
  title: '反馈 & 建议',
  description: '掘金提需，反馈 bug',
  follower_count: 23417,
  msg_count: 8302,
  icon: '📬'
}

Page({
  data: {
    topicId: '',
    current: DEFAULT_TOPIC,
    pins: [],
    followed: false,
    sort: 'hot',
    loading: true
  },

  onLoad(query) {
    this.setData({ topicId: query.id || '' })
    api.topics().then(({ result }) => {
      const topics = result.data || []
      const current = topics.find((item) => item.topic_id === this.data.topicId) || DEFAULT_TOPIC
      this.setCurrent(current)
    }).catch(() => this.setCurrent(DEFAULT_TOPIC))
    this.loadPins()
  },

  setCurrent(current) {
    const follows = session.getList('follows')
    this.setData({
      current: Object.assign({}, DEFAULT_TOPIC, current),
      followed: follows.indexOf(current.topic_id) !== -1
    })
  },

  loadPins() {
    this.setData({ loading: true })
    api.pins('0', { sortType: this.data.sort === 'hot' ? 300 : 200 }).then(({ result }) => {
      const local = session.getList('pins')
      this.setData({ pins: local.concat(result.data || []).map((item) => {
        const pin = utils.normalizePin(item)
        if (!pin.topic) pin.topic = this.data.current.title
        return pin
      }) })
    }).finally(() => this.setData({ loading: false }))
  },

  changeSort(event) {
    const sort = event.currentTarget.dataset.id
    if (sort === this.data.sort) return
    this.setData({ sort })
    this.loadPins()
  },

  toggleFollow() {
    if (!session.requireLogin()) return
    const followed = session.toggle('follows', this.data.current.topic_id)
    this.setData({ followed })
  },

  showDetails() {
    wx.showModal({
      title: this.data.current.title,
      content: this.data.current.description || '和掘友一起分享与讨论。',
      showCancel: false
    })
  },

  publish() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/pages/publish/publish?type=pin' })
  },

  back() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/feidian/feidian' }) })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  }
})
