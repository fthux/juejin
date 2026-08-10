Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
  },
  methods: {
    toPostDetail(e) {
      wx.navigateTo({
        url: `/features/post/post?id=${e.currentTarget.dataset.id}`,
      })
    },
  },
})