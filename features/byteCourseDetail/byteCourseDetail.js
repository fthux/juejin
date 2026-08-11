const theme = require('../../utils/theme.js')
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')
const markdown = require('../utils/markdown.js')

function formatVideoDuration(value) {
  const minutes = Math.ceil(Math.max(0, Number(value) || 0) / 60000)
  return minutes ? `${minutes}分钟` : ''
}

function normalizeChapter(raw, index) {
  const item = raw || {}
  const content = item.content || item
  const coursePackage = content.extra && content.extra.course_package || {}
  const resource = content.resource && content.resource.main || {}
  const video = resource.video || {}
  return {
    id: String(content.item_id || ''),
    number: index + 1,
    title: String(content.name || `第 ${index + 1} 节`).replace(/\s+/g, ' ').trim(),
    producer: coursePackage.producer || 'ByteTech',
    duration: formatVideoDuration(video.duration),
    videoKey: video.key || ''
  }
}

function styleIntroduction(source) {
  let html = String(source || '')
  html = html.replace('<h2>', '<h2 style="margin:0 0 12px;font-size:20px;line-height:1.45;font-weight:600">')
  html = html.replace(/<h2>/g, '<h2 style="margin:24px 0 12px;font-size:20px;line-height:1.45;font-weight:600">')
  html = html.replace(/<p>/g, '<p style="margin:0 0 16px">')
  html = html.replace(/<(ul|ol)>/g, '<$1 style="margin:0 0 18px;padding-left:24px">')
  html = html.replace(/<li>/g, '<li style="margin:0 0 10px">')
  return html
}

Page(theme.withTheme({
  data: {
    hasRuntimeSafeArea: false,
    safeAreaStyle: '',
    course: null,
    chapters: [],
    introduction: '',
    recommendations: [],
    comments: [],
    commentTotal: 0,
    commentsLoading: false,
    commentsHasMore: false,
    activeTab: 'intro',
    coverFailed: false,
    loading: true,
    loadError: false
  },

  onLoad(query) {
    this.courseId = String(query.id || '')
    this.commentCursor = '0'
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const safeArea = info.safeArea || null
    const viewportHeight = Number(info.screenHeight) || Number(info.windowHeight) || 0
    const safeAreaBottom = safeArea && viewportHeight
      ? Math.max(0, viewportHeight - Number(safeArea.bottom || viewportHeight))
      : 0
    this.setData({
      hasRuntimeSafeArea: safeAreaBottom > 0,
      safeAreaStyle: safeAreaBottom > 0 ? `--byte-safe-bottom:${safeAreaBottom}px;` : ''
    })
    if (!this.courseId) {
      this.setData({ loading: false, loadError: true })
      return
    }
    this.loadDetail()
  },

  onReachBottom() {
    if (this.data.activeTab === 'comments' && this.data.commentsHasMore) this.loadComments(false)
  },

  loadDetail() {
    this.setData({ loading: true, loadError: false })
    Promise.all([
      api.byteCourseDetail(this.courseId),
      api.byteCourseChapters(this.courseId),
      api.byteCourseRecommendations(this.courseId)
    ]).then(([detailResponse, chapterResponse, recommendationResponse]) => {
      const raw = detailResponse.result && detailResponse.result.data
      const content = raw && (raw.content || raw)
      if (!content || !content.item_id) throw new Error('课程详情不存在')

      const course = utils.normalizeByteCourse(raw)
      const extra = content.extra || {}
      const coursePackage = extra.course_package || {}
      const chapters = (chapterResponse.result && chapterResponse.result.data || [])
        .map(normalizeChapter)
        .filter((item) => item.id)
      course.summary = content.abstract || ''
      course.producer = coursePackage.producer || 'ByteTech'
      course.videoCount = Number(coursePackage.chapter_count) || chapters.length
      course.duration = course.duration || formatVideoDuration(coursePackage.duration)

      const html = extra.html_content || markdown.toHtml(content.content || course.summary)
      const recommendations = (recommendationResponse.result && recommendationResponse.result.data || [])
        .map(utils.normalizeByteCourse)
        .filter((item) => item.id && item.id !== course.id)

      const history = (wx.getStorageSync('jj:byte-course-history') || [])
        .filter((item) => String(item.id) !== course.id)
      history.unshift(Object.assign({}, course, { viewedAt: Date.now() }))
      wx.setStorageSync('jj:byte-course-history', history.slice(0, 50))

      this.setData({
        course,
        chapters,
        introduction: styleIntroduction(markdown.normalizeImageSources(html)),
        recommendations,
        loading: false
      })
      this.loadComments(true)
    }).catch(() => this.setData({ loading: false, loadError: true }))
  },

  loadComments(reload) {
    if (this.data.commentsLoading) return
    const cursor = reload ? '0' : this.commentCursor
    this.setData({ commentsLoading: true })
    api.byteCourseComments(this.courseId, cursor).then(({ result }) => {
      const rows = (result.data || []).map(utils.normalizeComment).filter((item) => item.id)
      const comments = reload ? rows : this.data.comments.concat(rows)
      this.commentCursor = result.cursor || '0'
      this.setData({
        comments,
        commentTotal: Number(result.count) || comments.length,
        commentsHasMore: Boolean(result.has_more) && rows.length > 0,
        commentsLoading: false
      })
    }).catch(() => this.setData({ commentsLoading: false, commentsHasMore: false }))
  },

  switchTab(event) {
    const activeTab = event.currentTarget.dataset.id
    if (activeTab && activeTab !== this.data.activeTab) this.setData({ activeTab })
  },

  ensureAccountPermission() {
    if (session.getSession()) return true
    return session.requireLogin()
  },

  openChapter(event) {
    const chapter = this.data.chapters[Number(event.currentTarget.dataset.index)]
    if (!chapter) return
    if (!this.ensureAccountPermission()) return
    wx.showModal({
      title: '免费试学 3 分钟',
      content: `《${chapter.title}》视频需在稀土掘金 App 或官网播放。`,
      cancelText: '取消',
      confirmText: '复制链接',
      success: (result) => {
        if (!result.confirm) return
        wx.setClipboardData({
          data: `https://juejin.cn/course/bytetech/${this.courseId}?chapter=${chapter.id}`
        })
      }
    })
  },

  startTrial() {
    if (!this.data.chapters.length) {
      utils.toast('当前课程暂无可试学章节')
      return
    }
    this.openChapter({ currentTarget: { dataset: { index: 0 } } })
  },

  openVip() {
    if (!this.ensureAccountPermission()) return
    wx.navigateTo({ url: '/features/vip/vip' })
  },

  openRecommendation(event) {
    const id = String(event.detail && event.detail.item && event.detail.item.id || '')
    if (id) wx.redirectTo({ url: `/features/byteCourseDetail/byteCourseDetail?id=${id}` })
  },

  onCoverError() {
    if (!this.data.coverFailed) this.setData({ coverFailed: true })
  }
}))
