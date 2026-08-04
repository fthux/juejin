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
    noop() {
      // The native share button is handled by the page's onShareAppMessage.
    }
  }
})
