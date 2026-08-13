<script setup lang="ts">
import { ref } from 'vue'
import { useRespondent, type RespondentType } from '~/composables/useRespondent'

// One-time self-tag (R12): public vs professional, plus optional contact
// (R13/R14 — never required). Shown on the first feedback submit when the
// respondent is untagged; never re-asked afterwards.
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ done: [] }>()

const { tag } = useRespondent()
const { t } = useI18n()

const choice = ref<RespondentType | null>(null)
const contact = ref('')

function confirm() {
  if (!choice.value) return
  tag(choice.value, contact.value || null)
  open.value = false
  emit('done')
}
</script>

<template>
  <UModal v-model:open="open" :title="t('selfTag.heading')" :description="t('selfTag.body')">
    <template #body>
      <div class="flex flex-col gap-3">
        <button
          type="button"
          class="rounded-lg border p-3 text-left transition"
          :class="choice === 'public' ? 'border-[var(--teal)] bg-[var(--chip)]' : 'border-[var(--line)] hover:border-[var(--line-strong)]'"
          @click="choice = 'public'"
        >
          <div class="font-semibold">{{ t('selfTag.public') }}</div>
          <div class="text-sm text-[var(--muted)]">{{ t('selfTag.publicHint') }}</div>
        </button>
        <button
          type="button"
          class="rounded-lg border p-3 text-left transition"
          :class="choice === 'professional' ? 'border-[var(--teal)] bg-[var(--chip)]' : 'border-[var(--line)] hover:border-[var(--line-strong)]'"
          @click="choice = 'professional'"
        >
          <div class="font-semibold">{{ t('selfTag.professional') }}</div>
          <div class="text-sm text-[var(--muted)]">{{ t('selfTag.professionalHint') }}</div>
        </button>

        <UFormField :label="t('selfTag.contactLabel')" class="mt-1">
          <UInput v-model="contact" :placeholder="t('selfTag.contactPlaceholder')" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton :disabled="!choice" color="primary" @click="confirm">
        {{ t('selfTag.continue') }}
      </UButton>
    </template>
  </UModal>
</template>
