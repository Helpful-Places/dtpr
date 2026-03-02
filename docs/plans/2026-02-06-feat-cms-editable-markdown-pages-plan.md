---
title: "Convert hardcoded pages to CMS-editable markdown"
type: feat
date: 2026-02-06
---

# Convert Hardcoded Pages to CMS-Editable Markdown

## Overview

Convert 6 hardcoded HTML pages to CMS-editable Markdown powered by Nuxt Content v3 and Nuxt Studio. Per-locale content collections support future i18n. Structured content (partner cards, council bios) uses frontmatter arrays. Only components actually used inside markdown (`PartnerCard`, `CopcCard`) move to `components/content/`.

## Problem Statement

All 6 non-taxonomy pages have content hardcoded in Vue `<template>` blocks. Non-developers cannot edit page content. Nuxt Studio is installed but has no page content to edit.

## Proposed Solution

### Architecture

```
content/
  dtpr.v0/              # existing - untouched
  dtpr.v1/              # existing - untouched
  pages/
    en/                  # NEW: English page content
      index.md
      awards.md
      get-involved.md
      governance.md
      how-we-got-here.md
      tools-and-resources.md

components/
  Card.vue              # stays put (used in Vue templates, not in markdown)
  PartnerCard.vue       # stays put (original preserved)
  NewsletterSignup.vue  # stays put (used in Vue templates, not in markdown)
  IntroHeader.vue       # stays put
  GuideHeader.vue       # stays put
  AwardsHeader.vue      # renamed from awardsHeader.vue
  content/              # MDC-registered components (used inside markdown)
    PartnerCard.vue     # moved from components/ (used in awards.md MDC blocks)
    CopcCard.vue        # renamed from COPC-Card.vue (used in governance.md MDC blocks)

composables/
  usePageContent.ts     # NEW: locale-aware content query with English fallback
```

Each page `.vue` file stays (unique layouts) but switches from hardcoded HTML to querying markdown via `usePageContent()` and rendering via `<ContentRenderer>`.

### Key Design Decisions

1. **Content location**: `content/pages/{locale}/` keeps page content separate from taxonomy data
2. **Per-locale collections**: Generated programmatically from locales array. `type: 'page'`, `prefix: '/'` (per Nuxt Content i18n docs)
3. **Fallback**: Missing locale content falls back to English silently
4. **Only 2 MDC components**: `PartnerCard` and `CopcCard` move to `components/content/`. `Card` and `NewsletterSignup` stay in `components/` (used in Vue templates only)
5. **Decorative elements** (background images): Stay in Vue templates, not markdown
6. **Partner cards (homepage)**: Frontmatter arrays (31 cards, looped in Vue template)
7. **Council bios (governance)**: Frontmatter arrays for consistency with partners (name, imageFile, imageAlt, bio fields). Vue template loops and renders `CopcCard` per entry
8. **Award entries**: Inline MDC `::partner-card` blocks (only 6, manageable)
9. **Internal links**: Standard markdown links -- Nuxt Content's ProseA uses NuxtLink
10. **Headers**: Stay as-is for now. Page titles come from frontmatter for `useHead()`. Header component prop-ification deferred until there's editorial demand
11. **Shared composable**: `usePageContent(path)` handles collection selection, query, English fallback, and locale watching. One place for the logic, one-liners in pages

---

## Implementation Phases

### Phase 1: Foundation + convert all 6 pages

Infrastructure setup, validate with simplest page, then convert remaining pages in the same pass.

#### 1.1 Update `content.config.ts` -- add page collections

Generate collections programmatically from the locales array:

