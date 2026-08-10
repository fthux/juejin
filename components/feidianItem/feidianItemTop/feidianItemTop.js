Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
  },
  data: {},
  attached() {
  },
  methods: {
    preview (e) {
      let dataset = e.currentTarget.dataset
      let urls = dataset.urls
      let index = dataset.index
      wx.previewImage({
        urls,
        current: urls[index],
      })
    },
    toPersonal(e) {
      const userId = e.currentTarget.dataset.user_id
      // wx.navigateTo({
      //   url: `/pages/personal/personal?thirduid=${userId}`,
      // })
    },
    toFeidianDetail (e) {
      let id = e.currentTarget.dataset.id
      // wx.navigateTo({
      //   url: `/features/feidianDetail/feidianDetail?msgId=${id}`,
      // })
    },
  },
})