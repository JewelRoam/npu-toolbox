import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NPUInfo, HardwareInfo, ToolInfo, DownloadTask, AppSettings } from '../types'

interface AppState {
  // 页面状态
  currentPage: 'home' | 'hardware' | 'tools' | 'settings' | 'ai-chat'
  setCurrentPage: (page: AppState['currentPage']) => void
  
  // NPU 状态
  npuInfo: NPUInfo & { checked: boolean; loading: boolean; error?: string }
  checkNPU: () => Promise<void>
  
  // 硬件信息
  hardwareInfo: HardwareInfo | null
  refreshHardware: () => Promise<void>
  
  // 工具管理
  tools: ToolInfo[]
  downloadTask: DownloadTask | null
  downloadTool: (toolId: string) => Promise<void>
  launchTool: (toolId: string) => Promise<void>
  uninstallTool: (toolId: string) => Promise<void>
  
  // 下载任务
  setDownloadTask: (task: DownloadTask | null) => void
  updateDownloadProgress: (progress: number, speed: number) => void
  
  // 设置
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // 初始化
  initialize: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 页面状态
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // NPU 状态
      npuInfo: {
        hasNPU: false,
        vendor: null,
        model: '',
        driverVersion: '',
        computeUnits: 0,
        tops: 0,
        recommendations: [],
        checked: false,
        loading: false,
      },
      checkNPU: async () => {
        set({ npuInfo: { ...get().npuInfo, loading: true, error: undefined } })
        
        try {
          // 模拟 NPU 检测（实际应调用系统 API）
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // 随机模拟检测结果（实际应根据硬件检测）
          const hasNPU = Math.random() > 0.5
          
          const npuInfo: NPUInfo = hasNPU
            ? {
                hasNPU: true,
                vendor: 'Intel',
                model: 'Intel AI Boost',
                driverVersion: '101.3792',
                computeUnits: 13,
                tops: 40,
                recommendations: [
                  '可流畅运行 1-3B 本地模型',
                  '支持实时视频处理',
                  '建议使用 INT8 量化模型'
                ]
              }
            : {
                hasNPU: false,
                vendor: null,
                model: '',
                driverVersion: '',
                computeUnits: 0,
                tops: 0,
                recommendations: [
                  '您的设备不支持 NPU',
                  '仍可使用 CPU 模式运行（速度较慢）',
                  '建议使用轻量化模型 (< 2B 参数)'
                ]
              }
          
          set({
            npuInfo: { ...npuInfo, checked: true, loading: false }
          })
        } catch (error) {
          set({
            npuInfo: {
              ...get().npuInfo,
              loading: false,
              error: 'NPU 检测失败，请重试'
            }
          })
        }
      },
      
      // 硬件信息
      hardwareInfo: null,
      refreshHardware: async () => {
        // 模拟硬件检测
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const hardwareInfo: HardwareInfo = {
          cpu: {
            name: 'Intel Core Ultra 7 155H',
            cores: 16,
            threads: 22,
            baseClock: 1.4,
            maxClock: 4.8,
            socket: 'FCBGA2049',
            temperature: 45
          },
          gpu: [
            {
              name: 'Intel Arc Graphics',
              vram: 8192,
              driver: '31.0.101.5127',
              temperature: 42
            },
            {
              name: 'NVIDIA GeForce RTX 4060',
              vram: 8192,
              driver: '551.23',
              temperature: 38
            }
          ],
          memory: {
            total: 32,
            used: 16,
            type: 'LPDDR5X',
            speed: 7467,
            slots: 2
          },
          storages: [
            {
              name: 'Samsung PM9A1',
              total: 1024,
              used: 512,
              type: 'SSD',
              health: 98
            },
            {
              name: 'WD Black SN770',
              total: 2048,
              used: 1024,
              type: 'SSD',
              health: 99
            }
          ]
        }
        
        set({ hardwareInfo })
      },
      
