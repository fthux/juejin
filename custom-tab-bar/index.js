const tabs = [
  { pagePath: '/pages/index/index', text: '首页', icon: '/assets/app/tabs/tab_home_normal.png', selectedIcon: '/assets/app/tabs/tab_home.png' },
  { pagePath: '/pages/feidian/feidian', text: '沸点', icon: '/assets/app/tabs/tab_activity.png', selectedIcon: '/assets/app/tabs/tab_activity_press.png' },
  { pagePath: '/pages/find/find', text: '发现', icon: '/assets/app/tabs/tab_find_normal.png', selectedIcon: '/assets/app/tabs/tab_find.png' },
  { pagePath: '/pages/xiaoce/xiaoce', text: '课程', icon: '/assets/app/tabs/tab_xiaoce_normal.png', selectedIcon: '/assets/app/tabs/tab_xiaoce.png' },
  { pagePath: '/pages/my/my', text: '我', icon: '/assets/app/tabs/tab_profile_normal.png', selectedIcon: '/assets/app/tabs/tab_profile.png' }
]

Component({
  data: {
    selected: 0,
    tabs
  },

  lifetimes: {
    attached() {
      this.syncSelected()
    }
  },

  pageLifetimes: {
    show() {
      this.syncSelected()
    }
  },

  methods: {
    syncSelected() {
      const pages = getCurrentPages()
      const current = pages.length ? `/${pages[pages.length - 1].route}` : ''
      const selected = tabs.findIndex((item) => item.pagePath === current)
      if (selected !== -1 && selected !== this.data.selected) this.setData({ selected })
    },

    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index)
      const tab = tabs[index]
      if (!tab || index === this.data.selected) return
      this.setData({ selected: index })
      wx.switchTab({ url: tab.pagePath })
    }
  }
})
