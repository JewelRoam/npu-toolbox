// Hardware info types matching backend Rust structs (snake_case)

export interface CPUInfo {
  name: string
  cores: number
  threads: number
  frequency: string
  temperature: number
  usage: number
}

export interface GPUInfo {
  name: string
  vram_total: string
  vram_used: string
  driver: string
  usage: number
}

export interface MemoryInfo {
  total: string
  used: string
  usage: number
  slots: string
}

export interface NPUInfo {
  has_npu: boolean
  vendor: string
  model: string
  compute_units: number
  tops: number
  driver_version: string
  status: string
  recommendations: string[]
}

export interface StorageInfo {
  name: string
  filesystem: string
  total: string
  used: string
  free: string
  usage: number
}

export interface HardwareInfo {
  cpu: CPUInfo
  gpu: GPUInfo
  memory: MemoryInfo
  npu: NPUInfo
  storage: StorageInfo[]
}

export interface ToolInfo {
  id: string
  name: string
  description: string
  category: 'ai' | 'hardware' | 'system' | 'creative' | 'audio' | 'programming'
  icon: string
  executable?: string
  downloadUrl?: string
  version?: string
  size?: number
  isDownloaded: boolean
  isRunning: boolean
  requiresNPU: boolean
  lastUsed?: string
}

export interface DownloadTask {
  id: string
  toolId: string
  progress: number
  speed: number
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

export interface SystemInfo {
  os_version: string
  computer_name: string
  uptime: string
}