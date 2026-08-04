const mock = require('../../data/mockData.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    course: null,
    chapters: [],
    inBookshelf: false
  },

  onLoad(query) {
    const cached = (wx.getStorageSync('jj:course-cache') || []).find((item) => item.id === query.id)
    const raw = mock.courses.find((item) => item.booklet_id === query.id) || mock.courses[0]
    const info = raw.base_info
    const ownedIds = wx.getStorageSync('jj:owned-courses') || []
    const bookshelf = wx.getStorageSync('jj:bookshelf') || []
    const course = cached || {
      id: raw.booklet_id,
      title: info.title,
      summary: info.summary,
      cover: info.cover_img,
      author: raw.user_info.user_name,
      section_count: info.section_count,
      owned: ownedIds.indexOf(raw.booklet_id) !== -1,
      price: info.price ? (info.price / 100).toFixed(2) : ''
    }
    const chapters = Array.from({ length: Math.min(course.section_count, 12) }, (_, index) => ({
      id: index + 1,
      title: `${index + 1}. ${['课程导读与学习路径', '核心概念与问题边界', '从真实案例理解原理', '常见错误与定位方法'][index % 4]}`,
      duration: `${8 + index} 分钟`,
      unlocked: course.owned || index < 2
    }))
    this.setData({ course, chapters, inBookshelf: bookshelf.indexOf(course.id) !== -1 })
    wx.setNavigationBarTitle({ title: course.title })
  },

  toggleBookshelf() {
    const list = wx.getStorageSync('jj:bookshelf') || []
    const index = list.indexOf(this.data.course.id)
    if (index === -1) list.unshift(this.data.course.id)
    else list.splice(index, 1)
    wx.setStorageSync('jj:bookshelf', list)
    this.setData({ inBookshelf: index === -1 })
  },

  openChapter(event) {
    const chapter = this.data.chapters.find((item) => item.id === event.currentTarget.dataset.id)
    if (!chapter.unlocked) {
      utils.toast('该章节仅对已购用户开放')
      return
    }
    wx.showModal({ title: chapter.title, content: '本节从核心概念、典型场景和实践案例三个部分展开。', showCancel: false })
  },

  startCourse() {
    const chapter = this.data.chapters.find((item) => item.unlocked)
    if (!chapter) return
    wx.showModal({ title: chapter.title, content: '本节从核心概念、典型场景和实践案例三个部分展开。', showCancel: false })
  }
})
