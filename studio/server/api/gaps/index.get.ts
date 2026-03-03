import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'
import { analyzeGaps } from '~/lib/gap-analyzer'

export default defineEventHandler(async () => {
  const provider = getProvider()
  const iconsDir = getIconsDir()
  return analyzeGaps(provider, iconsDir)
})
