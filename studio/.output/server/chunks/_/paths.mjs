import { u as useRuntimeConfig } from '../nitro/nitro.mjs';
import { resolve } from 'path';

function getContentDir() {
  const config = useRuntimeConfig();
  return config.contentDir || resolve(process.cwd(), "..", "app", "content", "dtpr.v1");
}
function getIconsDir() {
  const config = useRuntimeConfig();
  return config.iconsDir || resolve(process.cwd(), "..", "app", "public", "dtpr-icons");
}

export { getIconsDir as a, getContentDir as g };
//# sourceMappingURL=paths.mjs.map
