import { readdir, readFile } from 'fs/promises';
import { basename, join } from 'path';
import matter from 'gray-matter';
import { g as getContentDir, a as getIconsDir } from './paths.mjs';

const LOCALES = ["en", "es", "fr", "km", "pt", "tl"];

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
class LocalContentProvider {
  constructor(contentDir, iconsDir) {
    this.contentDir = contentDir;
    this.iconsDir = iconsDir;
    // Cache: collection -> id -> fileName (built from English, shared across locales since filenames are the same)
    __publicField(this, "idToFileCache", /* @__PURE__ */ new Map());
  }
  async readFile(collection, locale, id) {
    const cacheKey = collection;
    let cache = this.idToFileCache.get(cacheKey);
    if (cache == null ? void 0 : cache.has(id)) {
      return this.parseFile(collection, locale, cache.get(id));
    }
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      const files = await this.listFilesInDir(collection, "en");
      for (const f of files) {
        const parsed = await this.parseFile(collection, "en", f);
        cache.set(parsed.frontmatter.id, f);
      }
      this.idToFileCache.set(cacheKey, cache);
    }
    const fileName = cache.get(id);
    if (!fileName) throw new Error(`File not found: ${collection}/${locale}/${id}`);
    return this.parseFile(collection, locale, fileName);
  }
  async writeFile(_collection, _locale, _id, _data, _content) {
    throw new Error("Use content-writer.ts for write operations");
  }
  async listFiles(collection, locale) {
    const locales = locale ? [locale] : LOCALES;
    const results = [];
    for (const loc of locales) {
      const files = await this.listFilesInDir(collection, loc);
      results.push(...files.map((f) => `${loc}/${f}`));
    }
    return results;
  }
  async query(collection, filters) {
    const locales = (filters == null ? void 0 : filters.locale) ? [filters.locale] : LOCALES;
    const results = [];
    for (const locale of locales) {
      const files = await this.listFilesInDir(collection, locale);
      for (const file of files) {
        const parsed = await this.parseFile(collection, locale, file);
        if (this.matchesFilters(parsed, filters)) {
          results.push(parsed);
        }
      }
    }
    return results;
  }
  // Higher-level helpers
  async getAllElements(locale) {
    return this.query("elements", { locale });
  }
  async getAllCategories(locale) {
    return this.query("categories", { locale });
  }
  async getAllDatachainTypes(locale) {
    return this.query("datachain_types", { locale });
  }
  async getElementSummaries() {
    const enElements = await this.getAllElements("en");
    const summaries = [];
    for (const el of enElements) {
      const summary = {
        id: el.frontmatter.id,
        category: el.frontmatter.category,
        icon: el.frontmatter.icon,
        locales: { en: { name: el.frontmatter.name, description: el.frontmatter.description } },
        updated_at: el.frontmatter.updated_at,
        fileName: basename(el.filePath)
      };
      for (const locale of LOCALES) {
        if (locale === "en") continue;
        try {
          const locFile = await this.parseFile(
            "elements",
            locale,
            basename(el.filePath)
          );
          summary.locales[locale] = {
            name: locFile.frontmatter.name,
            description: locFile.frontmatter.description
          };
        } catch {
        }
      }
      summaries.push(summary);
    }
    return summaries;
  }
  async getCategorySummaries() {
    const enCategories = await this.getAllCategories("en");
    const enElements = await this.getAllElements("en");
    const summaries = [];
    for (const cat of enCategories) {
      const elementCount = enElements.filter(
        (el) => el.frontmatter.category.includes(cat.frontmatter.id)
      ).length;
      const summary = {
        id: cat.frontmatter.id,
        datachain_type: cat.frontmatter.datachain_type,
        order: cat.frontmatter.order,
        required: cat.frontmatter.required,
        element_variables: cat.frontmatter.element_variables,
        locales: {
          en: {
            name: cat.frontmatter.name,
            description: cat.frontmatter.description,
            prompt: cat.frontmatter.prompt
          }
        },
        updated_at: cat.frontmatter.updated_at,
        elementCount
      };
      for (const locale of LOCALES) {
        if (locale === "en") continue;
        try {
          const locFile = await this.parseFile(
            "categories",
            locale,
            basename(cat.filePath)
          );
          summary.locales[locale] = {
            name: locFile.frontmatter.name,
            description: locFile.frontmatter.description,
            prompt: locFile.frontmatter.prompt
          };
        } catch {
        }
      }
      summaries.push(summary);
    }
    return summaries;
  }
  async listIcons() {
    try {
      const files = await readdir(this.iconsDir);
      return files.filter((f) => f.endsWith(".svg"));
    } catch {
      return [];
    }
  }
  // Internal helpers
  collectionPath(collection, locale) {
    return join(this.contentDir, collection, locale);
  }
  async listFilesInDir(collection, locale) {
    try {
      const dir = this.collectionPath(collection, locale);
      const files = await readdir(dir);
      return files.filter((f) => f.endsWith(".md"));
    } catch {
      return [];
    }
  }
  async parseFile(collection, locale, fileName) {
    const filePath = join(this.collectionPath(collection, locale), fileName);
    const raw = await readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      frontmatter: data,
      content: content.trim(),
      filePath,
      locale,
      collection
    };
  }
  matchesFilters(parsed, filters) {
    if (!filters) return true;
    const fm = parsed.frontmatter;
    if (filters.category && fm.category && !fm.category.includes(filters.category)) {
      return false;
    }
    if (filters.datachain_type && fm.datachain_type !== filters.datachain_type) {
      return false;
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const searchable = `${fm.name || ""} ${fm.description || ""} ${fm.id || ""}`.toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    if (filters.hasIcon !== void 0) {
      const hasIcon = !!fm.icon;
      if (filters.hasIcon !== hasIcon) return false;
    }
    return true;
  }
}

let _provider = null;
function getProvider() {
  if (!_provider) {
    _provider = new LocalContentProvider(getContentDir(), getIconsDir());
  }
  return _provider;
}

export { LOCALES as L, getProvider as g };
//# sourceMappingURL=provider.mjs.map
