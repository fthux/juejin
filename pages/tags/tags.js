const mock = require('../../data/mockData.js')

Page({
  data: { activeTab: 'all', allTags: [], tags: [], followed: [] },
  onShow() { this.load() },
  load() {
    const followed = wx.getStorageSync('jj:followed-tags') || []
    const allTags = mock.categories.filter((item) => item.id).concat(mock.topics.map((item) => ({ id: item.topic_id, name: item.title })))
      .map((item) => Object.assign({}, item, { initial: item.name.slice(0, 2), followed: followed.indexOf(item.id) !== -1 }))
    this.setData({ followed, allTags })
    this.refresh()
  },
  refresh() {
    const tags = this.data.activeTab === 'followed' ? this.data.allTags.filter((item) => item.followed) : this.data.allTags
    this.setData({ tags })
  },
  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
    this.refresh()
  },
  toggle(event) {
    const id = event.currentTarget.dataset.id
    const followed = this.data.followed.slice()
    const index = followed.indexOf(id)
    if (index === -1) followed.push(id)
    else followed.splice(index, 1)
    wx.setStorageSync('jj:followed-tags', followed)
    const allTags = this.data.allTags.map((item) => Object.assign({}, item, { followed: followed.indexOf(item.id) !== -1 }))
    this.setData({ followed, allTags })
    this.refresh()
  }
})
