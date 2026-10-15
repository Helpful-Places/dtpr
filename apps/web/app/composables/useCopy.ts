// Copy text to the clipboard and confirm it with a toast.
export function useCopy() {
  const toast = useToast()
  return async (text: string, what = 'Link') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({ title: `${what} copied`, color: 'success' })
    }
    catch {
      toast.add({ title: `Could not copy the ${what.toLowerCase()}`, color: 'error' })
    }
  }
}
