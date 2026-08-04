const md5 = require('../utils/md5.js')
const utils = require('../utils/utils.js')

const BASE_URL = 'https://api.juejin.cn'
const APP_KEY = 'a5de4d5c610765ca17f7deb87db5959b'
const COOKIE_KEY = 'jj:passport-cookies'
const SDK_VERSION = '2.2.6'

function obfuscate(value) {
  const text = unescape(encodeURIComponent(String(value)))
  let output = ''
  for (let index = 0; index < text.length; index += 1) output += (text.charCodeAt(index) ^ 5).toString(16)
  return output
}

function mixFields(data, fields) {
  const mixed = Object.assign({ mix_mode: 0 }, data)
  let enabled = 0
  fields.forEach((field) => {
    if (typeof mixed[field] === 'undefined') return
    mixed[field] = obfuscate(mixed[field])
    enabled = 1
  })
  mixed.mix_mode = enabled
  mixed.fixed_mix_mode = enabled
  return mixed
}

function sortedValues(data, limit) {
  const keys = Object.keys(data || {}).sort()
  if (typeof limit === 'number' && limit >= 0) keys.splice(limit)
  return {
    keys,
    text: keys.map((key) => `${key}=${typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]}`).join('&')
  }
}

function sign(query, body) {
  const queryValues = sortedValues(query, 10)
  const bodyValues = sortedValues(body)
  return {
    sign: md5(`${queryValues.text}&${bodyValues.text}&app_key=${APP_KEY}`),
    qs: obfuscate(queryValues.keys.join(','))
  }
}

function encodeForm(data) {
  return Object.keys(data || {}).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`).join('&')
}

function getCookieMap() {
  return wx.getStorageSync(COOKIE_KEY) || {}
}

function getCookieHeader() {
  const cookies = getCookieMap()
  return Object.keys(cookies).map((name) => `${name}=${cookies[name]}`).join('; ')
}

function getAuthHeaders() {
  const cookies = getCookieMap()
  const cookie = getCookieHeader()
  const headers = {}
  if (cookie) headers.Cookie = cookie
  const csrf = cookies.passport_csrf_token || cookies.passport_csrf_token_default
  if (csrf) headers['x-tt-passport-csrf-token'] = csrf
  return headers
}

function splitCookies(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value).split(/,(?=\s*[^;,=\s]+=[^;,]*)/)
}

function captureCookies(response) {
  const headers = response.header || {}
  const values = (response.cookies || []).concat(splitCookies(headers['Set-Cookie'] || headers['set-cookie']))
  if (!values.length) return
  const cookies = getCookieMap()
  values.forEach((value) => {
    const pair = String(value).split(';')[0]
    const divider = pair.indexOf('=')
    if (divider <= 0) return
    const name = pair.slice(0, divider).trim()
    const cookieValue = pair.slice(divider + 1).trim()
    if (cookieValue) cookies[name] = cookieValue
    else delete cookies[name]
  })
  wx.setStorageSync(COOKIE_KEY, cookies)
}

function clearCookies() {
  wx.removeStorageSync(COOKIE_KEY)
}

function makeError(body, statusCode) {
  const data = (body && body.data) || {}
  const error = new Error(data.description || (body && body.message) || `请求失败 (${statusCode})`)
  error.code = Number(data.error_code) || statusCode
  error.captcha = data.captcha || ''
  error.descUrl = data.desc_url || ''
  return error
}

function request(path, options) {
  const config = options || {}
  const method = config.method || 'GET'
  const fp = `verify_${utils.getUuid()}`
  const query = Object.assign({
    aid: 2608,
    account_sdk_source: 'web',
    sdk_version: SDK_VERSION,
    verifyFp: fp,
    fp
  }, config.query || {})
  const body = config.data || {}
  Object.assign(query, sign(query, method === 'POST' ? body : {}))
  const queryString = encodeForm(query)
  const headers = Object.assign({
    Accept: 'application/json, text/javascript',
    'content-type': method === 'POST' ? 'application/x-www-form-urlencoded' : 'application/json'
  }, getAuthHeaders(), config.header || {})

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}?${queryString}`,
      method,
      data: method === 'POST' ? encodeForm(body) : {},
      header: headers,
      timeout: 15000,
      success(response) {
        captureCookies(response)
        const result = response.data || {}
        if (response.statusCode >= 200 && response.statusCode < 300 && result.message === 'success') {
          resolve(result.data || {})
          return
        }
        reject(makeError(result, response.statusCode))
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络连接失败'))
      }
    })
  })
}

