import { createI18n } from 'vue-i18n'
import { getBrowserLocale } from '../composables/locale'

// Using language and country codes from: https://wpcentral.io/internationalization/
import en_US from '../locales/en-US.json';
import en_CA from '../locales/en-CA.json';
import fr_FR from '../locales/fr-FR.json';
import fr_CA from '../locales/fr-CA.json';

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: getBrowserLocale() || 'en-US',
    fallbackLocale: 'en-US',
    messages: {
      'en-US': en_US,
      'en-CA': en_CA,
      'fr-FR': fr_FR,
      'fr-CA': fr_CA
    }
  })

  vueApp.use(i18n)
})