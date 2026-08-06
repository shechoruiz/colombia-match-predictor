/**
 * Entry point: builds the data sources (DI), supplies a shared QueryClient,
 * and mounts the composition root. No business logic here.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'
import { queryClient } from './app/queryClient'
import { createDataSources } from './app/di'
import './index.css'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App useCases={createDataSources().useCases} />
    </QueryClientProvider>
  </StrictMode>,
)