const mock = require('../../data/mockData.js')

Page({
  data: {
    columns: [
      { id: 'column-1', mark: '前', title: '前端工程化实践', description: '关注构建、质量和研发体验', count: 24, followers: '1.8w', color: '#e8f3ff', articles: mock.articles.slice(0, 3) },
      { id: 'column-2', mark: '后', title: '后端架构手册', description: '可靠服务与高并发系统设计', count: 32, followers: '1.3w', color: '#e8ffea', articles: mock.articles.slice(2, 5) },
      { id: 'column-3', mark: 'AI', title: 'AI 应用开发', description: '从模型能力走向真实产品', count: 18, followers: '9800', color: '#fff7e8', articles: mock.articles.slice(4, 7) },
      { id: 'column-4', mark: '端', title: '移动端性能优化', description: 'Android 与 iOS 的性能实践', count: 21, followers: '7600', color: '#f5e8ff', articles: mock.articles.slice(5, 8) }
    ]
  },

  openColumn(event) {
    const id = event.currentTarget.dataset.id
    const column = this.data.columns.find((item) => item.id === id)
    if (!column || !column.articles.length) return
    wx.navigateTo({ url: `/pages/post/post?id=${column.articles[0].article_id}` })
  }
})
