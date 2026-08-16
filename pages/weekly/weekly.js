const theme = require('../../utils/theme.js')
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const mock = require('../../data/mockData.js')

const WEEKLY_COLUMN_ID = '7052161662953979918'
const WEEKLY_USER_ID = '53218623894222'
const WEEKLY_NAME = '一周「金」选'

function fallbackWeeklyCollection() {
  return utils.normalizeCollectionSet(mock.weeklyCollection)
}

function normalizeWeeklyCreator(profile) {
  const user = profile || {}
  const avatar = String(user.avatar_large || '')
  return {
    user_id: String(user.user_id || WEEKLY_USER_ID),
    user_name: user.user_name || '掘金一周',
    avatar_large: avatar && avatar.indexOf('passport.byteacctimg.com/img/user-avatar/') === -1
      ? utils.normalizeAvatar(avatar, 160)
      : '/assets/app/common/ic_juejin_logo.png',
    level: Number(user.level || (user.user_growth_info && user.user_growth_info.jpower_level)) || 0
  }
}

function normalizeWeekly(detail, articles, cursor, hasMore) {
  const payload = detail || {}
  const column = payload.column || {}
  const version = payload.column_version || {}
  const author = payload.author || {}
  const followers = Array.isArray(payload.follower) ? payload.follower : []
  const firstCover = (articles || []).find((item) => item.cover_image) || {}
  const cover = version.cover || firstCover.cover_image || '/assets/app/find/find_page_ic_default_banner.png'
  return {
    collection_id: String(payload.column_id || column.column_id || WEEKLY_COLUMN_ID),
    name: version.title || WEEKLY_NAME,
    description: version.content || '每周掘金优质文章',
    cover: utils.normalizeImageUrl(cover, 1080),
    create_time: utils.formatDateTime(version.ctime || column.ctime, false) || '2022-01-12',
    article_count: Number(column.article_cnt) || (articles || []).length,
    follower_count: utils.formatCount(column.follow_cnt),
    creator: normalizeWeeklyCreator(author),
    recent_users: followers.slice(0, 5).map((user) => ({
      user_id: String(user.user_id || ''),
      avatar_large: utils.normalizeAvatar(user.avatar_large, 80)
    })),
    articles: articles || [],
    articleCursor: String(cursor || '0'),
    articleHasMore: Boolean(hasMore),
    isFollow: Boolean(payload.is_follow)
  }
}

function normalizeWeeklyArticle(raw) {
  const article = utils.normalizeArticle(raw)
  return Object.assign({}, article, {
    ctime: String(article.ctime || '').replace('个月前', '月前')
  })
}

Page(theme.withTheme({
  data: {
    title: '掘金一周',
    weekly: null,
    weeklyFollowed: false,
    loading: true,
    fromCache: false
  },

  onLoad(query) {
    let title = '掘金一周'
    try {
      title = query && query.title ? decodeURIComponent(query.title) : title
    } catch (error) {
      title = '掘金一周'
    }
    this.setData({ title })
    wx.setNavigationBarTitle({ title })
    this.loadWeekly(true)
  },

  onPullDownRefresh() {
    this.loadWeekly(true)
  },

  onReachBottom() {
    if (this.data.weekly && this.data.weekly.articleHasMore) this.loadWeekly(false)
  },

  loadWeekly(reload) {
    if (this.data.loading && !reload) return Promise.resolve()
    if (!reload && this.data.weekly && this.data.weekly.articleHasMore) {
      const current = this.data.weekly
      this.setData({ loading: true })
      return api.columnArticles(WEEKLY_COLUMN_ID, current.articleCursor || '0', 2, 20).then(({ result, fromCache }) => {
        const rows = (result.data || []).map(normalizeWeeklyArticle).filter((item) => item.article_id)
        const known = new Set((current.articles || []).map((item) => String(item.article_id)))
        const additions = rows.filter((item) => !known.has(String(item.article_id)))
        this.setData({
          weekly: Object.assign({}, current, {
            articles: (current.articles || []).concat(additions),
            articleCursor: String(result.cursor || current.articleCursor || '0'),
            articleHasMore: Boolean(result.has_more) && additions.length > 0
          }),
          loading: false,
          fromCache: Boolean(fromCache)
        })
      }).catch(() => this.setData({ loading: false, weekly: Object.assign({}, this.data.weekly, { articleHasMore: false }), fromCache: true })).finally(() => wx.stopPullDownRefresh())
    }
    this.setData({ loading: true })
    return Promise.all([api.columnDetail(WEEKLY_COLUMN_ID), api.columnArticles(WEEKLY_COLUMN_ID, '0', 2, 20)]).then(([detailResponse, articleResponse]) => {
      const detail = detailResponse.result.data || {}
      const result = articleResponse.result || {}
      const articles = (result.data || []).map(normalizeWeeklyArticle).filter((item) => item.article_id)
      if (!detailResponse.result.data && detailResponse.fromCache && articleResponse.fromCache) {
        this.setData({ weekly: Object.assign(fallbackWeeklyCollection(), { articleHasMore: false }), loading: false, fromCache: true })
        return this.data.weekly
      }
      const weekly = detailResponse.result.data
        ? normalizeWeekly(detail, articles, result.cursor, result.has_more)
        : Object.assign(fallbackWeeklyCollection(), {
          articles,
          articleCursor: String(result.cursor || '0'),
          articleHasMore: Boolean(result.has_more) && articles.length > 0
        })
      this.setData({ weekly, weeklyFollowed: weekly.isFollow, loading: false, fromCache: Boolean(detailResponse.fromCache || articleResponse.fromCache) })
      return weekly
    }).catch(() => this.setData({ weekly: Object.assign(fallbackWeeklyCollection(), { articleHasMore: false }), loading: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  openWeeklyArticle(event) {
    const item = this.data.weekly && this.data.weekly.articles[Number(event.currentTarget.dataset.index)]
    if (item && item.article_id) wx.navigateTo({ url: `/features/post/post?id=${item.article_id}` })
  },

  subscribeWeekly() {
    if (!session.requireLogin()) return
    this.setData({ weeklyFollowed: !this.data.weeklyFollowed })
  }

}))
