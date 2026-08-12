const theme = require('../../utils/theme.js')
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const SEARCH_TYPES = [
  { id: 'all', name: '综合', placeholder: '搜索文章/课程/标签/用户' },
  { id: 'article', name: '文章', placeholder: '搜索文章' },
  { id: 'course', name: '课程', placeholder: '搜索课程' },
  { id: 'tag', name: '标签', placeholder: '搜索标签' },
  { id: 'user', name: '用户', placeholder: '搜索用户' }
]

const SORT_OPTIONS = [
  { id: 0, name: '综合排序' },
  { id: 1, name: '最新优先' },
  { id: 2, name: '最热优先' }
]

const TIME_OPTIONS = [
  { id: 0, name: '时间不限' },
  { id: 1, name: '最新一天' },
  { id: 2, name: '最近一周' },
  { id: 3, name: '最近三月' }
]

function typeConfig(type) {
  return SEARCH_TYPES.find((item) => item.id === type) || SEARCH_TYPES[0]
}

function highlight(text, keyword) {
  const value = String(text || '')
  const query = String(keyword || '').toLowerCase()
  if (!query) return [{ key: `plain-${value}`, text: value, hit: false }]
  const lower = value.toLowerCase()
  const segments = []
  let offset = 0
  let index = lower.indexOf(query, offset)
  while (index !== -1) {
    if (index > offset) segments.push({ key: `plain-${offset}`, text: value.slice(offset, index), hit: false })
    segments.push({ key: `hit-${index}`, text: value.slice(index, index + query.length), hit: true })
    offset = index + query.length
    index = lower.indexOf(query, offset)
  }
  if (offset < value.length) segments.push({ key: `plain-${offset}`, text: value.slice(offset), hit: false })
  return segments.length ? segments : [{ key: `plain-${value}`, text: value, hit: false }]
}

function unwrap(raw) {
  return raw && raw.result_model ? raw.result_model : (raw || {})
}

function resultKind(raw, fallbackType) {
  const type = Number(raw && raw.result_type)
  if (type === 1) return 'user'
  if (type === 2) return 'article'
  if (type === 9) return 'tag'
  if (type === 12) return 'course'
  const model = unwrap(raw)
  if (model.article_id || model.article_info) return 'article'
  if (model.booklet_id || model.booklet_info || model.base_info) return 'course'
  if (model.tag_id || model.tag_name || model.tag) return 'tag'
  if (model.user_id || model.user_name) return 'user'
  return fallbackType === 'all' ? '' : fallbackType
}

function normalizeTag(raw) {
  const model = unwrap(raw)
  const tag = model.tag || model
  return {
    tag_id: String(model.tag_id || tag.tag_id || ''),
    tag_name: tag.tag_name || tag.name || model.tag_name || '技术标签',
    icon: utils.normalizeImageUrl(tag.icon || model.icon || '', 120),
    follower_count: utils.formatCount(tag.concern_user_count || model.concern_user_count),
    article_count: utils.formatCount(tag.post_article_count || model.post_article_count),
    followed: Boolean((model.user_interact && model.user_interact.is_follow) || tag.is_followed)
  }
}

function normalizeUser(raw) {
  const item = unwrap(raw)
  return {
    user_id: String(item.user_id || ''),
    user_name: item.user_name || '掘金用户',
    avatar_large: item.avatar_large || '/assets/app/common/default_avatar.png',
    job_title: item.job_title || '',
    company: item.company || '',
    description: item.description || '',
    follower_count: utils.formatCount(item.follower_count),
    followed: Boolean(item.isfollowed || item.is_followed)
  }
}

function normalizeResult(raw, fallbackType, keyword, index) {
  const kind = resultKind(raw, fallbackType)
  const model = unwrap(raw)
  if (!kind) return null
  let item
  if (kind === 'article') {
    item = utils.normalizeArticle(model)
    item.title_segments = highlight(item.title, keyword)
    item.brief_segments = highlight(item.brief_content, keyword)
  } else if (kind === 'course') {
    item = utils.normalizeCourse(model)
  } else if (kind === 'tag') {
    item = normalizeTag(model)
    item.name_segments = highlight(item.tag_name, keyword)
  } else {
    item = normalizeUser(model)
    item.name_segments = highlight(item.user_name, keyword)
  }
  const id = item.article_id || item.id || item.tag_id || item.user_id || index
  return { key: `${kind}-${id}-${index}`, kind, item }
}

