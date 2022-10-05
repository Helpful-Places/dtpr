import mdit from 'markdown-it'

const md = mdit()

export default defineNuxtPlugin(() => {
  return {
    provide: {
      md
    }
  }
})