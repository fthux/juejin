const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const fail = (message) => {
  throw new Error(message)
}
const collectFiles = (directory) => {
  const absolute = path.join(root, directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.DS_Store') return []
    const relative = path.join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(relative) : [relative]
  })
}

const app = JSON.parse(read('app.json'))
const project = JSON.parse(read('project.config.json'))
const subPackagePages = (app.subPackages || []).flatMap((pack) =>
  pack.pages.map((page) => `${pack.root.replace(/\/$/, '')}/${page}`)
)
const allPages = app.pages.concat(subPackagePages)
const pageSet = new Set(allPages)
const mainPageSet = new Set(app.pages)
const componentRoots = Object.values(app.usingComponents || {}).map((value) => value.replace(/^\//, ''))
const roots = allPages.concat(componentRoots)

if (app.pages[0] !== 'pages/disclaimer/disclaimer') fail('非官方声明页必须是首个注册页面')
if (app.pages[1] !== 'pages/launch/launch') fail('声明页之后必须是启动页')
if (app.pages[2] !== 'pages/index/index') fail('启动页之后必须是首页')
if (allPages.length !== pageSet.size) fail('app.json 中存在重复页面')
if (!(app.subPackages || []).some((pack) => pack.root === 'features')) fail('功能页面必须放入 features 分包')
if (app.lazyCodeLoading !== 'requiredComponents') fail('组件按需注入未启用')
if (!app.darkmode || app.themeLocation !== 'theme.json') fail('小程序必须启用系统深浅色主题配置')

const ignoredFolders = new Set((project.packOptions && project.packOptions.ignore || [])
  .filter((item) => item.type === 'folder')
  .map((item) => item.value.replace(/\/$/, '')))
for (const page of allPages) {
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
  if (pageSet.has(base) && !source.includes('theme.withTheme(')) fail(`${base}.js 未接入统一主题状态`)
  if (pageSet.has(base) && !template.includes('page-style="{{themePageStyle}}"')) fail(`${base}.wxml 未接入动态页面主题`)
  const bindings = [...template.matchAll(/(?:bind|catch)(?::|tap|input|confirm|change|submit|longpress|touchstart|touchend|scrolltolower|scroll)(?:[a-z:]*)="([A-Za-z_$][\w$]*)"/g)]
  for (const name of new Set(bindings.map((match) => match[1]))) {
    if (!new RegExp(`\\b${name}\\s*\\(`).test(source)) fail(`${base}.wxml 绑定了不存在的处理函数: ${name}`)
  }
}

const runtimeFiles = ['app.js', 'services/api.js', 'services/session.js', 'features/utils/chart.js', 'features/utils/markdown.js', 'features/utils/showdown.js', 'utils/utils.js', 'utils/theme.js', 'data/mockData.js']
  .concat(allPages.map((page) => `${page}.js`))
  .concat(componentRoots.map((component) => `${component}.js`))

const unsupportedApis = /wx\.(?:requestPayment|requestSubscribeMessage|login|getUserProfile|downloadFile|saveFile|chooseImage|chooseMedia|chooseVideo|startRecord|authorize)\b/

for (const file of runtimeFiles) {
  const source = read(file)
  new Function(source)
  if (source.includes('juejin.im')) fail(`注册代码仍包含旧域名: ${file}`)
  if (/requestPayment|pay_api|payRequest/i.test(source)) fail(`注册代码包含支付调用: ${file}`)
  if (unsupportedApis.test(source)) fail(`注册代码包含需求范围外的小程序能力: ${file}`)

  for (const match of source.matchAll(/["'`]\/((?:pages|features)\/(?!assets\/)[^?"'`$]+)(?:\?[^"'`]*)?["'`]/g)) {
    const target = match[1]
    if (!pageSet.has(target)) fail(`${file} 跳转到未注册页面: ${target}`)
  }
}

const privatePages = [
  'features/chat/chat',
  'features/collectionSet/collectionSet',
  'features/courseCenter/courseCenter',
  'features/creator/creator',
  'features/creatorActivities/creatorActivities',
  'features/creatorData/creatorData',
  'features/creatorFans/creatorFans',
  'features/drafts/drafts',
  'features/dislike/dislike',
  'features/level/level',
  'features/notes/notes',
  'features/notifications/notifications',
  'features/lottery/lottery',
  'features/welfare/welfare',
  'features/coupon/coupon',
  'features/personalInfo/personalInfo',
  'features/publish/publish',
  'features/readHistory/readHistory',
  'features/registrations/registrations',
  'features/sign/sign'
]

for (const page of privatePages) {
  if (!pageSet.has(page)) fail(`账号页面未注册: ${page}`)
  if (!read(`${page}.js`).includes('session.requirePage(')) fail(`账号页面缺少深链登录保护: ${page}`)
}

const loginSource = read('features/login/login.js')
const loginTemplate = read('features/login/login.wxml')
const appSource = read('app.js')
const launchSource = read('pages/launch/launch.js')
const disclaimerSource = read('pages/disclaimer/disclaimer.js')
const disclaimerTemplate = read('pages/disclaimer/disclaimer.wxml')
if (!appSource.includes('requireDisclaimer(path, query)') || !appSource.includes('disclaimerAcknowledged: false')) fail('小程序缺少冷启动声明门禁')
if (!launchSource.includes('consumePendingEntry()') || !launchSource.includes('createEntryUrl(entry)')) fail('启动页未恢复声明前的原始入口')
if (!disclaimerSource.includes('observeReadEnd()') || !disclaimerSource.includes("observe('.disclaimer-end'") || !disclaimerTemplate.includes('class="disclaimer-end"')) fail('非官方声明页缺少正文末尾可见性检测')
if (!disclaimerSource.includes('trackReadProgress()') || !disclaimerSource.includes('!this.data.hasReadAll') || !disclaimerTemplate.includes('disabled="{{!hasReadAll || continuing}}"')) fail('非官方声明页必须阅读到底后才能继续')
if (!disclaimerSource.includes('acknowledgeDisclaimer()') || !disclaimerTemplate.includes('非官方学习项目') || !disclaimerTemplate.includes('我已知悉，继续体验')) fail('非官方声明页缺少确认流程或必要文案')
if (pageSet.has('pages/loginCode/loginCode')) fail('小程序不得注册验证码登录页')
if (exists('services/passport.js')) fail('小程序不得包含 Passport 登录实现')
if (/<input|password=|sendCode|loginWith/.test(loginTemplate)) fail('账号说明页不得包含登录表单')
if (!loginTemplate.includes('小程序版不提供账号登录') || !loginTemplate.includes('稀土掘金官方 App')) fail('账号说明页缺少安全提示')
if (!loginSource.includes('https://juejin.cn/')) fail('账号说明页必须提供官方站点地址')

for (const base of roots) {
  const sources = [read(`${base}.js`), read(`${base}.wxml`), read(`${base}.wxss`)]
  for (const source of sources) {
    for (const match of source.matchAll(/\/(?:features\/)?assets\/[A-Za-z0-9_./-]+/g)) {
      const asset = match[0].replace(/^\//, '')
      if (!exists(asset)) fail(`${base} 引用了不存在的本地资源: ${asset}`)
    }
  }
}

for (const item of app.tabBar.list) {
  if (!mainPageSet.has(item.pagePath)) fail(`TabBar 页面必须注册在主包: ${item.pagePath}`)
  for (const key of ['iconPath', 'selectedIconPath']) {
    const file = item[key]
    if (!file.endsWith('.png')) fail(`TabBar 图标必须使用 PNG: ${file}`)
    if (!exists(file)) fail(`TabBar 图标不存在: ${file}`)
    if (fs.statSync(path.join(root, file)).size > 40 * 1024) fail(`TabBar 图标超过 40KB: ${file}`)
  }
}

const ignoredEntries = project.packOptions && project.packOptions.ignore || []
const isPackIgnored = (file) => ignoredEntries.some((item) => {
  const value = item.value.replace(/\/$/, '')
  return item.type === 'folder' ? file === value || file.startsWith(`${value}/`) : file === value
})
const activeJavaScript = new Set(runtimeFiles.concat(['custom-tab-bar/index.js']))
const packagedJavaScript = ['pages', 'features', 'components', 'custom-tab-bar', 'data', 'services', 'utils']
  .flatMap(collectFiles)
  .filter((file) => file.endsWith('.js') && !isPackIgnored(file))
const unusedJavaScript = packagedJavaScript.filter((file) => !activeJavaScript.has(file))
if (unusedJavaScript.length) fail(`存在无依赖代码文件: ${unusedJavaScript.join(', ')}`)

const activeTextFiles = new Set(['app.json', 'app.wxss', 'theme.json', 'sitemap.json', 'custom-tab-bar/index.js', 'custom-tab-bar/index.json', 'custom-tab-bar/index.wxml', 'custom-tab-bar/index.wxss'].concat(runtimeFiles))
for (const base of roots) {
  for (const extension of ['js', 'json', 'wxml', 'wxss']) activeTextFiles.add(`${base}.${extension}`)
}
const assetReferences = new Set()
for (const file of activeTextFiles) {
  if (!exists(file)) continue
  for (const match of read(file).matchAll(/\/?(?:features\/)?assets\/[A-Za-z0-9_./-]+/g)) {
    assetReferences.add(match[0].replace(/^\//, ''))
  }
}
for (const item of app.tabBar.list) {
  assetReferences.add(item.iconPath)
  assetReferences.add(item.selectedIconPath)
}

const packageAssets = collectFiles('assets').concat(collectFiles('features/assets'))
const unusedAssets = packageAssets.filter((file) => !assetReferences.has(file))
if (unusedAssets.length) fail(`存在无依赖本地资源: ${unusedAssets.join(', ')}`)
for (const file of packageAssets) {
  if (!/\.(?:avif|gif|jpe?g|png|svg|webp|aac|m4a|mp3|ogg|wav)$/i.test(file)) continue
  const bytes = fs.statSync(path.join(root, file)).size
  if (bytes > 200 * 1024) fail(`图片或音频资源超过 200KB: ${file} (${bytes} bytes)`)
}

const mainPackageFiles = new Set(['app.js', 'app.json', 'app.wxss', 'theme.json', 'sitemap.json'])
for (const base of app.pages.concat(componentRoots)) {
  for (const extension of ['js', 'json', 'wxml', 'wxss']) mainPackageFiles.add(`${base}.${extension}`)
}
for (const file of ['services/api.js', 'services/session.js', 'utils/utils.js', 'utils/theme.js', 'data/mockData.js']) mainPackageFiles.add(file)
for (const file of collectFiles('custom-tab-bar').concat(collectFiles('assets'))) mainPackageFiles.add(file)
const mainPackageBytes = [...mainPackageFiles].reduce((total, file) => total + fs.statSync(path.join(root, file)).size, 0)
if (mainPackageBytes >= 1.5 * 1024 * 1024) fail(`主包原始文件超过 1.5MiB: ${mainPackageBytes} bytes`)

const featurePackageBytes = collectFiles('features').reduce((total, file) => total + fs.statSync(path.join(root, file)).size, 0)
if (featurePackageBytes >= 2 * 1024 * 1024) fail(`features 分包原始文件超过 2MiB: ${featurePackageBytes} bytes`)

const markdown = require(path.join(root, 'features/utils/markdown.js'))
const signedImage = 'https://p3.example.com/image.webp?rk3s=test&x-expires=1&x-signature=test'
const renderedImage = markdown.toHtml(`![](${signedImage})`)
if (!renderedImage.includes(`src="${signedImage}"`)) fail('Markdown 图片签名参数被 HTML 实体破坏')
if (!renderedImage.includes('max-width:100%;height:auto;display:block')) fail('Markdown 图片缺少响应式尺寸样式')
if (markdown.normalizeImageSources('<p>&amp;</p>').includes('<p>&</p>')) fail('图片 URL 修复不应改动正文实体')

const fixedImage = markdown.normalizeImageSources('<img width="960" height="540" style="width:960px;max-width:none;height:540px;object-fit:cover" src="https://p3.example.com/a.webp?x=1&amp;y=2">')
if (/\s(?:width|height)=/i.test(fixedImage)) fail('正文图片仍包含固定宽高属性')
if (/(?:^|;)\s*(?:width|min-width|max-width|height|min-height|max-height)\s*:(?!\s*(?:100%|auto))/i.test(fixedImage)) fail('正文图片仍包含固定尺寸样式')
if (!fixedImage.includes('object-fit:cover')) fail('图片响应式处理不应移除无关样式')
if (!fixedImage.includes('src="https://p3.example.com/a.webp?x=1&y=2"')) fail('图片响应式处理破坏了签名参数')

const utils = require(path.join(root, 'utils/utils.js'))
const themeUtils = require(path.join(root, 'utils/theme.js'))
if (themeUtils.resolveTheme({ followSystem: false, selected: 'dark' }, 'light') !== 'dark') fail('手动深色模式未覆盖系统浅色模式')
if (themeUtils.resolveTheme({ followSystem: false, selected: 'light' }, 'dark') !== 'light') fail('手动浅色模式未覆盖系统深色模式')
if (themeUtils.resolveTheme({ followSystem: true, selected: 'light' }, 'dark') !== 'dark') fail('跟随系统模式未响应系统深色模式')
const darkThemeData = themeUtils.createThemeData('dark', { darkMode: false })
if (!darkThemeData.darkMode || !darkThemeData.themePageStyle.includes('--jj-bg:#111214')) fail('深色主题未生成页面样式变量')
if (Object.prototype.hasOwnProperty.call(themeUtils.createThemeData('dark', { theme: {} }), 'theme')) fail('外观主题不得覆盖页面业务 theme 数据')
const recentTimestamp = String(Math.floor(Date.now() / 1000) - 3600)
if (!utils.formatTime(recentTimestamp)) fail('相对时间必须支持接口返回的数字字符串时间戳')
const yearAgoTimestamp = String(Math.floor(Date.now() / 1000) - 370 * 86400)
if (utils.formatTime(yearAgoTimestamp) !== '1年前') fail('文章发布时间超过一年时必须显示相对年份')
if (utils.formatCompactCount(2450) !== '2K+') fail('圈子人数和沸点数必须使用 K+ 格式')
const zeroActionArticle = utils.normalizeArticle({ article_info: { article_id: 'zero-action', digg_count: 0, comment_count: 0 } })
if (zeroActionArticle.digg_label !== '点赞' || zeroActionArticle.comment_label !== '评论') fail('文章零互动数必须显示点赞和评论文案')
const normalizedThemePin = utils.normalizePin({
  msg_Info: {
    msg_id: 'theme-pin',
    topic_id: '0',
    theme_id: '7668498957522452490',
    content: '[7668498957522452490#TRAE Work 实战帮#]\n正文'
  },
  topic: { topic_id: '0', title: '' },
  theme: { theme_id: '7668498957522452490', name: 'TRAE Work 实战帮' }
})
if (normalizedThemePin.content !== '#TRAE Work 实战帮#\n正文') fail('沸点正文活动标签未转换为可读文本')
if (!normalizedThemePin.theme || normalizedThemePin.theme.theme_id !== '7668498957522452490') fail('沸点正文活动标签缺少活动 ID')
if (normalizedThemePin.topic) fail('活动标签不得显示为卡片底部圈子标签')
if (!normalizedThemePin.content_segments.some((item) => item.type === 'theme')) fail('沸点正文活动标签未生成可点击片段')

const normalizedTopicPin = utils.normalizePin({
  msg_Info: { msg_id: 'topic-pin', topic_id: '7273343075660300349', content: '圈子正文' },
  topic: { topic_id: '7273343075660300349', title: '大模型生态圈' }
})
if (normalizedTopicPin.topic !== '大模型生态圈' || normalizedTopicPin.topic_id !== '7273343075660300349') fail('普通圈子标签缺少名称或 ID')
const normalizedComment = utils.normalizeComment({
  comment_id: 'comment-1',
  comment_info: { comment_content: '一级评论', reply_count: 2 },
  is_hot: true,
  reply_infos: [{
    reply_id: 9007199254740992,
    reply_info: { reply_id: 'reply-1', reply_content: '回复内容', reply_to_user_id: 'user-2' },
    user_info: { user_id: 'user-1', user_name: '回复者' },
    reply_user: { user_id: 'user-2', user_name: '被回复者' },
    is_author: true
  }]
})
if (normalizedComment.replies.length !== 1) fail('评论归一化丢失接口返回的回复')
if (normalizedComment.replies[0].id !== 'reply-1') fail('评论回复应优先使用精确的字符串 ID')
if (normalizedComment.replies[0].reply_user !== '被回复者') fail('评论回复缺少被回复用户')
if (!normalizedComment.reply_has_more) fail('评论回复数量不完整时应显示查看更多入口')
if (!normalizedComment.is_hot) fail('评论归一化丢失热评标识')

const postSource = read('features/post/post.js')
const apiSource = read('services/api.js')
if (!/commentSort:\s*['"]hot['"]/.test(postSource)) fail('文章评论列表默认排序必须为最热')

const courseDetailTemplate = read('features/courseDetail/courseDetail.wxml')
const courseDetailStyle = read('features/courseDetail/courseDetail.wxss')
const courseDetailConfig = JSON.parse(read('features/courseDetail/courseDetail.json'))
if (courseDetailConfig.navigationStyle === 'custom' || courseDetailTemplate.includes('<status-bar')) fail('小册详情必须使用小程序系统导航栏')
if (!/\.detail-tabs\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/.test(courseDetailStyle)) fail('小册详情页签栏缺少顶部吸附')
if (!courseDetailTemplate.includes('ic_course_free_try.png') || !/\.trial-icon\s*\{[^}]*width:\s*34rpx;[^}]*height:\s*36rpx;/.test(courseDetailStyle)) fail('小册详情免费试学图标异常')

const byteCourseDetailSource = read('features/byteCourseDetail/byteCourseDetail.js')
const byteCourseDetailTemplate = read('features/byteCourseDetail/byteCourseDetail.wxml')
const byteCourseDetailStyle = read('features/byteCourseDetail/byteCourseDetail.wxss')
const byteCourseDetailConfig = JSON.parse(read('features/byteCourseDetail/byteCourseDetail.json'))
const xiaoceSource = read('pages/xiaoce/xiaoce.js')
if (!pageSet.has('features/byteCourseDetail/byteCourseDetail') || !xiaoceSource.includes("course.courseType === 'byte'")) fail('字节内部课缺少独立详情页路由')
if (!apiSource.includes('/booklet_api/v1/bytecourse/get') || !apiSource.includes('/booklet_api/v1/bytecourse/chapter_list') || !apiSource.includes('/booklet_api/v1/bytecourse/hot_list')) fail('字节内部课缺少 APK 对应的详情、目录或推荐接口')
if (!/byteCourseComments[\s\S]*?item_type:\s*60/.test(apiSource)) fail('字节内部课评论接口必须使用 item_type 60')
if (!byteCourseDetailTemplate.includes("activeTab === 'intro'") || !byteCourseDetailTemplate.includes("activeTab === 'contents'") || !byteCourseDetailTemplate.includes("activeTab === 'comments'")) fail('字节内部课详情缺少介绍、目录或评论页签')
if (!byteCourseDetailTemplate.includes('data-index="{{index}}"') || !byteCourseDetailSource.includes('this.data.chapters[Number(event.currentTarget.dataset.index)]')) fail('字节内部课章节必须通过索引保留长整型 ID 精度')
if (!byteCourseDetailSource.includes('info.safeArea') || !byteCourseDetailTemplate.includes('style="{{safeAreaStyle}}"') || !byteCourseDetailStyle.includes('constant(safe-area-inset-bottom)') || !byteCourseDetailStyle.includes('env(safe-area-inset-bottom)')) fail('字节内部课底栏缺少运行时或 CSS 安全区适配')
if (byteCourseDetailConfig.navigationStyle === 'custom' || byteCourseDetailTemplate.includes('<status-bar')) fail('字节内部课详情必须使用小程序系统导航栏')
if ((byteCourseDetailSource.match(/ensureAccountPermission\(\)/g) || []).length < 3 || !byteCourseDetailSource.includes('session.requireLogin()')) fail('字节内部课试学和会员入口缺少账号权限校验')
if (!byteCourseDetailTemplate.includes('ic_course_free_try.png') || byteCourseDetailStyle.includes('.book-icon')) fail('字节内部课免费试学未使用 APK 原始图标')
const normalizedByteCourse = utils.normalizeByteCourse({
  content: {
    item_id: '7142808926348640263',
    name: '后端 -  算法、安全、性能优化',
    extra: { course_package: { chapter_count: 7, duration: 12953106 } }
  }
})
if (normalizedByteCourse.id !== '7142808926348640263' || normalizedByteCourse.title !== '后端 - 算法、安全、性能优化') fail('字节内部课归一化破坏课程 ID 或标题')
if (normalizedByteCourse.videoCount !== 7 || normalizedByteCourse.duration !== '3小时36分钟') fail('字节内部课归一化未保留视频数或时长')

const pinDetailSource = read('features/feidianDetail/feidianDetail.js')
const pinDetailTemplate = read('features/feidianDetail/feidianDetail.wxml')
const pinDetailConfig = JSON.parse(read('features/feidianDetail/feidianDetail.json'))
const pinCardSource = read('components/pinCard/pinCard.js')
const pinCardTemplate = read('components/pinCard/pinCard.wxml')
const pinCardStyles = read('components/pinCard/pinCard.wxss')
const findTemplate = read('pages/find/find.wxml')
const findStyles = read('pages/find/find.wxss')
const findSource = read('pages/find/find.js')
const collectionSquareSource = read('features/collectionSquare/collectionSquare.js')
const collectionSquareTemplate = read('features/collectionSquare/collectionSquare.wxml')
const profileSource = read('features/profile/profile.js')
const dailySource = read('features/daily/daily.js')
const dailyTemplate = read('features/daily/daily.wxml')
const columnSource = read('features/column/column.js')
const columnTemplate = read('features/column/column.wxml')
const collectionConfig = JSON.parse(read('features/collectionSquare/collectionSquare.json'))
const rankSource = read('features/rank/rank.js')
const rankTemplate = read('features/rank/rank.wxml')
const rankRulesSource = read('features/rankRules/rankRules.js')
const rankRulesTemplate = read('features/rankRules/rankRules.wxml')
const rankRulesConfig = JSON.parse(read('features/rankRules/rankRules.json'))
const utilsSource = read('utils/utils.js')
const appStyles = read('app.wxss')
const emptyStateSource = read('components/emptyState/emptyState.js')
const emptyStateTemplate = read('components/emptyState/emptyState.wxml')
const emptyStateStyles = read('components/emptyState/emptyState.wxss')
const indexSource = read('pages/index/index.js')
const indexTemplate = read('pages/index/index.wxml')
const feidianSource = read('pages/feidian/feidian.js')
const feidianTemplate = read('pages/feidian/feidian.wxml')
if (!/commentSort:\s*['"]hot['"]/.test(pinDetailSource)) fail('沸点评论列表默认排序必须为最热')
if (!pinDetailTemplate.includes('loadCommentReplies')) fail('沸点评论列表缺少回复加载入口')
if (!pinDetailTemplate.includes('ic_pins_hot_comment.png')) fail('沸点热评缺少 App 热评图标')
if (pinDetailConfig.navigationStyle === 'custom') fail('沸点详情必须使用系统导航栏')
if (!pinCardTemplate.includes('ic_pins_share.png') || !pinCardTemplate.includes('ic_pins_comment.png')) fail('沸点卡片必须使用 App 的分享和评论图标')
if (!pinCardTemplate.includes('class="publish-time"')) fail('沸点卡片缺少发布时间')
if (!pinCardTemplate.includes('catchtap="openTheme"')) fail('沸点正文活动标签缺少独立点击处理')
if (!/<text\b(?=[^>]*\bclass="pin-theme-link")(?=[^>]*\bdata-index="\{\{index\}\}")(?=[^>]*\bcatchtap="openTheme")[^>]*>/.test(pinCardTemplate)) fail('沸点活动标签必须通过片段索引保留长整型 ID 精度')
if (!/<view\b(?=[^>]*\bclass="topic")(?=[^>]*\bcatchtap="openTopic")[^>]*>/.test(pinCardTemplate)) fail('沸点底部圈子标签缺少独立点击处理')
if (!findTemplate.includes('catchtap="openSelectedTheme"')) fail('发现页精选沸点活动标签缺少独立点击处理')
if (/url\(\s*['"]?\/assets\//.test(findStyles)) fail('发现页 WXSS 不得直接引用本地图片')
if (!findTemplate.includes('class="find-top-bg"')) fail('发现页顶部缺少 image 背景')
if (!findTemplate.includes('referrer-policy="no-referrer"')) fail('发现页远程图片缺少防盗链策略')
if (!findTemplate.includes('class="find-sticky"') || !findTemplate.includes('transparent="{{true}}"')) fail('发现页搜索栏必须吸顶并使用透明状态栏')
if (!findTemplate.includes('class="page find-page {{themeName}}"') || !findStyles.includes('.find-page.dark .search-bar') || !findStyles.includes('.find-page.dark .daily-card') || !findStyles.includes('.find-page.dark .recommend-card')) fail('发现页顶部、每日掘金和推荐卡片必须跟随应用主题')
if (/<swiper[^>]*class="quick-swiper"|<swiper-item><view class="quick-grid"><\/view><\/swiper-item>/.test(findTemplate)) fail('发现页功能入口不得包含空白轮播页')
if (!findTemplate.includes('class="banner-art"') || !/\.banner-art\s*\{[^}]*width:\s*198rpx;[^}]*height:\s*198rpx/s.test(findStyles)) fail('发现页活动 Banner 必须按正方形比例展示封面')
if (!findTemplate.includes('class="banner-brief two-lines"') || !/\.banner-brief\s*\{[^}]*max-height:\s*72rpx/s.test(findStyles)) fail('发现页顶部轮播简介必须限制为最多两行')
if (!pageSet.has('features/daily/daily') || !findSource.includes("'/features/daily/daily'")) fail('每日掘金往日精彩缺少独立页面')
if (!pageSet.has('features/selectedPins/selectedPins') || !findSource.includes("'/features/selectedPins/selectedPins'")) fail('精选沸点缺少独立页面')
if (!findTemplate.includes('class="selected-content two-lines"') || !findTemplate.includes('等人赞过') || !findTemplate.includes('class="pin-comment-box"')) fail('发现页精选沸点卡片缺少两行摘要、点赞人或评论框')
if (!/<swiper[^>]*class="rank-swiper"[^>]*bindchange="changeRankCategory"/.test(findTemplate)) fail('发现页文章榜必须支持左右滑动切换')
if (findTemplate.includes('type=news') || findTemplate.includes('行业速递</text><view')) fail('行业速递不得保留查看更多入口')
if (!findSource.includes('loadMoreHeadlines()') || !findSource.includes('headlineCursor')) fail('发现页行业速递缺少上拉分页')
if (!findTemplate.includes('item.digg_label') || !findTemplate.includes('find_page_ic_undigg.svg') || !findTemplate.includes('find_page_ic_comment.svg')) fail('行业速递必须复用首页点赞和评论图标及文案')
if (!findTemplate.includes('掘友{{item.follower_count}} · 沸点{{item.msg_count}}')) fail('推荐圈子不得在 K+ 格式后重复追加加号')
if (!/\.horizontal-card\s*\{[^}]*flex:\s*0\s+0\s+650rpx/s.test(findStyles)) fail('发现页横向卡片必须禁止 flex 收缩')
if (!/\.topic-card\s*\{[^}]*width:\s*674rpx;[^}]*height:\s*292rpx;[^}]*padding:\s*30rpx;[^}]*flex-basis:\s*674rpx/s.test(findStyles) || !/\.topic-head\s*\{[^}]*height:\s*72rpx;[^}]*flex:\s*0\s+0\s+auto/s.test(findStyles) || !/\.topic-preview\s*\{[^}]*height:\s*134rpx;[^}]*overflow:\s*hidden/s.test(findStyles)) fail('推荐圈子卡片必须匹配 APP 的固定宽度、头部和两行预览区域')
if (!/\.topic-preview-row\s*\{[^}]*height:\s*57rpx;[^}]*overflow:\s*hidden/s.test(findStyles) || !/\.topic-preview-row text\s*\{[^}]*height:\s*36rpx;[^}]*white-space:\s*nowrap/s.test(findStyles)) fail('推荐圈子沸点预览必须保持两行头像文本对齐')
if (!/function normalizeCollectionSet[\s\S]*?articles:\s*\(item\.articles \|\| item\.article_list \|\| \[\]\)\.slice\(0, 3\)\.map\(normalizeArticle\)/.test(utilsSource)) fail('推荐收藏集卡片预览必须限制为三篇文章')
if (!/\.recommend-head\s*\{[^}]*height:\s*118rpx;[^}]*overflow:\s*hidden/s.test(findStyles) || !/\.recommend-preview\s*\{[^}]*height:\s*282rpx;[^}]*overflow:\s*hidden/s.test(findStyles) || !/\.preview-row\s*\{[^}]*height:\s*94rpx;[^}]*overflow:\s*hidden/s.test(findStyles)) fail('推荐专栏、收藏集和作者榜卡片必须使用稳定的三行预览布局')
if (!/moduleType:\s*this\.data\.sort === ['"]latest['"] \? 0 : 1/.test(collectionSquareSource)) fail('收藏集最新和最热必须使用服务端排序模块')
if (!collectionSquareSource.includes('this.allSets.slice') || !collectionSquareTemplate.includes('class="collection-badge"')) fail('收藏集页缺少分批加载或精选标签')
if (!collectionSquareSource.includes('onReachBottom()') || !collectionSquareSource.includes('detailCursor') || !collectionSquareSource.includes('previousArticles.concat(additions)')) fail('收藏集详情缺少去重上拉分页')
if (collectionConfig.navigationStyle !== 'custom' || !collectionSquareTemplate.includes('collection_detail_bg.png') || !collectionSquareTemplate.includes('class="detail-sheet surface"')) fail('收藏集详情必须使用 APP 蓝色头部和圆角文章区')
if (!dailyTemplate.includes('daily_column_cover.jpg') || !dailyTemplate.includes('level-badge') || !dailyTemplate.includes('subscriber-avatars')) fail('每日掘金缺少 APP 头图、作者等级或订阅头像')
if (!dailySource.includes('columnArticles(DAILY_COLUMN_ID') || !dailyTemplate.includes('item.digg_label') || !dailyTemplate.includes('item.comment_label')) fail('每日掘金必须使用专栏文章流和统一互动文案')
if (!columnSource.includes('loadDetailArticles(false)') || !columnTemplate.includes('column_default_cover.png') || !columnTemplate.includes('class="article-actions"')) fail('专栏详情缺少 APP 头部、文章卡片或上拉分页')
if (!utilsSource.includes('owner_label:') || !findTemplate.includes('item.owner_label') || utilsSource.includes("title: `${item.user_name")) fail('推荐专栏必须分开显示专栏名称和作者归属')
if (columnSource.includes('showMore()') || columnTemplate.includes('nav-more') || !columnSource.includes('onPageScroll(event)') || !columnTemplate.includes('navOpacity')) fail('专栏详情必须移除三点菜单并支持滚动渐显导航栏')
if (!columnSource.includes("label: '默认排序'") || !columnSource.includes("label: '最新发布'") || !columnSource.includes("label: '最早发布'") || !columnSource.includes("{ default: 2, latest: 0, earliest: 1 }") || !columnSource.includes('sortArticlesByTime')) fail('专栏详情缺少默认、最新和最早三种排序')
if (!/column\/articles_cursor[\s\S]*\bsort:\s*Number\.isFinite/.test(apiSource)) fail('专栏文章接口必须使用 APP 的 sort 参数')
if (!profileSource.includes('api.userArticles') || !profileSource.includes('onReachBottom()') || !profileSource.includes('articleCursor')) fail('作者主页文章列表缺少真实上拉分页')
if (!rankSource.includes('timeRanges:') || !rankSource.includes('selectCategory(') || !rankTemplate.includes('class="category-tabs"') || !rankTemplate.includes('class="period-tabs"')) fail('文章榜缺少分类和时间范围筛选')
if (!findTemplate.includes('bindtap="openRankCategory"') || !findSource.includes('categoryId=${encodeURIComponent(String(category.id))}') || !rankSource.includes('query.categoryId')) fail('发现页文章榜卡片必须按分类进入文章榜')
if (!rankTemplate.includes('item.digg_label') || !rankTemplate.includes('find_page_ic_comment.svg') || !rankTemplate.includes('data-index="{{index}}" bindtap="openArticle"')) fail('文章榜必须使用标准文章卡片并通过索引打开文章')
if (!rankSource.includes('onReachBottom()') || !rankSource.includes('loadMoreArticles()') || !rankSource.includes('previous.concat(additions)') || !rankTemplate.includes('loadingMore')) fail('文章榜缺少去重上拉加载')
if (!rankSource.includes('onPageScroll(event)') || !rankTemplate.includes('rank-fixed-nav') || !rankTemplate.includes('navOpacity')) fail('文章榜缺少滚动渐显导航栏')
if (!pageSet.has('features/rankRules/rankRules') || !rankSource.includes("'/features/rankRules/rankRules'")) fail('文章榜排名规则缺少独立页面跳转')
if (rankRulesConfig.navigationStyle === 'custom' || rankRulesConfig.navigationBarTitleText !== '排名规则') fail('排名规则页必须使用标题为排名规则的系统导航栏')
if (!rankRulesSource.includes("bookletId: '6843715467522080775'") || !rankRulesSource.includes("sectionId: '6843715630860861453'")) fail('排名规则页缺少 APK 中对应的小册章节标识')
if ((rankRulesSource.match(/rank_rules_\d{2}\.png/g) || []).length !== 6 || !rankRulesTemplate.includes('wx:for="{{ruleImages}}"') || !rankRulesTemplate.includes('mode="widthFix"')) fail('排名规则页缺少完整的分段规则正文')
if (!/\.pin-content\s*\{[^}]*white-space:\s*pre-wrap/s.test(pinCardStyles)) fail('沸点正文必须保留接口换行')
if (!pinCardSource.includes("wx.setStorageSync('jj:user-current', author)")) fail('沸点头像跳转前必须缓存当前作者资料')
if (profileSource.includes('|| mock.authors[0]')) fail('用户主页不得回退到固定的官方账号')

const legacyPages = ['dynamic', 'entry', 'favorate', 'infoCenter', 'manageTag', 'miniqrcode', 'myPins', 'originalPost', 'probation', 'purchasedXiaoce', 'sharePost', 'subscribedTag', 'xiaocedetail']
for (const page of legacyPages) {
  if (collectFiles(`pages/${page}`).length) fail(`未注册旧页面仍保留文件: pages/${page}`)
}

if (!['--jj-font-caption: 24rpx', '--jj-font-body: 28rpx', '--jj-touch-target: 88rpx', '--jj-safe-bottom: env(safe-area-inset-bottom)'].every((token) => appStyles.includes(token))) fail('全局视觉规范缺少字号、触控高度或安全区令牌')
if (!emptyStateSource.includes("value: 'empty'") || !['loading', 'error', 'cached', 'end'].every((type) => emptyStateTemplate.includes(`type === '${type}'`))) fail('统一页面状态必须覆盖 loading、empty、error、cached 和 end')
if (!emptyStateTemplate.includes('actionLoading') || !emptyStateTemplate.includes('actionDisabled') || !emptyStateStyles.includes('.state-skeleton')) fail('统一页面状态缺少操作反馈或骨架屏')
for (const [name, template, source] of [['首页', indexTemplate, indexSource], ['发现页', findTemplate, findSource], ['沸点页', feidianTemplate, feidianSource]]) {
  if (!template.includes('type="loading"') || !template.includes('skeleton-rows=')) fail(`${name}缺少骨架屏`)
  if (!template.includes('type="error"') || !template.includes('bind:action="retryLoad"') || !source.includes('retryLoad()')) fail(`${name}缺少错误重试状态`)
}
if (!appStyles.includes('.interactive-pressed') || !appStyles.includes('.is-disabled') || !appStyles.includes('.is-loading')) fail('全局交互反馈缺少按压、禁用或加载状态')

console.log(`Validated ${allPages.length} pages, ${componentRoots.length} components, main package ${Math.ceil(mainPackageBytes / 1024)}KB, feature package ${Math.ceil(featurePackageBytes / 1024)}KB, navigation, dependencies, local assets and API boundaries.`)
