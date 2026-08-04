const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    greeting: '每天读一点，保持技术好奇心',
    dailyArticles: [],
    loading: true,
    quickEntries: [
      { name: '圈子广场', caption: '遇见更多掘友', icon: '/assets/app/find/find_page_ic_circle_square.svg', url: '/pages/feidian/feidian' },
      { name: '文章榜', caption: '热门技术文章', icon: '/assets/app/find/find_page_ic_rank_article.svg', url: '/pages/rank/rank?type=article' },
      { name: '作者榜', caption: '优质创作者', icon: '/assets/app/find/find_page_ic_rank_author.svg', url: '/pages/rank/rank?type=author' },
      { name: '专栏', caption: '系统化阅读', icon: '/assets/app/find/find_page_ic_column.svg', url: '/pages/column/column' },
      { name: '话题广场', caption: '关注技术话题', icon: '/assets/app/find/find_page_ic_topic_square.svg', url: '/pages/feidian/feidian' },
      { name: '收藏集', caption: '整理知识线索', icon: '/assets/app/find/find_page_ic_collection.svg', url: '/pages/collectionSet/collectionSet' },
      { name: '活动', caption: '社区技术活动', icon: '/assets/app/find/find_page_ic_activity.svg', url: '' },
      { name: '直播', caption: '开发者直播间', icon: '/assets/app/find/find_page_ic_live.svg', url: '' }
    ]
  },

  onLoad() {
    this.loadDaily()
  },

  onPullDownRefresh() {
    this.loadDaily()
  },

  loadDaily() {
    this.setData({ loading: true })
    api.daily().then(({ result }) => {
      const data = result.data || {}
      const articles = Array.isArray(data)
        ? data
        : (data.article_info ? [data] : (data.articles || data.article_list || []))
      this.setData({
        greeting: data.greeting || this.data.greeting,
        dailyArticles: articles.map(utils.normalizeArticle),
        loading: false
      })
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  openFeature(event) {
    const url = event.currentTarget.dataset.url
    if (!url) {
      utils.toast('该内容当前没有公开数据源')
      return
    }
    if (url.indexOf('/pages/feidian/feidian') === 0) wx.switchTab({ url })
    else wx.navigateTo({ url })
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/post/post?id=${event.detail.item.article_id}` })
  }
})
