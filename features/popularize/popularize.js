const theme = require('../../utils/theme.js')
const api = require('../../services/api.js')
const session = require('../../services/session.js')
const utils = require('../../utils/utils.js')

const CATEGORIES = [
  { id: '', name: '全部' },
  { id: '6809637769959178254', name: '后端' },
  { id: '6809637767543259144', name: '前端' },
  { id: '6809635626879549454', name: 'Android' },
  { id: '6809635626661445640', name: 'iOS' },
  { id: '6809637773935378440', name: '人工智能' },
  { id: '6809637771511070734', name: '开发工具' },
  { id: '6809637776263217160', name: '代码人生' },
  { id: '6809637772874219534', name: '阅读' }
]

Page(theme.withTheme({
  data: {
    session: null,
    balance: '0.00',
    categories: CATEGORIES,
    activeCategory: '',
    courses: [],
    cursor: '0',
    hasMore: true,
    loading: true,
    fromCache: false
  },

  onLoad() {
    this.loadCourses(true)
  },

  onShow() {
    this.setData({ session: session.getSession() })
  },

  onPullDownRefresh() {
    this.loadCourses(true)
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadCourses(false)
  },

  loadCourses(reload) {
    if (this.data.loading && !reload) return
    const cursor = reload ? '0' : this.data.cursor
    this.setData({ loading: true })
    api.popularizeCourses(cursor, {
      categoryId: this.data.activeCategory,
      sort: 'recommend'
    }).then(({ result, fromCache }) => {
      const rows = (result.data || []).map(utils.normalizePopularizeCourse).filter((item) => item.id)
      const previous = reload ? [] : this.data.courses
      const known = new Set(previous.map((item) => item.id))
      const additions = rows.filter((item) => !known.has(item.id))
      this.setData({
        courses: previous.concat(additions),
        cursor: String(result.cursor || cursor),
        hasMore: Boolean(result.has_more) && (rows.length > 0 || String(result.cursor || '') !== String(cursor)),
        loading: false,
        fromCache: Boolean(fromCache)
      })
    }).catch(() => this.setData({ loading: false, hasMore: false, fromCache: true }))
      .finally(() => wx.stopPullDownRefresh())
  },

  selectCategory(event) {
    const categoryId = String(event.currentTarget.dataset.id || '')
    if (categoryId === this.data.activeCategory) return
    this.setData({ activeCategory: categoryId, courses: [], cursor: '0', hasMore: true, loading: false })
    this.loadCourses(true)
  },

  openCourse(event) {
    const course = this.data.courses[Number(event.currentTarget.dataset.index)]
    if (course) wx.navigateTo({ url: `/features/courseDetail/courseDetail?id=${course.id}` })
  },

  openRules() {
    wx.navigateTo({ url: '/features/popularizeRules/popularizeRules' })
  },

  openLogin() {
    wx.navigateTo({ url: '/features/login/login' })
  },

  handleBalanceAction() {
    if (!this.data.session) {
      this.openLogin()
      return
    }
    utils.toast('请在稀土掘金 App 中提现')
  },

  showBalanceHelp() {
    wx.showModal({
      title: '可提现金额',
      content: '推广佣金结算后会计入可提现金额，实际账单与提现请在稀土掘金 App 中查看。',
      showCancel: false
    })
  },

  prepareShare(event) {
    this.shareCourse = this.data.courses[Number(event.currentTarget.dataset.index)] || null
  },

  onShareAppMessage(options) {
    const index = Number(options && options.target && options.target.dataset.index)
    const course = this.data.courses[index] || this.shareCourse
    if (!course) return { title: '掘金小册', path: '/pages/xiaoce/xiaoce' }
    const distributor = this.data.session && this.data.session.user && this.data.session.user.user_id
    const suffix = distributor ? `&distributor=${distributor}` : ''
    return {
      title: course.title,
      path: `/features/courseDetail/courseDetail?id=${course.id}${suffix}`,
      imageUrl: course.distributionImage || course.cover
    }
  }
}))
