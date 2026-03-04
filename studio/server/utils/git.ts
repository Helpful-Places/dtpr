import simpleGit from 'simple-git'
import { resolve } from 'path'

function getRepoRoot(): string {
  // The app content lives in the monorepo root
  return resolve(process.cwd(), '..')
}

export async function getGitStatus() {
  const git = simpleGit(getRepoRoot())
  const status = await git.status()
  return {
    isClean: status.isClean(),
    modified: status.modified,
    created: status.created,
    deleted: status.deleted,
    not_added: status.not_added,
    staged: status.staged,
    current: status.current,
  }
}

export async function gitCommit(message: string, files?: string[]) {
  const git = simpleGit(getRepoRoot())
  if (files && files.length > 0) {
    await git.add(files)
  } else {
    // Add all changes in the content and icons directories
    await git.add(['app/content/dtpr.v1/', 'app/public/dtpr-icons/'])
  }
  const result = await git.commit(message)
  return {
    commit: result.commit,
    summary: {
      changes: result.summary.changes,
      insertions: result.summary.insertions,
      deletions: result.summary.deletions,
    },
  }
}
