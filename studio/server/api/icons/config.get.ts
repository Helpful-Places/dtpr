export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    hasRecraftKey: !!config.recraftApiKey,
  }
})
