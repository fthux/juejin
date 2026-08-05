const session = require('../../services/session.js')

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
      session.cacheArticle(this.data.item)
      this.triggerEvent('open', { item: this.data.item })
    },
    openAuthor() {
      this.triggerEvent('author', { author: this.data.item.author })
    },
    dislike() {
      this.triggerEvent('dislike', { item: this.data.item })
    }
  }
})
