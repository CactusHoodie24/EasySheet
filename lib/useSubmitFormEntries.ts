import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { submitFormEntries, FormEntryPayload } from '../lib/submitFormEntries'

export function useSubmitFormEntries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitFormEntries,

    // 🔥 OPTIMISTIC UPDATE
    onMutate: async (newEntries) => {
      // 1️⃣ Stop any ongoing refetches
      await queryClient.cancelQueries({ queryKey: ['formEntries'] })

      // 2️⃣ Snapshot previous cache
      const previousEntries =
        queryClient.getQueryData<FormEntryPayload[]>(['formEntries'])

      // 3️⃣ Write immediately to cache
      queryClient.setQueryData<FormEntryPayload[]>(
        ['formEntries'],
        (old = []) => [
          ...old,
          ...newEntries.map(entry => ({
            ...entry,
            _optimistic: true, // optional flag
            _savedAt: Date.now(),
          })),
        ]
      )

      // 4️⃣ Return context for rollback
      return { previousEntries }
    },

    // ❌ Server failed → rollback
    onError: (error, _newEntries, context) => {
      if (axios.isAxiosError(error)) {
        console.error("[submitFormEntries] request failed", {
          status: error.response?.status,
          data: error.response?.data,
        })
      } else {
        console.error("[submitFormEntries] request failed", error)
      }

      if (context?.previousEntries) {
        queryClient.setQueryData(
          ['formEntries'],
          context.previousEntries
        )
      }
    },

    // 🔄 Always sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['formEntries'] })
    },
  })
}
