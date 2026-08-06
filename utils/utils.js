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

function normalizeImageUrl(value, size) {
  let url = String(value || '').split('#')[0]
  if (size && /~tplv-k3u1fbpfcp-jj:0:0:0:0/.test(url)) {
    url = url.replace('~tplv-k3u1fbpfcp-jj:0:0:0:0', `~tplv-k3u1fbpfcp-jj:${size}:${size}:0:0`)
  }
  return url
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

function normalizeHotRank(raw) {
  const item = raw || {}
  const content = item.content || item.article_info || item
  const counter = item.content_counter || item.counter || item
  const author = item.author || item.author_user_info || {}
  return {
    article_id: content.content_id || content.article_id || item.article_id || '',
    title: content.title || item.title || '无标题文章',
    brief_content: content.brief || item.brief_content || '',
    cover_image: content.cover_image || item.cover_image || '',
    ctime: '',
    digg_count: formatCount(counter.like || item.digg_count),
    tags: [],
    author: {
      user_id: author.user_id || content.author_id || '',
      user_name: author.name || author.user_name || item.author_name || '掘金用户',
      avatar_large: author.avatar || author.avatar_large || '/assets/app/common/default_avatar.webp'
    },
    hot_rank: String(Math.round(Number(counter.hot_rank) || Number(item.hot_rank) || Number(item.view_count) || 0)),
    collect_count: formatCount(counter.collect || item.collect_count),
    comment_count: formatCount(counter.comment_count || item.comment_count),
    view_count: formatCount(counter.view || item.view_count)
  }
}

function normalizeHotAuthor(raw) {
  const item = raw || {}
  const author = item.author || item
  const counter = item.author_counter || item
  return {
    user_id: author.user_id || '',
    user_name: author.name || author.user_name || '掘金用户',
    avatar_large: author.avatar || author.avatar_large || '/assets/app/common/default_avatar.webp',
    job_title: author.job_title || '',
    company: author.company || '',
    follower_count: formatCount(counter.follower || author.follower_count),
    got_digg_count: formatCount(counter.like || author.got_digg_count),
    hot_rank: formatCount(Math.round(Number(counter.hot_rank) || 0))
  }
}

function normalizeHeadline(raw) {
  const item = raw || {}
  const info = item.content_info || item
  const author = item.author_user_info || item.author || {}
  return {
    content_id: info.content_id || item.content_id || info.article_id || item.article_id || '',
    title: info.title || item.title || '无标题资讯',
    brief: info.brief || info.brief_content || item.brief_content || '',
    thumbnail: info.thumbnail || info.cover_image || item.cover_image || '',
    url: info.content || info.link_url || item.link_url || '',
    source: author.user_name || author.name || item.author_name || '头条精选',
    publish_time: info.publish_time_string || formatTime(info.publish_time || info.ctime || item.ctime),
    digg_count: formatCount((item.content_counter && item.content_counter.digg) || info.digg_count || item.digg_count)
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
    pic_list: (info.pic_list || []).map((pic) => typeof pic === 'string' ? pic : (pic.pic_url || pic.url || '')).filter(Boolean),
    link: info.link || info.url || item.link || '',
    link_title: info.url_title || info.link_title || '',
    topic,
    ctime: formatTime(info.ctime || item.ctime),
    digg_count: formatCount(item.digg_count || info.digg_count),
    comment_count: formatCount(item.comment_count || info.comment_count),
    is_digg: Boolean(item.user_interact && item.user_interact.is_digg),
    is_followed: Boolean(item.user_interact && item.user_interact.is_follow),
    author: {
      user_id: author.user_id || '',
      user_name: author.user_name || '掘友',
      avatar_large: author.avatar_large || '/assets/app/common/default_avatar.webp',
      job_title: author.job_title || '',
      company: author.company || ''
    }
  }
}

function normalizeTopic(raw) {
  const item = raw || {}
  const topic = item.topic || item
  const icon = normalizeImageUrl(topic.icon || topic.icon_url || topic.topic_pic || '', 160)
  return {
    topic_id: String(item.topic_id || topic.topic_id || ''),
    title: String(topic.title || '圈子'),
    description: topic.description || topic.notice || '',
    iconUrl: /^https?:\/\//.test(icon) || /^\//.test(icon) ? icon : '',
    iconText: icon && !/^https?:\/\//.test(icon) && !/^\//.test(icon) ? icon : String(topic.title || '#').slice(0, 2),
    follower_count: formatCount(topic.follower_count || item.follower_count),
    msg_count: formatCount(topic.msg_count || item.msg_count || item.short_msg_count)
  }
}

function normalizeTheme(raw) {
  const item = raw || {}
  const theme = item.theme || item
  return {
    theme_id: String(theme.theme_id || ''),
    name: theme.name || '掘金活动',
    cover: normalizeImageUrl(theme.cover || '', 700),
    brief: theme.brief || '',
    hot: formatCount(theme.hot),
    user_count: formatCount(theme.user_cnt),
    recent_users: (item.recent_users || []).slice(0, 4).map((user) => ({
      user_id: String(user.user_id || ''),
      avatar_large: normalizeImageUrl(user.avatar_large || '/assets/app/common/default_avatar.webp', 80)
    }))
  }
}

function normalizeCollectionSet(raw) {
  const item = raw || {}
  const info = item.collection_set || item.collection || item
  const creator = item.creator || item.user_info || {}
  return {
    collection_id: String(info.collection_id || info.collection_set_id || ''),
    name: info.collection_name || info.name || '优质收藏集',
    description: info.description || item.description || '',
    update_time: Number(info.update_time || info.mtime) || 0,
    article_count: Number(info.post_article_count || info.article_count) || 0,
    follower_value: Number(info.concern_user_count || info.follow_count) || 0,
    follower_count: formatCount(info.concern_user_count || info.follow_count),
    is_follow: Boolean(info.is_follow),
    creator: {
      user_id: String(creator.user_id || info.creator_id || ''),
      user_name: creator.user_name || creator.name || '掘金用户',
      avatar_large: normalizeImageUrl(creator.avatar_large || '/assets/app/common/default_avatar.webp', 80)
    },
    articles: (item.articles || item.article_list || []).map(normalizeArticle)
  }
}

function normalizeRecommendedAuthor(raw) {
  const item = raw || {}
  const articleAuthor = item.articles && item.articles.length
    ? ((item.articles[0].author_user_info) || {})
    : {}
  return {
    user_id: String(item.user_id || articleAuthor.user_id || ''),
    user_name: item.user_name || articleAuthor.user_name || '掘金用户',
    avatar_large: normalizeImageUrl(item.avatar_large || articleAuthor.avatar_large || '/assets/app/common/default_avatar.webp', 160),
    job_title: item.job_title || articleAuthor.job_title || '',
    company: item.company || articleAuthor.company || '',
    description: item.author_desc || item.description || articleAuthor.description || '',
    follower_count: formatCount(item.follower_count || articleAuthor.follower_count),
    got_digg_count: formatCount(item.got_digg_count || articleAuthor.got_digg_count),
    got_view_count: formatCount(item.got_view_count || articleAuthor.got_view_count),
    article_count: Number(item.post_article_count || articleAuthor.post_article_count) || 0,
    is_followed: Boolean(item.isfollowed),
    articles: (item.articles || []).slice(0, 3).map(normalizeArticle)
  }
}

function authorToColumn(author) {
  const item = author || {}
  const firstArticle = item.articles && item.articles[0]
  return {
    column_id: `author-${item.user_id || ''}`,
    title: `${item.user_name || '掘金作者'} 的专栏`,
    description: item.description || '持续分享一线技术实践与思考',
    cover: item.avatar_large || '',
    tag: firstArticle && firstArticle.tags && firstArticle.tags.length ? firstArticle.tags[0] : '',
    article_count: item.article_count || (item.articles || []).length,
    follower_value: 0,
    follower_count: item.follower_count || '0',
    creator: { user_id: String(item.user_id || ''), user_name: item.user_name || '掘金用户' },
    articles: item.articles || []
  }
}

function normalizeColumn(raw) {
  const item = raw || {}
  const info = item.column || item.column_info || item
  const creator = item.creator || item.author_user_info || item.user_info || {}
  return {
    column_id: String(info.column_id || info.id || ''),
    title: info.title || info.column_name || info.name || '技术专栏',
    description: info.description || info.brief || '',
    cover: normalizeImageUrl(info.cover || info.cover_image || '', 240),
    tag: info.tag_name || info.category_name || '',
    article_count: Number(info.article_count || info.post_article_count) || 0,
    follower_value: Number(info.follow_count || info.concern_user_count) || 0,
    follower_count: formatCount(info.follow_count || info.concern_user_count),
    creator: {
      user_id: String(creator.user_id || info.user_id || ''),
      user_name: creator.user_name || creator.name || '掘金用户'
    },
    articles: (item.articles || item.article_list || []).slice(0, 3).map(normalizeArticle)
  }
}

function normalizeLiveActivity(raw) {
  const item = raw || {}
  const statusMap = { 1: '直播中', 2: '预告', 3: '回放', 4: '已结束' }
  const timestamp = Number(item.live_time) || 0
  const date = timestamp ? new Date(timestamp * 1000) : null
  return {
    activity_id: String(item.activity_id || item.id || ''),
    activity_type: Number(item.activity_type) || 0,
    status: Number(item.status) || 0,
    status_text: statusMap[Number(item.status)] || '直播',
    name: item.name || '掘金直播',
    cover_img: normalizeImageUrl(item.cover_img || item.cover || '', 720),
    live_time: date && !Number.isNaN(date.getTime())
      ? `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
      : '',
    view_url: item.view_url || item.sign_url || '',
    can_reserve: Boolean(item.is_reservation_enable)
  }
}

function normalizeComment(raw) {
  const item = raw || {}
  const info = item.comment_info || item
  const user = item.user_info || {}
  return {
    id: item.comment_id || info.comment_id || '',
    content: info.comment_content || '',
    time: formatTime(info.ctime),
    digg_count: formatCount(info.digg_count),
    reply_count: Number(info.reply_count) || 0,
    avatar: user.avatar_large || '/assets/app/common/default_avatar.webp',
    user: user.user_name || '掘友',
    user_id: user.user_id || ''
  }
}

function formatPrice(value) {
  const price = Number(value) || 0
  const text = (price / 100).toFixed(2)
  return text.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function normalizeCourse(raw) {
  const item = raw || {}
  const info = item.base_info || item.booklet_info || item
  const user = item.user_info || info.user_info || {}
  const event = item.event_discount || {}
  const originalPrice = Number(info.price) || 0
  const discountRate = Number(event.discount_rate) || 0
  const salePrice = discountRate > 0 && discountRate < 10
    ? Math.round(originalPrice * discountRate / 10)
    : originalPrice
  const updatedCount = Number(item.section_updated_count) || Number(info.section_count) || 0
  const progressSource = item.reading_progress || info.reading_progress || 0
  const progress = typeof progressSource === 'object'
    ? Number(progressSource.progress || progressSource.percent || progressSource.read_percent) || 0
    : Number(progressSource) || 0

  return {
    id: item.booklet_id || info.booklet_id || '',
    title: info.title || '掘金小册',
    summary: info.summary || info.introduction || '',
    cover: info.cover_img || '/assets/app/common/default_booklet_cover_image.webp',
    category_id: info.category_id || '',
    priceValue: salePrice,
    price: formatPrice(salePrice),
    originalPrice: salePrice < originalPrice ? formatPrice(originalPrice) : '',
    section_count: Number(info.section_count) || 0,
    buy_count: formatCount(info.buy_count),
    statusText: Number(info.is_finished) === 1 ? '已完结' : `已更新${updatedCount}小节`,
    author: user.user_name || info.author_name || '稀土掘金',
    authorLevel: Number(user.level || (user.user_growth_info && user.user_growth_info.jpower_level)) || 0,
    vip: Boolean(info.can_vip_borrow),
    isNew: Boolean(item.is_new),
    discountLabel: event.show_label || event.desc || '',
    owned: Boolean(item.is_buy),
    progress: progress > 0 && progress <= 1 ? Math.round(progress * 100) : Math.min(100, Math.round(progress))
  }
}

module.exports = {
  formatCount,
  formatTime,
  dateKey,
  getUuid,
  normalizeImageUrl,
  navigate,
  toast,
  normalizeArticle,
  normalizeHotRank,
  normalizeHotAuthor,
  normalizeHeadline,
  normalizePin,
  normalizeTopic,
  normalizeTheme,
  normalizeCollectionSet,
  normalizeRecommendedAuthor,
  authorToColumn,
  normalizeColumn,
  normalizeLiveActivity,
  normalizeComment,
  normalizeCourse,
  formatPrice
}
