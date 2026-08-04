Page({
  data: {
    stats: [
      { label: '总阅读', value: '12,680', change: '+12.4%' },
      { label: '总点赞', value: '328', change: '+8.2%' },
      { label: '总评论', value: '96', change: '+5.1%' },
      { label: '新增关注', value: '42', change: '+16.8%' }
    ],
    entries: [
      { name: '数据中心', description: '查看内容表现与趋势', icon: '/assets/app/creator/ic_creator_data_center.webp', url: '/pages/creatorData/creatorData' },
      { name: '关注数据', description: '关注者变化与画像', icon: '/assets/app/creator/ic_creator_follow_data_center.webp', url: '/pages/creatorFans/creatorFans' },
      { name: '创作活动', description: '参与社区创作活动', icon: '/assets/app/creator/ic_creator_activity.webp', url: '/pages/creatorActivities/creatorActivities' },
      { name: '草稿箱', description: '继续未完成的创作', icon: '/assets/app/creator/ic_creator_draft_list.webp', url: '/pages/drafts/drafts' }
    ]
  },

  openEntry(event) {
    const url = event.currentTarget.dataset.url
    if (url) wx.navigateTo({ url })
  },

  publishArticle() {
    wx.navigateTo({ url: '/pages/publish/publish?type=article' })
  },

  publishPin() {
    wx.navigateTo({ url: '/pages/publish/publish?type=pin' })
  },

  openLevel() {
    wx.navigateTo({ url: '/pages/level/level' })
  }
})
