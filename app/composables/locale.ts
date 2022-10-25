export const getBrowserLocale = (options = {}) => {
  if (process.client && typeof navigator !== 'undefined') {
    const defaultOptions = { countryCodeOnly: false }

    const opt = { ...defaultOptions, ...options }
  
    const navigatorLocale =
      navigator.languages !== undefined
        ? navigator.languages[0]
        : navigator.language
  
    if (!navigatorLocale) {
      return undefined
    }
  
    const trimmedLocale = opt.countryCodeOnly
      ? navigatorLocale.trim().split(/-|_/)[0]
      : navigatorLocale.trim()
  
    return trimmedLocale
  } else {
    return undefined
  }
}