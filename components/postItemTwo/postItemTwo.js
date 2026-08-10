let utils = require('../../utils/utils.js')
Component({
  properties: {
    avatar: {
      type: String,
      value: '/img/default_avatar.png'
    },
    userName: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    briefContent: {
      type: String,
      value: ''
    },
    coverImage: {
      type: String,
      value: ''
    },
    likeCount: {
      type: Number,
      value: ''
    },
    commentCount: {
      type: Number,
      value: ''
    },
    tags: {
      type: Array,
      value: []
    },
    articleId: {
      type: String,
      value: ''
    },
    adUrl: {
      type: String,
      value: ''
    }
  },
  methods: {
    toPostDetail(e) {
      if (this.data.adUrl) {
        wx.setClipboardData({
          data: this.data.adUrl,
          success(res) {
            console.error('res1 ', res)
            wx.showToast({
              title: '链接已复制，请在浏览器中打开',
              icon: 'none',
            })
          },
          fail(res) {
            console.error('res ', res)
          }
        })
      } else {
        wx.navigateTo({
          url: `/features/post/post?id=${e.currentTarget.dataset.article_id}`,
        })
      }
    },
    toPersonal(e) {
      let item = e.currentTarget.dataset.item
      wx.navigateTo({
        url: `/pages/personal/personal?thirduid=${item.user.objectId}`,
      })
    },
  },
})