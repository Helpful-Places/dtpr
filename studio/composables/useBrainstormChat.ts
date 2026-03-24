import { DefaultChatTransport } from 'ai'
import { Chat } from '@ai-sdk/vue'

// Holds chat instances per element so they survive slideover open/close.
// Keyed by elementId — chat resets when a different element is selected.
const chatInstances = new Map<string, Chat>()

export function useBrainstormChat(elementId: string, referenceSymbols: string[]) {
  const key = elementId

  if (!chatInstances.has(key)) {
    chatInstances.set(key, new Chat({
      transport: new DefaultChatTransport({
        api: '/api/icons/chat',
        body: {
          elementId,
          referenceSymbols,
        },
      }),
    }))
  }

  const chat = chatInstances.get(key)!
  return chat
}

export function clearBrainstormChat(elementId: string) {
  chatInstances.delete(elementId)
}

export function clearAllBrainstormChats() {
  chatInstances.clear()
}
