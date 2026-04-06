import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import { NPUInfo, HardwareInfo, ToolInfo, DownloadTask, AppSettings } from '../types'

interface AppState {
  currentPage: 'home' | 'hardware' | 'tools' | 'settings' | 'ai-chat'
  setCurrentPage: (page: AppState['currentPage']) => void

  npuInfo: NPUInfo & { checked: boolean; loading: boolean; error?: string }
  checkNPU: () => Promise<void>

  hardwareInfo: HardwareInfo | null
  refreshHardware: () => Promise<void>

  tools: ToolInfo[]
  downloadTask: DownloadTask | null
  downloadTool: (toolId: string) => Promise<void>
  launchTool: (toolId: string) => Promise<void>
  uninstallTool: (toolId: string) => Promise<void>

  setDownloadTask: (task: DownloadTask | null) => void
  updateDownloadProgress: (progress: number, speed: number) => void

  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void

  initialize: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),

      npuInfo: {
        has_npu: false, vendor: '', model: '', driver_version: '',
        compute_units: 0, tops: 0, status: '', recommendations: [],
        checked: false, loading: false,
      },
      checkNPU: async () => {
        set({ npuInfo: { ...get().npuInfo, loading: true, error: undefined } })
        try {
          const npu = await invoke<NPUInfo>('detect_npu')
          set({ npuInfo: { ...npu, checked: true, loading: false } })
        } catch (error) {
          set({ npuInfo: { ...get().npuInfo, loading: false, error: 'NPU detection failed' } })
        }
      },

      hardwareInfo: null,
      refreshHardware: async () => {
        try {
          const info = await invoke<HardwareInfo>('get_hardware_info')
          set( { hardwareInfo: info })
        } catch (error) {
          console.error('Failed to get hardware info:', error)
          set({ hardwareInfo: null })
        }
      },

      tools: [
        { id: 'ollama', name: 'Ollama', description: 'Local LLM runtime', category: 'ai', icon: 'robot', downloadUrl: 'https://ollama.com/download/ollama-windows-amd64.zip', version: '0.5.1', size: 150, isDownloaded: false, isRunning: false, requiresNPU: false },
        { id: 'cpu-z', name: 'CPU-Z', description: 'Professional CPU detection tool', category: 'hardware', icon: 'search', downloadUrl: 'https://download.cpuid.com/cpu-z/cpu-z_2.10-cn.zip', version: '2.10', size: 2, isDownloaded: true, isRunning: false, requiresNPU: false },
        { id: 'gpu-z', name: 'GPU-Z', description: 'Professional GPU detection tool', category: 'hardware', icon: 'gamepad', downloadUrl: 'https://soft99.ir/downloads/GPU-Z.2.55.0.zip', version: '2.55', size: 4, isDownloaded: true, isRunning: false, requiresNPU: false },
        { id: 'crystaldiskinfo', name: 'CrystalDiskInfo', description: 'Disk health detection tool', category: 'hardware', icon: 'harddrive', version: '9.2', size: 5, isDownloaded: false, isRunning: false, requiresNPU: false },
        { id: '7-zip', name: '7-Zip', description: 'High compression ratio archive tool', category: 'system', icon: 'package', downloadUrl: 'https://www.7-zip.org/a/7z2401-x64.exe', version: '24.01', size: 1.5, isDownloaded: true, isRunning: false, requiresNPU: false }
      ],
      downloadTask: null,
      downloadTool: async (toolId) => {
        const tool = get().tools.find(t => t.id === toolId)
        if (!tool) return
        set({ downloadTask: { id: Date.now().toString(), toolId, progress: 0, speed: 0, status: 'downloading' } })
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          set({ downloadTask: { ...get().downloadTask!, progress: i, speed: 5000 + Math.random() * 2000 } })
        }
        set({ downloadTask: { ...get().downloadTask!, status: 'completed', progress: 100 }, tools: get().tools.map(t => t.id === toolId ? { ...t, isDownloaded: true } : t) })
        setTimeout(() => set({ downloadTask: null }), 2000)
      },
      launchTool: async (toolId) => {
        await new Promise(resolve => setTimeout(resolve, 500))
        set({ tools: get().tools.map(t => t.id === toolId ? { ...t, isRunning: true, lastUsed: new Date().toISOString() } : t) })
      },
      uninstallTool: async (toolId) => {
        await new Promise(resolve => setTimeout(resolve, 500))
        set({ tools: get().tools.map(t => t.id === toolId ? { ...t, isDownloaded: false, isRunning: false } : t) })
      },

      setDownloadTask: (task) => set({ downloadTask: task }),
      updateDownloadProgress: (progress, speed) => set({
        downloadTask: get().downloadTask ? { ...get().downloadTask!, progress, speed } : null
      }),

      settings: { theme: 'light', language: 'zh-CN', autoCheckUpdates: true, downloadPath: '', cachePath: '' },
      updateSettings: (settings) => set({ settings: { ...get().settings, ...settings } }),

      initialize: async () => {
        // Load settings from backend (source of truth)
        try {
          const json = await invoke<string>('load_settings')
          const loaded = JSON.parse(json) as AppSettings
          set({ settings: loaded })
        } catch { /* keep defaults */ }

        await get().checkNPU()
        await get().refreshHardware()
      }
    }),
    { name: 'npu-toolbox-storage', partialize: (state) => ({ tools: state.tools }) }
  )
)
