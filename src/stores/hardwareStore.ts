import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import type { HardwareInfo } from '../types'

interface HardwareState {
  info: HardwareInfo | null
  loading: boolean
  error: string | null

  /** Fetch hardware info from backend (respects server-side 30s cache). */
  refresh: () => Promise<void>

  /** Fire-and-forget: start loading in background without blocking caller. */
  refreshInBackground: () => void
}

export const useHardwareStore = create<HardwareState>()((set, get) => ({
  info: null,
  loading: false,
  error: null,

  refresh: async () => {
    // Skip if already loading
    if (get().loading) return

    set({ loading: true, error: null })
    try {
      const info = await invoke<HardwareInfo>('get_hardware_info')
      set({ info, loading: false })
    } catch (err) {
      set({ error: '获取硬件信息失败', loading: false })
    }
  },

  refreshInBackground: () => {
    if (get().loading) return
    get().refresh()
  },
}))