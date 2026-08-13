const utils = require('../utils/utils.js')
const mock = require('../data/mockData.js')

const BASE_URL = 'https://api.juejin.cn'
const DEFAULT_QUERY = 'aid=2608&spider=0'

function request(path, data, options) {
  const config = options || {}
  const divider = path.indexOf('?') === -1 ? '?' : '&'
  return utils.getUuid().then((uuid) => {
    const query = config.skipDefaultQuery ? `uuid=${uuid}` : `${DEFAULT_QUERY}&uuid=${uuid}`
    const url = `${BASE_URL}${path}${divider}${query}`

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: config.method || 'POST',
        data: data || {},
        header: config.header || { 'content-type': 'application/json' },
        timeout: config.timeout || 12000,
        success(response) {
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

function categoryTagFeed(cateId, tagId, cursor) {
  if (!tagId) return categoryFeed(cateId, cursor)
  return withFallback(request('/recommend_api/v1/article/recommend_cate_tag_feed', {
    id_type: 2,
    sort_type: 200,
    cate_id: cateId || '',
    tag_id: tagId,
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.articles.map((item) => ({ item_info: item })), cursor: 'mock-end', has_more: false }))
}

function pins(cursor, options) {
  const config = options || {}
  const isHot = config.sort === 'hot'
  const path = isHot ? '/recommend_api/v1/short_msg/hot' : '/recommend_api/v1/short_msg/recommend'
  return withFallback(request(path, {
    id_type: 4,
    sort_type: isHot ? 200 : 300,
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.pins, cursor: 'mock-end', has_more: false }))
}

function topicPins(topicId, cursor, options) {
  const config = options || {}
  return withFallback(request('/recommend_api/v1/short_msg/topic', {
    id_type: 11,
    sort_type: config.sortType || 500,
    topic_id: topicId || '',
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.pins, cursor: 'mock-end', has_more: false }))
}

function selectedPins(cursor) {
  return withFallback(request('/content_api/v1/short_msg/list_by_selected_cursor', {
    page_size: 20,
    cursor: cursor || '0'
  }, {
    header: { 'content-type': 'application/x-www-form-urlencoded' }
  }), { data: [], cursor: '', has_more: false })
}

function recommendedThemes(cursor, limit) {
  return withFallback(request('/tag_api/v1/theme/list_by_hot', {
    cursor: cursor || '0',
    limit: limit || 8
  }), { data: [], cursor: '0', has_more: false })
}

function themeDetail(themeId) {
  return withFallback(request('/tag_api/v1/theme/detail', {
    theme_id: themeId
  }), { data: null })
}

function themePins(themeId, cursor, options) {
  const config = options || {}
  return withFallback(request('/recommend_api/v1/short_msg/theme', {
    theme_id: themeId,
    cursor: cursor || '0',
    limit: config.limit || 20,
    sort_type: config.sortType || 500
  }), { data: [], cursor: '0', has_more: false })
}

function recommendedCollectionSets(cursor, limit, options) {
  const config = options || {}
  const data = {
    cursor: cursor || '0',
    limit: limit || 8
  }
  if (config.moduleType !== undefined) data.module_type = Number(config.moduleType)
  return withFallback(request('/interact_api/v2/collectionset/recommend', data), {
    data: [], cursor: '0', has_more: false
  })
}

function collectionSetDetail(collectionId, cursor) {
  return withFallback(request('/interact_api/v2/collectionset/detail', {
    collection_id: collectionId,
    cursor: cursor || '0',
    limit: 20
  }), { data: null, cursor: '0', has_more: false })
}

function recommendedAuthors(cursor, limit) {
  return withFallback(request('/user_api/v1/author/recommend', {
    cursor: cursor || '0',
    limit: limit || 8,
    need_article: 1
  }, { method: 'GET' }), { data: [], cursor: '0', has_more: false })
}

function recommendedColumns(cursor, limit) {
  return withFallback(request('/content_api/v1/column/recommend', {
    cursor: cursor || '0',
    limit: limit || 8
  }), { data: [], cursor: '0', has_more: false })
}

function columnArticles(columnId, cursor, sortType) {
  if (!columnId) return Promise.resolve({ result: { data: [], cursor: '0', has_more: false }, fromCache: true })
  const normalizedSort = Number(sortType)
  return withFallback(request('/content_api/v1/column/articles_cursor', {
    column_id: String(columnId),
    cursor: cursor || '0',
    limit: 10,
    sort: Number.isFinite(normalizedSort) ? normalizedSort : 2
  }), () => ({ data: mock.articles, cursor: 'mock-end', has_more: false }))
}

function liveTypes() {
  return withFallback(request('/study_api/v1/live/get_activity_types', {}), { data: [] })
}

function liveActivities(cursor, options) {
  const config = options || {}
  const data = {
    cursor: cursor || '0',
    limit: config.limit || 20
  }
  if (config.activityType) data.activity_type = Number(config.activityType)
  if (config.status) data.status = Number(config.status)
  return withFallback(request('/study_api/v1/live/activity_list', data), {
    data: [], cursor: '0', has_more: false
  })
}

function creatorActivities(cursor, options) {
  const config = options || {}
  return withFallback(request('/study_api/v1/events/get_by_cursor', {
    cursor: cursor || '0',
    limit: config.limit || 20,
    type: Number(config.type) || 1,
    status: Number(config.status) || 1,
    cate_id: config.categoryId || '0'
  }), { data: [], cursor: '0', has_more: false })
}

function courses(cursor, options) {
  const config = options || {}
  if (config.courseType === 'byte') {
    return withFallback(request('/booklet_api/v1/bytecourse/list_by_category', {
      category_id: config.categoryId || '0',
      cursor: cursor || '0',
      page_size: 20
    }, { method: 'GET' }), () => ({
      data: mock.byteCourses.filter((item) => {
        if (!config.categoryId) return true
        return (item.categories || []).some((category) => String(category.category_id) === String(config.categoryId))
      }),
      cursor: 'mock-end',
      has_more: false
    }))
  }

  const data = {
    cursor: cursor || '0',
    limit: 20,
    category_id: config.categoryId || '0',
    sort: config.sort === 'hot' ? 7 : 1,
    is_vip: config.onlyVip ? 1 : 0
  }
  return withFallback(request('/booklet_api/v1/booklet/listbycategory', data), () => ({
    data: mock.courses.filter((item) => !config.onlyVip || Boolean((item.base_info || item).can_vip_borrow)),
    cursor: 'mock-end',
    has_more: false
  }))
}

function courseRecommendations(bookletId, cursor) {
  const data = { booklet_id: String(bookletId || '') }
  if (cursor && cursor !== '0') data.cursor = cursor
  return withFallback(request('/booklet_api/v1/booklet/recommend', data), () => ({
    data: mock.courses.filter((item) => String(item.booklet_id || '') !== String(bookletId || '')),
    cursor: 'mock-end',
    has_more: false
  }))
}

function popularizeCourses(cursor, options) {
  return courses(cursor, options).then(({ result, fromCache }) => ({
    result: Object.assign({}, result, {
      data: (result.data || []).filter((item) => {
        const info = item.base_info || item.booklet_info || item
        return Number(info.is_distribution) === 1 || info.is_distribution === true
      })
    }),
    fromCache
  }))
}

function courseDetail(bookletId) {
  return request('/booklet_api/v1/booklet/get', { booklet_id: bookletId })
}

function courseSection(sectionId) {
  return request('/booklet_api/v1/section/get', { section_id: sectionId })
}

function courseComments(bookletId, cursor) {
  return withFallback(request('/interact_api/v1/comment/list', {
    item_id: bookletId,
    item_type: 12,
    sort: 0,
    cursor: cursor || '0',
    limit: 20,
    client_type: 2608
  }), { data: [], cursor: '0', count: 0, has_more: false })
}

function byteCourseDetail(itemId) {
  const local = mock.byteCourseDetails[String(itemId)]
  const fallback = local && local.detail || mock.byteCourses.find((item) => (
    String(item.content && item.content.item_id) === String(itemId)
  )) || null
  return withFallback(request('/booklet_api/v1/bytecourse/get', {
    item_id: itemId,
    item_type: 60
  }, { method: 'GET' }), () => ({ data: fallback }))
}

function byteCourseChapters(itemId) {
  const local = mock.byteCourseDetails[String(itemId)]
  return withFallback(request('/booklet_api/v1/bytecourse/chapter_list', {
    item_id: itemId,
    item_type: 60
  }, { method: 'GET' }), () => ({ data: local ? local.chapters : [] }))
}

function byteCourseRecommendations(itemId) {
  return withFallback(request('/booklet_api/v1/bytecourse/hot_list', {
    item_id: itemId
  }, { method: 'GET' }), () => ({
    data: mock.byteCourses.filter((item) => String(item.content && item.content.item_id) !== String(itemId))
  }))
}

function byteCourseComments(itemId, cursor) {
  return withFallback(request('/interact_api/v1/comment/list', {
    item_id: itemId,
    item_type: 60,
    cursor: cursor || '0',
    limit: 20,
    client_type: 2608
  }), { data: [], cursor: '0', count: 0, has_more: false })
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

function articleRecommendations(articleId, userId, tagIds) {
  return withFallback(request('/recommend_api/v1/article/detail_rela_rec', {
    item_id: articleId,
    user_id: userId || '',
    tag_ids: tagIds || []
  }), { data: [], cursor: '0', has_more: false })
}

function articleFeatured(articleId) {
  return withFallback(request('/recommend_api/v1/article/detail_featured', {
    article_id: articleId
  }), { data: [] })
}

function articleComments(articleId, cursor) {
  return withFallback(request('/interact_api/v1/comment/list', {
    item_id: articleId,
    item_type: 2,
    cursor: cursor || '0',
    limit: 20,
    client_type: 2608
  }), { data: [], cursor: '0', count: 0, has_more: false })
}

function articleCommentReplies(articleId, commentId, cursor) {
  return withFallback(request('/interact_api/v1/reply/list', {
    item_id: articleId,
    item_type: 2,
    comment_id: commentId,
    cursor: cursor || '0',
    limit: 20,
    client_type: 2608
  }), { data: [], cursor: '0', count: 0, has_more: false })
}

function pinDetail(msgId) {
  return withFallback(request('/content_api/v1/short_msg/detail', { msg_id: msgId }), () => ({
    data: mock.pins.find((item) => item.msg_id === msgId) || mock.pins[0]
  }))
}

function pinRecommendations(msgId, cursor) {
  return withFallback(request('/recommend_api/v1/short_msg/detail_rec', {
    msg_id: msgId,
    cursor: cursor || '0',
    limit: 10
  }), { data: [], cursor: '0', has_more: false })
}

function pinComments(msgId, cursor, sort) {
  return withFallback(request('/interact_api/v1/comment/list', {
    item_id: msgId,
    item_type: 4,
    sort: sort === 'latest' ? 0 : 1,
    cursor: cursor || '0',
    limit: 20,
    client_type: 2608
  }), { data: [], cursor: '0', count: 0, has_more: false })
}

function pinCommentReplies(msgId, commentId, cursor) {
  return withFallback(request('/interact_api/v1/reply/list', {
    item_id: msgId,
    item_type: 4,
    comment_id: commentId,
    cursor: cursor || '0',
    limit: 5,
    client_type: 2608
  }), { data: [], cursor: '0', has_more: false })
}

function daily() {
  return withFallback(request('/content_api/v1/article/daily', {}), () => ({ data: mock.daily }))
}

function userArticles(userId, cursor, sortType) {
  if (!userId) return Promise.resolve({ result: { data: [], cursor: '0', has_more: false }, fromCache: true })
  return withFallback(request('/content_api/v1/article/query_list', {
    user_id: String(userId),
    sort_type: Number(sortType) || 2,
    cursor: cursor || '0',
    limit: 10
  }), { data: [], cursor: '0', has_more: false })
}

function userProfile(userId) {
  if (!userId) return Promise.resolve({ result: { data: null }, fromCache: true })
  return withFallback(request('/user_api/v1/user/get', {
    user_id: String(userId),
    need_badge: 1
  }, { method: 'GET', skipDefaultQuery: true }), { data: null })
}

function recommendationRanks() {
  return withFallback(request('/content_api/v1/requests', {
    requests: [
      {
        url: '/content_api/v1/content/list_by_hot',
        param: { type: 'hot', count: 3, item_type: 2 }
      },
      {
        url: '/content_api/v1/author/list_by_hot',
        param: { type: 'hot', count: 3 }
      }
    ]
  }), () => ({ data: [mock.articles.slice(0, 3), mock.authors.slice(0, 3)] }))
}

function hotArticles(options) {
  const config = options || {}
  const data = {
    type: config.type || 'hot',
    count: config.count || 40,
    item_type: 2,
    category_id: config.categoryId || '0'
  }
  if (config.period) data.period = config.period
  return withFallback(request('/content_api/v1/content/list_by_hot', data, { method: 'GET' }), () => ({ data: mock.articles }))
}

function hotAuthors(count) {
  return withFallback(request('/content_api/v1/author/list_by_hot', {
    type: 'hot',
    count: count || 30
  }, { method: 'GET' }), () => ({ data: mock.authors }))
}

function headlineFeed(cursor) {
  return withFallback(request('/content_api/v1/content/list_by_category', {
    item_type: 28,
    page_size: 10,
    category_id: '',
    cursor: cursor || ''
  }), () => ({ data: mock.articles, cursor: 'mock-end', has_more: false }))
}

function followers(userId, cursor) {
  if (!userId) return Promise.resolve({ result: { data: [], cursor: '0', has_more: false }, fromCache: true })
  return withFallback(request('/interact_api/v1/follow/follower_list', {
    user_id: userId,
    cursor: cursor || '0',
    limit: 20
  }), { data: [], cursor: '0', has_more: false })
}

function topics(cursor, limit) {
  return withFallback(request('/tag_api/v1/topic/list_by_rec', {
    cursor: cursor || '0',
    limit: limit || 30
  }), () => ({ data: mock.topics, cursor: 'mock-end', has_more: false }))
}

function topicsByCategory(categoryId, cursor) {
  return withFallback(request('/tag_api/v1/topic/list_by_cate_cursor', {
    cate_id: categoryId,
    cursor: cursor || '0',
    limit: 20
  }), () => ({ data: mock.topics, cursor: 'mock-end', has_more: false }))
}

function searchTopics(keyword, cursor) {
  const query = String(keyword || '').trim()
  if (!query) return topics(cursor, 20)
  return withFallback(request('/tag_api/v1/topic/list_by_search_cursor', {
    keyword: query,
    cursor: cursor || '0',
    limit: 20
  }), () => ({
    data: mock.topics.filter((item) => {
      const topic = item.topic || item
      return `${topic.title || ''}${topic.description || ''}`.indexOf(query) !== -1
    }),
    cursor: 'mock-end',
    has_more: false
  }))
}

function search(keyword, type, cursor, options) {
  const query = String(keyword || '').trim()
  const kind = type || 'all'
  const config = options || {}
  const idTypes = { all: 0, article: 2, course: 12, tag: 9, user: 1 }
  if (!query) return Promise.resolve({ result: { data: [], cursor: '0', has_more: false }, fromCache: true })
  return withFallback(request('/search_api/v1/search', {
    key_word: query,
    id_type: idTypes[kind] === undefined ? 0 : idTypes[kind],
    cursor: cursor || '0',
    limit: 20,
    version: 1,
    search_type: Number(config.searchType) || 0,
    sort_type: Number(config.sortType) || 0
  }), () => ({
    data: mock.search(query, kind),
    cursor: 'mock-end',
    has_more: false
  }))
}

module.exports = {
  request,
  homeFeed,
  categoryFeed,
  categoryTagFeed,
  pins,
  topicPins,
  selectedPins,
  recommendedThemes,
  themeDetail,
  themePins,
  recommendedCollectionSets,
  collectionSetDetail,
  recommendedAuthors,
  recommendedColumns,
  columnArticles,
  liveTypes,
  liveActivities,
  creatorActivities,
  courses,
  courseRecommendations,
  popularizeCourses,
  courseDetail,
  courseSection,
  courseComments,
  byteCourseDetail,
  byteCourseChapters,
  byteCourseRecommendations,
  byteCourseComments,
  courseShelf,
  articleDetail,
  articleRecommendations,
  articleFeatured,
  articleComments,
  articleCommentReplies,
  pinDetail,
  pinRecommendations,
  pinComments,
  pinCommentReplies,
  daily,
  userArticles,
  userProfile,
  recommendationRanks,
  hotArticles,
  hotAuthors,
  headlineFeed,
  followers,
  topics,
  topicsByCategory,
  searchTopics,
  search
}
