const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const DAILY_COLUMN_ID = '7107151273765371941'
const DAILY_DESCRIPTION = '最近鉴于掘友们的热情召唤，我们终于把做了几百期的社群下午茶搬到站内了，酱酱们会一直陪伴，认证创作的掘友们，站内下午茶新增优质作者介绍和码上掘金板块，专注于发掘站内优质创作者和优质内容，欢迎大家多提宝贵意见！'

Page({
  data: {
    daily: null,
    author: null,
    articles: [],
    sort: 'default',
    cursor: '0',
    hasMore: true,
    loading: false,
    followed: false,
    fromCache: false
  },

  onLoad() { this.loadDaily() },
  onPullDownRefresh() { this.loadDaily() },
  onReachBottom() { this.loadArticles(false) },

  goBack() { wx.navigateBack() },

  loadDaily() {
    this.setData({ loading: true })
    api.daily().then(({ result, fromCache }) => {
      const payload = result.data || {}
      const raw = payload.article_info
        ? payload
        : (Array.isArray(payload) ? payload[0] : (payload.articles || payload.article_list || [])[0]) || {}
      const daily = raw.article_info || raw.article_id ? utils.normalizeArticle(raw) : null
      const authorInfo = raw.author_user_info || (daily && daily.author) || {}
      const author = {
        user_id: String(authorInfo.user_id || (daily && daily.author.user_id) || ''),
        user_name: authorInfo.user_name || (daily && daily.author.user_name) || '酱酱们的AI编程淘金',
        avatar_large: authorInfo.avatar_large || '/assets/app/common/default_avatar.webp',
        level: Number(authorInfo.level || (authorInfo.user_growth_info && authorInfo.user_growth_info.jpower_level)) || 6,
        description: DAILY_DESCRIPTION,
        create_time: '2022-06-09',
        article_count: 349,
        follower_count: '976',
        subscriber_avatars: []
      }
      this.setData({ daily, author, fromCache: Boolean(fromCache), cursor: '0', hasMore: true })
      this.loadSubscribers(author.user_id)
      return this.loadArticles(true)
    }).catch(() => this.setData({ loading: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  loadArticles(reload) {
    if (!this.data.author || !this.data.author.user_id || (this.data.loading && !reload) || (!reload && !this.data.hasMore)) return Promise.resolve()
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })
    return api.columnArticles(DAILY_COLUMN_ID, cursor, this.data.sort === 'latest' ? 1 : 2).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeArticle).filter((item) => item.article_id)
      const previous = reload ? [] : this.data.articles
      const known = new Set(previous.map((item) => String(item.article_id)))
      const additions = rows.filter((item) => !known.has(String(item.article_id)))
      this.setData({
        articles: previous.concat(additions),
        cursor: String(result.cursor || cursor),
        hasMore: Boolean(result.has_more) && additions.length > 0,
        loading: false,
        fromCache: this.data.fromCache || Boolean(fromCache)
      })
    }).catch(() => this.setData({ loading: false, hasMore: false, fromCache: true }))
  },

  loadSubscribers(userId) {
    if (!userId) return
    Promise.all([api.followers(userId, '0'), api.recommendedAuthors('0', 6)]).then(([followerResponse, authorResponse]) => {
      const candidates = (followerResponse.result.data || []).map((item) => item.user_info || item)
        .concat((authorResponse.result.data || []).map((item) => item.user_info || item))
      const seen = new Set()
      const avatars = candidates.filter((item) => {
        const key = String(item.user_id || item.avatar_large || '')
        if (!key || !item.avatar_large || seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 4).map((item) => ({
        user_id: String(item.user_id || item.avatar_large),
        avatar_large: item.avatar_large
      }))
      if (avatars.length) this.setData({ 'author.subscriber_avatars': avatars })
    }).catch(() => {})
  },

  switchSort() {
    this.setData({ sort: this.data.sort === 'default' ? 'latest' : 'default', cursor: '0', hasMore: true })
    this.loadArticles(true)
  },

  toggleFollow() {
    if (!session.requireLogin()) return
    this.setData({ followed: !this.data.followed })
  },

  openArticle(event) {
    const item = this.data.articles[Number(event.currentTarget.dataset.index)]
    if (item) wx.navigateTo({ url: `/features/post/post?id=${item.article_id}` })
  },

  openAuthor() {
    const author = this.data.author
    if (!author) return
    wx.setStorageSync('jj:user-current', author)
    wx.navigateTo({ url: `/features/profile/profile?id=${author.user_id}` })
  }
})
