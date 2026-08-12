const theme = require("../../utils/theme.js")
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page(theme.withTheme({
  data: {
    types: ['功能问题', '内容问题', '体验建议', '其他'],
    activeType: '功能问题',
    content: '',
    contact: ''
  },

  onLoad() {
    this.authorized = session.requirePage('/features/feedback/feedback')
  },

  selectType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type })
  },

  onContentInput(event) {
    this.setData({ content: event.detail.value })
  },

  onContactInput(event) {
    this.setData({ contact: event.detail.value })
  },

  submit() {
    const content = this.data.content.trim()
    if (!content) {
      utils.toast('请填写反馈内容')
      return
    }
    const list = wx.getStorageSync('jj:feedback') || []
    list.unshift({
      id: `feedback-${Date.now()}`,
      type: this.data.activeType,
      content,
      contact: this.data.contact.trim(),
      createdAt: Date.now()
    })
    wx.setStorageSync('jj:feedback', list.slice(0, 30))
    this.setData({ content: '', contact: '' })
    utils.toast('反馈已保存在本机')
  }
}))
