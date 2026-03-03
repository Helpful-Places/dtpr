import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { L as LOCALES, g as getProvider } from '../../_/provider.mjs';
import { a as getIconsDir } from '../../_/paths.mjs';
import { existsSync } from 'fs';
import { basename, join } from 'path';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'fs/promises';
import 'gray-matter';

async function analyzeGaps(provider, iconsDir) {
  const [
    missingTranslations,
    missingIcons,
    staleTranslations,
    sparseCategories,
    orphanedElements,
    validationErrors
  ] = await Promise.all([
    findMissingTranslations(provider),
    findMissingIcons(provider, iconsDir),
    findStaleTranslations(provider),
    findSparseCategories(provider),
    findOrphanedElements(provider),
    findValidationErrors(provider)
  ]);
  const icons = await provider.listIcons();
  const summary = {
    totalElements: (await provider.getAllElements("en")).length,
    totalCategories: (await provider.getAllCategories("en")).length,
    totalLocales: LOCALES.length,
    totalIcons: icons.length,
    missingTranslationCount: missingTranslations.reduce(
      (sum, mt) => sum + mt.missingLocales.length,
      0
    ),
    missingIconCount: missingIcons.length,
    staleTranslationCount: staleTranslations.length,
    validationErrorCount: validationErrors.length
  };
  return {
    summary,
    missingTranslations,
    missingIcons,
    staleTranslations,
    sparseCategories,
    orphanedElements,
    validationErrors
  };
}
async function findMissingTranslations(provider) {
  const results = [];
  for (const collection of ["elements", "categories", "datachain_types"]) {
    const enFiles = await provider.listFiles(collection, "en");
    const enFileNames = enFiles.map((f) => f.replace("en/", ""));
    for (const fileName of enFileNames) {
      const missingLocales = [];
      for (const locale of LOCALES) {
        if (locale === "en") continue;
        const localeFiles = await provider.listFiles(collection, locale);
        const localeFileNames = localeFiles.map((f) => f.replace(`${locale}/`, ""));
        if (!localeFileNames.includes(fileName)) {
          missingLocales.push(locale);
        }
      }
      if (missingLocales.length > 0) {
        const parsed = await provider.query("elements", { locale: "en" });
        const match = parsed.find((p) => basename(p.filePath) === fileName);
        results.push({
          elementId: (match == null ? void 0 : match.frontmatter.id) || fileName.replace(".md", ""),
          collection,
          missingLocales
        });
      }
    }
  }
  return results;
}
async function findMissingIcons(provider, iconsDir) {
  const elements = await provider.getAllElements("en");
  const missing = [];
  for (const el of elements) {
    const iconPath = el.frontmatter.icon;
    if (!iconPath) {
      missing.push(el.frontmatter.id);
      continue;
    }
    const iconFile = join(iconsDir, basename(iconPath));
    if (!existsSync(iconFile)) {
      missing.push(el.frontmatter.id);
    }
  }
  return missing;
}
async function findStaleTranslations(provider) {
  const results = [];
  for (const collection of ["elements", "categories"]) {
    const enFiles = collection === "elements" ? await provider.getAllElements("en") : await provider.getAllCategories("en");
    for (const enFile of enFiles) {
      const enUpdated = enFile.frontmatter.updated_at;
      if (!enUpdated) continue;
      for (const locale of LOCALES) {
        if (locale === "en") continue;
        try {
          const locFile = await provider.readFile(collection, locale, enFile.frontmatter.id);
          const locUpdated = locFile.frontmatter.updated_at;
          if (locUpdated && new Date(enUpdated) > new Date(locUpdated)) {
            results.push({
              elementId: enFile.frontmatter.id,
              collection,
              locale,
              sourceUpdatedAt: enUpdated,
              translationUpdatedAt: locUpdated
            });
          }
        } catch {
        }
      }
    }
  }
  return results;
}
async function findSparseCategories(provider) {
  const categories = await provider.getAllCategories("en");
  const elements = await provider.getAllElements("en");
  const counts = categories.map((cat) => {
    const count = elements.filter(
      (el) => el.frontmatter.category.includes(cat.frontmatter.id)
    ).length;
    return { categoryId: cat.frontmatter.id, elementCount: count };
  });
  const sorted = counts.map((c) => c.elementCount).sort((a, b) => a - b);
  const medianCount = sorted[Math.floor(sorted.length / 2)];
  const threshold = Math.max(1, Math.floor(medianCount / 2));
  return counts.filter((c) => c.elementCount < threshold).map((c) => ({ ...c, medianCount }));
}
async function findOrphanedElements(provider) {
  const elements = await provider.getAllElements("en");
  const categories = await provider.getAllCategories("en");
  const categoryIds = new Set(categories.map((c) => c.frontmatter.id));
  const results = [];
  for (const el of elements) {
    for (const catRef of el.frontmatter.category) {
      if (!categoryIds.has(catRef)) {
        results.push({
          elementId: el.frontmatter.id,
          referencedCategory: catRef,
          fileName: basename(el.filePath)
        });
      }
    }
  }
  return results;
}
async function findValidationErrors(provider) {
  const errors = [];
  const elements = await provider.getAllElements("en");
  for (const el of elements) {
    const fm = el.frontmatter;
    if (!fm.id) errors.push({ file: el.filePath, field: "id", message: "Missing required field: id" });
    if (!fm.name) errors.push({ file: el.filePath, field: "name", message: "Missing required field: name" });
    if (!fm.description) errors.push({ file: el.filePath, field: "description", message: "Missing required field: description" });
    if (!fm.category || fm.category.length === 0)
      errors.push({ file: el.filePath, field: "category", message: "Missing required field: category" });
  }
  const categories = await provider.getAllCategories("en");
  for (const cat of categories) {
    const fm = cat.frontmatter;
    if (!fm.id) errors.push({ file: cat.filePath, field: "id", message: "Missing required field: id" });
    if (!fm.name) errors.push({ file: cat.filePath, field: "name", message: "Missing required field: name" });
    if (!fm.datachain_type)
      errors.push({ file: cat.filePath, field: "datachain_type", message: "Missing required field: datachain_type" });
  }
  return errors;
}

const index_get = defineEventHandler(async () => {
  const provider = getProvider();
  const iconsDir = getIconsDir();
  return analyzeGaps(provider, iconsDir);
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
