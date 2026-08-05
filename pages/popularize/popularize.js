const session = require('../../services/session.js')

Page({
  data: {
    tabs: ['全部', '后端', '前端', 'Android', 'iOS', '人工智能'],
    activeTab: '全部',
    courses: [
      { title: '从零打造一个 AI Agent CLI', author: '谭sir', price: '¥59.40', oldPrice: '¥99.00', reward: '推广赚 ¥19.80' },
      { title: 'AI Agents 开发实践', author: '言萧凡_CookieBoty', price: '¥77.40', oldPrice: '¥129.00', reward: '推广赚 ¥25.80' },
      { title: 'AI 全栈编程生存指南', author: '张风捷特烈', price: '¥59.40', oldPrice: '¥99.00', reward: '推广赚 ¥19.80' },
      { title: 'Openclaw 入门详解', author: 'duange', price: '¥5.94', oldPrice: '¥9.90', reward: '推广赚 ¥1.98' }
    ]
  },

  onLoad() {
    this.authorized = session.requirePage('/pages/popularize/popularize')
  },

  selectTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  }
})
