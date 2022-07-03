import { visit } from 'unist-util-visit'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', (file) => {
    if (file._id.endsWith('.md')) {
      if (file._id.includes(':fr:')) {
        file.icon = "https://dtpr.helpfulplaces.com/dtpr_icons/access/resale.svg"
      }
      // visit(file.body, (n:any) => n.tag === 'img', (node) => {
      //   file.coverImage = node.props.src
      // })
    }
    
    // if (file._id.endsWith('.md')) {
    //   console.log(file.locale)

    //   visit(file.locale, (node) => {
    //     file.coverImage = node.props.src
    //   })
    // }
  })
})