function requestJuejin(path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}?aid=2608&spider=0&uuid=${utils.getUuid()}`,
      method: 'POST',
      data: data || {},
      header: Object.assign({ 'content-type': 'application/json' }, getAuthHeaders()),
      timeout: 15000,
      success(response) {
        captureCookies(response)
        const body = response.data || {}
        if (response.statusCode >= 200 && response.statusCode < 300 && body.err_no === 0) {
          resolve(body.data || {})
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

function sendCode(mobile) {
  return request('/passport/web/send_code/', {
    method: 'POST',
    data: mixFields({ mobile, type: 24 }, ['mobile', 'type'])
  })
}

function normalizeUser(account, profile) {
  const source = Object.assign({}, account || {}, profile || {})
  const growth = source.user_growth_info || {}
  return {
    user_id: String(source.user_id || source.uid || ''),
    user_name: source.user_name || source.name || source.screen_name || '掘金用户',
    avatar_large: source.avatar_large || source.avatar_url || source.avatar || '/assets/app/common/default_avatar.webp',
    job_title: source.job_title || '',
    company: source.company || '',
    description: source.description || source.user_description || '',
    level: Number(source.level || growth.jpower_level) || 0,
    follower_count: Number(source.follower_count) || 0,
    followee_count: Number(source.followee_count) || 0,
    power: Number(source.power || growth.jpower) || 0,
    next_level_power: Number(growth.jpower_next || growth.jpower_upper || source.next_level_power) || 0,
    post_article_count: Number(source.post_article_count) || 0,
    post_column_count: Number(source.post_column_count) || 0,
    post_shortmsg_count: Number(source.post_shortmsg_count) || 0,
    got_digg_count: Number(source.got_digg_count) || 0,
    got_view_count: Number(source.got_view_count) || 0,
    got_collect_count: Number(source.got_collect_count) || 0,
    active_follower_count: Number(source.active_follower_count) || 0,
    new_follower_count: Number(source.new_follower_count) || 0
  }
}

function login(mobile, code) {
  return request('/passport/web/sms_login/', {
    method: 'POST',
    data: mixFields({ mobile, code }, ['mobile', 'code'])
  }).then((loginData) => request('/passport/account/info/v2/').catch(() => loginData))
    .then((account) => {
      const userId = String(account.user_id || account.uid || '')
      if (!userId) throw new Error('登录成功但未获取到账号信息')
      return requestJuejin('/user_api/v1/user/get', { user_id: userId }).catch(() => null)
        .then((profile) => normalizeUser(account, profile))
    })
}

function validateSession() {
  return request('/passport/account/info/v2/').then((account) => {
    const userId = String(account.user_id || account.uid || '')
    if (!userId) throw new Error('会话已失效')
    return requestJuejin('/user_api/v1/user/get', { user_id: userId }).catch(() => null)
      .then((profile) => normalizeUser(account, profile))
  })
}

function logout() {
  return request('/passport/web/logout/', { query: { need_redirect: 0, next: '/' } }).catch(() => null).then(() => clearCookies())
}

module.exports = {
  COOKIE_KEY,
  sendCode,
  login,
  logout,
  validateSession,
  getAuthHeaders,
  captureCookies,
  clearCookies,
  obfuscate,
  mixFields,
  sign
}
