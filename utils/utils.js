function formatCount(value) {
  const count = Number(value) || 0
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)}w`
  return String(count)
}

function formatCompactCount(value) {
  const count = Number(value) || 0
  if (count >= 1000000) return `${Math.floor(count / 1000000)}M+`
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`
  return String(count)
}

function formatTime(value) {
  if (!value) return ''
  const timestamp = Number(value)
  const input = Number.isFinite(timestamp) && timestamp > 0
    ? (timestamp < 1000000000000 ? timestamp * 1000 : timestamp)
    : value
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  if (diff < 2592000000) return `${Math.floor(diff / 604800000)}周前`
  if (diff < 31536000000) return `${Math.floor(diff / 2592000000)}个月前`
  if (diff >= 31536000000) return `${Math.floor(diff / 31536000000)}年前`
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function dateKey(date) {
  const value = date || new Date()
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function formatDateTime(value, includeTime) {
  if (!value) return ''
  const input = typeof value === 'number' && value < 1000000000000 ? value * 1000 : Number(value) < 1000000000000 ? Number(value) * 1000 : value
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return includeTime ? `${datePart} ${pad(date.getHours())}:${pad(date.getMinutes())}` : datePart
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
  const result = raw && raw.result_model ? raw.result_model : (raw || {})
  const item = result && result.item_info ? result.item_info : result
  const info = item.article_info || item
  const author = item.author_user_info || result.author_user_info || item.author || result.author || {}
  const tags = item.tags || result.tags || []
  const authorGrowth = author.user_growth_info || {}
  const ctime = Number(info.ctime || item.ctime) || 0
  const mtime = Number(info.mtime || item.mtime || info.rtime || item.rtime) || ctime
  const contentCount = Number(info.content_count || item.content_count) || 0
  const estimatedMinutes = contentCount ? Math.max(1, Math.ceil(contentCount / 300)) : 0
  const diggCount = Number(info.digg_count || item.digg_count) || 0
  const commentCount = Number(info.comment_count || item.comment_count) || 0
  return {
    article_id: info.article_id || item.article_id || item.item_id || '',
    title: info.title || item.title || '无标题文章',
    brief_content: info.brief_content || item.brief || '',
    cover_image: info.cover_image || item.cover || '',
    ctime: formatTime(info.ctime || item.ctime),
    ctime_value: ctime,
    digg_count: formatCount(diggCount),
    comment_count: formatCount(commentCount),
    digg_label: diggCount > 0 ? formatCount(diggCount) : '点赞',
    comment_label: commentCount > 0 ? formatCount(commentCount) : '评论',
    view_count: formatCount(info.view_count || item.view_count),
    collect_count: formatCount(info.collect_count || item.collect_count),
    digg_count_value: diggCount,
    comment_count_value: commentCount,
    publish_date: formatDateTime(ctime, false),
    update_time: formatDateTime(mtime, true),
    read_time: info.read_time || item.read_time || (estimatedMinutes ? `${estimatedMinutes}分钟` : ''),
    author: {
      user_id: author.user_id || item.user_id || '',
      user_name: author.user_name || item.author_name || '掘金用户',
      avatar_large: author.avatar_large || '/assets/app/common/default_avatar.png',
      job_title: author.job_title || '',
      company: author.company || '',
      level: Number(author.level || authorGrowth.jpower_level) || 0
    },
    tags: tags.slice(0, 2).map((tag) => tag.tag_name || tag.name || tag),
    all_tags: tags.map((tag) => tag.tag_name || tag.name || tag).filter(Boolean)
  }
}

function normalizeHotRank(raw) {
  const item = raw || {}
  const content = item.content || item.article_info || item
  const counter = item.content_counter || item.counter || item
  const author = item.author || item.author_user_info || {}
  const diggCount = Number(counter.like || item.digg_count) || 0
  const commentCount = Number(counter.comment_count || item.comment_count) || 0
  return {
    article_id: content.content_id || content.article_id || item.article_id || '',
    title: content.title || item.title || '无标题文章',
    brief_content: content.brief || item.brief_content || '',
    cover_image: content.cover_image || item.cover_image || '',
    ctime: formatTime(content.ctime || item.ctime),
    digg_count: formatCount(diggCount),
    comment_count: formatCount(commentCount),
    digg_label: diggCount > 0 ? formatCount(diggCount) : '点赞',
    comment_label: commentCount > 0 ? formatCount(commentCount) : '评论',
    tags: [item.category && item.category.category_name].filter(Boolean),
    author: {
      user_id: author.user_id || content.author_id || '',
      user_name: author.name || author.user_name || item.author_name || '掘金用户',
      avatar_large: author.avatar || author.avatar_large || '/assets/app/common/default_avatar.png'
    },
    hot_rank: String(Math.round(Number(counter.hot_rank) || Number(item.hot_rank) || Number(item.view_count) || 0)),
    collect_count: formatCount(counter.collect || item.collect_count),
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
    avatar_large: author.avatar || author.avatar_large || '/assets/app/common/default_avatar.png',
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
  const diggCount = Number((item.content_counter && (item.content_counter.digg || item.content_counter.like)) || info.digg_count || item.digg_count) || 0
  const commentCount = Number((item.content_counter && (item.content_counter.comment || item.content_counter.comment_count)) || info.comment_count || item.comment_count) || 0
  return {
    content_id: info.content_id || item.content_id || info.article_id || item.article_id || '',
    title: info.title || item.title || '无标题资讯',
    brief: info.brief || info.brief_content || item.brief_content || '',
    thumbnail: info.thumbnail || info.cover_image || item.cover_image || '',
    url: info.content || info.link_url || item.link_url || '',
    source: author.user_name || author.name || item.author_name || '头条精选',
    avatar: normalizeImageUrl(author.avatar_large || author.avatar || '/assets/app/common/default_avatar.png', 80),
    publish_time: info.publish_time_string || formatTime(info.publish_time || info.ctime || item.ctime),
    digg_count: formatCount(diggCount),
    comment_count: formatCount(commentCount),
    digg_label: diggCount > 0 ? formatCount(diggCount) : '点赞',
    comment_label: commentCount > 0 ? formatCount(commentCount) : '评论'
  }
}

function parsePinContent(value) {
  const source = String(value || '')
  const segments = []
  const themes = []
  const markerPattern = /\[(\d+)#([^#\]\r\n]+)#\]/g
  let cursor = 0
  let match

  while ((match = markerPattern.exec(source))) {
    if (match.index > cursor) {
      segments.push({ type: 'text', text: source.slice(cursor, match.index) })
    }
    const theme = { theme_id: String(match[1]), name: String(match[2]).trim() }
    themes.push(theme)
    segments.push({ type: 'theme', text: theme.name, theme_id: theme.theme_id })
    cursor = markerPattern.lastIndex
  }
  if (cursor < source.length) segments.push({ type: 'text', text: source.slice(cursor) })
  if (!segments.length && source) segments.push({ type: 'text', text: source })

  return {
    content: segments.map((segment) => segment.type === 'theme' ? `#${segment.text}#` : segment.text).join(''),
    segments: segments.map((segment, index) => Object.assign({ key: `${segment.type}-${index}` }, segment)),
    themes
  }
}

function normalizePin(raw) {
  const item = raw || {}
  const info = item.msg_Info || item.msg_info || item
  const author = item.author_user_info || info.author_user_info || {}
  const rawTopic = item.topic || info.topic || {}
  const rawTopicId = String(rawTopic.topic_id || info.topic_id || item.topic_id || '')
  const rawTopicTitle = typeof rawTopic === 'string' ? rawTopic : ((rawTopic && rawTopic.title) || '')
  const theme = item.theme || info.theme || {}
  const parsedContent = parsePinContent(info.content)
  const markerTheme = parsedContent.themes[0] || {}
  const rawThemeId = String(theme.theme_id || info.theme_id || item.theme_id || markerTheme.theme_id || '')
  const topicId = rawTopicId && rawTopicId !== '0' ? rawTopicId : ''
  const themeId = rawThemeId && rawThemeId !== '0' ? rawThemeId : ''
  const topicTitle = /^\d+$/.test(String(rawTopicTitle).trim()) ? '' : String(rawTopicTitle || '').trim()
  const topic = topicId && topicTitle ? topicTitle : ''
  const normalizedTheme = themeId ? {
    theme_id: themeId,
    name: String(theme.name || markerTheme.name || '').trim(),
    cover: normalizeImageUrl(theme.cover || '', 700),
    brief: theme.brief || '',
    view_count: String(theme.hot || theme.view_cnt || 0),
    user_count: formatCount(theme.user_cnt)
  } : null
  const diggCount = Number(item.digg_count || info.digg_count) || 0
  const commentCount = Number(item.comment_count || info.comment_count) || 0
  const hotComment = item.hot_comment || info.hot_comment || {}
  const hotCommentInfo = hotComment.comment_info || hotComment.comment || hotComment
  const hotCommentContent = String(hotCommentInfo.comment_content || hotCommentInfo.content || '').trim()
  const hotCommentDiggCount = Number(hotCommentInfo.digg_count || hotComment.digg_count) || 0
  const diggUsers = item.digg_user || info.digg_user || item.digg_users || info.digg_users || []
  return {
    msg_id: item.msg_id || info.msg_id || '',
    content: parsedContent.content,
    content_segments: parsedContent.segments,
    pic_list: (info.pic_list || []).map((pic) => typeof pic === 'string' ? pic : (pic.pic_url || pic.url || '')).filter(Boolean),
    link: info.link || info.url || item.link || '',
    link_title: info.url_title || info.link_title || '',
    topic,
    topic_id: topicId,
    topic_info: topicId ? {
      topic_id: topicId,
      title: topicTitle || '圈子',
      description: rawTopic.description || '',
      icon: rawTopic.icon || '',
      msg_count: rawTopic.msg_count || 0,
      follower_count: rawTopic.follower_count || 0
    } : null,
    theme: normalizedTheme,
    ctime: formatTime(info.ctime || item.ctime),
    digg_count: formatCount(diggCount),
    comment_count: formatCount(commentCount),
    digg_count_value: diggCount,
    comment_count_value: commentCount,
    hot_comment: hotCommentContent ? {
      content: hotCommentContent,
      digg_count: formatCount(hotCommentDiggCount),
      digg_count_value: hotCommentDiggCount
    } : null,
    digg_users: Array.isArray(diggUsers) ? diggUsers.slice(0, 3).map((user) => ({
      user_id: String(user.user_id || ''),
      user_name: user.user_name || '掘友',
      avatar_large: normalizeImageUrl(user.avatar_large || '/assets/app/common/default_avatar.png', 80)
    })) : [],
    is_digg: Boolean(item.user_interact && item.user_interact.is_digg),
    is_followed: Boolean(item.user_interact && item.user_interact.is_follow),
    author: {
      user_id: author.user_id || '',
      user_name: author.user_name || '掘友',
      avatar_large: author.avatar_large || '/assets/app/common/default_avatar.png',
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
    follower_count: formatCompactCount(topic.follower_count || item.follower_count),
    msg_count: formatCompactCount(topic.msg_count || item.msg_count || item.short_msg_count),
    shorts: (item.shorts || item.short_msgs || []).slice(0, 2).map((short, index) => {
      const normalized = normalizePin(short)
      return {
        key: normalized.msg_id || `short-${index}`,
        msg_id: normalized.msg_id,
        content: normalized.content,
        avatar: normalized.author.avatar_large
      }
    })
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
    view_count: String(theme.hot || theme.view_cnt || 0),
    user_count: formatCount(theme.user_cnt),
    recent_users: (item.recent_users || []).slice(0, 4).map((user) => ({
      user_id: String(user.user_id || ''),
      avatar_large: normalizeImageUrl(user.avatar_large || '/assets/app/common/default_avatar.png', 80)
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
    description: info.description || '',
    badge: String(item.description || '').trim(),
    update_time: Number(info.update_time || info.mtime) || 0,
    article_count: Number(info.post_article_count || info.article_count) || 0,
    follower_value: Number(info.concern_user_count || info.follow_count) || 0,
    follower_count: formatCount(info.concern_user_count || info.follow_count),
    is_follow: Boolean(info.is_follow),
    creator: {
      user_id: String(creator.user_id || info.creator_id || ''),
      user_name: creator.user_name || creator.name || '掘金用户',
      avatar_large: normalizeImageUrl(creator.avatar_large || '/assets/app/common/default_avatar.png', 80),
      level: Number(creator.level || (creator.user_growth_info && creator.user_growth_info.jpower_level)) || 0
    },
    recent_users: (item.recent_users || []).slice(0, 4).map((user) => ({
      user_id: String(user.user_id || ''),
      avatar_large: normalizeImageUrl(user.avatar_large || '/assets/app/common/default_avatar.png', 80)
    })),
    articles: (item.articles || item.article_list || []).slice(0, 3).map(normalizeArticle)
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
    avatar_large: normalizeImageUrl(item.avatar_large || articleAuthor.avatar_large || '/assets/app/common/default_avatar.png', 160),
    job_title: item.job_title || articleAuthor.job_title || '',
    company: item.company || articleAuthor.company || '',
    description: item.author_desc || item.description || articleAuthor.description || '',
    follower_count: formatCount(item.follower_count || articleAuthor.follower_count),
    got_digg_count: formatCount(item.got_digg_count || articleAuthor.got_digg_count),
    got_view_count: formatCount(item.got_view_count || articleAuthor.got_view_count),
    level: Number(item.level || (item.user_growth_info && item.user_growth_info.jpower_level) || articleAuthor.level) || 0,
    article_count: Number(item.post_article_count || articleAuthor.post_article_count) || 0,
    is_followed: Boolean(item.isfollowed),
    articles: (item.articles || []).slice(0, 3).map(normalizeArticle)
  }
}

function authorToColumn(author) {
  const item = author || {}
  const firstArticle = item.articles && item.articles[0]
  const firstTag = firstArticle && firstArticle.tags && firstArticle.tags[0]
  const tagName = typeof firstTag === 'string' ? firstTag : (firstTag && firstTag.tag_name || '')
  const creatorName = item.user_name || '掘金作者'
  return {
    column_id: `author-${item.user_id || ''}`,
    title: tagName ? `${tagName}精选` : '技术专栏',
    owner_label: `${creatorName}的专栏`,
    description: item.description || '持续分享一线技术实践与思考',
    cover: '/assets/app/column/column_default_cover.png',
    tag: tagName,
    article_count: item.article_count || (item.articles || []).length,
    follower_value: 0,
    follower_count: item.follower_count || '0',
    create_time: '',
    creator: {
      user_id: String(item.user_id || ''),
      user_name: item.user_name || '掘金用户',
      avatar_large: item.avatar_large || '/assets/app/common/default_avatar.png',
      level: Number(item.level) || 0
    },
    articles: item.articles || []
  }
}

function normalizeColumn(raw) {
  const item = raw || {}
  const info = item.column || item.column_info || item
  const creator = item.creator || item.author_user_info || item.user_info || {}
  const creatorName = creator.user_name || creator.name || info.user_name || '掘金用户'
  return {
    column_id: String(info.column_id || info.id || ''),
    title: info.title || info.column_name || info.name || '技术专栏',
    owner_label: `${creatorName}的专栏`,
    description: info.description || info.brief || '',
    cover: normalizeImageUrl(info.cover || info.cover_image || '', 240),
    tag: info.tag_name || info.category_name || '',
    article_count: Number(info.article_count || info.post_article_count) || 0,
    follower_value: Number(info.follow_count || info.concern_user_count) || 0,
    follower_count: formatCount(info.follow_count || info.concern_user_count),
    create_time: formatDateTime(info.ctime || info.create_time, false),
    creator: {
      user_id: String(creator.user_id || info.user_id || ''),
      user_name: creatorName,
      avatar_large: normalizeImageUrl(creator.avatar_large || '/assets/app/common/default_avatar.png', 80),
      level: Number(creator.level || (creator.user_growth_info && creator.user_growth_info.jpower_level)) || 0
    },
    recent_users: (item.recent_users || []).slice(0, 4).map((user) => ({
      user_id: String(user.user_id || ''),
      avatar_large: normalizeImageUrl(user.avatar_large || '/assets/app/common/default_avatar.png', 80)
    })),
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

function normalizeReply(raw) {
  const item = raw || {}
  const info = item.reply_info || item
  const user = item.user_info || {}
  const replyUser = item.reply_user || {}
  const replyToUserId = String(info.reply_to_user_id || '')
  return {
    id: String(info.reply_id || item.reply_id || ''),
    content: info.reply_content || '',
    time: formatTime(info.ctime),
    ctime_value: Number(info.ctime) || 0,
    digg_count: formatCount(info.digg_count),
    digg_count_value: Number(info.digg_count) || 0,
    avatar: user.avatar_large || '/assets/app/common/default_avatar.png',
    user: user.user_name || '掘友',
    user_id: String(user.user_id || ''),
    reply_user: replyToUserId && replyToUserId !== '0' ? (replyUser.user_name || '') : '',
    is_author: Boolean(item.is_author),
    is_digg: Boolean(info.is_digg || (item.user_interact && item.user_interact.is_digg))
  }
}

function normalizeComment(raw) {
  const item = raw || {}
  const info = item.comment_info || item
  const user = item.user_info || {}
  const replies = (item.reply_infos || []).map(normalizeReply).filter((reply) => reply.id)
    .sort((left, right) => left.ctime_value - right.ctime_value)
  return {
    id: String(item.comment_id || info.comment_id || ''),
    content: info.comment_content || '',
    time: formatTime(info.ctime),
    ctime_value: Number(info.ctime) || 0,
    digg_count: formatCount(info.digg_count),
    digg_count_value: Number(info.digg_count) || 0,
    reply_count: Number(info.reply_count) || 0,
    avatar: user.avatar_large || '/assets/app/common/default_avatar.png',
    user: user.user_name || '掘友',
    user_id: user.user_id || '',
    is_author: Boolean(item.is_author),
    is_hot: Boolean(item.is_hot),
    is_digg: Boolean(info.is_digg || (item.user_interact && item.user_interact.is_digg)),
    replies,
    reply_cursor: '0',
    reply_has_more: Number(info.reply_count) > replies.length,
    reply_loading: false
  }
}

function formatPrice(value) {
  const price = Number(value) || 0
  const text = (price / 100).toFixed(2)
  return text.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function normalizeCourseCover(value) {
  const url = normalizeImageUrl(value, 240)
  if (!url || /^https?:\/\/[^/]*passport\.byteacctimg\.com\/img\/user-avatar\//i.test(url)) {
    return '/assets/app/common/default_booklet_cover_image.png'
  }
  return url
}

function normalizeCourse(raw) {
  const item = raw || {}
  const info = item.base_info || item.booklet_info || item
  const user = item.user_info || info.user_info || {}
  const event = item.event_discount || {}
  const maxDiscount = item.max_discount || {}
  const originalPrice = Number(info.price) || 0
  const discountRate = Number(event.discount_rate) || 0
  const eventPrice = discountRate > 0 && discountRate < 10
    ? Math.round(originalPrice * discountRate / 10)
    : originalPrice
  const maxDiscountPrice = Number(maxDiscount.pay_money)
  const salePrice = maxDiscountPrice > 0 && maxDiscountPrice < originalPrice
    ? maxDiscountPrice
    : eventPrice
  const updatedCount = Number(item.section_updated_count) || Number(info.section_count) || 0
  const progressSource = item.reading_progress || info.reading_progress || 0
  const progress = typeof progressSource === 'object'
    ? Number(progressSource.progress || progressSource.percent || progressSource.read_percent) || 0
    : Number(progressSource) || 0

  return {
    id: item.booklet_id || info.booklet_id || '',
    title: info.title || '掘金小册',
    summary: info.summary || info.introduction || '',
    cover: normalizeCourseCover(info.cover_img),
    category_id: info.category_id || '',
    priceValue: salePrice,
    price: formatPrice(salePrice),
    originalPrice: salePrice < originalPrice ? formatPrice(originalPrice) : '',
    section_count: updatedCount,
    detail_section_count: Number(info.section_count) || Math.max(0, updatedCount - 1),
    buy_count: formatCount(info.buy_count),
    buy_count_value: Number(info.buy_count) || 0,
    read_time: Number(info.read_time) || 0,
    statusText: Number(info.is_finished) === 1 ? '已完结' : `已更新${updatedCount}小节`,
    author: user.user_name || info.author_name || '稀土掘金',
    authorAvatar: normalizeImageUrl(user.avatar_large || '/assets/app/common/default_avatar.png', 80),
    authorLevel: Number(user.level || (user.user_growth_info && user.user_growth_info.jpower_level)) || 0,
    vip: Boolean(info.can_vip_borrow),
    isNew: Boolean(item.is_new),
    discountLabel: maxDiscount.desc || maxDiscount.name || event.show_label || event.desc || '',
    owned: Boolean(item.is_buy),
    progress: progress > 0 && progress <= 1 ? Math.round(progress * 100) : Math.min(100, Math.round(progress))
  }
}

function normalizePopularizeCourse(raw) {
  const item = raw || {}
  const info = item.base_info || item.booklet_info || item
  const user = item.user_info || info.user_info || {}
  const event = item.event_discount || {}
  const originalPrice = Number(info.price) || 0
  const discountRate = Number(event.discount_rate) || 0
  const currentPrice = discountRate > 0 && discountRate < 10
    ? Math.round(originalPrice * discountRate / 10)
    : originalPrice
  const commission = Number(info.commission || item.commission) || 0

  return {
    id: item.booklet_id || info.booklet_id || '',
    title: info.title || '掘金小册',
    author: user.user_name || info.author_name || '稀土掘金',
    cover: normalizeImageUrl(info.cover_img || '/assets/app/common/default_booklet_cover_image.png', 240),
    category_id: String(info.category_id || ''),
    price: formatPrice(currentPrice),
    originalPrice: currentPrice < originalPrice ? formatPrice(originalPrice) : '',
    commission: formatPrice(commission),
    distributionImage: normalizeImageUrl(info.distribution_img || info.cover_img || '', 720)
  }
}

function formatCourseDuration(value) {
  const totalMinutes = Math.ceil(Math.max(0, Number(value) || 0) / 60000)
  if (!totalMinutes) return ''
  if (totalMinutes < 60) return `${totalMinutes}分钟`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}小时${minutes ? `${minutes}分钟` : ''}`
}

const BYTE_COURSE_LOCAL_COVERS = {
  '7472685250229846067': '/assets/app/course/byte/big-data-scheduling.jpg',
  '7472685250247098405': '/assets/app/course/byte/open-source.jpg',
  '7142808926348640263': '/assets/app/course/byte/backend-performance.jpg',
  '7142838251227709448': '/assets/app/course/byte/backend-storage.jpg',
  '7140987981803814919': '/assets/app/course/byte/backend-go.jpg',
  '7158744309133475848': '/assets/app/course/byte/technical-writing.jpg'
}

function normalizeByteCourse(raw) {
  const item = raw || {}
  const content = item.content || item
  const extra = content.extra || {}
  const coursePackage = extra.course_package || {}
  const coverImage = content.cover_image || {}
  const id = String(content.item_id || item.item_id || '')

  return {
    id,
    itemType: Number(content.item_type || item.item_type) || 60,
    courseType: 'byte',
    title: String(content.name || item.name || '字节内部课').replace(/\s+/g, ' ').trim(),
    cover: BYTE_COURSE_LOCAL_COVERS[id] || normalizeImageUrl(coverImage.url || content.cover || item.cover || ''),
    author: 'ByteTech',
    videoCount: Number(coursePackage.chapter_count) || 0,
    duration: formatCourseDuration(coursePackage.duration),
    vip: true
  }
}

module.exports = {
  formatCount,
  formatCompactCount,
  formatTime,
  formatDateTime,
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
  normalizeReply,
  normalizeComment,
  normalizeCourse,
  normalizePopularizeCourse,
  normalizeByteCourse,
  formatPrice
}
