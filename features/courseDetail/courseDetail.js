const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

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

Page({
  data: {
    course: null,
    chapters: [],
    introduction: '',
    readingTitle: '',
    readingContent: '',
    inBookshelf: false,
    loading: true,
    loadError: false
  },

  onLoad(query) {
    this.bookletId = query.id || ''
    if (!this.bookletId) {
      this.setData({ loading: false, loadError: true })
      return
    }
    this.loadDetail()
  },

  loadDetail() {
    this.setData({ loading: true, loadError: false })
    const bookshelf = wx.getStorageSync('jj:bookshelf') || []
    const localDetail = GUIDE_DETAILS[this.bookletId]
    const task = localDetail ? Promise.resolve({ data: localDetail }) : api.courseDetail(this.bookletId)
    task.then((result) => {
      const detail = result.data || {}
      const raw = detail.booklet || {}
      const course = utils.normalizeCourse(raw)
      const chapters = (detail.sections || []).map((section, index) => ({
        id: String(section.section_id || ''),
        title: `${index + 1}. ${section.title}`,
        duration: section.read_time ? `${Math.max(1, Math.round(Number(section.read_time) / 60))} 分钟` : '',
        unlocked: Boolean(course.owned || section.is_free),
        isFree: Boolean(section.is_free),
        content: section.local_content || ''
      }))
      if (!course.id) throw new Error('课程详情不存在')
      const history = (wx.getStorageSync('jj:course-history') || []).filter((item) => String(item.id) !== String(course.id))
      history.unshift(Object.assign({}, course, { viewedAt: Date.now() }))
      wx.setStorageSync('jj:course-history', history.slice(0, 50))
      this.setData({
        course,
        chapters,
        introduction: (detail.introduction && detail.introduction.content) || course.summary,
        inBookshelf: bookshelf.map(String).indexOf(String(course.id)) !== -1,
        loading: false
      })
      wx.setNavigationBarTitle({ title: course.title })
    }).catch(() => this.setData({ loading: false, loadError: true }))
  },

  toggleBookshelf() {
    if (!session.requireLogin()) return
    const list = wx.getStorageSync('jj:bookshelf') || []
    const index = list.map(String).indexOf(String(this.data.course.id))
    if (index === -1) list.unshift(this.data.course.id)
    else list.splice(index, 1)
    wx.setStorageSync('jj:bookshelf', list)
    this.setData({ inBookshelf: index === -1 })
  },

  openChapter(event) {
    const chapterId = String(event.currentTarget.dataset.id || '')
    const chapter = this.data.chapters.find((item) => String(item.id) === chapterId)
    if (!chapter) return
    this.loadChapter(chapter)
  },

  loadChapter(chapter) {
    if (!chapter.unlocked) {
      utils.toast('请在掘金 App 或官网购买后阅读')
      return
    }
    if (chapter.content) {
      this.setData({ readingTitle: chapter.title.replace(/^\d+\.\s*/, ''), readingContent: chapter.content })
      wx.pageScrollTo({ selector: '#course-reading', duration: 250 })
      return
    }
    wx.showLoading({ title: '加载中' })
    api.courseSection(chapter.id).then((result) => {
      const section = result.data && result.data.section
      const content = section && (section.content || section.app_html_content)
      if (!section || !content) throw new Error('章节内容为空')
      this.setData({ readingTitle: section.title, readingContent: content })
      wx.pageScrollTo({ selector: '#course-reading', duration: 250 })
    }).catch((error) => utils.toast(error.message || '章节加载失败')).finally(() => wx.hideLoading())
  },

  startCourse() {
    const chapter = this.data.chapters.find((item) => item.unlocked)
    if (!chapter) {
      utils.toast('当前课程没有可试读章节')
      return
    }
    this.loadChapter(chapter)
  }
})
