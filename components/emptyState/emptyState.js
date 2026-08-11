Component({
  properties: {
    text: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'empty'
    },
    description: {
      type: String,
      value: ''
    },
    actionText: {
      type: String,
      value: ''
    },
    actionLoading: {
      type: Boolean,
      value: false
    },
    actionDisabled: {
      type: Boolean,
      value: false
    },
    compact: {
      type: Boolean,
      value: false
    },
    skeletonRows: {
      type: Number,
      value: 3
    }
  },

  methods: {
    action() {
      if (this.data.actionLoading || this.data.actionDisabled) return
      this.triggerEvent('action', { type: this.data.type })
    }
  }
})
