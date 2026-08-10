const theme = require('../../utils/theme.js')

Page(theme.withTheme({
  data: { followSystem: true, selected: 'light' },

  onShow() {
    this.setData(theme.getPreference())
  },

  toggleSystem(event) {
    const next = Object.assign({}, this.data, { followSystem: event.detail.value })
    theme.setPreference({ followSystem: next.followSystem, selected: next.selected })
    this.setData({ followSystem: next.followSystem })
  },

  chooseMode(event) {
    const selected = event.currentTarget.dataset.mode
    theme.setPreference({ followSystem: false, selected })
    this.setData({ followSystem: false, selected })
  }
}))
