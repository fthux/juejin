const config = getApp().globalData.config
const utils = require('../../utils/utils.js')
Page({
  data: {
    list: [],
    systemInfoList: [],
    auth: {},
    currentSwiper: '0',
  },
  onLoad() {
    let auth = utils.ifLogined()
    this.setData({
      auth,
    })
    this.getUserNotification()
    this.getSystemNotification()
  },
  switchSwiper(e) {
    let index = e.currentTarget.dataset.index
    this.setData({
      currentSwiper: index,
    })
  },
  swiperChanged(e) {
    this.setData({
      currentSwiper: e.detail.currentItemId,
    })
  },
  toPostDetail(e) {
    wx.navigateTo({
      url: `/features/post/post?id=${e.currentTarget.dataset.id}`,
    })
  },
  toPersonal(e) {
    let id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/personal/personal?thirduid=${id}`,
    })
  },
  // 获取用户消息
  getUserNotification() {
    const auth = this.data.auth
    let list = this.data.list
    if (utils.isEmptyObject(list)) {
      list = [{ beforeAtString: '' }]
    }
    let beforeAtString = (list.slice(-1)[0].beforeAtString) || ''
    wx.request({
      url: `${config.ufpApiMsRequestUrl}/getUserNotification`,
      data: {
        uid: auth.uid,
        token: auth.token,
        src: 'web',
        before: beforeAtString,
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
  // 获取系统消息
  getSystemNotification() {
    const auth = this.data.auth
    wx.request({
      url: `${config.userNotificationApiMsRequestUrl}/getSystemNotification`,
      data: {
        uid: auth.uid,
        token: auth.token,
        src: 'web',
        device_id: auth.clientId,
        pointer: '',
      },
      success: (res) => {
        let data = res.data
        if (data.s === 1) {
          let systemInfoList = data.d || []
          this.setData({
            systemInfoList,
          })
        } else {
          if (data.s !== 2) {
            wx.showToast({
              title: data.m.toString(),
              icon: 'none',
            })
          }
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
  getMoreUserNotification() {
    this.getUserNotification()
  },
})