Page(theme.withTheme({
  data: {
    keyword: '',
    submittedKeyword: '',
    type: 'all',
    types: SEARCH_TYPES,
    placeholder: SEARCH_TYPES[0].placeholder,
    histories: [],
    results: [],
    searched: false,
    loading: false,
    loadError: false,
    fromCache: false,
    cursor: '0',
    hasMore: false,
    sortType: 0,
    sortLabel: SORT_OPTIONS[0].name,
    searchType: 0,
    timeLabel: TIME_OPTIONS[0].name,
    sortOptions: SORT_OPTIONS,
    timeOptions: TIME_OPTIONS,
    openFilter: ''
  },

  onLoad(query) {
    this.searchRequestId = 0
    const requestedType = SEARCH_TYPES.some((item) => item.id === query.type) ? query.type : 'all'
    const keyword = String(query.keyword || '')
    this.setData({
      keyword,
      type: requestedType,
      placeholder: typeConfig(requestedType).placeholder,
      histories: wx.getStorageSync('jj:search-history') || []
    })
    if (keyword.trim()) this.submit()
  },

  onUnload() {
    this.searchRequestId += 1
  },

  onReachBottom() {
    if (this.data.searched && this.data.hasMore && !this.data.loading) this.loadResults(false)
  },

  goBack() {
    wx.navigateBack()
  },

  onInput(event) {
    const keyword = event.detail.value
    if (!keyword) {
      this.searchRequestId += 1
      this.setData({ keyword: '', results: [], searched: false, loading: false, loadError: false, openFilter: '' })
      return
    }
    this.setData({ keyword })
  },

  clearKeyword() {
    this.searchRequestId += 1
    this.setData({
      keyword: '',
      submittedKeyword: '',
      results: [],
      searched: false,
      loading: false,
      loadError: false,
      cursor: '0',
      hasMore: false,
      openFilter: ''
    })
  },

  switchType(event) {
    const type = event.currentTarget.dataset.id
    if (type === this.data.type) return
    this.setData({ type, placeholder: typeConfig(type).placeholder, openFilter: '' })
    if (this.data.searched) this.loadResults(true)
  },

  useHistory(event) {
    const keyword = this.data.histories[Number(event.currentTarget.dataset.index)]
    if (!keyword) return
    this.setData({ keyword })
    this.submit()
  },

  clearHistory() {
    wx.removeStorageSync('jj:search-history')
    this.setData({ histories: [] })
  },

  submit() {
    const keyword = this.data.keyword.trim()
    if (!keyword) return
    const histories = [keyword].concat(this.data.histories.filter((item) => item !== keyword)).slice(0, 20)
    wx.setStorageSync('jj:search-history', histories)
    this.setData({ keyword, submittedKeyword: keyword, histories, searched: true, openFilter: '' })
    this.loadResults(true)
  },

  toggleFilter(event) {
    const filter = event.currentTarget.dataset.filter
    this.setData({ openFilter: this.data.openFilter === filter ? '' : filter })
  },

  closeFilter() {
    this.setData({ openFilter: '' })
  },

  selectSort(event) {
    const option = SORT_OPTIONS[Number(event.currentTarget.dataset.index)]
    if (!option) return
    const changed = option.id !== this.data.sortType
    this.setData({ sortType: option.id, sortLabel: option.name, openFilter: '' })
    if (changed) this.loadResults(true)
  },

  selectTime(event) {
    const option = TIME_OPTIONS[Number(event.currentTarget.dataset.index)]
    if (!option) return
    const changed = option.id !== this.data.searchType
    this.setData({ searchType: option.id, timeLabel: option.name, openFilter: '' })
    if (changed) this.loadResults(true)
  },

  loadResults(reload) {
    if (this.data.loading && !reload) return
    const keyword = this.data.submittedKeyword || this.data.keyword.trim()
    if (!keyword) return
    const type = this.data.type
    const cursor = reload ? '0' : this.data.cursor
    const requestId = ++this.searchRequestId
    this.setData({
      loading: true,
      loadError: false,
      results: reload ? [] : this.data.results,
      cursor: reload ? '0' : this.data.cursor,
      hasMore: reload ? false : this.data.hasMore
    })

    api.search(keyword, type, cursor, {
      searchType: this.data.searchType,
      sortType: this.data.sortType
    }).then(({ result, fromCache }) => {
      if (requestId !== this.searchRequestId || type !== this.data.type) return
      const offset = reload ? 0 : this.data.results.length
      const rows = (result.data || []).map((item, index) => normalizeResult(item, type, keyword, offset + index)).filter(Boolean)
      this.setData({
        results: reload ? rows : this.data.results.concat(rows),
        cursor: String(result.cursor || '0'),
        hasMore: Boolean(result.has_more) && rows.length > 0,
        fromCache: Boolean(fromCache),
        loading: false,
        loadError: false
      })
    }).catch(() => {
      if (requestId === this.searchRequestId) this.setData({ loading: false, loadError: true, hasMore: false })
    })
  },

  retryLoad() {
    this.loadResults(this.data.fromCache || !this.data.results.length)
  },

  openResult(event) {
    const row = this.data.results[Number(event.currentTarget.dataset.index)]
    if (!row) return
    if (row.kind === 'article' && row.item.article_id) {
      session.cacheArticle(row.item)
      wx.navigateTo({ url: `/features/post/post?id=${row.item.article_id}` })
    } else if (row.kind === 'course' && row.item.id) {
      wx.navigateTo({ url: `/features/courseDetail/courseDetail?id=${row.item.id}` })
    } else if (row.kind === 'user' && row.item.user_id) {
      wx.setStorageSync('jj:user-current', row.item)
      wx.navigateTo({ url: `/features/profile/profile?id=${row.item.user_id}` })
    } else if (row.kind === 'tag') {
      this.setData({ keyword: row.item.tag_name, submittedKeyword: row.item.tag_name, type: 'article', placeholder: typeConfig('article').placeholder })
      this.submit()
    }
  },

  openAuthor(event) {
    const row = this.data.results[Number(event.currentTarget.dataset.index)]
    const author = row && row.item && row.item.author
    if (!author || !author.user_id) return
    wx.setStorageSync('jj:user-current', author)
    wx.navigateTo({ url: `/features/profile/profile?id=${author.user_id}` })
  },

  toggleFollow(event) {
    if (!session.requireLogin()) return
    const index = Number(event.currentTarget.dataset.index)
    const row = this.data.results[index]
    if (!row || (row.kind !== 'user' && row.kind !== 'tag')) return
    this.setData({ [`results[${index}].item.followed`]: !row.item.followed })
  },

  openCourse(event) {
    const item = event.detail && event.detail.item
    if (item && item.id) wx.navigateTo({ url: `/features/courseDetail/courseDetail?id=${item.id}` })
  }
}))
