import { resolve } from 'path'

export function getContentDir(): string {
  const config = useRuntimeConfig()
  return config.contentDir || resolve(process.cwd(), '..', 'app', 'content', 'dtpr.v1')
}

export function getIconsDir(): string {
  const config = useRuntimeConfig()
  return config.iconsDir || resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons')
}
