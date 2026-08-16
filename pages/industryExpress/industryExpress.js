const theme = require('../../utils/theme.js')
const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')

const DEFAULT_HEADLINE_THUMBNAIL = '/assets/app/find/find_page_ic_default_banner.png'

Page(theme.withTheme({
  data: {
    title: '行业速递',
    headlines: [],
    cursor: '',
    hasMore: true,
    loading: true,
    loadingMore: false,
    fromCache: false
  },

  onLoad(query) {
    let title = '行业速递'
    try {
      title = query && query.title ? decodeURIComponent(query.title) : title
    } catch (error) {
      title = '行业速递'
    }
    this.setData({ title })
    wx.setNavigationBarTitle({ title })
    this.load(true)
  },

  onPullDownRefresh() {
    this.load(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.load(false)
  },

  load(reload) {
    if (this.data.loadingMore && !reload) return Promise.resolve()
    const cursor = reload ? '' : this.data.cursor
    this.setData({ loading: reload, loadingMore: !reload })
    return api.industryExpress(cursor).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizeHeadline).filter((item) => item.content_id)
      const previous = reload ? [] : this.data.headlines
      const known = new Set(previous.map((item) => String(item.content_id)))
      const additions = rows.filter((item) => !known.has(String(item.content_id)))
      this.setData({
        headlines: previous.concat(additions),
        cursor: String(result.cursor || cursor),
        hasMore: Boolean(result.has_more) && additions.length > 0,
        loading: false,
        loadingMore: false,
        fromCache: Boolean(fromCache)
      })
    }).catch(() => this.setData({ loading: false, loadingMore: false, hasMore: false, fromCache: true })).finally(() => wx.stopPullDownRefresh())
  },

  openHeadline(event) {
    const item = this.data.headlines[Number(event.currentTarget.dataset.index)]
    if (!item) return
    wx.setStorageSync('jj:headline-current', item)
    wx.navigateTo({ url: '/features/headlineDetail/headlineDetail' })
  },

  onThumbnailError(event) {
    const index = Number(event.currentTarget.dataset.index)
    const item = this.data.headlines[index]
    if (!Number.isInteger(index) || !item || item.thumbnail === DEFAULT_HEADLINE_THUMBNAIL) return
    this.setData({ [`headlines[${index}].thumbnail`]: DEFAULT_HEADLINE_THUMBNAIL })
  }
}))
