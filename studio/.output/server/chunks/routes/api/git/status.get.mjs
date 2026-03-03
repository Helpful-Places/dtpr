import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { a as getGitStatus } from '../../../_/git.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'simple-git';
import 'path';

const status_get = defineEventHandler(async () => {
  return getGitStatus();
});

export { status_get as default };
//# sourceMappingURL=status.get.mjs.map
