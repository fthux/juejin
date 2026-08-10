const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    list: [],
    groups: [],
    keyword: '',
    searching: false
  },

  onLoad() {
    this.authorized = session.requirePage('/features/readHistory/readHistory')
  },

  onShow() {
    if (!this.authorized) return
    const list = session.getList('history').map((item) => Object.assign({}, item, {
      readTime: utils.formatTime(item.readAt),
      dateLabel: this.formatDate(item.readAt)
    }))
    this.setData({ list })
    this.applySearch()
  },

  formatDate(value) {
    const date = new Date(value || Date.now())
    const pad = (part) => String(part).padStart(2, '0')
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
  },

  applySearch() {
    const keyword = this.data.keyword.trim().toLowerCase()
    const rows = keyword
      ? this.data.list.filter((item) => `${item.title}${item.brief_content}${item.author && item.author.user_name}`.toLowerCase().indexOf(keyword) !== -1)
      : this.data.list
    const groups = []
    rows.forEach((item) => {
      let group = groups.find((entry) => entry.date === item.dateLabel)
      if (!group) {
        group = { date: item.dateLabel, items: [] }
        groups.push(group)
      }
      group.items.push(item)
    })
    this.setData({ groups })
  },

  toggleSearch() {
    this.setData({ searching: !this.data.searching, keyword: '' })
    this.applySearch()
  },

  onSearchInput(event) {
    this.setData({ keyword: event.detail.value })
    this.applySearch()
  },

  back() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/my/my' }) })
  },

  clear() {
    const that = this
    wx.showModal({
      title: '清空浏览历史',
      content: '清空后无法恢复',
      success(result) {
        if (!result.confirm) return
        session.setList('history', [])
        that.setData({ list: [], groups: [] })
      }
    })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/features/post/post?id=${event.currentTarget.dataset.id}` })
  }
})
