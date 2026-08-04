const utils = require('../utils/utils.js')
const passport = require('./passport.js')

const KEYS = {
  session: 'jj:session',
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
  getSession()
}

function getSession() {
  const value = wx.getStorageSync(KEYS.session) || null
  if (value && value.mode === 'juejin' && value.user && value.user.user_id) return value
  if (value) wx.removeStorageSync(KEYS.session)
  return null
}

function loginWithSms(mobile, code) {
  return passport.login(mobile, code).then((user) => {
    const session = {
      mode: 'juejin',
      user,
      createdAt: Date.now()
    }
    wx.setStorageSync(KEYS.session, session)
    return session
  })
}

function logout() {
  wx.removeStorageSync(KEYS.session)
  return passport.logout()
}

function refresh() {
  const current = getSession()
  if (!current) return Promise.resolve(null)
  return passport.validateSession().then((user) => {
    const next = Object.assign({}, current, { user, refreshedAt: Date.now() })
    wx.setStorageSync(KEYS.session, next)
    return next
  }).catch(() => {
    wx.removeStorageSync(KEYS.session)
    passport.clearCookies()
    return null
  })
}

function requireLogin() {
  if (getSession()) return true
  wx.navigateTo({ url: '/pages/login/login' })
  return false
}

function requirePage(target) {
  if (getSession()) return true
  const redirect = /^\/pages\/[A-Za-z0-9_/-]+(?:\?.*)?$/.test(target || '') ? target : '/pages/my/my'
  wx.redirectTo({ url: `/pages/login/login?redirect=${encodeURIComponent(redirect)}` })
  return false
}

function getList(name) {
  return wx.getStorageSync(KEYS[name]) || []
}

function setList(name, list) {
  wx.setStorageSync(KEYS[name], list)
  return list
}

function toggle(name, id) {
  if (!getSession()) return null
  const list = getList(name)
  const index = list.indexOf(id)
  if (index === -1) list.unshift(id)
  else list.splice(index, 1)
  setList(name, list)
  return index === -1
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

function saveDraft(draft) {
  if (!getSession()) throw new Error('请先登录')
  const list = getList('drafts')
  const item = Object.assign({ id: `draft-${Date.now()}`, updatedAt: Date.now() }, draft)
  const index = list.findIndex((current) => current.id === item.id)
  if (index === -1) list.unshift(item)
  else list[index] = item
  setList('drafts', list)
  return item
}

function publishPin(pin) {
  const list = getList('pins')
  const session = getSession()
  if (!session) throw new Error('请先登录')
  const item = {
    msg_id: `local-${Date.now()}`,
    msg_Info: {
      content: pin.content,
      pic_list: pin.pic_list || [],
      ctime: Math.floor(Date.now() / 1000)
    },
    author_user_info: session.user,
    digg_count: 0,
    comment_count: 0,
    local: true
  }
  list.unshift(item)
  setList('pins', list)
  return item
}

function publishArticle(article) {
  const list = getList('articles')
  const currentSession = getSession()
  if (!currentSession) throw new Error('请先登录')
  const item = {
    article_id: `local-article-${Date.now()}`,
    title: article.title,
    brief_content: article.content.slice(0, 88),
    content: article.content,
    author_user_info: currentSession.user,
    tags: (article.tags || []).map((name) => ({ tag_name: name })),
    ctime: Math.floor(Date.now() / 1000),
    digg_count: 0,
    comment_count: 0,
    view_count: 1,
    collect_count: 0,
    local: true
  }
  list.unshift(item)
  setList('articles', list)
  return item
}

function saveNote(note) {
  if (!getSession()) throw new Error('请先登录')
  const list = getList('notes')
  const item = Object.assign({ id: `note-${Date.now()}`, updatedAt: Date.now(), favorite: false }, note)
  const index = list.findIndex((current) => current.id === item.id)
  if (index === -1) list.unshift(item)
  else list[index] = item
  setList('notes', list)
  return item
}

function signIn() {
  if (!getSession()) throw new Error('请先登录')
  const today = utils.dateKey()
  const list = getList('signDays')
  if (list.indexOf(today) === -1) {
    list.push(today)
    setList('signDays', list)
  }
  return { signed: true, days: list.length, today }
}

function toggleRegistration(activity) {
  if (!getSession()) throw new Error('请先登录')
  const list = getList('registrations')
  const index = list.findIndex((item) => item.id === activity.id)
  if (index === -1) {
    list.unshift(Object.assign({}, activity, { registeredAt: Date.now() }))
    setList('registrations', list)
    return true
  }
  list.splice(index, 1)
  setList('registrations', list)
  return false
}

function getComments(kind, targetId) {
  return getList('comments').filter((item) => item.kind === kind && item.targetId === String(targetId))
}

function addComment(kind, targetId, content) {
  const current = getSession()
  if (!current) throw new Error('请先登录')
  const list = getList('comments')
  const item = {
    id: `comment-${Date.now()}`,
    kind,
    targetId: String(targetId),
    content: String(content || '').trim(),
    user: current.user.user_name,
    avatar: current.user.avatar_large || '/assets/app/common/default_avatar.webp',
    time: '刚刚',
    createdAt: Date.now()
  }
  if (!item.content) throw new Error('请输入评论内容')
  list.unshift(item)
  setList('comments', list.slice(0, 300))
  return item
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
  loginWithSms,
  logout,
  refresh,
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
