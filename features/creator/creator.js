const theme = require("../../utils/theme.js")
const session = require('../../services/session.js')

Page(theme.withTheme({
  data: {
    user: null,
    level: 1,
    progress: 0,
    progressText: '继续创作，提升创作等级',
    contentStats: [],
    followerStats: [],
    activity: {
      title: '「TRAE Work 实战帮」征文启动',
      description: '分享开发实战经验，让好内容被更多人看见'
    }
  },

  onLoad() {
    this.authorized = session.requirePage('/features/creator/creator')
  },

  onShow() {
    if (!this.authorized) return
    const current = session.getSession()
    if (!current) return
    const user = current.user
    const articles = session.getList('articles')
    const pins = session.getList('pins')
    const collections = session.getList('collections')
    const level = Number(user.level || user.level_info && user.level_info.level) || 1
    const currentScore = Number(user.power || user.level_info && user.level_info.current_score) || 0
    const nextScore = Number(user.next_level_power) || 0
    const progress = nextScore > currentScore ? Math.max(0, Math.min(100, Math.round(currentScore / nextScore * 100))) : 0
    this.setData({
      user,
      level,
      progress,
      progressText: nextScore > currentScore
        ? `还需 ${nextScore - currentScore} 成长值升级`
        : (currentScore ? `当前成长值 ${currentScore}` : '继续创作，提升创作等级'),
      contentStats: [
        { label: '总文章数', value: Number(user.post_article_count) || articles.length },
        { label: '总专栏数', value: Number(user.post_column_count) || 0 },
        { label: '总沸点数', value: Number(user.post_shortmsg_count) || pins.length },
        { label: '文章展现数', value: Number(user.got_view_count) || 0 },
        { label: '文章阅读数', value: Number(user.got_view_count) || 0 },
        { label: '文章收藏数', value: Number(user.got_collect_count) || collections.length }
      ],
      followerStats: [
        { label: '总关注者', value: Number(user.follower_count) || 0 },
        { label: '活跃关注者', value: Number(user.active_follower_count) || 0 },
        { label: '净增关注', value: Number(user.new_follower_count) || 0 }
      ]
    })
  },

  openEntry(event) {
    const url = event.currentTarget.dataset.url
    if (url) wx.navigateTo({ url })
  },

  openLevel() {
    wx.navigateTo({ url: '/features/level/level' })
  },

  openData() {
    wx.navigateTo({ url: '/features/creatorData/creatorData' })
  },

  openFans() {
    wx.navigateTo({ url: '/features/creatorFans/creatorFans' })
  },

  openActivities() {
    wx.navigateTo({ url: '/features/creatorActivities/creatorActivities' })
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/my/my' }) })
  },

  openCreate() {
    wx.showActionSheet({
      itemList: ['写文章', '发沸点'],
      success: ({ tapIndex }) => {
        const type = tapIndex === 1 ? 'pin' : 'article'
        wx.navigateTo({ url: `/features/publish/publish?type=${type}` })
      }
    })
  }
}))
