const theme = require('../../utils/theme.js')

const OFFICIAL_RULE_URL = 'https://lf26-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/juejin/dd3cffc9-7abf-408d-9f79-95571b022def.html'

Page(theme.withTheme({
  goBack() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    if (pages.length > 1) wx.navigateBack()
    else wx.redirectTo({ url: '/features/popularize/popularize' })
  },

  showMore() {
    wx.showActionSheet({
      itemList: ['复制官方规则链接'],
      success() {
        wx.setClipboardData({ data: OFFICIAL_RULE_URL })
      }
    })
  }
}))
