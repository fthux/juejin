const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page({
  data: {
    notes: [],
    editing: false,
    title: '',
    content: ''
  },

  onShow() {
    this.load()
  },

  load() {
    this.setData({ notes: session.getList('notes').map((item) => Object.assign({}, item, { displayTime: utils.formatTime(item.updatedAt) })) })
  },

  create() {
    this.setData({ editing: true, title: '', content: '' })
  },

  cancel() {
    this.setData({ editing: false })
  },

  onTitleInput(event) {
    this.setData({ title: event.detail.value })
  },

  onContentInput(event) {
    this.setData({ content: event.detail.value })
  },

  save() {
    if (!this.data.content.trim()) {
      utils.toast('请输入笔记内容')
      return
    }
    session.saveNote({ title: this.data.title.trim() || '未命名笔记', content: this.data.content.trim() })
    this.setData({ editing: false })
    this.load()
  }
})
