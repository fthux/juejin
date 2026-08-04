function pad(value) {
  return String(value).padStart(2, '0')
}

function recentDates(days, count) {
  const total = count || 7
  const step = Math.max(1, Math.floor((Number(days) || 7) / total))
  return Array.from({ length: total }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - step * (total - index - 1))
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  })
}

function lineSegments(values, color, options) {
  const rows = Array.isArray(values) ? values : []
  const config = options || {}
  const max = Number(config.max) || Math.max.apply(null, rows.concat([1]))
  const min = Number(config.min) || 0
  const aspect = Number(config.aspect) || 1.8
  const range = Math.max(1, max - min)
  const points = rows.map((value, index) => ({
    x: rows.length > 1 ? index * 100 / (rows.length - 1) : 0,
    y: 100 - (Number(value) - min) / range * 100
  }))

  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]
    const dx = next.x - point.x
    const dy = next.y - point.y
    const adjustedY = dy / aspect
    const length = Math.sqrt(dx * dx + adjustedY * adjustedY)
    const angle = Math.atan2(dy, dx * aspect) * 180 / Math.PI
    return {
      style: `left:${point.x}%;top:${point.y}%;width:${length}%;background:${color};transform:rotate(${angle}deg);`
    }
  })
}

function formatMetric(value) {
  const number = Number(value) || 0
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 2 : 1).replace(/0+$/, '').replace(/\.$/, '')}万`
  return String(number)
}

module.exports = { recentDates, lineSegments, formatMetric }
