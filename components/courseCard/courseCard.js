Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  data: {
    coverFailed: false
  },

  observers: {
    'item.cover': function () {
      if (this.data.coverFailed) this.setData({ coverFailed: false })
    }
  },

  methods: {
    onCoverError() {
      if (!this.data.coverFailed) this.setData({ coverFailed: true })
    },

    open() {
      this.triggerEvent('open', { item: this.data.item })
    }
  }
})
