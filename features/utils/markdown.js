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

module.exports = { toHtml, normalizeImageSources }
