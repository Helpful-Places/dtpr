import simpleGit from 'simple-git';
import { resolve } from 'path';

function getRepoRoot() {
  return resolve(process.cwd(), "..");
}
async function getGitStatus() {
  const git = simpleGit(getRepoRoot());
  const status = await git.status();
  return {
    isClean: status.isClean(),
    modified: status.modified,
    created: status.created,
    deleted: status.deleted,
    not_added: status.not_added,
    staged: status.staged,
    current: status.current
  };
}
async function gitCommit(message, files) {
  const git = simpleGit(getRepoRoot());
  if (files && files.length > 0) {
    await git.add(files);
  } else {
    await git.add(["app/content/dtpr.v1/", "app/public/dtpr-icons/"]);
  }
  const result = await git.commit(message);
  return {
    commit: result.commit,
    summary: {
      changes: result.summary.changes,
      insertions: result.summary.insertions,
      deletions: result.summary.deletions
    }
  };
}

export { getGitStatus as a, gitCommit as g };
//# sourceMappingURL=git.mjs.map