      // 工具管理
      tools: [
        {
          id: 'ollama',
          name: 'Ollama',
          description: '本地大模型运行时，支持 100+ 开源模型',
          category: 'ai',
          icon: '🤖',
          downloadUrl: 'https://ollama.com/download/ollama-windows-amd64.zip',
          version: '0.5.1',
          size: 150,
          isDownloaded: false,
          isRunning: false,
          requiresNPU: false
        },
        {
          id: 'cpu-z',
          name: 'CPU-Z',
          description: '专业 CPU 检测工具',
          category: 'hardware',
          icon: '🔍',
          downloadUrl: 'https://download.cpuid.com/cpu-z/cpu-z_2.10-cn.zip',
          version: '2.10',
          size: 2,
          isDownloaded: true,
          isRunning: false,
          requiresNPU: false
        },
        {
          id: 'gpu-z',
          name: 'GPU-Z',
          description: '专业显卡检测工具',
          category: 'hardware',
          icon: '🎮',
          downloadUrl: 'https://soft99.ir/downloads/GPU-Z.2.55.0.zip',
          version: '2.55',
          size: 4,
          isDownloaded: true,
          isRunning: false,
          requiresNPU: false
        },
        {
          id: 'crystaldiskinfo',
          name: 'CrystalDiskInfo',
          description: '硬盘健康检测工具',
          category: 'hardware',
          icon: '💾',
          downloadUrl: 'https://crystaldiskinfo.en.softonic.com/download',
          version: '9.2',
          size: 5,
          isDownloaded: false,
          isRunning: false,
          requiresNPU: false
        },
        {
          id: '7-zip',
          name: '7-Zip',
          description: '流行的高压缩率压缩软件',
          category: 'system',
          icon: '📦',
          downloadUrl: 'https://www.7-zip.org/a/7z2401-x64.exe',
          version: '24.01',
          size: 1.5,
          isDownloaded: true,
          isRunning: false,
          requiresNPU: false
        }
      ],
      downloadTask: null,
      downloadTool: async (toolId) => {
        const tool = get().tools.find(t => t.id === toolId)
        if (!tool) return
        
        set({
          downloadTask: {
            id: Date.now().toString(),
            toolId,
            progress: 0,
            speed: 0,
            status: 'downloading'
          }
        })
        
        // 模拟下载过程
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          set({ downloadTask: { ...get()!.downloadTask!, progress: i, speed: 5000 + Math.random() * 2000 } })
        }
        
        // 下载完成
        set({
          downloadTask: { ...get().downloadTask!, status: 'completed', progress: 100 },
          tools: get().tools.map(t => 
            t.id === toolId ? { ...t, isDownloaded: true, version: t.version } : t
          )
        })
        
        setTimeout(() => set({ downloadTask: null }), 2000)
      },
      launchTool: async (toolId) => {
        // 模拟启动工具
        await new Promise(resolve => setTimeout(resolve, 500))
        set({
          tools: get().tools.map(t =>
            t.id === toolId ? { ...t, isRunning: true, lastUsed: new Date().toISOString() } : t
          )
        })
      },
      uninstallTool: async (toolId) => {
        await new Promise(resolve => setTimeout(resolve, 500))
        set({
          tools: get().tools.map(t =>
            t.id === toolId ? { ...t, isDownloaded: false, isRunning: false } : t
          )
        })
      },
      
      // 下载任务
      setDownloadTask: (task) => set({ downloadTask: task }),
      updateDownloadProgress: (progress, speed) => set({
        downloadTask: get().downloadTask
          ? { ...get().downloadTask!, progress, speed }
          : null
      }),
      
      // 设置
      settings: {
        theme: 'dark',
        language: 'zh-CN',
        autoCheckUpdates: true,
        downloadPath: './downloads',
        cachePath: './cache'
      },
      updateSettings: (settings) => set({
        settings: { ...get().settings, ...settings }
      }),
      
      // 初始化
      initialize: async () => {
        await get().checkNPU()
        await get().refreshHardware()
      }
    }),
    {
      name: 'npu-toolbox-storage',
      partialize: (state) => ({
        settings: state.settings,
        tools: state.tools
      })
    }
  )
)