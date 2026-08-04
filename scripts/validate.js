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

const runtimeFiles = ['app.js', 'services/api.js', 'services/passport.js', 'services/session.js', 'utils/chart.js', 'utils/md5.js', 'utils/markdown.js', 'utils/utils.js', 'data/mockData.js']
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
  'pages/level/level',
  'pages/notes/notes',
  'pages/notifications/notifications',
  'pages/publish/publish',
  'pages/readHistory/readHistory',
  'pages/registrations/registrations',
  'pages/sign/sign',
  'pages/tags/tags'
]

for (const page of privatePages) {
  if (!pageSet.has(page)) fail(`账号页面未注册: ${page}`)
  if (!read(`${page}.js`).includes('session.requirePage(')) fail(`账号页面缺少深链登录保护: ${page}`)
}

const loginSource = read('pages/login/login.js')
const loginCodeSource = read('pages/loginCode/loginCode.js')
if (!loginSource.includes('/pages/loginCode/loginCode?')) fail('手机号登录第一步必须跳转到验证码页面')
if (!loginSource.includes('passport.sendCode(') || !loginSource.includes("'sent=1'")) fail('手机号页按钮必须先发送验证码再跳转')
if (!loginCodeSource.includes('this.sendCode()')) fail('验证码页面必须在加载时自动发送验证码')
if (!loginCodeSource.includes("query.sent === '1'")) fail('验证码页面必须避免重复发送验证码')
if (!/code\.length\s*===\s*6/.test(loginCodeSource) || !loginCodeSource.includes('this.login()')) {
  fail('验证码输入满六位后必须自动登录')
}
if (!loginSource.includes('redirect') || !loginCodeSource.includes('redirect')) fail('登录两步必须保留深链跳转参数')
if (/需要安全验证|滑块验证/.test(loginCodeSource)) fail('短信登录不得出现滑块安全验证分支')

const md5 = require(path.join(root, 'utils/md5.js'))
if (md5('') !== 'd41d8cd98f00b204e9800998ecf8427e') fail('MD5 空字符串向量校验失败')
if (md5('abc') !== '900150983cd24fb0d6963f7d28e17f72') fail('MD5 abc 向量校验失败')

const passport = require(path.join(root, 'services/passport.js'))
const mixed = passport.mixFields({ mobile: '13800138000', type: 24 }, ['mobile', 'type'])
if (mixed.mobile === '13800138000' || mixed.type === 24 || mixed.mix_mode !== 1 || mixed.fixed_mix_mode !== 1) {
  fail('掘金 Passport 字段混淆校验失败')
}

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

console.log(`Validated ${app.pages.length} pages, ${componentRoots.length} components, navigation, local assets and API boundaries.`)
