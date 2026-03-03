import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { g as gitCommit } from '../../../_/git.mjs';
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

const commit_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { message, files } = body;
  if (!message) {
    throw createError({ statusCode: 400, message: "Commit message is required" });
  }
  return gitCommit(message, files);
});

export { commit_post as default };
//# sourceMappingURL=commit.post.mjs.map
