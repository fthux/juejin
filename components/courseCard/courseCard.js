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
    }
  }
})
