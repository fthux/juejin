const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

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
    api.courseDetail(this.bookletId).then((result) => {
      const detail = result.data || {}
      const raw = detail.booklet || {}
      const course = utils.normalizeCourse(raw)
      const chapters = (detail.sections || []).map((section, index) => ({
        id: String(section.section_id || ''),
        title: `${index + 1}. ${section.title}`,
        duration: section.read_time ? `${Math.max(1, Math.round(Number(section.read_time) / 60))} 分钟` : '',
        unlocked: Boolean(course.owned || section.is_free),
        isFree: Boolean(section.is_free)
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
