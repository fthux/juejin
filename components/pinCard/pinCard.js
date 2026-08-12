Component({
  data: {
    contentExpanded: false,
    contentCanToggle: false
  },

  properties: {
    item: {
      type: Object,
      value: {},
      observer() {
        this.resetContentState()
      }
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
    showMore: {
      type: Boolean,
      value: true
    },
    followed: {
      type: Boolean,
      value: false
    }
  },

  lifetimes: {
    ready() {
      this.resetContentState()
    },
    detached() {
      this.contentMeasureId = (this.contentMeasureId || 0) + 1
    }
  },

  methods: {
    resetContentState() {
      const measureId = (this.contentMeasureId || 0) + 1
      this.contentMeasureId = measureId
      this.setData({ contentExpanded: false, contentCanToggle: false }, () => {
        this.createSelectorQuery()
          .select('.pin-content-visible').boundingClientRect()
          .select('.pin-content-measure').boundingClientRect()
          .exec((rects) => {
            if (measureId !== this.contentMeasureId) return
            const visible = rects && rects[0]
            const measured = rects && rects[1]
            const contentCanToggle = Boolean(visible && measured && measured.height > visible.height + 1)
            if (contentCanToggle !== this.data.contentCanToggle) this.setData({ contentCanToggle })
          })
      })
    },
    toggleContent() {
      if (!this.data.contentCanToggle) return
      this.setData({ contentExpanded: !this.data.contentExpanded })
    },
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
      wx.navigateTo({ url: `/features/theme/theme?id=${themeId}` })
    },
    openTopic() {
      const topic = this.data.item && this.data.item.topic_info
      if (!topic || !topic.topic_id) return
      const cache = wx.getStorageSync('jj:topic-cache') || {}
      cache[String(topic.topic_id)] = topic
      wx.setStorageSync('jj:topic-cache', cache)
      wx.navigateTo({ url: `/features/topic/topic?id=${topic.topic_id}` })
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
