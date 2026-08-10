Component({
  properties: {
    list: {
      type: Array,
      value: []
    },
  },
  methods: {
    toTagDetail(e) {
      wx.navigateTo({
        url: `/features/post/post?id=${e.currentTarget.dataset.id}`,
      })
    },
  },
})