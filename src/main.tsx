import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function App(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
      <h1 className="text-2xl font-bold">Colombia Match Predictor</h1>
      <p className="mt-2 text-neutral-600">
        Scaffold listo — selección de equipo y predicciones en las próximas fases.
      </p>
    </main>
  )
}

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
