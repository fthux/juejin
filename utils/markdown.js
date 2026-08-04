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
  return markdown ? converter.makeHtml(markdown) : ''
}

module.exports = { toHtml }
