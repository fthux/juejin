const config = getApp().globalData.config
const utils = require('../../utils/utils.js')
Page({
  data: {
    list: [],
    auth: {},
    thirduid: '',
  },
  onLoad(query) {
    if (query && query.thirduid) {
      let thirduid = query && query.thirduid
      this.setData({
        thirduid,
      })
    }
    let auth = utils.ifLogined()
    this.setData({
      auth,
    })
    this.getUserLog()
  },
  toPostDetail(e) {
    wx.navigateTo({
      url: `/features/post/post?id=${e.currentTarget.dataset.id}`,
    })
  },
  getUserLog() {
    const auth = this.data.auth
    let list = this.data.list
    if (utils.isEmptyObject(list)) {
      list = [{ beforeAtString: '' }]
    }
    let before = (list.slice(-1)[0].beforeAtString) || ''
    wx.request({
      url: `${config.ufpApiMsRequestUrl}/getUserLog`,
      data: {
        uid: this.data.thirduid || auth.uid,
        token: auth.token || '',
        src: 'web',
        before,
      },
      success: (res) => {
        let data = res.data
        if (data.s === 1) {
          let list = data.d || []
          this.setData({
            list: this.data.list.concat(list),
          })
        } else {
          wx.showToast({
            title: data.m.toString(),
            icon: 'none',
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网路开小差，请稍后再试',
          icon: 'none',
        })
      },
    })
  },
  onReachBottom() {
    this.getUserLog()
  },
})