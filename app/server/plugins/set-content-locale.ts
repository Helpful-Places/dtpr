import { useRuntimeConfig } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', (file) => {
    const config = useRuntimeConfig();

    const locales = config.public.content.locales;
    const locale = file._dir;

    if (!locales.includes(locale)) { return; }

    file._locale = locale;
    // return file;
  })
})
