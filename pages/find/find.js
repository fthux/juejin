const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const mock = require('../../data/mockData.js')
const theme = require('../../utils/theme.js')

function cacheThemeAndOpen(theme) {
  if (!theme || !theme.theme_id) return
  const themeId = String(theme.theme_id)
  const cache = wx.getStorageSync('jj:theme-cache') || {}
  cache[themeId] = theme
  wx.setStorageSync('jj:theme-cache', cache)
  wx.navigateTo({ url: `/features/theme/theme?id=${themeId}` })
}

Page(theme.withTheme({
  data: {
    greeting: '每天读一点，保持技术好奇心',
    dailyDay: String(new Date().getDate()),
    dailyMonth: `${new Date().getFullYear()}.${new Date().getMonth() + 1}`,
    dailyArticle: null,
    selectedPins: [],
    themes: [],
    topics: [],
    columns: [],
    collectionSets: [],
    authors: [],
    headlines: [],
    headlineCursor: '',
    headlineHasMore: true,
    headlineLoading: false,
    rankCategories: mock.hotCategories,
    rankLists: mock.hotCategories.map(() => []),
    activeRankIndex: 0,
    activeRankCategory: mock.hotCategories[0] ? mock.hotCategories[0].id : '',
    rankLoading: false,
    loading: true,
    loadError: false,
    initialLoaded: false,
    fromCache: false,
    darkMode: false,
    channelEntries: [
      { title: '职场锦囊', icon: '/assets/app/find/find_page_ic_interview_kit.svg', darkIcon: '/assets/app/find/dark/find_page_ic_interview_kit.svg', url: '/features/discoverChannel/discoverChannel?type=interview&title=职场锦囊' },
      { title: '行业速递', icon: '/assets/app/find/find_page_ic_industry_express.svg', darkIcon: '/assets/app/find/dark/find_page_ic_industry_express.svg', anchor: 'industry' },
      { title: '掘金一周', icon: '/assets/app/find/find_page_ic_juejin_weekly.svg', darkIcon: '/assets/app/find/dark/find_page_ic_juejin_weekly.svg', url: '/features/discoverChannel/discoverChannel?type=weekly&title=掘金一周' },
      { title: '高校精选', icon: '/assets/app/find/find_page_ic_undergraduate_reading.svg', darkIcon: '/assets/app/find/dark/find_page_ic_undergraduate_reading.svg', url: '/features/discoverChannel/discoverChannel?type=student&title=高校精选' }
    ],
    quickEntries: [
      { name: '技术团队', icon: '/assets/app/find/find_page_ic_tech_team.svg', url: '/features/discoverChannel/discoverChannel?type=team&title=技术团队' },
      { name: '圈子广场', icon: '/assets/app/find/find_page_ic_circle_square.svg', url: '/features/topic/topic' },
      { name: '话题广场', icon: '/assets/app/find/find_page_ic_topic_square.svg', url: '/features/theme/theme' },
      { name: '活动', icon: '/assets/app/find/find_page_ic_activity.svg', url: '/features/discoverChannel/discoverChannel?type=activity&title=活动' },
      { name: '竞赛', icon: '/assets/app/find/find_page_ic_game.svg', url: '/features/discoverChannel/discoverChannel?type=game&title=竞赛' }
    ]
  },

  onLoad() {
    this.loadAll()
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 2 })
  },

  onPullDownRefresh() {
    this.loadAll()
  },

  onReachBottom() {
    this.loadMoreHeadlines()
  },

  loadAll() {
    const firstCategory = this.data.rankCategories[0] || { id: '' }
    this.setData({ loading: true, loadError: false, fromCache: false, headlineCursor: '', headlineHasMore: true })
    Promise.all([
      api.daily(),
      api.selectedPins('0'),
      api.recommendedThemes('0', 6),
      api.topics('0', 8),
      api.recommendedColumns('0', 8),
      api.recommendedCollectionSets('0', 8, { moduleType: 1 }),
      api.recommendedAuthors('0', 8),
      api.hotArticles({ type: 'hot', count: 3, categoryId: firstCategory.id }),
      api.headlineFeed('')
    ]).then((responses) => {
      const dailyData = responses[0].result.data || {}
      const dailyRows = Array.isArray(dailyData)
        ? dailyData
        : (dailyData.article_info ? [dailyData] : (dailyData.articles || dailyData.article_list || []))
      const authors = (responses[6].result.data || []).map(utils.normalizeRecommendedAuthor).filter((item) => item.user_id)
      const remoteColumns = (responses[4].result.data || []).map(utils.normalizeColumn).filter((item) => item.column_id)
      const rankLists = this.data.rankCategories.map(() => [])
      rankLists[0] = (responses[7].result.data || []).map(utils.normalizeHotRank).filter((item) => item.article_id).slice(0, 3)
      this.setData({
        greeting: dailyData.greeting || this.data.greeting,
        dailyArticle: dailyRows.length ? utils.normalizeArticle(dailyRows[0]) : null,
        selectedPins: (responses[1].result.data || []).map(utils.normalizePin).filter((item) => item.msg_id).slice(0, 8),
        themes: (responses[2].result.data || []).map(utils.normalizeTheme).filter((item) => item.theme_id),
        topics: (responses[3].result.data || []).map(utils.normalizeTopic).filter((item) => item.topic_id),
        columns: remoteColumns.length ? remoteColumns : authors.map(utils.authorToColumn),
        collectionSets: (responses[5].result.data || []).map(utils.normalizeCollectionSet).filter((item) => item.collection_id),
        authors,
        rankLists,
        activeRankIndex: 0,
        activeRankCategory: firstCategory.id,
        headlines: (responses[8].result.data || []).map(utils.normalizeHeadline).filter((item) => item.content_id),
        headlineCursor: String(responses[8].result.cursor || ''),
        headlineHasMore: Boolean(responses[8].result.has_more),
        loading: false,
        loadError: false,
        initialLoaded: true,
        fromCache: responses.some((response) => response.fromCache)
      })
      this.loadTopicPreviews()
    }).catch(() => this.setData({ loading: false, loadError: true, fromCache: false })).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  loadTopicPreviews() {
    const topics = this.data.topics
    if (!topics.length) return
    Promise.all(topics.map((topic) => api.topicPins(topic.topic_id, '0', { limit: 2 }))).then((responses) => {
      const hydrated = topics.map((topic, index) => Object.assign({}, topic, {
        shorts: (responses[index].result.data || []).map(utils.normalizePin).filter((item) => item.msg_id).slice(0, 2).map((pin) => ({
          key: pin.msg_id,
          msg_id: pin.msg_id,
          content: pin.content,
          avatar: pin.author.avatar_large
        }))
      }))
      this.setData({ topics: hydrated })
    }).catch(() => {})
  },

  loadMoreHeadlines() {
    if (this.data.loading || this.data.headlineLoading || !this.data.headlineHasMore) return
    this.setData({ headlineLoading: true })
    api.headlineFeed(this.data.headlineCursor).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeHeadline).filter((item) => item.content_id)
      const known = new Set(this.data.headlines.map((item) => String(item.content_id)))
      const additions = rows.filter((item) => !known.has(String(item.content_id)))
      this.setData({
        headlines: this.data.headlines.concat(additions),
        headlineCursor: String(result.cursor || this.data.headlineCursor),
        headlineHasMore: Boolean(result.has_more) && additions.length > 0,
        headlineLoading: false,
        fromCache: this.data.fromCache || Boolean(fromCache)
      })
    }).catch(() => this.setData({ headlineLoading: false, headlineHasMore: false }))
  },

  openSearch() { wx.navigateTo({ url: '/features/search/search' }) },

  retryLoad() { this.loadAll() },

  openFeature(event) {
    const item = event.currentTarget.dataset
    if (item.anchor === 'industry') {
      wx.pageScrollTo({ selector: '#industry-section', duration: 300 })
      return
    }
    if (item.url) wx.navigateTo({ url: item.url })
  },

  openTheme(event) {
    const item = this.data.themes[Number(event.currentTarget.dataset.index)]
    if (item) cacheThemeAndOpen(item)
  },

  openDaily() {
    if (this.data.dailyArticle) wx.navigateTo({ url: `/features/post/post?id=${this.data.dailyArticle.article_id}` })
  },

  openDailyHistory() { wx.navigateTo({ url: '/features/daily/daily' }) },
  openSelectedPins() { wx.navigateTo({ url: '/features/selectedPins/selectedPins' }) },

  openPin(event) {
    const item = this.data.selectedPins[Number(event.currentTarget.dataset.index)]
    if (item) wx.navigateTo({ url: `/features/feidianDetail/feidianDetail?msgId=${item.msg_id}` })
  },

  openSelectedTheme(event) {
    const pin = this.data.selectedPins[Number(event.currentTarget.dataset.pinIndex)]
    const segment = pin && pin.content_segments[Number(event.currentTarget.dataset.segmentIndex)]
    if (!segment || segment.type !== 'theme' || !segment.theme_id) return
    const theme = pin.theme && String(pin.theme.theme_id) === String(segment.theme_id)
      ? pin.theme
      : { theme_id: String(segment.theme_id), name: segment.text || '活动标签' }
    cacheThemeAndOpen(theme)
  },

  openAuthor(event) {
    const id = String(event.currentTarget.dataset.id || '')
    if (!id) return
    const author = this.data.authors.find((item) => item.user_id === id)
    if (author) wx.setStorageSync('jj:user-current', author)
    wx.navigateTo({ url: `/features/profile/profile?id=${id}` })
  },

  openAccountInfo() { session.requireLogin() },

  onRemoteImageError(event) {
    const index = Number(event.currentTarget.dataset.index)
    const kind = event.currentTarget.dataset.kind
    const fallbackByKind = {
      theme: ['themes', 'cover', '/assets/app/find/find_page_ic_default_banner.png'],
      'pin-avatar': ['selectedPins', 'author.avatar_large', '/assets/app/common/default_avatar.png'],
      topic: ['topics', 'iconUrl', ''],
      column: ['columns', 'cover', ''],
      author: ['authors', 'avatar_large', '/assets/app/common/default_avatar.png'],
      headline: ['headlines', 'thumbnail', '']
    }
    const fallback = fallbackByKind[kind]
    if (!Number.isInteger(index) || !fallback || !this.data[fallback[0]][index]) return
    this.setData({ [`${fallback[0]}[${index}].${fallback[1]}`]: fallback[2] })
  },

  openCircleSquare() { wx.navigateTo({ url: '/features/topic/topic' }) },

  openTopic(event) {
    const topic = this.data.topics[Number(event.currentTarget.dataset.index)]
    if (!topic) return
    const id = topic.topic_id
    if (topic) {
      const cache = wx.getStorageSync('jj:topic-cache') || {}
      cache[id] = topic
      wx.setStorageSync('jj:topic-cache', cache)
    }
    wx.navigateTo({ url: `/features/topic/topic?id=${id}` })
  },

  openColumnList() { wx.navigateTo({ url: '/features/column/column' }) },

  openColumn(event) {
    const item = this.data.columns[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:column-current', item)
    wx.navigateTo({ url: `/features/column/column?id=${item.column_id}` })
  },

  openCollectionList() { wx.navigateTo({ url: '/features/collectionSquare/collectionSquare' }) },

  openCollection(event) {
    const item = this.data.collectionSets[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:collection-current', item)
    wx.navigateTo({ url: `/features/collectionSquare/collectionSquare?id=${item.collection_id}` })
  },

  openRank(event) { wx.navigateTo({ url: `/features/rank/rank?type=${event.currentTarget.dataset.type}` }) },

  openRankCategory(event) {
    const category = this.data.rankCategories[Number(event.currentTarget.dataset.index)]
    if (!category || !category.id) return
    wx.navigateTo({ url: `/features/rank/rank?type=article&categoryId=${encodeURIComponent(String(category.id))}` })
  },

  selectRankCategory(event) {
    if (this.data.rankLoading) return
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isInteger(index) || !this.data.rankCategories[index]) return
    this.setData({ activeRankIndex: index, activeRankCategory: this.data.rankCategories[index].id })
    this.loadRankAt(index)
  },

  changeRankCategory(event) {
    const index = Number(event.detail.current)
    if (!Number.isInteger(index) || !this.data.rankCategories[index]) return
    this.setData({ activeRankIndex: index, activeRankCategory: this.data.rankCategories[index].id })
    this.loadRankAt(index)
  },

  loadRankAt(index) {
    if (this.data.rankLoading || (this.data.rankLists[index] || []).length) return
    const category = this.data.rankCategories[index]
    if (!category) return
    this.setData({ rankLoading: true })
    api.hotArticles({ type: 'hot', count: 3, categoryId: category.id }).then(({ result }) => {
      this.setData({
        [`rankLists[${index}]`]: (result.data || []).map(utils.normalizeHotRank).filter((item) => item.article_id).slice(0, 3),
        rankLoading: false
      })
    }).catch(() => this.setData({ rankLoading: false }))
  },

  openArticle(event) {
    const id = event.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/features/post/post?id=${id}` })
  },

  openCardArticle(event) {
    const data = event.currentTarget.dataset
    const groups = { column: this.data.columns, collection: this.data.collectionSets, author: this.data.authors }
    const group = groups[data.section] || []
    const card = group[Number(data.cardIndex)]
    const article = card && card.articles[Number(data.articleIndex)]
    if (article) wx.navigateTo({ url: `/features/post/post?id=${article.article_id}` })
  },

  openRankArticle(event) {
    const data = event.currentTarget.dataset
    const list = this.data.rankLists[Number(data.pageIndex)] || []
    const article = list[Number(data.articleIndex)]
    if (article) wx.navigateTo({ url: `/features/post/post?id=${article.article_id}` })
  },

  openHeadline(event) {
    const item = this.data.headlines[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:headline-current', item)
    wx.navigateTo({ url: '/features/headlineDetail/headlineDetail' })
  },

  onShareAppMessage() { return { title: '发现稀土掘金', path: '/pages/find/find' } }
}))
