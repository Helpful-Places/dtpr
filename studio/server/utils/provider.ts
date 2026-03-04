import { LocalContentProvider } from '~/lib/content-reader'
import { getContentDir, getIconsDir } from './paths'

let _provider: LocalContentProvider | null = null

export function getProvider(): LocalContentProvider {
  if (!_provider) {
    _provider = new LocalContentProvider(getContentDir(), getIconsDir())
  }
  return _provider
}
