const showdown = require('./showdown.js')

const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  simplifiedAutoLink: true,
  openLinksInNewWindow: false
})

function toHtml(source) {
  const markdown = String(source || '').replace(/^---\n[\s\S]*?\n---\n/, '')
  return markdown ? normalizeImageSources(converter.makeHtml(markdown)) : ''
}

function normalizeImageSources(source) {
  return String(source || '').replace(/<img\b[^>]*>/gi, (tag) => {
    let style = ''
    let styleQuote = '"'
    let image = tag.replace(/\s+(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

    image = image.replace(/\s+style\s*=\s*(["'])(.*?)\1/i, (match, quote, value) => {
      styleQuote = quote
      style = value.split(';').map((declaration) => declaration.trim()).filter((declaration) => {
        const property = declaration.split(':')[0].trim().toLowerCase()
        return declaration && ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'].indexOf(property) === -1
      }).join(';')
      return ''
    })

    image = image.replace(
      /(\bsrc\s*=\s*)(["'])(.*?)\2/i,
      (match, prefix, quote, src) => `${prefix}${quote}${src.replace(/&(?:amp|#0*38|#x0*26);/gi, '&')}${quote}`
    )

    const responsiveStyle = [style, 'max-width:100%', 'height:auto', 'display:block'].filter(Boolean).join(';')
    const selfClosing = /\/\s*>$/.test(image)
    const openTag = image.replace(/\s*\/?\s*>$/, '')
    return `${openTag} style=${styleQuote}${responsiveStyle}${styleQuote}${selfClosing ? ' />' : '>'}`
  })
}

function decodeHeadingText(source) {
  const namedEntities = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' }
  return String(source || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#(?:x[0-9a-f]+|\d+)|amp|apos|gt|lt|nbsp|quot);/gi, (match, entity) => {
      if (entity[0] !== '#') return namedEntities[entity.toLowerCase()] || match
      const hexadecimal = entity[1].toLowerCase() === 'x'
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
      } catch (error) {
        return match
      }
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function sectionArticleContent(source, catalogLimit = 6) {
  const html = String(source || '')
  const headings = []
  const headingPattern = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi
  let match

  while (headings.length < catalogLimit && (match = headingPattern.exec(html))) {
    const title = decodeHeadingText(match[2])
    if (!title) continue
    headings.push({ id: `article-heading-${headings.length}`, title, offset: match.index })
  }

  if (!headings.length) {
    return {
      catalog: [],
      sections: html ? [{ id: 'article-content-start', content: html }] : []
    }
  }

  const sections = []
  if (headings[0].offset > 0) {
    sections.push({ id: 'article-content-start', content: html.slice(0, headings[0].offset) })
  }
  headings.forEach((heading, index) => {
    const next = headings[index + 1]
    sections.push({
      id: heading.id,
      content: html.slice(heading.offset, next ? next.offset : html.length)
    })
  })

  return {
    catalog: headings.map(({ id, title }) => ({ id, title })),
    sections
  }
}

module.exports = { toHtml, normalizeImageSources, sectionArticleContent }
