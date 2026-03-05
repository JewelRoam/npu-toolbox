// 硬件信息类型定义

export interface CPUInfo {
  name: string
  cores: number
  threads: number
  baseClock: number
  maxClock: number
  socket: string
  temperature?: number
}

export interface GPUInfo {
  name: string
  vram: number // MB
  driver: string
  temperature?: number
}

export interface MemoryInfo {
  total: number // GB
  used: number // GB
  type: string
  speed: number
  slots: number
}

export interface StorageInfo {
  name: string
  total: number // GB
  used: number // GB
  type: 'SSD' | 'HDD'
  health?: number // percentage
}

export interface NPUInfo {
  hasNPU: boolean
  vendor: 'Intel' | 'AMD' | 'Qualcomm' | null
  model: string
  driverVersion: string
  computeUnits: number
  tops: number
  recommendations: string[]
}

export interface HardwareInfo {
  cpu: CPUInfo
  gpu: GPUInfo[]
  memory: MemoryInfo
  storages: StorageInfo[]
}

export interface ToolInfo {
  id: string
  name: string
  description: string
  category: 'ai' | 'hardware' | 'system' | 'creative'
  icon: string
  executable?: string
  downloadUrl?: string
  version?: string
  size?: number // MB
  isDownloaded: boolean
  isRunning: boolean
  requiresNPU: boolean
  lastUsed?: string
}

export interface DownloadTask {
  id: string
  toolId: string
  progress: number
  speed: number // KB/s
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  error?: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  autoCheckUpdates: boolean
  downloadPath: string
  cachePath: string
}