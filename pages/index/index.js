const api = require('../../services/api.js')
const session = require('../../services/session.js')
const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    navTabs: [
      { id: 'following', name: '关注' },
      { id: 'recommend', name: '推荐' },
      { id: 'hot', name: '热榜' },
      { id: 'headline', name: '头条精选' },
      { id: 'backend', name: '后端' }
    ],
    activeNav: 'recommend',
    extraCategory: null,
    hotList: [],
    list: [],
    cursor: '0',
    loading: false,
    hasMore: true,
    fromCache: false
  },

  onLoad() {
    this.loadHotList()
    this.loadFeed(true)
  },

  onShow() {
    this.mergeLocalArticles()
  },

  onPullDownRefresh() {
    this.loadHotList()
    this.loadFeed(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadFeed(false)
  },

  selectNav(event) {
    const id = event.currentTarget.dataset.id
    if (id === this.data.activeNav) return
    if (id === 'following' && !session.requireLogin()) return
    this.setData({ activeNav: id, extraCategory: null })
    this.loadFeed(true)
  },

  openCategoryMenu() {
    const categories = mock.categories.filter((item) => item.id)
    wx.showActionSheet({
      itemList: categories.map((item) => item.name),
      success: (result) => {
        const extraCategory = categories[result.tapIndex]
        if (!extraCategory) return
        this.setData({ activeNav: 'category', extraCategory })
        this.loadFeed(true)
      }
    })
  },

  loadHotList() {
    api.hotArticles().then(({ result }) => {
      this.setData({ hotList: (result.data || []).map(utils.normalizeArticle).slice(0, 3) })
    })
  },

  loadFeed(reload) {
    if (this.data.loading) return
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })

    const options = { sortType: this.data.activeNav === 'hot' ? 3 : (this.data.activeNav === 'headline' ? 300 : 200) }
    let task = api.homeFeed(cursor, options)
    if (this.data.activeNav === 'backend') task = api.categoryFeed('6809637769959178254', cursor)
    if (this.data.activeNav === 'category' && this.data.extraCategory) task = api.categoryFeed(this.data.extraCategory.id, cursor)

    task.then(({ result, fromCache }) => {
      let rows = (result.data || []).map(utils.normalizeArticle)
      if (this.data.activeNav === 'following') {
        const follows = session.getList('follows')
        rows = rows.filter((article) => follows.indexOf(article.author.user_id) !== -1)
      }
      const local = reload ? this.getLocalArticles() : []
      this.setData({
        list: reload ? local.concat(rows) : this.data.list.concat(rows),
        cursor: result.cursor || '0',
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loading: false
      })
    }).finally(() => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  getLocalArticles() {
    const current = session.getSession()
    if (!current) return []
    return session.getList('articles')
      .filter((item) => item.author_user_info && item.author_user_info.user_id === current.user.user_id)
      .map(utils.normalizeArticle)
  },

  mergeLocalArticles() {
    const local = this.getLocalArticles()
    const remote = this.data.list.filter((item) => String(item.article_id).indexOf('local-article-') !== 0)
    this.setData({ list: local.concat(remote) })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  openLive() {
    wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=live&title=直播' })
  },

  openActivity() {
    wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=activity&title=开发者大会' })
  },

  openSign() {
    if (!session.requireLogin()) return
    wx.navigateTo({ url: '/pages/sign/sign' })
  },

  openArticle(event) {
    const item = event.detail ? event.detail.item : null
    const articleId = item ? item.article_id : event.currentTarget.dataset.id
    if (articleId) wx.navigateTo({ url: `/pages/post/post?id=${articleId}` })
  },

  openAuthor(event) {
    const author = event.detail.author
    if (author.user_id) wx.navigateTo({ url: `/pages/profile/profile?id=${author.user_id}` })
  },

  onShareAppMessage() {
    return { title: '稀土掘金 · 帮助开发者成长的社区', path: '/pages/index/index' }
  }
})