```typescript
// content.config.ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const locales = ['en', 'fr', 'es', 'pt', 'tl', 'km']

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  // Homepage-specific (optional on other pages)
  partners: z.array(z.object({
    name: z.string(),
    url: z.string().optional(),
    imageFile: z.string(),
    imageAlt: z.string(),
    group: z.enum(['deployment', 'standard', 'codesign']),
  })).optional(),
  // Governance-specific (optional on other pages)
  councilMembers: z.array(z.object({
    name: z.string(),
    imageFile: z.string(),
    imageAlt: z.string(),
    bio: z.string(),
  })).optional(),
})

// Generate one collection per locale
const localeCollections = Object.fromEntries(
  locales.map(locale => [
    `content_${locale}`,
    defineCollection({
      type: 'page',
      source: { include: `pages/${locale}/**`, prefix: '/' },
      schema: pageSchema,
    }),
  ])
)

export default defineContentConfig({
  collections: {
    // Existing taxonomy collections (unchanged)
    categories: defineCollection({ /* ... existing ... */ }),
    datachain_types: defineCollection({ /* ... existing ... */ }),
    elements: defineCollection({ /* ... existing ... */ }),
    v0_elements: defineCollection({ /* ... existing ... */ }),
    v0_categories: defineCollection({ /* ... existing ... */ }),
    // Page collections per locale
    ...localeCollections,
  }
})
```

**Note on `prefix`**: Using `prefix: '/'` strips all directory structure from generated paths per the official Nuxt Content i18n docs. `content/pages/en/awards.md` generates path `/awards`.

**Files**: `app/content.config.ts`

#### 1.2 Prepare MDC components

Only 2 components need MDC registration (used inside markdown content):

- Rename + move `COPC-Card.vue` -> `components/content/CopcCard.vue`
- Copy `PartnerCard.vue` -> `components/content/PartnerCard.vue`

Keep originals in `components/` — `Card.vue`, `NewsletterSignup.vue`, `PartnerCard.vue` are used directly in Vue page templates wrapping `<ContentRenderer>`, not inside markdown.

Add `mdc-unwrap="p"` on slots where paragraph wrapping is unwanted.

Rename `awardsHeader.vue` -> `AwardsHeader.vue` for PascalCase consistency.

**Important**: Test that Nuxt auto-imports `PartnerCard` from both `components/` (for Vue templates) and `components/content/` (for MDC). If there's a naming conflict, prefix MDC versions (e.g., `MdcPartnerCard.vue`).

**Files**: `components/content/CopcCard.vue`, `components/content/PartnerCard.vue`, `components/AwardsHeader.vue`

#### 1.3 Create `usePageContent` composable

```typescript
// composables/usePageContent.ts
import type { Collections } from '@nuxt/content'

export function usePageContent(pagePath: string) {
  const { locale } = useI18n()

  return useAsyncData(
    `page-${pagePath}-${locale.value}`,
    async () => {
      const collection = ('content_' + locale.value) as keyof Collections
      const result = await queryCollection(collection).path(pagePath).first()
      // Fallback to English if translation missing
      if (!result && locale.value !== 'en') {
        return await queryCollection('content_en').path(pagePath).first()
      }
      return result
    },
    { watch: [locale] }
  )
}
```

**Files**: `composables/usePageContent.ts`

#### 1.4 Scope existing content hooks to taxonomy files only

Add a path guard to `content:file:beforeParse` and `content:file:afterParse` hooks in `nuxt.config.ts`:

```typescript
'content:file:afterParse': (ctx) => {
  const path = ctx.file.path || ''
  // Only process taxonomy files, skip page content
  if (!path.includes('dtpr.v0/') && !path.includes('dtpr.v1/')) return
  // ... existing hook logic
}
```

**Files**: `app/nuxt.config.ts`

#### 1.5 Convert `how-we-got-here` (simplest page, validates pipeline)

Create `content/pages/en/how-we-got-here.md` with frontmatter and prose extracted from current page.

Update `pages/how-we-got-here.vue`:

```vue
<script setup>
const { data: page } = await usePageContent('/how-we-got-here')
useHead({ title: page.value?.title })
</script>

<template>
  <div>
    <Card class="md:w-[60%] bg-dtpr-blue-100">
      <ContentRenderer v-if="page" :value="page" />
    </Card>
    <div class="bg-deployment" />
  </div>
