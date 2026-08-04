Component({
  options: {
    multipleSlots: true
  },

  properties: {
    navigation: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusHeight: 20,
    navigationHeight: 44,
    menuInset: 12
  },

  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const statusHeight = Number(info.statusBarHeight) || 20
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      const hasMenu = menu && Number(menu.width) > 0 && Number(menu.top) >= statusHeight
      this.setData({
        statusHeight,
        navigationHeight: hasMenu ? Number(menu.height) + (Number(menu.top) - statusHeight) * 2 : 44,
        menuInset: hasMenu ? Number(info.windowWidth) - Number(menu.left) + 8 : 12
      })
    }
  }
})
