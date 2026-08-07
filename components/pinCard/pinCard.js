Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    compact: {
      type: Boolean,
      value: false
    },
    showFollow: {
      type: Boolean,
      value: false
    },
    showActions: {
      type: Boolean,
      value: true
    },
    followed: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    open() {
      this.triggerEvent('open', { item: this.data.item })
    },
    like() {
      this.triggerEvent('like', { item: this.data.item })
    },
    openAuthor() {
      const author = this.data.item && this.data.item.author
      if (!author || !author.user_id) return
      wx.setStorageSync('jj:user-current', author)
      this.triggerEvent('author', { author })
    },
    openTheme(event) {
      const segments = this.data.item && this.data.item.content_segments || []
      const segment = segments[Number(event.currentTarget.dataset.index)]
      const themeId = segment && String(segment.theme_id || '')
      if (!themeId) return
      const current = this.data.item && this.data.item.theme
      const theme = current && String(current.theme_id) === themeId
        ? current
        : { theme_id: themeId, name: segment.text || '活动标签' }
      const cache = wx.getStorageSync('jj:theme-cache') || {}
      cache[themeId] = theme
      wx.setStorageSync('jj:theme-cache', cache)
      wx.navigateTo({ url: `/pages/theme/theme?id=${themeId}` })
    },
    openTopic() {
      const topic = this.data.item && this.data.item.topic_info
      if (!topic || !topic.topic_id) return
      const cache = wx.getStorageSync('jj:topic-cache') || {}
      cache[String(topic.topic_id)] = topic
      wx.setStorageSync('jj:topic-cache', cache)
      wx.navigateTo({ url: `/pages/topic/topic?id=${topic.topic_id}` })
    },
    follow() {
      this.triggerEvent('follow', { author: this.data.item.author })
    },
    more() {
      this.triggerEvent('more', { item: this.data.item })
    },
    previewImage(event) {
      const current = event.currentTarget.dataset.src
      wx.previewImage({ current, urls: this.data.item.pic_list || [] })
    },
    noop() {
      // The native share button is handled by the page's onShareAppMessage.
    }
  }
})
