const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const fail = (message) => {
  throw new Error(message)
}

const app = JSON.parse(read('app.json'))
const project = JSON.parse(read('project.config.json'))
const pageSet = new Set(app.pages)
const componentRoots = Object.values(app.usingComponents || {}).map((value) => value.replace(/^\//, ''))
const roots = app.pages.concat(componentRoots)

if (app.pages[0] !== 'pages/index/index') fail('首页必须是首个注册页面')
if (app.pages.length !== pageSet.size) fail('app.json 中存在重复页面')

const ignoredFolders = new Set((project.packOptions && project.packOptions.ignore || [])
  .filter((item) => item.type === 'folder')
  .map((item) => item.value.replace(/\/$/, '')))
for (const page of app.pages) {
  const folder = page.replace(/\/[^/]+$/, '')
  if (ignoredFolders.has(folder)) fail(`注册页面被项目配置排除: ${page}`)
}

for (const base of roots) {
  for (const extension of ['js', 'json', 'wxml', 'wxss']) {
    const file = `${base}.${extension}`
    if (!exists(file)) fail(`缺少文件: ${file}`)
    if (extension === 'json') JSON.parse(read(file))
    if (extension === 'js') new Function(read(file))
  }

  const source = read(`${base}.js`)
  const template = read(`${base}.wxml`)
  const bindings = [...template.matchAll(/(?:bind|catch)(?::|tap|input|confirm|change|submit|longpress|touchstart|touchend|scrolltolower|scroll)(?:[a-z:]*)="([A-Za-z_$][\w$]*)"/g)]
  for (const name of new Set(bindings.map((match) => match[1]))) {
    if (!new RegExp(`\\b${name}\\s*\\(`).test(source)) fail(`${base}.wxml 绑定了不存在的处理函数: ${name}`)
  }
}

const runtimeFiles = ['app.js', 'services/api.js', 'services/session.js', 'utils/chart.js', 'utils/markdown.js', 'utils/utils.js', 'data/mockData.js']
  .concat(app.pages.map((page) => `${page}.js`))
  .concat(componentRoots.map((component) => `${component}.js`))

const unsupportedApis = /wx\.(?:requestPayment|requestSubscribeMessage|login|getUserProfile|downloadFile|saveFile|chooseImage|chooseMedia|chooseVideo|startRecord|authorize)\b/

for (const file of runtimeFiles) {
  const source = read(file)
  new Function(source)
  if (source.includes('juejin.im')) fail(`注册代码仍包含旧域名: ${file}`)
  if (/requestPayment|pay_api|payRequest/i.test(source)) fail(`注册代码包含支付调用: ${file}`)
  if (unsupportedApis.test(source)) fail(`注册代码包含需求范围外的小程序能力: ${file}`)

  for (const match of source.matchAll(/["'`]\/((?:pages)\/[^?"'`$]+)(?:\?[^"'`]*)?["'`]/g)) {
    const target = match[1]
    if (!pageSet.has(target)) fail(`${file} 跳转到未注册页面: ${target}`)
  }
}

const privatePages = [
  'pages/chat/chat',
  'pages/collectionSet/collectionSet',
  'pages/courseCenter/courseCenter',
  'pages/creator/creator',
  'pages/creatorActivities/creatorActivities',
  'pages/creatorData/creatorData',
  'pages/creatorFans/creatorFans',
  'pages/drafts/drafts',
  'pages/dislike/dislike',
  'pages/level/level',
  'pages/notes/notes',
  'pages/notifications/notifications',
  'pages/lottery/lottery',
  'pages/welfare/welfare',
  'pages/popularize/popularize',
  'pages/coupon/coupon',
  'pages/personalInfo/personalInfo',
  'pages/publish/publish',
  'pages/readHistory/readHistory',
  'pages/registrations/registrations',
  'pages/sign/sign'
]

for (const page of privatePages) {
  if (!pageSet.has(page)) fail(`账号页面未注册: ${page}`)
  if (!read(`${page}.js`).includes('session.requirePage(')) fail(`账号页面缺少深链登录保护: ${page}`)
}

const loginSource = read('pages/login/login.js')
const loginTemplate = read('pages/login/login.wxml')
if (pageSet.has('pages/loginCode/loginCode')) fail('小程序不得注册验证码登录页')
if (exists('services/passport.js')) fail('小程序不得包含 Passport 登录实现')
if (/<input|password=|sendCode|loginWith/.test(loginTemplate)) fail('账号说明页不得包含登录表单')
if (!loginTemplate.includes('小程序版不提供账号登录') || !loginTemplate.includes('稀土掘金官方 App')) fail('账号说明页缺少安全提示')
if (!loginSource.includes('https://juejin.cn/')) fail('账号说明页必须提供官方站点地址')

for (const base of roots) {
  const sources = [read(`${base}.js`), read(`${base}.wxml`), read(`${base}.wxss`)]
  for (const source of sources) {
    for (const match of source.matchAll(/\/assets\/[A-Za-z0-9_./-]+/g)) {
      const asset = match[0].replace(/^\//, '')
      if (!exists(asset)) fail(`${base} 引用了不存在的本地资源: ${asset}`)
    }
  }
}

for (const item of app.tabBar.list) {
  if (!pageSet.has(item.pagePath)) fail(`TabBar 页面未注册: ${item.pagePath}`)
  for (const key of ['iconPath', 'selectedIconPath']) {
    const file = item[key]
    if (!file.endsWith('.png')) fail(`TabBar 图标必须使用 PNG: ${file}`)
    if (!exists(file)) fail(`TabBar 图标不存在: ${file}`)
    if (fs.statSync(path.join(root, file)).size > 40 * 1024) fail(`TabBar 图标超过 40KB: ${file}`)
  }
}

const markdown = require(path.join(root, 'utils/markdown.js'))
const signedImage = 'https://p3.example.com/image.webp?rk3s=test&x-expires=1&x-signature=test'
const renderedImage = markdown.toHtml(`![](${signedImage})`)
if (!renderedImage.includes(`src="${signedImage}"`)) fail('Markdown 图片签名参数被 HTML 实体破坏')
if (markdown.normalizeImageSources('<p>&amp;</p>').includes('<p>&</p>')) fail('图片 URL 修复不应改动正文实体')

console.log(`Validated ${app.pages.length} pages, ${componentRoots.length} components, navigation, local assets and API boundaries.`)
