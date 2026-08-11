const theme = require('../../utils/theme.js')
const CONTACT_EMAIL = '851399101@qq.com'
const PROFILE_URL = 'https://github.com/fthux'

function displayUrl(url) {
  return String(url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const PROJECTS = [
  {
    name: 'juejin',
    icon: '/assets/app/common/ic_juejin_logo.png',
    description: '掘金非官方微信小程序，也是你正在使用的这个开源项目。',
    github: 'https://github.com/fthux/juejin'
  },
  {
    name: 'RenoPit',
    icon: '/assets/app/open-source/renopit.svg',
    description: 'AI 驱动的开源装修避坑工具，辅助检查设计、合同与报价中的潜在问题。',
    website: 'https://renopit.fthux.com/',
    github: 'https://github.com/fthux/RenoPit'
  },
  {
    name: 'GitZipPro',
    icon: '/assets/app/open-source/gitzippro.png',
    description: '按需下载 GitHub 文件和文件夹的开源浏览器扩展。',
    website: 'https://gitzippro.fthux.com/',
    github: 'https://github.com/fthux/GitZipPro'
  }
].map((project) => {
  const primaryUrl = project.website || project.github
  return Object.assign({}, project, {
    primaryUrl,
    displayAddress: displayUrl(primaryUrl)
  })
})

Page(theme.withTheme({
  data: {
    projects: PROJECTS,
    contactEmail: CONTACT_EMAIL,
    profileAddress: displayUrl(PROFILE_URL)
  },

  copyProjectLink(event) {
    const project = this.data.projects[Number(event.currentTarget.dataset.index)]
    const type = event.currentTarget.dataset.type
    const url = project && project[type]
    if (url) this.copyUrl(url)
  },

  copyPrimaryLink(event) {
    const project = this.data.projects[Number(event.currentTarget.dataset.index)]
    const url = project && project.primaryUrl
    if (url) this.copyUrl(url)
  },

  copyProfileLink() {
    this.copyUrl(PROFILE_URL)
  },

  copyEmail() {
    this.copyValue(CONTACT_EMAIL, '邮箱已复制')
  },

  copyUrl(url) {
    this.copyValue(url, '链接已复制，请在浏览器中打开')
  },

  copyValue(value, successTitle) {
    wx.setClipboardData({
      data: value,
      success() {
        wx.showToast({ title: successTitle, icon: 'none' })
      },
      fail() {
        wx.showToast({ title: '复制失败，请稍后重试', icon: 'none' })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: 'fthux 的开源作品',
      path: '/features/openSource/openSource'
    }
  }
}))
