const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const mock = require('../../data/mockData.js')

function isDarkMode() {
  const preference = wx.getStorageSync('jj:dark-mode-v2') || {}
  const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
  if (preference.followSystem) return system.theme === 'dark'
  if (preference.selected) return preference.selected === 'dark'
  return system.theme === 'dark'
}

Page({
  data: {
    greeting: '每天读一点，保持技术好奇心',
    dailyArticle: null,
    selectedPins: [],
    themes: [],
    topics: [],
    columns: [],
    collectionSets: [],
    authors: [],
    hotArticles: [],
    headlines: [],
    rankCategories: [{ id: '', name: '综合' }].concat(mock.hotCategories),
    activeRankCategory: '',
    loading: true,
    rankLoading: false,
    loadError: false,
    darkMode: false,
    channelEntries: [
      { title: '职场锦囊', icon: '/assets/app/find/find_page_ic_interview_kit.svg', darkIcon: '/assets/app/find/dark/find_page_ic_interview_kit.svg', url: '/pages/discoverChannel/discoverChannel?type=interview&title=职场锦囊' },
      { title: '行业速递', icon: '/assets/app/find/find_page_ic_industry_express.svg', darkIcon: '/assets/app/find/dark/find_page_ic_industry_express.svg', url: '/pages/discoverChannel/discoverChannel?type=news&title=行业速递' },
      { title: '掘金一周', icon: '/assets/app/find/find_page_ic_juejin_weekly.svg', darkIcon: '/assets/app/find/dark/find_page_ic_juejin_weekly.svg', url: '/pages/discoverChannel/discoverChannel?type=weekly&title=掘金一周' },
      { title: '高校精选', icon: '/assets/app/find/find_page_ic_undergraduate_reading.svg', darkIcon: '/assets/app/find/dark/find_page_ic_undergraduate_reading.svg', url: '/pages/discoverChannel/discoverChannel?type=student&title=高校精选' }
    ],
    quickEntries: [
      { name: '直播', icon: '/assets/app/find/find_page_ic_live.svg', url: '/pages/discoverChannel/discoverChannel?type=live&title=直播' },
      { name: '专栏', icon: '/assets/app/find/find_page_ic_column.svg', url: '/pages/column/column' },
      { name: '收藏集', icon: '/assets/app/find/find_page_ic_collection.svg', url: '/pages/collectionSquare/collectionSquare' },
      { name: '文章榜', icon: '/assets/app/find/find_page_ic_rank_article.svg', url: '/pages/rank/rank?type=article' },
      { name: '作者榜', icon: '/assets/app/find/find_page_ic_rank_author.svg', url: '/pages/rank/rank?type=author' }
    ]
  },

  onLoad() {
    this.setData({ darkMode: isDarkMode() })
    this.loadAll()
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 2 })
    this.setData({ darkMode: isDarkMode() })
  },

  onPullDownRefresh() {
    this.loadAll()
  },

  loadAll() {
    this.setData({ loading: true, loadError: false })
    Promise.all([
      api.daily(),
      api.selectedPins('0'),
      api.recommendedThemes('0', 6),
      api.topics('0', 8),
      api.recommendedColumns('0', 8),
      api.recommendedCollectionSets('0', 8),
      api.recommendedAuthors('0', 8),
      api.hotArticles({ type: 'hot', count: 8 }),
      api.headlineFeed('')
    ]).then((responses) => {
      const dailyData = responses[0].result.data || {}
      const dailyRows = Array.isArray(dailyData)
        ? dailyData
        : (dailyData.article_info ? [dailyData] : (dailyData.articles || dailyData.article_list || []))
      const pins = (responses[1].result.data || []).map(utils.normalizePin).filter((item) => item.msg_id).slice(0, 8)
      const hasFallback = responses.some((response) => response.fromCache)
      const authors = (responses[6].result.data || []).map(utils.normalizeRecommendedAuthor).filter((item) => item.user_id)
      const remoteColumns = (responses[4].result.data || []).map(utils.normalizeColumn).filter((item) => item.column_id)
      this.setData({
        greeting: dailyData.greeting || this.data.greeting,
        dailyArticle: dailyRows.length ? utils.normalizeArticle(dailyRows[0]) : null,
        selectedPins: pins,
        themes: (responses[2].result.data || []).map(utils.normalizeTheme).filter((item) => item.theme_id),
        topics: (responses[3].result.data || []).map(utils.normalizeTopic).filter((item) => item.topic_id),
        columns: remoteColumns.length ? remoteColumns : authors.map(utils.authorToColumn),
        collectionSets: (responses[5].result.data || []).map(utils.normalizeCollectionSet).filter((item) => item.collection_id),
        authors,
        hotArticles: (responses[7].result.data || []).map(utils.normalizeHotRank).filter((item) => item.article_id).slice(0, 8),
        headlines: (responses[8].result.data || []).map(utils.normalizeHeadline).filter((item) => item.content_id).slice(0, 12),
        loading: false,
        loadError: hasFallback
      })
    }).catch(() => this.setData({ loading: false, loadError: true })).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  openSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  openFeature(event) {
    const url = event.currentTarget.dataset.url
    if (url) wx.navigateTo({ url })
  },

  openTheme(event) {
    const item = this.data.themes[Number(event.currentTarget.dataset.index)]
    if (!item) {
      wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=guide&title=掘金使用指南' })
      return
    }
    const cache = wx.getStorageSync('jj:theme-cache') || {}
    cache[String(item.theme_id)] = item
    wx.setStorageSync('jj:theme-cache', cache)
    wx.navigateTo({ url: `/pages/theme/theme?id=${item.theme_id}` })
  },

  openDaily() {
    if (this.data.dailyArticle) wx.navigateTo({ url: `/pages/post/post?id=${this.data.dailyArticle.article_id}` })
  },

  openDailyHistory() {
    wx.navigateTo({ url: '/pages/discoverChannel/discoverChannel?type=daily&title=每日掘金' })
  },

  openSelectedPins() {
    getApp().globalData.openSelectedPins = true
    wx.switchTab({ url: '/pages/feidian/feidian' })
  },

  openPin(event) {
    wx.navigateTo({ url: `/pages/feidianDetail/feidianDetail?msgId=${event.currentTarget.dataset.id}` })
  },

  openAuthor(event) {
    const id = event.currentTarget.dataset.id
    if (!id) return
    const author = this.data.authors.find((item) => item.user_id === String(id))
    if (author) wx.setStorageSync('jj:user-current', author)
    wx.navigateTo({ url: `/pages/profile/profile?id=${id}` })
  },

  openAccountInfo() {
    session.requireLogin()
  },

  openCircleSquare() {
    wx.navigateTo({ url: '/pages/topic/topic' })
  },

  openTopic(event) {
    const id = event.currentTarget.dataset.id
    if (!id) return
    const topic = this.data.topics.find((item) => item.topic_id === String(id))
    if (topic) {
      const cache = wx.getStorageSync('jj:topic-cache') || {}
      cache[String(id)] = topic
      wx.setStorageSync('jj:topic-cache', cache)
    }
    wx.navigateTo({ url: `/pages/topic/topic?id=${id}` })
  },

  openColumnList() {
    wx.navigateTo({ url: '/pages/column/column' })
  },

  openColumn(event) {
    const item = this.data.columns[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:column-current', item)
    wx.navigateTo({ url: `/pages/column/column?id=${item.column_id}` })
  },

  openCollectionList() {
    wx.navigateTo({ url: '/pages/collectionSquare/collectionSquare' })
  },

  openCollection(event) {
    const item = this.data.collectionSets[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:collection-current', item)
    wx.navigateTo({ url: `/pages/collectionSquare/collectionSquare?id=${item.collection_id}` })
  },

  openRank(event) {
    wx.navigateTo({ url: `/pages/rank/rank?type=${event.currentTarget.dataset.type}` })
  },

  selectRankCategory(event) {
    const categoryId = event.currentTarget.dataset.id
    if (categoryId === this.data.activeRankCategory || this.data.rankLoading) return
    this.setData({ activeRankCategory: categoryId, rankLoading: true })
    api.hotArticles({ type: 'hot', count: 8, categoryId }).then(({ result }) => {
      this.setData({
        hotArticles: (result.data || []).map(utils.normalizeHotRank).filter((item) => item.article_id).slice(0, 8),
        rankLoading: false
      })
    }).catch(() => this.setData({ hotArticles: [], rankLoading: false }))
  },

  openArticle(event) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/post/post?id=${id}` })
  },

  openHeadline(event) {
    const item = this.data.headlines[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:headline-current', item)
    wx.navigateTo({ url: '/pages/headlineDetail/headlineDetail' })
  },

  onShareAppMessage() {
    return { title: '发现稀土掘金', path: '/pages/find/find' }
  }
})
