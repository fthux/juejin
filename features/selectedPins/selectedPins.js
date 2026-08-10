const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: { pins: [], cursor: '0', hasMore: true, loading: false, fromCache: false },
  onLoad() { this.load(true) },
  onPullDownRefresh() { this.load(true) },
  onReachBottom() { this.load(false) },

  load(reload) {
    if ((this.data.loading && !reload) || (!reload && !this.data.hasMore)) return
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })
    api.selectedPins(cursor).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizePin).filter((item) => item.msg_id)
      this.setData({ pins: reload ? rows : this.data.pins.concat(rows), cursor: String(result.cursor || cursor), hasMore: Boolean(result.has_more) && rows.length > 0, loading: false, fromCache: Boolean(fromCache) })
    }).catch(() => this.setData({ loading: false, hasMore: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  openPin(event) {
    const item = this.data.pins[Number(event.currentTarget.dataset.index)]
    if (item) wx.navigateTo({ url: `/features/feidianDetail/feidianDetail?msgId=${item.msg_id}` })
  },

  openAuthor(event) {
    const item = this.data.pins[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:user-current', item.author)
    wx.navigateTo({ url: `/features/profile/profile?id=${item.author.user_id}` })
  },

  requireLogin() { session.requireLogin() }
})
