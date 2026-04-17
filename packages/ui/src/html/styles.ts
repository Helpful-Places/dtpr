// Inlines the compiled Vue stylesheet as a string so `renderDatachainDocument`
// can emit a self-contained document with no external asset references.
// Vite's `?raw` resolves the file contents at build time.
import stylesCss from '../vue/styles.css?raw'

export { stylesCss }
