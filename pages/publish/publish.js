const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    type: 'pin',
    title: '',
    content: '',
    tagText: '',
    count: 0,
    publishing: false
  },

  onLoad(query) {
    const type = query.type === 'article' ? 'article' : 'pin'
    if (!session.requirePage(`/pages/publish/publish?type=${type}`)) return
    this.setData({ type })
    wx.setNavigationBarTitle({ title: type === 'article' ? '写文章' : '发布沸点' })
  },

  switchType(event) {
    const type = event.currentTarget.dataset.type
    this.setData({ type })
    wx.setNavigationBarTitle({ title: type === 'article' ? '写文章' : '发布沸点' })
  },

  onTitleInput(event) {
    this.setData({ title: event.detail.value })
  },

  onContentInput(event) {
    const content = event.detail.value
    this.setData({ content, count: content.length })
  },

  onTagsInput(event) {
    this.setData({ tagText: event.detail.value })
  },

  saveDraft() {
    if (!session.requireLogin()) return
    if (!this.data.title && !this.data.content) {
      utils.toast('还没有可保存的内容')
      return
    }
    session.saveDraft({
      type: this.data.type,
      title: this.data.title || (this.data.type === 'pin' ? '沸点草稿' : '未命名文章'),
      content: this.data.content
    })
    utils.toast('草稿已保存')
  },

  publish() {
    if (!session.requireLogin()) return
    if (!this.data.content.trim()) {
      utils.toast('请输入内容')
      return
    }
    if (this.data.type === 'article' && !this.data.title.trim()) {
      utils.toast('请输入文章标题')
      return
    }

    this.setData({ publishing: true })
    if (this.data.type === 'article') {
      session.publishArticle({
        title: this.data.title.trim(),
        content: this.data.content.trim(),
        tags: this.data.tagText.split(/[，,\s]+/).filter(Boolean).slice(0, 3)
      })
    } else {
      session.publishPin({ content: this.data.content.trim(), pic_list: [] })
    }
    utils.toast('发布成功')
    setTimeout(() => wx.navigateBack(), 500)
  }
})
