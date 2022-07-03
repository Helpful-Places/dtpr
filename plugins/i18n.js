import { createI18n } from 'vue-i18n'

import { languages } from '../locales/index.js'
import { defaultLocale } from '../locales/index.js'
const messages = Object.assign(languages)

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(i18n)
})