const session = require('../../services/session.js')

Page({
  data: {},
  onLoad() {
    session.requirePage('/pages/registrations/registrations')
  }
})
