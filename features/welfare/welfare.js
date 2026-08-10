const session = require('../../services/session.js')

Page({
  onLoad() {
    this.authorized = session.requirePage('/features/welfare/welfare')
  }
})
