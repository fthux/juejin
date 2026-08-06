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
  return String(source || '').replace(
    /(<img\b[^>]*\bsrc\s*=\s*)(["'])(.*?)\2/gi,
    (match, prefix, quote, src) => `${prefix}${quote}${src.replace(/&(?:amp|#0*38|#x0*26);/gi, '&')}${quote}`
  )
}

module.exports = { toHtml, normalizeImageSources }
