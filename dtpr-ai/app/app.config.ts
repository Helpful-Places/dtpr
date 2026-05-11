export default defineAppConfig({
  header: {
    title: 'DTPR for AI'
  },
  seo: {
    title: 'DTPR for AI',
    description: 'Digital Trust for Places & Routines — AI-focused microsite.'
  },
  socials: {
    github: 'https://github.com/helpful-places/dtpr'
  },
  github: {
    url: 'https://github.com/helpful-places/dtpr',
    branch: 'main',
    rootDir: 'dtpr-ai'
  },
  // Single source of truth for "how to cite DTPR for AI". Mirrors the
  // root CITATION.cff (which is what GitHub renders as the
  // "Cite this repository" sidebar). Keep the two in sync — when you
  // bump version or add an author, edit both files.
  citation: {
    title: 'DTPR for AI: Digital Trust for Places & Routines — AI extension',
    authors: ['Helpful Places'],
    year: 2026,
    version: '0.1.0',
    url: 'https://dtpr.ai',
    repository: 'https://github.com/helpful-places/dtpr',
    license: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/'
  }
})
