import { createI18n } from 'vue-i18n'
import { getBrowserLocale } from '../composables/locale'

// Using language and country codes from: https://wpcentral.io/internationalization/
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: getBrowserLocale() || 'en',
    fallbackLocale: 'en',
    messages: {
      'en': en,
      'fr': fr,
      'es': es,
      'pt': pt
    }
  })

  vueApp.use(i18n)
})