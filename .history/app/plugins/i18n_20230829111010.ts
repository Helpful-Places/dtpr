import { createI18n } from 'vue-i18n'
import { getBrowserLocale } from '../composables/locale'

// Using language and country codes from: https://wpcentral.io/internationalization/
import en_US from '../locales/en-US.json';
import fr_FR from '../locales/fr-FR.json';

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: getBrowserLocale() || 'en',
    fallbackLocale: 'en',
    messages: {
      'en': en_US,
      'fr': fr_FR,
      'e'
    }
  })

  vueApp.use(i18n)
})