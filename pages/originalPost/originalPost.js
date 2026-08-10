const config = getApp().globalData.config
const utils = require('../../utils/utils.js')
Page({
  data: {
    COUNT: 20,
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
    this.getEntryBySelf()
  },
  toPostDetail(e) {
    wx.navigateTo({
      url: `/features/post/post?id=${e.currentTarget.dataset.id}`,
    })
  },
  getEntryBySelf() {
    const auth = this.data.auth
    let list = this.data.list
    if (utils.isEmptyObject(list)) {
      list = [{ verifyCreatedAt: '' }]
    }
    let before = (list.slice(-1)[0].createdAt) || ''
    wx.request({
      url: `${config.timelineRequestUrl}/get_entry_by_self`,
      data: {
        targetUid: this.data.thirduid || auth.uid,
        type: 'post',
        before,
        limit: this.data.COUNT,
        order: 'createdAt',
        uid: auth.uid || '',
        token: auth.token || '',
        device_id: auth.clientId,
        client_id: auth.clientId,
        src: 'android',
      },
      success: (res) => {
        let data = res.data
        if (data.s === 1) {
          let list = (data.d && data.d.entrylist) || []
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
    this.getEntryBySelf()
  },
})