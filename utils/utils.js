function formatCount(value) {
  const count = Number(value) || 0
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)}w`
  return String(count)
}

function formatTime(value) {
  if (!value) return ''
  const input = typeof value === 'number' && value < 1000000000000 ? value * 1000 : value
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function dateKey(date) {
  const value = date || new Date()
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function getUuid() {
  let uuid = wx.getStorageSync('jj:uuid')
  if (!uuid) {
    uuid = `${Date.now()}${Math.random().toString(16).slice(2)}`
    wx.setStorageSync('jj:uuid', uuid)
  }
  return uuid
}

function navigate(event) {
  const url = event.currentTarget.dataset.url
  if (!url) return
  wx.navigateTo({ url })
}

function toast(title) {
  wx.showToast({ title, icon: 'none' })
}

function normalizeArticle(raw) {
  const item = raw && raw.item_info ? raw.item_info : (raw || {})
  const info = item.article_info || item
  const author = item.author_user_info || raw.author_user_info || item.author || raw.author || {}
  const tags = item.tags || raw.tags || []
  return {
    article_id: info.article_id || item.article_id || item.item_id || '',
    title: info.title || item.title || '无标题文章',
    brief_content: info.brief_content || item.brief || '',
    cover_image: info.cover_image || item.cover || '',
    ctime: formatTime(info.ctime || item.ctime),
    digg_count: formatCount(info.digg_count || item.digg_count),
    comment_count: formatCount(info.comment_count || item.comment_count),
    view_count: formatCount(info.view_count || item.view_count),
    collect_count: formatCount(info.collect_count || item.collect_count),
    author: {
      user_id: author.user_id || item.user_id || '',
      user_name: author.user_name || item.author_name || '掘金用户',
      avatar_large: author.avatar_large || '/assets/app/common/default_avatar.webp',
      job_title: author.job_title || '',
      company: author.company || ''
    },
    tags: tags.slice(0, 2).map((tag) => tag.tag_name || tag.name || tag)
  }
}

function normalizePin(raw) {
  const item = raw || {}
  const info = item.msg_Info || item.msg_info || item
  const author = item.author_user_info || info.author_user_info || {}
  const rawTopic = info.topic || item.topic
  const topic = typeof rawTopic === 'string' ? rawTopic : ((rawTopic && rawTopic.title) || '')
  return {
    msg_id: item.msg_id || info.msg_id || '',
    content: info.content || '',
    pic_list: info.pic_list || [],
    topic,
    ctime: formatTime(info.ctime || item.ctime),
    digg_count: formatCount(item.digg_count || info.digg_count),
    comment_count: formatCount(item.comment_count || info.comment_count),
    is_digg: Boolean(item.user_interact && item.user_interact.is_digg),
    author: {
      user_id: author.user_id || '',
      user_name: author.user_name || '掘友',
      avatar_large: author.avatar_large || '/assets/app/common/default_avatar.webp',
      job_title: author.job_title || '',
      company: author.company || ''
    }
  }
}

module.exports = {
  formatCount,
  formatTime,
  dateKey,
  getUuid,
  navigate,
  toast,
  normalizeArticle,
  normalizePin
}
