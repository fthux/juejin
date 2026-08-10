const theme = require('../../utils/theme.js')
const api = require('../../services/api.js')
const utils = require('../../utils/utils.js')
const markdown = require('../utils/markdown.js')

Page(theme.withTheme({
  data: {
    course: null,
    chapters: [],
    chapter: null,
    chapterIndex: -1,
    content: '',
    loading: true,
    loadError: false,
    catalogOpen: false,
    hasPrevious: false,
    hasNext: false
  },

  onLoad(query) {
    this.bookletId = String(query.bookletId || '')
    const sectionId = String(query.sectionId || '')
    const cached = wx.getStorageSync(`jj:course-reader:${this.bookletId}`) || {}
    const chapters = Array.isArray(cached.chapters) ? cached.chapters : []
    const chapterIndex = chapters.findIndex((item) => String(item.id) === sectionId)
    if (!cached.course || chapterIndex === -1) {
      this.setData({ loading: false, loadError: true })
      return
    }
    this.setData({ course: cached.course, chapters })
    this.openChapterAt(chapterIndex)
  },

  openChapterAt(chapterIndex) {
    const chapter = this.data.chapters[chapterIndex]
    if (!chapter) return
    this.setData({
      chapter,
      chapterIndex,
      content: '',
      loading: Boolean(chapter.unlocked),
      loadError: false,
      catalogOpen: false,
      hasPrevious: chapterIndex > 0,
      hasNext: chapterIndex < this.data.chapters.length - 1
    })
    wx.setNavigationBarTitle({ title: chapter.title || '小册章节' })
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
    if (!chapter.unlocked) {
      this.setData({ loading: false })
      return
    }
    if (chapter.content) {
      this.setData({ content: chapter.content, loading: false })
      return
    }
    const cachedContent = this.contentById && this.contentById[chapter.id]
    if (cachedContent) {
      this.setData({ content: cachedContent, loading: false })
      return
    }
    api.courseSection(chapter.id).then((result) => {
      const section = result.data && result.data.section
      const markdownContent = section && section.markdown_show
      const htmlContent = section && (section.content || section.app_html_content)
      const content = markdownContent
        ? markdown.toHtml(markdownContent)
        : markdown.normalizeImageSources(htmlContent || '')
      if (!content) throw new Error('章节内容为空')
      this.contentById = this.contentById || {}
      this.contentById[chapter.id] = content
      this.setData({ content, loading: false })
    }).catch((error) => {
      this.setData({ loading: false, loadError: true })
      utils.toast(error.message || '章节加载失败')
    })
  },

  openCatalogChapter(event) {
    this.openChapterAt(Number(event.currentTarget.dataset.index))
  },

  toggleCatalog() {
    this.setData({ catalogOpen: !this.data.catalogOpen })
  },

  closeCatalog() {
    this.setData({ catalogOpen: false })
  },

  previousChapter() {
    if (this.data.hasPrevious) this.openChapterAt(this.data.chapterIndex - 1)
  },

  nextChapter() {
    if (this.data.hasNext) this.openChapterAt(this.data.chapterIndex + 1)
  },

  showComments() {
    utils.toast('请在掘金 App 中参与章节讨论')
  },

  buyCourse() {
    utils.toast('请在掘金 App 或官网购买')
  },

  retry() {
    this.openChapterAt(this.data.chapterIndex)
  }
}))
