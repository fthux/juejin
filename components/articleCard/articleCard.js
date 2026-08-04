Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    rank: {
      type: Number,
      value: 0
    }
  },

  methods: {
    open() {
      this.triggerEvent('open', { item: this.data.item })
    },
    openAuthor() {
      this.triggerEvent('author', { author: this.data.item.author })
    }
  }
})
