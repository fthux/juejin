const utils = require('../utils/utils.js')
const mock = require('../data/mockData.js')

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
  signDays: 'jj:sign-days'
}

function ensureLocalData() {
  if (!wx.getStorageSync(KEYS.notifications)) {
    wx.setStorageSync(KEYS.notifications, mock.notifications)
  }
  if (!wx.getStorageSync(KEYS.drafts)) {
    wx.setStorageSync(KEYS.drafts, mock.drafts)
  }
}

function getSession() {
  return wx.getStorageSync(KEYS.session) || null
}

function login(profile) {
  const session = {
    mode: 'local',
    user: Object.assign({}, mock.localUser, profile || {}),
    createdAt: Date.now()
  }
  wx.setStorageSync(KEYS.session, session)
  return session
}

function logout() {
  wx.removeStorageSync(KEYS.session)
}

function getList(name) {
  return wx.getStorageSync(KEYS[name]) || []
}

function setList(name, list) {
  wx.setStorageSync(KEYS[name], list)
  return list
}

function toggle(name, id) {
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

function saveDraft(draft) {
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
  const session = getSession() || login()
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
  const currentSession = getSession() || login()
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
  const list = getList('notes')
  const item = Object.assign({ id: `note-${Date.now()}`, updatedAt: Date.now(), favorite: false }, note)
  const index = list.findIndex((current) => current.id === item.id)
  if (index === -1) list.unshift(item)
  else list[index] = item
  setList('notes', list)
  return item
}

function signIn() {
  const today = utils.dateKey()
  const list = getList('signDays')
  if (list.indexOf(today) === -1) {
    list.push(today)
    setList('signDays', list)
  }
  return { signed: true, days: list.length, today }
}

module.exports = {
  KEYS,
  ensureLocalData,
  getSession,
  login,
  logout,
  getList,
  setList,
  toggle,
  addHistory,
  saveDraft,
  publishPin,
  publishArticle,
  saveNote,
  signIn
}
