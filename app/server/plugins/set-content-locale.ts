import { useRuntimeConfig } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', (file) => {
    const config = useRuntimeConfig();

    const locales = config.public.content.locales;
    const locale = file._dir;
    const type = file._id.split(':')[2];
    const typeMap = [
      { 
        id: 'elements',
        type: 'element'
      },
      { 
        id: 'categories',
        type: 'category'
      }
    ]

    if (!locales.includes(locale)) { return; }

    file._type = typeMap.find(t => t.id === type)?.type;
    file._locale = locale;
  })
})
