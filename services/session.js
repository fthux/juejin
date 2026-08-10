const KEYS = {
  collections: 'jj:collections',
  likes: 'jj:likes',
  follows: 'jj:follows',
  history: 'jj:history',
  drafts: 'jj:drafts',
  articles: 'jj:local-articles',
  pins: 'jj:local-pins',
  notes: 'jj:notes',
  notifications: 'jj:notifications',
  registrations: 'jj:registrations',
  comments: 'jj:comments',
  signDays: 'jj:sign-days',
  articleCache: 'jj:article-cache'
}

function ensureLocalData() {
  wx.removeStorageSync('jj:session')
  wx.removeStorageSync('jj:passport-cookies')
}

function getSession() {
  return null
}

function requireLogin() {
  wx.navigateTo({ url: '/features/login/login' })
  return false
}

function requirePage() {
  wx.redirectTo({ url: '/features/login/login' })
  return false
}

function getList(name) {
  return wx.getStorageSync(KEYS[name]) || []
}

function setList(name, list) {
  wx.setStorageSync(KEYS[name], list)
  return list
}

function toggle() {
  requireLogin()
  return null
}

function addHistory(article) {
  const list = getList('history').filter((item) => item.article_id !== article.article_id)
  list.unshift(Object.assign({}, article, { readAt: Date.now() }))
  setList('history', list.slice(0, 100))
}

function cacheArticle(article) {
  if (!article || !article.article_id) return
  const cache = wx.getStorageSync(KEYS.articleCache) || {}
  cache[article.article_id] = article
  const ids = Object.keys(cache)
  if (ids.length > 100) delete cache[ids[0]]
  wx.setStorageSync(KEYS.articleCache, cache)
}

function getCachedArticle(articleId) {
  const cache = wx.getStorageSync(KEYS.articleCache) || {}
  return cache[articleId] || null
}

function getCachedArticles() {
  const cache = wx.getStorageSync(KEYS.articleCache) || {}
  return Object.keys(cache).map((id) => cache[id])
}

function accountOnlyError() {
  throw new Error('小程序版不提供账号登录，请使用稀土掘金官方 App 或网站')
}

function saveDraft() { return accountOnlyError() }
function publishPin() { return accountOnlyError() }
function publishArticle() { return accountOnlyError() }
function saveNote() { return accountOnlyError() }
function signIn() { return accountOnlyError() }
function toggleRegistration() { return accountOnlyError() }
function addComment() { return accountOnlyError() }

function getComments(kind, targetId) {
  return getList('comments').filter((item) => item.kind === kind && item.targetId === String(targetId))
}

function clearCache() {
  wx.removeStorageSync(KEYS.articleCache)
  wx.removeStorageSync('jj:course-cache')
  wx.removeStorageSync('jj:course-history')
}

module.exports = {
  KEYS,
  ensureLocalData,
  getSession,
  requireLogin,
  requirePage,
  getList,
  setList,
  toggle,
  addHistory,
  cacheArticle,
  getCachedArticle,
  getCachedArticles,
  saveDraft,
  publishPin,
  publishArticle,
  saveNote,
  signIn,
  toggleRegistration,
  getComments,
  addComment,
  clearCache
}
