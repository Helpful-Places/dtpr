<script setup lang="ts">
import { computed } from 'vue'
import type { ElementDisplay, ElementDisplayVariable } from '../core/index.js'
import { interpolateSegments } from '../core/index.js'
import DtprIcon from './DtprIcon.vue'

interface YesNoLabels {
  yes: string
  no: string
}

interface Props {
  // Pre-derived display data (use `deriveElementDisplay` from `@dtpr/ui/core`).
  display: ElementDisplay
  // BCP-47 locale for Intl formatting on number/date variable types.
  locale?: string
  // Localized yes/no labels for boolean variables. Default: { yes: 'yes', no: 'no' }.
  yesNoLabels?: YesNoLabels
  // Trusted HTML for the description. Bound via v-html without sanitization.
  // SECURITY: callers MUST sanitize (DOMPurify etc.) before passing. When
  // omitted, the library uses the plain-text path which escapes via Vue's
  // default text interpolation.
  descriptionHtml?: string
  // Icon size in pixels. Defaults to 64.
  iconSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  locale: 'en',
  yesNoLabels: () => ({ yes: 'yes', no: 'no' }),
  descriptionHtml: undefined,
  iconSize: 64,
})

// Variable segments for the plain-text description path. Missing
// placeholders are surfaced as a distinct segment so they can render
// in-line with an emphasised style (or be wrapped by assistive tech).
const descriptionSegments = computed(() => {
  if (props.descriptionHtml !== undefined) return []
  const vars: Record<string, string> = {}
  for (const v of props.display.variables) {
    if (v.value !== '') vars[v.id] = v.value
  }
  return interpolateSegments(props.display.description, vars)
})

// Required variables with empty values surface an inline warning.
const missingRequired = computed(() =>
  props.display.variables.filter((v) => v.required && v.value === ''),
)

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value
}

function isSafeUrl(value: string): boolean {
  return /^https?:\/\//.test(value)
}

interface NumberRender {
  kind: 'number'
  value: string
}
interface DateRender {
  kind: 'date'
  datetime: string
  formatted: string
}
interface BoolRender {
  kind: 'boolean'
  value: boolean
  label: string
}
interface UrlRender {
  kind: 'url'
  href: string
  label: string
}
interface TextRender {
  kind: 'text'
  value: string
  unknownType?: string
}

type RenderedVariable = NumberRender | DateRender | BoolRender | UrlRender | TextRender

// Compute a structured render payload for each variable. Keeps template
// branching trivial and mirrors exactly what the html renderer will emit.
function renderVariable(v: ElementDisplayVariable): RenderedVariable {
  if (v.value === '') return { kind: 'text', value: '' }
  switch (v.type) {
    case 'url': {
      if (isSafeUrl(v.value)) {
        return { kind: 'url', href: v.value, label: truncate(v.value, 60) }
      }
      // Unsafe scheme (e.g. javascript:) falls through to text rendering.
      return { kind: 'text', value: v.value }
    }
    case 'boolean': {
      const truthy = v.value === 'true' || v.value === '1' || v.value === 'yes'
      return {
        kind: 'boolean',
        value: truthy,
        label: truthy ? props.yesNoLabels.yes : props.yesNoLabels.no,
      }
    }
    case 'number': {
      const n = Number(v.value)
      if (!Number.isFinite(n)) return { kind: 'text', value: v.value }
      return { kind: 'number', value: new Intl.NumberFormat(props.locale).format(n) }
    }
    case 'date': {
      const ts = Date.parse(v.value)
      if (Number.isNaN(ts)) return { kind: 'text', value: v.value }
      return {
        kind: 'date',
        datetime: v.value,
        formatted: new Intl.DateTimeFormat(props.locale).format(ts),
      }
    }
    case 'text':
      return { kind: 'text', value: v.value }
    default: {
      // Defensive fallthrough for future schema variable types.
      const unknownType = v.type as unknown as string
      return { kind: 'text', value: v.value, unknownType }
    }
  }
}
</script>

<template>
  <article class="dtpr-element-detail">
    <header class="dtpr-element-detail__header">
      <slot name="overlay">
        <DtprIcon
          class="dtpr-element-detail__icon"
          :src="display.icon.url"
          :alt="display.icon.alt"
          :size="iconSize"
        />
        <h2 class="dtpr-element-detail__title">{{ display.title }}</h2>
      </slot>
    </header>

    <div
      v-if="descriptionHtml !== undefined"
      class="dtpr-element-detail__description"
      v-html="descriptionHtml"
    />
    <p v-else class="dtpr-element-detail__description">
      <template v-for="(seg, idx) in descriptionSegments" :key="idx">
        <span v-if="seg.kind === 'text'">{{ seg.value }}</span>
        <span
          v-else-if="seg.kind === 'variable'"
          class="dtpr-variable-highlight"
          :data-variable-id="seg.variable_id"
        >{{ seg.value }}</span>
        <span
          v-else
          class="dtpr-variable-missing"
          :data-variable-id="seg.variable_id"
        >{{ seg.value }}</span>
      </template>
    </p>

    <slot name="after-description" />

    <div
      v-if="missingRequired.length > 0"
      class="dtpr-element-detail__warning"
      role="alert"
    >
      <span
        v-for="mv in missingRequired"
        :key="mv.id"
        :data-variable-id="mv.id"
        class="dtpr-element-detail__warning-item"
      >{{ mv.label }}</span>
    </div>

    <ul v-if="display.variables.length > 0" class="dtpr-element-detail__variables">
      <li
        v-for="v in display.variables"
        :key="v.id"
        class="dtpr-element-detail__variable"
        :data-variable-id="v.id"
      >
        <span class="dtpr-element-detail__variable-label">{{ v.label }}</span>
        <template v-if="v.value === ''">
          <span class="dtpr-variable-value" />
        </template>
        <template v-else>
          <template v-for="(r, i) in [renderVariable(v)]" :key="i">
            <a
              v-if="r.kind === 'url'"
              class="dtpr-variable-url"
              :href="r.href"
              target="_blank"
              rel="noopener noreferrer"
            >{{ r.label }}</a>
            <span
              v-else-if="r.kind === 'boolean'"
              class="dtpr-variable-bool"
              :data-value="String(r.value)"
            >{{ r.label }}</span>
            <span
              v-else-if="r.kind === 'number'"
              class="dtpr-variable-number"
            >{{ r.value }}</span>
            <time
              v-else-if="r.kind === 'date'"
              class="dtpr-variable-date"
              :datetime="r.datetime"
            >{{ r.formatted }}</time>
            <span
              v-else
              class="dtpr-variable-value"
              :data-dtpr-unknown-type="r.unknownType"
            >{{ r.value }}</span>
          </template>
        </template>
      </li>
    </ul>

    <slot name="after-variables" />

    <p v-if="display.citation" class="dtpr-element-detail__citation">
      {{ display.citation }}
    </p>

    <slot name="after-citation" />
  </article>
</template>
