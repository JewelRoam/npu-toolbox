import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useAppStore } from './stores/appStore'

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

async function initApp() {
  // Apply theme before render to prevent flash
  const settings = useAppStore.getState().settings
  applyTheme(settings.theme)

  // Listen for system theme changes when in system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useAppStore.getState().settings.theme
    if (current === 'system') applyTheme('system')
  })

  // Initialize app state
  await useAppStore.getState().initialize()

  // Re-apply theme after settings load from persistence
  const loaded = useAppStore.getState().settings
  applyTheme(loaded.theme)

  // Subscribe to theme changes
  useAppStore.subscribe((state) => {
    applyTheme(state.settings.theme)
  })

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

initApp()