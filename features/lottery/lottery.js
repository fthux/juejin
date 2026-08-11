const theme = require("../../utils/theme.js")
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

Page(theme.withTheme({
  data: {
    ore: 2506,
    prizes: [
      { name: '随机矿石', icon: '/features/assets/app/lottery/ic_luck.png' },
      { name: '课程5折兑换券', icon: '/features/assets/app/lottery/bg_luck_card.png' },
      { name: '曼秀雷敦唇膏', icon: '/features/assets/app/lottery/bg_luck_card.png' },
      { name: '「4201」随机周边', icon: '/features/assets/app/lottery/bg_luck_card.png' },
      { name: '「睡眠日」小礼物', icon: '/features/assets/app/lottery/bg_luck_card.png' },
      { name: '虎虎生金眼罩', icon: '/features/assets/app/lottery/bg_luck_card.png' },
      { name: '再抽1次解锁', locked: true },
      { name: '再抽2次解锁', locked: true },
      { name: '再抽3次解锁', locked: true }
    ]
  },

  onLoad() {
    this.authorized = session.requirePage('/features/lottery/lottery')
  },

  blocked() {
    utils.toast('抽奖操作仅在掘金 App 内执行')
  }
}))
