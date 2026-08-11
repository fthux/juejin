const theme = require('../../utils/theme.js')

Page(theme.withTheme({
  data: {
    hasReadAll: false,
    continuing: false
  },

  onReady() {
    this.observeReadEnd()
    this.checkReadCompletion()
  },

  onUnload() {
    if (this.readObserver) this.readObserver.disconnect()
    if (this.readCheckTimer) clearTimeout(this.readCheckTimer)
  },

  observeReadEnd() {
    if (!this.createIntersectionObserver) return
    this.readObserver = this.createIntersectionObserver({ thresholds: [0, 1] })
    this.readObserver
      .relativeTo('.disclaimer-scroll')
      .observe('.disclaimer-end', (result) => {
        if (result.intersectionRatio > 0) this.markAsRead()
      })
  },

  checkReadCompletion() {
    const query = this.createSelectorQuery()
    query.select('.disclaimer-scroll').boundingClientRect()
    query.select('.disclaimer-end').boundingClientRect()
    query.exec(([viewport, end]) => {
      if (!viewport || !end) return
      if (end.top <= viewport.bottom + 1) this.markAsRead()
    })
  },

  trackReadProgress() {
    if (this.data.hasReadAll || this.readCheckTimer) return
    this.readCheckTimer = setTimeout(() => {
      this.readCheckTimer = null
      this.checkReadCompletion()
    }, 40)
  },

  markAsRead() {
    if (!this.data.hasReadAll) this.setData({ hasReadAll: true })
  },

  acknowledgeDisclaimer() {
    if (!this.data.hasReadAll || this.data.continuing) return
    this.setData({ continuing: true })
    const app = getApp()
    app.acknowledgeDisclaimer()
    wx.redirectTo({
      url: '/pages/launch/launch',
      fail: () => {
        app.globalData.disclaimerAcknowledged = false
        this.setData({ continuing: false })
        wx.showToast({ title: '暂时无法进入，请重试', icon: 'none' })
      }
    })
  }
}, { skipDisclaimer: true }))
