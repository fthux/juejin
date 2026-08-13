const assert = require('assert')
const path = require('path')

const root = path.resolve(__dirname, '..')
const indexPath = path.join(root, 'pages/index/index.js')
const api = require(path.join(root, 'services/api.js'))
const realHomeFeed = api.homeFeed
const realCategoryFeed = api.categoryFeed
const realCategoryTagFeed = api.categoryTagFeed
const storage = {}
const app = { globalData: { foregroundSequence: 1 } }
let pageDefinition
let stopPullDownCount = 0
let toastCount = 0

global.wx = {
  getStorageSync(key) { return storage[key] === undefined ? '' : storage[key] },
  setStorageSync(key, value) { storage[key] = value },
  removeStorageSync(key) { delete storage[key] },
  getAppBaseInfo() { return { theme: 'light' } },
  getSystemInfoSync() { return { theme: 'light' } },
  setNavigationBarColor() {},
  setBackgroundColor() {},
  stopPullDownRefresh() { stopPullDownCount += 1 },
  showToast() { toastCount += 1 }
}
global.getApp = () => app
global.getCurrentPages = () => []
global.Page = (definition) => { pageDefinition = definition }

function article(id) {
  return {
    item_type: 2,
    item_info: {
      article_id: String(id),
      article_info: { article_id: String(id), title: `article-${id}` },
      author_user_info: { user_id: `author-${id}`, user_name: `author-${id}` }
    }
  }
}

function response(ids, cursor, hasMore) {
  return Promise.resolve({
    result: { data: ids.map(article), cursor, has_more: hasMore },
    fromCache: false
  })
}

function createPage() {
  const page = Object.assign({}, pageDefinition)
  page.data = JSON.parse(JSON.stringify(pageDefinition.data))
  page.setData = function setData(patch) { Object.assign(this.data, patch) }
  page.getTabBar = () => null
  page.feedRequestId = 0
  page.displayedArticleIds = new Set()
  page.lastForegroundSequence = app.globalData.foregroundSequence
  return page
}

async function run() {
  storage['jj:uuid'] = 'home-feed-test-uuid'
  const requestBodies = []
  wx.request = (options) => {
    requestBodies.push({ url: options.url, data: options.data })
    options.success({ statusCode: 200, data: { err_no: 0, data: [], cursor: 'next', has_more: true } })
  }
  const refreshResult = await realHomeFeed('stale-cursor', { sortType: 200, reload: true })
  await realHomeFeed('server-cursor', { sortType: 200, reload: false })
  await realCategoryFeed('6809637767543259144', 'stale-cursor', { reload: true })
  await realCategoryTagFeed('6809637767543259144', '6809640407484334093', 'stale-cursor', { reload: true })
  assert.strictEqual(refreshResult.fromCache, false)
  assert.strictEqual(Object.prototype.hasOwnProperty.call(requestBodies[0].data, 'cursor'), false, 'refresh must omit cursor')
  assert.strictEqual(requestBodies[1].data.cursor, 'server-cursor', 'pagination must send the response cursor')
  assert.strictEqual(Object.prototype.hasOwnProperty.call(requestBodies[2].data, 'cursor'), false, 'category refresh must omit cursor')
  assert.strictEqual(Object.prototype.hasOwnProperty.call(requestBodies[3].data, 'cursor'), false, 'category tag refresh must omit cursor')
  assert.strictEqual(requestBodies[2].data.cate_id, '6809637767543259144')
  assert.strictEqual(requestBodies[3].data.tag_id, '6809640407484334093')
  assert(requestBodies[0].url.includes('aid=2608') && requestBodies[0].url.includes('uuid=home-feed-test-uuid'))

  wx.request = (options) => {
    options.success({ statusCode: 500, data: { err_no: 1, err_msg: 'network failed' } })
  }
  await assert.rejects(() => realHomeFeed('0', { reload: true }), /network failed/)
  await assert.rejects(() => realCategoryFeed('6809637767543259144', '0', { reload: true }), /network failed/)
  await assert.rejects(() => realCategoryTagFeed('6809637767543259144', '6809640407484334093', '0', { reload: true }), /network failed/)

  require(indexPath)
  assert(pageDefinition, 'homepage Page definition was not registered')
  api.recommendationRanks = () => response([], '0', false)

  const page = createPage()
  let requests = []
  api.homeFeed = (cursor, options) => {
    requests.push({ cursor, reload: Boolean(options.reload) })
    return response(['a', 'b'], 'cursor-1', true)
  }
  await page.loadArticleFeed(true)
  assert.deepStrictEqual(page.data.list.map((item) => item.article_id), ['a', 'b'])
  assert.deepStrictEqual(requests, [{ cursor: '0', reload: true }])

  requests = []
  api.homeFeed = (cursor, options) => {
    requests.push({ cursor, reload: Boolean(options.reload) })
    if (options.reload) return response(['a', 'b'], 'cursor-1', true)
    return response(['c', 'd'], 'cursor-2', true)
  }
  await page.onPullDownRefresh()
  assert.deepStrictEqual(page.data.list.map((item) => item.article_id), ['c', 'd'])
  assert.deepStrictEqual(requests, [
    { cursor: '0', reload: true },
    { cursor: 'cursor-1', reload: false }
  ])
  assert.strictEqual(page.data.cursor, 'cursor-2')

  requests = []
  api.homeFeed = (cursor, options) => {
    requests.push({ cursor, reload: Boolean(options.reload) })
    return response(['d', 'e'], 'cursor-3', true)
  }
  await page.loadArticleFeed(false)
  assert.deepStrictEqual(page.data.list.map((item) => item.article_id), ['c', 'd', 'e'])
  assert.strictEqual(requests[0].cursor, 'cursor-2')

  const resumedPage = createPage()
  requests = []
  api.homeFeed = (cursor, options) => {
    requests.push({ cursor, reload: Boolean(options.reload) })
    if (options.reload) return response(['a', 'b'], 'cursor-1', true)
    if (cursor === 'cursor-3') return response(['f', 'g'], 'cursor-4', true)
    return response(['c', 'd'], 'cursor-2', true)
  }
  await resumedPage.loadArticleFeed(true)
  assert.deepStrictEqual(resumedPage.data.list.map((item) => item.article_id), ['f', 'g'])
  assert.deepStrictEqual(requests, [
    { cursor: '0', reload: true },
    { cursor: 'cursor-3', reload: false }
  ])

  const beforeFailure = resumedPage.data.list.map((item) => item.article_id)
  api.homeFeed = () => Promise.reject(new Error('network failed'))
  await resumedPage.onPullDownRefresh()
  assert.deepStrictEqual(resumedPage.data.list.map((item) => item.article_id), beforeFailure)
  assert.strictEqual(resumedPage.data.loadError, true)
  assert.strictEqual(toastCount, 1)

  let refreshCount = 0
  resumedPage.loadCurrent = () => { refreshCount += 1; return Promise.resolve() }
  await resumedPage.onShow()
  assert.strictEqual(refreshCount, 0, 'ordinary page return must not refresh')
  app.globalData.foregroundSequence += 1
  await resumedPage.onShow()
  assert.strictEqual(refreshCount, 1, 'foreground resume must refresh once')
  await resumedPage.onShow()
  assert.strictEqual(refreshCount, 1, 'same foreground cycle must not refresh twice')

  assert(stopPullDownCount >= 5, 'every completed feed request must stop pull-down refresh')
  process.stdout.write('Home feed behavior checks passed.\n')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
