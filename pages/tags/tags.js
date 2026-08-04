const session = require('../../services/session.js')

const TAGS = [
  { id: 'frontend', name: '前端', followers: '73.7w', articles: '70.4w', logo: '</>', tone: 'blue' },
  { id: 'backend', name: '后端', followers: '61.1w', articles: '50.6w', logo: 'CODE', tone: 'black' },
  { id: 'javascript', name: 'JavaScript', followers: '57.7w', articles: '20.2w', logo: 'JS', tone: 'yellow' },
  { id: 'interview', name: '面试', followers: '51.4w', articles: '9.9w', logo: '···', tone: 'cyan' },
  { id: 'github', name: 'GitHub', followers: '47.6w', articles: '4.4w', logo: 'GH', tone: 'charcoal' },
  { id: 'vue', name: 'Vue.js', followers: '47.5w', articles: '9.2w', logo: 'V', tone: 'green' },
  { id: 'java', name: 'Java', followers: '45.0w', articles: '17.7w', logo: 'J', tone: 'orange' },
  { id: 'architecture', name: '架构', followers: '43.9w', articles: '8.4w', logo: '▥', tone: 'navy' },
  { id: 'algorithm', name: '算法', followers: '43.6w', articles: '10.4w', logo: 'A', tone: 'portrait' }
]

Page({
  data: { activeTab: 'all', allTags: [], tags: [], followed: [] },

  onLoad() {
    this.authorized = session.requirePage('/pages/tags/tags')
  },

  onShow() {
    if (this.authorized) this.load()
  },

  load() {
    const storage = wx.getStorageInfoSync ? wx.getStorageInfoSync() : { keys: [] }
    const hasSaved = (storage.keys || []).indexOf('jj:followed-tags') !== -1
    const followed = hasSaved ? (wx.getStorageSync('jj:followed-tags') || []) : ['frontend', 'backend', 'javascript']
    if (!hasSaved) wx.setStorageSync('jj:followed-tags', followed)
    const allTags = TAGS.map((item) => Object.assign({}, item, { followed: followed.indexOf(item.id) !== -1 }))
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
    if (!session.requireLogin()) return
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
