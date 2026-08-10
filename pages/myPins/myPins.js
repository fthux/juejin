const config = getApp().globalData.config
const utils = require('../../utils/utils.js')
Page({
  data: {
    COUNT: 20,
    list: [],
    auth: {},
    page: 0,
    liked: true,
    thirduid: '',
  },
  onLoad(query) {
    if (query && query.thirduid) {
      let thirduid = query && query.thirduid
      this.setData({
        thirduid,
      })
    }
    let liked = query && query.liked
    let auth = utils.ifLogined()
    this.setData({
      auth,
    })
    if (liked) {
      this.setData({
        liked: true,
      })
      wx.setNavigationBarTitle({
        title: '赞过的沸点',
      })
      this.getUserLikedList()
    } else {
      this.setData({
        liked: false,
      })
      wx.setNavigationBarTitle({
        title: '沸点',
      })
      this.getUserList()
    }
  },
  toPostDetail(e) {
    wx.navigateTo({
      url: `/features/post/post?id=${e.currentTarget.dataset.id}`,
    })
  },
  // 我赞过的沸点
  getUserLikedList() {
    const auth = this.data.auth
    let list = this.data.list
    if (utils.isEmptyObject(list)) {
      list = [{ createdAt: '' }]
    }
    let before = (list.slice(-1)[0].createdAt) || ''
    wx.request({
      url: `${config.shortMsgMsRequestUrl}/getUserLikedList`,
      data: {
        uid: this.data.thirduid || auth.uid,
        page: this.data.page,
        pageSize: this.data.COUNT,
        token: auth.token,
        device_id: auth.clientId,
        client_id: auth.clientId,
        src: 'web',
        before,
      },
      success: (res) => {
        let data = res.data
        if (data.s === 1) {
          let list = (data.d && data.d.list) || []
          if (!utils.isEmptyObject(list)) {
            let page = this.data.page + 1
            this.setData({
              page,
              list: this.data.list.concat(list),
            })
          }
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
  // 我的沸点
  getUserList() {
    const auth = this.data.auth
    let list = this.data.list
    if (utils.isEmptyObject(list)) {
      list = [{ createdAt: '' }]
    }
    let before = (list.slice(-1)[0].createdAt) || ''
    wx.request({
      url: `${config.shortMsgMsRequestUrl}/getUserList`,
      data: {
        uid: this.data.thirduid || auth.uid,
        currentUid: auth.uid,
        limit: this.data.COUNT,
        token: auth.token,
        device_id: auth.clientId,
        src: 'web',
        before,
      },
      success: (res) => {
        let data = res.data
        if (data.s === 1) {
          let list = (data.d && data.d.list) || []
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
    let liked = this.data.liked
    if (liked) {
      this.getUserLikedList()
    } else {
      this.getUserList()
    }
  },
})