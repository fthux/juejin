const theme = require("../../utils/theme.js")
const STORAGE_KEY = 'jj:push-settings-v1'

const defaultSettings = {
  external: true,
  follower: true,
  digg: true,
  comment: true,
  chat: true,
  selectedArticle: true,
  followingContent: true,
  columnContent: true,
  collectionContent: true
}

Page(theme.withTheme({
  data: {
    settings: defaultSettings,
    interactionItems: [
      { id: 'follower', name: '新增粉丝' },
      { id: 'digg', name: '收到赞和收藏' },
      { id: 'comment', name: '评论回复' },
      { id: 'chat', name: '私信' }
    ],
    contentItems: [
      { id: 'selectedArticle', name: '精选优质文章' },
      { id: 'followingContent', name: '关注的人发布内容' },
      { id: 'columnContent', name: '订阅的专栏更新内容' },
      { id: 'collectionContent', name: '订阅的收藏集更新内容' }
    ]
  },

  onShow() {
    this.setData({ settings: Object.assign({}, defaultSettings, wx.getStorageSync(STORAGE_KEY) || {}) })
  },

  toggle(event) {
    const id = event.currentTarget.dataset.id
    const settings = Object.assign({}, this.data.settings, { [id]: event.detail.value })
    wx.setStorageSync(STORAGE_KEY, settings)
    this.setData({ settings })
  }
}))
