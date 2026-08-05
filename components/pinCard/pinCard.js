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
      this.triggerEvent('author', { author: this.data.item.author })
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
