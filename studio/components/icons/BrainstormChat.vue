<script setup lang="ts">
import { isTextUIPart } from 'ai'
import { Chat } from '@ai-sdk/vue'

const props = defineProps<{
  elementId: string
  elementName: string
  elementDescription: string
  shapeName?: string
  referenceSymbols: string[]
}>()

const emit = defineEmits<{
  'prompt-ready': [prompt: string, suggestedColors?: [number, number, number][]]
}>()

const toast = useToast()
const input = ref('')
const generatingPrompt = ref(false)

const chat = new Chat({
  transport: {
    api: '/api/icons/chat',
    body: computed(() => ({
      elementId: props.elementId,
      referenceSymbols: props.referenceSymbols,
    })).value,
  },
  onError(error) {
    toast.add({ title: 'Chat error', description: error.message, color: 'error' })
  },
})

// Send initial context message when the component mounts
onMounted(() => {
  const refCount = props.referenceSymbols.length
  const refText = refCount > 0
    ? ` I've selected ${refCount} reference symbol${refCount > 1 ? 's' : ''} from our existing set for style context.`
    : ''

  const initialMessage = `I need to create a symbol for "${props.elementName}": ${props.elementDescription}. The symbol needs to work at 36×36px as monochrome line art — just the inner graphic, no outer shape or border.${refText} What visual metaphors would work well for this concept?`

  chat.sendMessage({ text: initialMessage })
})

function onSubmit() {
  if (!input.value.trim()) return
  chat.sendMessage({ text: input.value })
  input.value = ''
}

async function generatePrompt() {
  generatingPrompt.value = true
  try {
    // Extract message text for the prompt endpoint
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

const hasMessages = computed(() => chat.messages.length > 1)
const isStreaming = computed(() => chat.status === 'streaming')
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-hidden flex flex-col">
      <UChatMessages
        :messages="chat.messages"
        :status="chat.status"
        :assistant="{ icon: 'i-lucide-bot', side: 'left', variant: 'naked' }"
        :user="{ side: 'right', variant: 'soft' }"
        :should-auto-scroll="true"
        class="flex-1"
      >
        <template #content="{ message }">
          <template
            v-for="(part, index) in message.parts"
            :key="`${message.id}-${part.type}-${index}`"
          >
            <p
              v-if="isTextUIPart(part)"
              class="whitespace-pre-wrap text-sm"
            >{{ part.text }}</p>
          </template>
        </template>
      </UChatMessages>

      <div class="border-t border-default p-3">
        <UButton
          v-if="hasMessages"
          label="Use this to generate Recraft prompt"
          icon="i-lucide-sparkles"
          size="sm"
          :loading="generatingPrompt"
          :disabled="isStreaming"
          class="w-full mb-3"
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
  </div>
</template>
