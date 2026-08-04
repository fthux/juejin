const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')

const keywords = {
  guide: '掘金 使用指南',
  activity: '掘金 活动',
  live: '掘金 直播',
  game: '游戏开发',
  daily: '掘金一刻',
  weekly: '掘金一周',
  pin: '精选沸点',
  interview: '面试',
  team: '技术团队',
  news: '技术资讯',
  student: '高校 程序员'
}

Page({
  data: {
    title: '发现',
    articles: [],
    loading: true,
    fromCache: false
  },

  onLoad(query) {
    let title = '发现'
    try {
      title = query.title ? decodeURIComponent(query.title) : title
    } catch (error) {
      title = '发现'
    }
    this.type = query.type || 'news'
    this.setData({ title })
    wx.setNavigationBarTitle({ title })
    this.load()
  },

  onPullDownRefresh() {
    this.load()
  },

  load() {
    this.setData({ loading: true })
    api.search(keywords[this.type] || this.data.title, 'article').then(({ result, fromCache }) => {
      this.setData({
        articles: (result.data || []).map(utils.normalizeArticle),
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).catch(() => this.setData({ articles: [], fromCache: true, loading: false })).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  }
})