</template>
```

Validate: page renders correctly, Studio can edit it, styles apply via Card's global styles.

**Files**: `content/pages/en/how-we-got-here.md`, `pages/how-we-got-here.vue`

#### 1.6 Convert `get-involved`

Extract content to `content/pages/en/get-involved.md`. `<NewsletterSignup>` stays in the Vue template (not MDC). Background image div stays in Vue template.

**Files**: `content/pages/en/get-involved.md`, `pages/get-involved.vue`

#### 1.7 Convert `awards`

Extract content to `content/pages/en/awards.md`. Award entries become `::partner-card` MDC blocks (6 items). Header text stays in `AwardsHeader` for now.

**Files**: `content/pages/en/awards.md`, `pages/awards.vue`

#### 1.8 Convert `governance`

Extract content to `content/pages/en/governance.md`. Council members as **frontmatter array** with `name`, `imageFile`, `imageAlt`, `bio` fields. Vue template loops over `page.councilMembers` rendering `<CopcCard>` per entry. Governance intro prose is markdown body.

**Files**: `content/pages/en/governance.md`, `pages/governance.vue`

#### 1.9 Convert `tools-and-resources`

Extract content to `content/pages/en/tools-and-resources.md`. Multi-column layout stays in Vue template. Resource lists and blog post links become structured markdown within each layout section. May need frontmatter sections or multiple ContentRenderer areas.

**Files**: `content/pages/en/tools-and-resources.md`, `pages/tools-and-resources.vue`

#### 1.10 Convert `index` (most complex)

Extract content to `content/pages/en/index.md`. Partner cards as **frontmatter arrays** grouped by `group` field (deployment, standard, codesign). Colored section prose in markdown body. Layout structure (flex columns, background images) stays in Vue template.

Homepage is a hybrid: Vue template owns layout, markdown/frontmatter owns content.

**Files**: `content/pages/en/index.md`, `pages/index.vue`

#### 1.11 Bug fixes (while touching these files)

- Fix NavHeader `@click="isOpen-false"` -> `@click="isOpen = false"` (lines 27-28)
- Fix NavHeader `var isOpen` -> `const isOpen` (line 2)
- Remove commented-out code in `get-involved.vue` (lines 22-26)

**Files**: `components/NavHeader.vue`, `pages/get-involved.vue`

---

## Acceptance Criteria

### Functional Requirements

- [ ] All 6 pages render identically to their current hardcoded versions
- [ ] Content is editable via Nuxt Studio visual editor (/_studio in dev mode)
- [ ] Partner cards on homepage editable via frontmatter arrays in Studio form editor
- [ ] Council member bios editable via frontmatter arrays in Studio form editor
- [ ] Award entries editable as MDC blocks in visual editor
- [ ] SEO titles come from frontmatter
- [ ] English content renders at `/page-name` (no locale prefix)
- [ ] Existing taxonomy pages continue to work unchanged

### Quality Gates

- [ ] Visual comparison of each page before/after conversion
- [ ] Studio editing tested for each page type
- [ ] Newsletter form submission still works
- [ ] Generated path for `how-we-got-here.md` equals `/how-we-got-here` (validates prefix config)

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `prefix: '/'` doesn't strip paths correctly | Medium | High | Validate in step 1.5 before converting other pages |
| MDC component name resolution fails | Medium | High | Rename CopcCard, test early. Keep PartnerCard in both dirs |
| `Card` name collision with @nuxt/ui | Low | Medium | Card stays in components/, not globally re-registered |
| Scoped styles don't apply to ContentRenderer | High | Medium | Card.vue styles are already global (unscoped). Use `:deep()` only for page-specific styles |
| Content hooks interfere with page content | Low | Medium | Path guard in step 1.4 |
| Auto-import conflict between components/ and components/content/ | Medium | Medium | Test in step 1.2. If conflict, prefix MDC names |

## Future Work (not in this plan)

- **i18n scaffolding**: Create locale content directories, update i18n config to use locale objects, uncomment and fix LocaleSwitcher
- **Studio production config**: Configure git provider, auth, rootDir for production editing
- **Header prop-ification**: Make header component text editable via frontmatter when there's editorial demand

## References

- Brainstorm: `docs/brainstorms/2026-02-06-cms-content-conversion-brainstorm.md`
- [Nuxt Content v3 Collections](https://content.nuxt.com/docs/collections/define)
- [Nuxt Content v3 i18n](https://content.nuxt.com/docs/integrations/i18n)
- [Nuxt Content v3 MDC Syntax](https://content.nuxt.com/docs/files/markdown)
- [Nuxt Studio Setup](https://nuxt.studio/setup)
- [Nuxt Studio Content Editing](https://nuxt.studio/content)
- Existing content config: `app/content.config.ts`
- Existing nuxt config: `app/nuxt.config.ts`
