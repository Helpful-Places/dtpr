import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import tl from './locales/tl.json';
import km from './locales/km.json';

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en,
    fr,
    es,
    pt,
    tl,
    km,
  }
}));
