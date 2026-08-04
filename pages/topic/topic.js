const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    topicId: '',
    topics: [],
    current: null,
    pins: [],
    followed: false,
    loading: true
  },

  onLoad(query) {
    this.setData({ topicId: query.id || '' })
    Promise.all([api.topics(), api.pins('0')]).then(([topicResponse, pinResponse]) => {
      const topics = topicResponse.result.data || []
      const current = topics.find((item) => item.topic_id === this.data.topicId) || topics[0] || null
      this.setData({
        topics,
        current,
        pins: (pinResponse.result.data || []).map(utils.normalizePin),
        followed: current ? session.getList('follows').indexOf(current.topic_id) !== -1 : false,
        loading: false
      })
      if (current) wx.setNavigationBarTitle({ title: current.title })
    }).finally(() => this.setData({ loading: false }))
  },

  selectTopic(event) {
    const current = this.data.topics.find((item) => item.topic_id === event.currentTarget.dataset.id)
    if (!current) return
    this.setData({ current, followed: session.getList('follows').indexOf(current.topic_id) !== -1 })
    wx.setNavigationBarTitle({ title: current.title })
  },

  toggleFollow() {
    const followed = session.toggle('follows', this.data.current.topic_id)
    this.setData({ followed })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.detail.item.msg_id}` })
  }
})
