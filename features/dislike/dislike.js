const session = require('../../services/session.js')

Page({
  data: {
    activeTab: 'authors',
    tabs: [
      { id: 'authors', name: '屏蔽作者' },
      { id: 'tags', name: '屏蔽标签' }
    ],
    authors: [],
    tags: []
  },

  onLoad() {
    this.authorized = session.requirePage('/features/dislike/dislike')
  },

  onShow() {
    if (!this.authorized) return
    this.setData({
      authors: wx.getStorageSync('jj:blocked-authors') || [],
      tags: wx.getStorageSync('jj:blocked-tags') || []
    })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
  },

  removeItem(event) {
    const id = String(event.currentTarget.dataset.id)
    const key = this.data.activeTab === 'authors' ? 'authors' : 'tags'
    const storageKey = this.data.activeTab === 'authors' ? 'jj:blocked-authors' : 'jj:blocked-tags'
    const rows = this.data[key].filter((item) => String(item.id || item.user_id || item.tag_id) !== id)
    wx.setStorageSync(storageKey, rows)
    this.setData({ [key]: rows })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
