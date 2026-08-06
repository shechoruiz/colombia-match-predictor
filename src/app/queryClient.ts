/**
 * Shared QueryClient for the composition root (guía §6: server state in
 * TanStack Query). Conservative retry avoids hammering the rate cap; stale
 * data from cache windows is refreshed in the background per the design.
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 15 * 60 * 1000,
    },
  },
})