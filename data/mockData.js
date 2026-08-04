const categories = [
  { id: '', name: '全部' },
  { id: '6809637769959178254', name: '后端' },
  { id: '6809637767543259144', name: '前端' },
  { id: '6809635626879549454', name: 'Android' },
  { id: '6809635626661445640', name: 'iOS' },
  { id: '6809637773935378440', name: '人工智能' },
  { id: '6809637771511070734', name: '开发工具' },
  { id: '6809637776263217160', name: '代码人生' },
  { id: '6809637772874219534', name: '阅读' }
]

const authors = [
  { user_id: 'user-1', user_name: '稀土掘金技术团队', avatar_large: '/assets/app/common/ic_juejin_logo.webp', job_title: '官方账号', company: '稀土掘金', follower_count: 128000 },
  { user_id: 'user-2', user_name: '前端森林', avatar_large: '/assets/app/common/default_avatar.webp', job_title: '前端工程师', company: '字节跳动', follower_count: 32640 },
  { user_id: 'user-3', user_name: '代码与远方', avatar_large: '/assets/app/common/default_avatar.webp', job_title: '后端架构师', company: '科技公司', follower_count: 18900 },
  { user_id: 'user-4', user_name: 'AI 工程札记', avatar_large: '/assets/app/common/default_avatar.webp', job_title: '算法工程师', company: 'AI Lab', follower_count: 12360 }
]

const articleSeeds = [
  ['art-1', '2024 年值得关注的前端工程化实践', '从构建性能、依赖治理到研发体验，梳理团队落地工程化时最关键的几个环节。', 328, 42, 18900, ['前端', '工程化'], 1],
  ['art-2', '深入理解 JavaScript 事件循环', '结合浏览器渲染时序与真实案例，重新认识任务、微任务和异步边界。', 526, 61, 27600, ['JavaScript', '前端'], 1],
  ['art-3', '高并发系统中的缓存设计', '缓存不是简单地加一层 Redis。本文从一致性、穿透与热点问题讲起。', 419, 53, 22100, ['后端', '架构'], 2],
  ['art-4', '从零搭建一个可观测的 Node.js 服务', '日志、指标、链路追踪如何协同，给出一套适合中小团队的实现路径。', 287, 35, 14600, ['Node.js', '服务端'], 2],
  ['art-5', '大模型应用的检索增强实战', '从切片、召回到重排，分析 RAG 系统中最容易被忽略的质量问题。', 612, 79, 31500, ['人工智能', 'RAG'], 3],
  ['art-6', 'Android 性能优化检查清单', '覆盖启动、布局、内存、网络和包体积，附带可执行的定位思路。', 198, 21, 9300, ['Android', '性能优化'], 0],
  ['art-7', '一套稳定的跨端状态管理方案', '当业务运行在 Web、小程序和原生容器中，怎样保持清晰的数据边界。', 354, 44, 17300, ['跨端', '架构'], 1],
  ['art-8', '产品工程师如何做好技术方案', '从目标、约束和验证方式出发，把技术方案写成团队可以执行的共同语言。', 243, 38, 12100, ['职场', '方法论'], 0]
]

const articles = articleSeeds.map((seed) => ({
  article_id: seed[0],
  title: seed[1],
  brief_content: seed[2],
  digg_count: seed[3],
  comment_count: seed[4],
  view_count: seed[5],
  collect_count: Math.round(seed[3] * 0.62),
  ctime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 500000),
  author_user_info: authors[seed[7]],
  tags: seed[6].map((name) => ({ tag_name: name })),
  cover_image: ''
}))

const pins = [
  { msg_id: 'pin-1', msg_Info: { content: '你最近学到的最有价值的一个技术细节是什么？欢迎在评论区分享。', pic_list: [], ctime: Math.floor(Date.now() / 1000) - 900 }, author_user_info: authors[0], digg_count: 86, comment_count: 32 },
  { msg_id: 'pin-2', msg_Info: { content: '终于把项目的冷启动时间压到了 1 秒以内，性能优化最快乐的瞬间就是指标真的降下来了。', pic_list: [], ctime: Math.floor(Date.now() / 1000) - 7200 }, author_user_info: authors[1], digg_count: 124, comment_count: 18 },
  { msg_id: 'pin-3', msg_Info: { content: '写技术文章时，比“知道答案”更难的是把推理过程解释清楚。', pic_list: [], ctime: Math.floor(Date.now() / 1000) - 21600 }, author_user_info: authors[2], digg_count: 203, comment_count: 41 },
  { msg_id: 'pin-4', msg_Info: { content: '今天的 AI 论文阅读清单已完成。保持输入，也别忘了动手做实验。', pic_list: [], ctime: Math.floor(Date.now() / 1000) - 86400 }, author_user_info: authors[3], digg_count: 97, comment_count: 11 }
]

const courses = [
  { booklet_id: 'course-1', base_info: { title: '深入浅出 TypeScript', summary: '从类型系统到工程实践', cover_img: '/assets/app/common/default_booklet_cover_image.webp', price: 2990, section_count: 36, is_finished: true }, user_info: authors[1] },
  { booklet_id: 'course-2', base_info: { title: '高并发系统设计 40 问', summary: '建立可靠的服务端架构知识体系', cover_img: '/assets/app/common/default_booklet_cover_image.webp', price: 3990, section_count: 40, is_finished: true }, user_info: authors[2] },
  { booklet_id: 'course-3', base_info: { title: '大模型应用开发实战', summary: 'RAG、Agent 与评测完整路径', cover_img: '/assets/app/common/default_booklet_cover_image.webp', price: 4990, section_count: 28, is_finished: false }, user_info: authors[3] },
  { booklet_id: 'course-4', base_info: { title: '前端性能优化原理与实践', summary: '从指标到工具，再到落地方案', cover_img: '/assets/app/common/default_booklet_cover_image.webp', price: 2990, section_count: 31, is_finished: true }, user_info: authors[1] }
]

const topics = [
  { topic_id: 'topic-1', title: '上班摸鱼', description: '聊聊开发者工作日常', follower_count: 82400, icon: '摸' },
  { topic_id: 'topic-2', title: '技术交流', description: '分享今天解决的技术问题', follower_count: 76200, icon: '技' },
  { topic_id: 'topic-3', title: '开源推荐', description: '发现值得关注的开源项目', follower_count: 53900, icon: '源' },
  { topic_id: 'topic-4', title: 'AI 新鲜事', description: '大模型与 AI 应用动态', follower_count: 48600, icon: 'AI' },
  { topic_id: 'topic-5', title: '代码人生', description: '程序员的生活与选择', follower_count: 45500, icon: '码' }
]

const daily = {
  date: '今日',
  greeting: '每天读一点，保持技术好奇心',
  articles: articles.slice(0, 5)
}

function search(keyword, type) {
  const query = keyword.toLowerCase()
  if (type === 'user') {
    return authors.filter((item) => `${item.user_name}${item.job_title}${item.company}`.toLowerCase().indexOf(query) !== -1)
  }
  return articles.filter((item) => `${item.title}${item.brief_content}${item.tags.map((tag) => tag.tag_name).join('')}`.toLowerCase().indexOf(query) !== -1)
}

module.exports = {
  categories,
  authors,
  articles,
  pins,
  courses,
  topics,
  daily,
  search
}
