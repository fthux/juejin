const theme = require("../../utils/theme.js")
const session = require('../../services/session.js')

Page(theme.withTheme({
  onLoad() {
    session.requirePage()
  }
}))
