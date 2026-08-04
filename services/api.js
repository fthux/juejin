const utils = require('../utils/utils.js')
const mock = require('../data/mockData.js')
const passport = require('./passport.js')

const BASE_URL = 'https://api.juejin.cn'
const DEFAULT_QUERY = 'aid=2608&spider=0'

function request(path, data, options) {
  const config = options || {}
  const divider = path.indexOf('?') === -1 ? '?' : '&'
  const url = `${BASE_URL}${path}${divider}${DEFAULT_QUERY}&uuid=${utils.getUuid()}`

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: config.method || 'POST',
      data: data || {},
      header: Object.assign({ 'content-type': 'application/json' }, passport.getAuthHeaders()),
      timeout: config.timeout || 12000,
      success(response) {
        passport.captureCookies(response)
        const body = response.data || {}
        if (response.statusCode >= 200 && response.statusCode < 300 && body.err_no === 0) {
          resolve(body)
          return
        }
        reject(new Error(body.err_msg || `请求失败 (${response.statusCode})`))
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络连接失败'))
      }
    })
  })
}

function withFallback(task, fallback) {
  return task.then((result) => ({ result, fromCache: false })).catch(() => ({
    result: typeof fallback === 'function' ? fallback() : fallback,
    fromCache: true
  }))
}

function homeFeed(cursor, options) {
  const config = options || {}
  return withFallback(request('/recommend_api/v1/article/recommend_all_feed', {
    id_type: 2,
    client_type: 2608,
    sort_type: config.sortType || 200,
    cate_id: config.cateId || '',
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.articles.map((item) => ({ item_info: item })), cursor: 'mock-end', has_more: false }))
}

function categoryFeed(cateId, cursor) {
  return withFallback(request('/recommend_api/v1/article/recommend_cate_feed', {
    id_type: 2,
    sort_type: 200,
    cate_id: cateId || '',
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.articles.map((item) => ({ item_info: item })), cursor: 'mock-end', has_more: false }))
}

function pins(cursor, options) {
  const config = options || {}
  return withFallback(request('/recommend_api/v1/short_msg/recommend', {
    id_type: 4,
    sort_type: config.sortType || 300,
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.pins, cursor: 'mock-end', has_more: false }))
}

function selectedPins(cursor) {
  return withFallback(request('/content_api/v1/short_msg/list_by_selected', {
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.pins, cursor: 'mock-end', has_more: false }))
}

function courses(cursor, options) {
  const config = options || {}
  if (config.courseType === 'byte') {
    return withFallback(request('/booklet_api/v1/bytecourse/list_by_category', {
      category_id: config.categoryId || '0',
      cursor: cursor || '0',
      limit: 20
    }), { data: [], cursor: '0', has_more: false })
  }

  const isRecommended = !config.categoryId && (!config.sort || config.sort === 'all')
  const path = isRecommended
    ? '/booklet_api/v1/booklet/recommend'
    : '/booklet_api/v1/booklet/listbycategory'
  const data = {
    cursor: cursor || '0',
    limit: 20
  }
  if (!isRecommended) {
    data.category_id = config.categoryId || '0'
    data.sort = config.sort === 'latest' ? 1 : (config.sort === 'hot' ? 2 : 0)
  }
  return withFallback(request(path, data), () => ({ data: mock.courses, cursor: 'mock-end', has_more: false }))
}

function courseDetail(bookletId) {
  return request('/booklet_api/v1/booklet/get', { booklet_id: bookletId })
}

function courseSection(sectionId) {
  return request('/booklet_api/v1/section/get', { section_id: sectionId })
}

function courseShelf(cursor) {
  return withFallback(request('/booklet_api/v1/booklet/bookletshelflist', {
    cursor: cursor || '0',
    limit: 20
  }), { data: [], cursor: '0', has_more: false })
}

function articleDetail(articleId) {
  return withFallback(request('/content_api/v1/article/detail', {
    article_id: articleId,
    client_type: 2608
  }), { data: null })
}

function pinDetail(msgId) {
  return withFallback(request('/content_api/v1/short_msg/detail', { msg_id: msgId }), () => ({
    data: mock.pins.find((item) => item.msg_id === msgId) || mock.pins[0]
  }))
}

function daily() {
  return withFallback(request('/content_api/v1/article/daily', {}), () => ({ data: mock.daily }))
}

function hotArticles() {
  return withFallback(request('/content_api/v1/content/list_by_hot', { cursor: '0', limit: 30 }), () => ({ data: mock.articles }))
}

function hotAuthors() {
  return withFallback(request('/content_api/v1/author/list_by_hot', { cursor: '0', limit: 30 }), () => ({ data: mock.authors }))
}

function followers(userId, cursor) {
  if (!userId) return Promise.resolve({ result: { data: [], cursor: '0', has_more: false }, fromCache: true })
  return withFallback(request('/interact_api/v1/follow/follower_list', {
    user_id: userId,
    cursor: cursor || '0',
    limit: 20
  }), { data: [], cursor: '0', has_more: false })
}

function topics() {
  return withFallback(request('/tag_api/v1/topic/list_by_rec', { cursor: '0', limit: 30 }), () => ({ data: mock.topics }))
}

function search(keyword, type) {
  const query = String(keyword || '').trim()
  const kind = type || 'article'
  if (!query) return Promise.resolve({ result: { data: [] }, fromCache: true })
  return withFallback(request('/search_api/v1/search', {
    query,
    id_type: kind === 'user' ? 1 : 2,
    cursor: '0',
    limit: 20,
    search_type: 0
  }), () => ({ data: mock.search(query, kind) }))
}

module.exports = {
  request,
  homeFeed,
  categoryFeed,
  pins,
  selectedPins,
  courses,
  courseDetail,
  courseSection,
  courseShelf,
  articleDetail,
  pinDetail,
  daily,
  hotArticles,
  hotAuthors,
  followers,
  topics,
  search
}
