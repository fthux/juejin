const session = require('../../services/session.js')

Page({
  data: {
    conversationId: '',
    input: '',
    messages: []
  },

  onLoad(query) {
    const id = query.id || 'assistant'
    const name = query.name ? decodeURIComponent(query.name) : '掘金小助手'
    const target = `/features/chat/chat?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`
    if (!session.requirePage(target)) return
    wx.setNavigationBarTitle({ title: name })
    this.setData({ conversationId: id })
    const messages = wx.getStorageSync(`jj:chat:${id}`) || [
      { id: 'welcome', side: 'left', content: '欢迎来到稀土掘金，有什么想聊的吗？', time: '刚刚' }
    ]
    this.setData({ messages })
  },

  onInput(event) {
    this.setData({ input: event.detail.value })
  },

  send() {
    const content = this.data.input.trim()
    if (!content) return
    const messages = this.data.messages.concat({ id: `message-${Date.now()}`, side: 'right', content, time: '刚刚' })
    wx.setStorageSync(`jj:chat:${this.data.conversationId}`, messages)
    this.setData({ messages, input: '' })
  }
})
