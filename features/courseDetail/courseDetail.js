const theme = require("../../utils/theme.js")
const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')
const markdown = require('../utils/markdown.js')

const GUIDE_DETAILS = {
  'free-writing-guide': {
    booklet: {
      booklet_id: 'free-writing-guide',
      base_info: {
        booklet_id: 'free-writing-guide',
        title: '如何写一本掘金小册',
        summary: '从选题、组织目录到持续更新，了解掘金小册的创作流程。',
        cover_img: '/features/assets/app/course/bg_book_free.webp',
        section_count: 3,
        is_finished: 1,
        price: 0
      },
      user_info: { user_name: '稀土掘金' },
      is_buy: true,
      reading_progress: 0.37
    },
    introduction: { content: '这本免费小册介绍如何确定主题、规划章节，并把经验整理成读者能够持续学习的内容。' },
    sections: [
      { section_id: 'writing-1', title: '找到值得持续讲清楚的主题', is_free: true, local_content: '从真实问题出发，先明确目标读者，再验证主题是否适合拆成连续章节。' },
      { section_id: 'writing-2', title: '设计清晰的小册目录', is_free: true, local_content: '目录应该体现学习路径，每一节解决一个明确问题，并给出可验证的结果。' },
      { section_id: 'writing-3', title: '发布与持续更新', is_free: true, local_content: '发布后结合读者反馈迭代内容，及时修正过时信息并补充实践案例。' }
    ]
  },
  'free-community-guide': {
    booklet: {
      booklet_id: 'free-community-guide',
      base_info: {
        booklet_id: 'free-community-guide',
        title: '如何使用掘金社区',
        summary: '快速了解文章、沸点、课程与互动功能。',
        cover_img: '/features/assets/app/course/bg_book_free.webp',
        section_count: 3,
        is_finished: 1,
        price: 0
      },
      user_info: { user_name: '稀土掘金' },
      is_buy: true,
      reading_progress: 0.08
    },
    introduction: { content: '这本免费小册帮助新用户熟悉掘金的内容浏览、互动与创作入口。' },
    sections: [
      { section_id: 'community-1', title: '发现感兴趣的技术内容', is_free: true, local_content: '通过首页分类、发现页和标签管理，建立适合自己的内容订阅。' },
      { section_id: 'community-2', title: '参与沸点与话题讨论', is_free: true, local_content: '在沸点中分享短内容，加入话题并与其他开发者交流。' },
      { section_id: 'community-3', title: '收藏、笔记与阅读记录', is_free: true, local_content: '使用收藏、笔记和阅读记录整理内容，方便后续回顾。' }
    ]
  }
}

function formatSectionDuration(value) {
  let seconds = Math.max(0, Math.floor(Number(value) || 0))
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  seconds %= 3600
  const minutes = Math.floor(seconds / 60)
  seconds %= 60
  return `${hours ? `${hours}小时` : ''}${minutes ? `${minutes}分` : ''}${seconds ? `${seconds}秒` : ''}`
}

function formatCourseDuration(value) {
  const seconds = Number(value) || 0
  if (!seconds) return ''
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours ? `${hours} 小时` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes} 分钟` : ''}`
}

Page(theme.withTheme({
  data: {
    course: null,
    chapters: [],
    introduction: '',
    recommendations: [],
    activeTab: 'intro',
    navTotalHeight: 64,
    navCollapsed: false,
    loading: true,
    loadError: false
  },

  onLoad(query) {
    this.bookletId = query.id || ''
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusHeight = Number(info.statusBarHeight) || 20
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    const navigationHeight = menu && Number(menu.height) > 0
      ? Number(menu.height) + (Number(menu.top) - statusHeight) * 2
      : 44
    this.setData({ navTotalHeight: statusHeight + navigationHeight })
    if (!this.bookletId) {
      this.setData({ loading: false, loadError: true })
      return
    }
    this.loadDetail()
  },

  onPageScroll(event) {
    const navCollapsed = Number(event.scrollTop) > 150
    if (navCollapsed !== this.data.navCollapsed) this.setData({ navCollapsed })
  },

  loadDetail() {
    this.setData({ loading: true, loadError: false })
    const localDetail = GUIDE_DETAILS[this.bookletId]
    const task = localDetail ? Promise.resolve({ data: localDetail }) : api.courseDetail(this.bookletId)
    task.then((result) => {
      const detail = result.data || {}
      const raw = detail.booklet || {}
      const course = utils.normalizeCourse(raw)
      const chapters = (detail.sections || []).map((section, index) => ({
        id: String(section.section_id || ''),
        number: index + 1,
        title: section.title || section.draft_title || `第 ${index + 1} 节`,
        duration: formatSectionDuration(section.read_time),
        unlocked: Boolean(course.owned || Number(section.is_free) === 1 || section.is_free === true),
        isFree: Boolean(Number(section.is_free) === 1 || section.is_free === true),
        content: section.local_content || ''
      }))
      if (!course.id) throw new Error('课程详情不存在')
      course.durationText = formatCourseDuration(course.read_time)
      const history = (wx.getStorageSync('jj:course-history') || []).filter((item) => String(item.id) !== String(course.id))
      history.unshift(Object.assign({}, course, { viewedAt: Date.now() }))
      wx.setStorageSync('jj:course-history', history.slice(0, 50))
      wx.setStorageSync(`jj:course-reader:${course.id}`, { course, chapters })
      this.setData({
        course,
        chapters,
        introduction: markdown.normalizeImageSources((detail.introduction && detail.introduction.content) || course.summary),
        loading: false
      })
      this.loadRecommendations()
    }).catch(() => this.setData({ loading: false, loadError: true }))
  },

  loadRecommendations() {
    api.courseRecommendations('0', 20).then(({ result }) => {
      const recommendations = (result.data || []).map(utils.normalizeCourse).filter((item) => item.id)
      this.setData({ recommendations })
    }).catch(() => this.setData({ recommendations: [] }))
  },

  openChapter(event) {
    const chapterId = String(event.currentTarget.dataset.id || '')
    const chapter = this.data.chapters.find((item) => String(item.id) === chapterId)
    if (!chapter) return
    wx.navigateTo({
      url: `/features/courseReader/courseReader?bookletId=${this.data.course.id}&sectionId=${chapter.id}`
    })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.id })
  },

  startTrial() {
    const chapter = this.data.chapters.find((item) => item.isFree) || this.data.chapters.find((item) => item.unlocked)
    if (!chapter) {
      utils.toast('当前小册没有可试读章节')
      return
    }
    this.openChapter({ currentTarget: { dataset: { id: chapter.id } } })
  },

  openRecommendation(event) {
    const id = String(event.detail && event.detail.item && event.detail.item.id || '')
    if (id) wx.redirectTo({ url: `/features/courseDetail/courseDetail?id=${id}` })
  },

  goBack() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    if (pages.length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/xiaoce/xiaoce' })
  },

  showMore() {
    wx.showActionSheet({ itemList: ['分享小册', '举报'] })
  },

  buyCourse() {
    if (this.data.course && this.data.course.owned) {
      this.startTrial()
      return
    }
    utils.toast('请在掘金 App 或官网购买')
  },

  onShareAppMessage() {
    return {
      title: this.data.course ? this.data.course.title : '掘金小册',
      path: `/features/courseDetail/courseDetail?id=${this.bookletId}`
    }
  }
}))
