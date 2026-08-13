Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    rank: {
      type: Number,
      value: 0
    },
    compact: {
      type: Boolean,
      value: false
    },
    home: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    open() {
      this.triggerEvent('open', { item: this.data.item })
    },
    openAuthor() {
      wx.setStorageSync('jj:user-current', this.data.item.author)
      this.triggerEvent('author', { author: this.data.item.author })
    },
    dislike() {
      this.triggerEvent('dislike', { item: this.data.item })
    }
  }
})
