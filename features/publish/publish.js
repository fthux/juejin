const session = require('../../services/session.js')

Page({
  onLoad() {
    session.requirePage()
  }
})
