<script setup lang="ts">
import { isTextUIPart } from 'ai'

const props = defineProps<{
  elementId: string
  elementName: string
  elementDescription: string
  referenceSymbols: string[]
}>()

const emit = defineEmits<{
  'prompt-ready': [prompt: string, suggestedColors?: [number, number, number][]]
}>()

const toast = useToast()
const generatingPrompt = ref(false)

// Use persistent chat from composable — survives slideover open/close
const chat = useBrainstormChat(props.elementId, props.referenceSymbols)

// Pre-fill the suggested first message if chat is empty
const input = ref('')
onMounted(() => {
  if (chat.messages.length === 0) {
    const refCount = props.referenceSymbols.length
    const refText = refCount > 0
      ? ` I've selected ${refCount} reference symbol${refCount > 1 ? 's' : ''} from our existing set for style context.`
      : ''

    input.value = `I need to create a symbol for "${props.elementName}": ${props.elementDescription}. The symbol needs to work at 36×36px as monochrome line art — just the inner graphic, no outer shape or border.${refText} What visual metaphors would work well for this concept?`
  }
})

function onSubmit() {
  if (!input.value.trim()) return
  chat.sendMessage({ text: input.value })
  input.value = ''
}

async function generatePrompt() {
  generatingPrompt.value = true
  try {
    const messagesForPrompt = chat.messages.map((m) => ({
      role: m.role,
      content: m.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n') || '',
    }))

    const result = await $fetch<{ prompt: string; suggestedColors?: [number, number, number][] }>('/api/icons/prompt', {
      method: 'POST',
      body: {
        messages: messagesForPrompt,
        elementName: props.elementName,
        elementDescription: props.elementDescription,
        referenceSymbols: props.referenceSymbols,
      },
    })

    emit('prompt-ready', result.prompt, result.suggestedColors)
  } catch (e: any) {
    toast.add({ title: 'Prompt generation failed', description: e.data?.message || e.message, color: 'error' })
  } finally {
    generatingPrompt.value = false
  }
}

const hasAssistantMessage = computed(() => chat.messages.some((m) => m.role === 'assistant'))
const isStreaming = computed(() => chat.status === 'streaming')
</script>

<template>
  <div class="flex flex-col" style="height: calc(100vh - 8rem)">
    <!-- Scrollable message area -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <UChatMessages
        :messages="chat.messages"
        :status="chat.status"
        :assistant="{ icon: 'i-lucide-bot', side: 'left', variant: 'naked' }"
        :user="{ side: 'right', variant: 'soft' }"
        :should-auto-scroll="true"
      >
        <template #content="{ message }">
          <template
            v-for="(part, index) in message.parts"
            :key="`${message.id}-${part.type}-${index}`"
          >
            <MDC
              v-if="isTextUIPart(part)"
              :value="part.text"
              :cache-key="`${message.id}-${index}`"
              class="prose prose-sm max-w-none *:first:mt-0 *:last:mb-0"
            />
          </template>
        </template>
      </UChatMessages>
    </div>

    <!-- Fixed bottom: prompt + actions -->
    <div class="shrink-0 border-t border-default p-3 space-y-3">
      <UButton
        v-if="hasAssistantMessage"
        label="Use this to generate Recraft prompt"
        icon="i-lucide-sparkles"
        size="sm"
        :loading="generatingPrompt"
        :disabled="isStreaming"
        class="w-full"
        @click="generatePrompt"
      />

      <UChatPrompt
        v-model="input"
        placeholder="Describe what you're envisioning..."
        :error="chat.error"
        @submit="onSubmit"
      >
        <UChatPromptSubmit
          :status="chat.status"
          @stop="chat.stop()"
          @reload="chat.regenerate()"
        />
      </UChatPrompt>
    </div>
  </div>
</template>
