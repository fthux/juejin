const session = require('../../services/session.js')

Page({
  data: {
    items: [
      '账号信息',
      '个人信息',
      '内容及互动',
      '社交及关系',
      '搜索记录',
      '已购列表',
      '当前设备信息',
      '应用信息'
    ]
  },

  onLoad(query) {
    session.requirePage(`/features/personalInfo/personalInfo${query && query.from ? `?from=${query.from}` : ''}`)
  }
})
