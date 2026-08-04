Component({
  properties: {
    item: {
      type: Object,
      value: {}
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
    }
  }
})
