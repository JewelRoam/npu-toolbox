import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { RefreshCw, Cpu, MemoryStick } from 'lucide-react'
import { tempColor } from '../utils/tempColor'

interface HardwareInfo {
  cpu: {
    name: string
    cores: number
    threads: number
    frequency: string
    temperature: number
  }
  gpu: {
    name: string
    vram: string
    driver: string
  }
  memory: {
    total: string
    used: string
    usage: number
  }
  npu: {
    has_npu: boolean
    vendor: string
    model: string
    compute_units: number
    tops: number
    driver_version: string
    status: string
  }
}

export function Header() {
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchHardwareInfo = async () => {
    setLoading(true)
    try {
      const info = await invoke<HardwareInfo>('get_hardware_info')
      setHardwareInfo(info)
    } catch (error) {
      console.error('获取硬件信息失败:', error)
      setHardwareInfo(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHardwareInfo()
  }, [])

  const cpuTemp = hardwareInfo?.cpu.temperature ?? 0
  const cpuTempDisplay = cpuTemp > 0 ? `${cpuTemp}°C` : '--'

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        {/* NPU status */}
        <div className="flex items-center gap-2">
          <Cpu className={`w-5 h-5 ${hardwareInfo?.npu.has_npu ? 'text-npu-available' : 'text-gray-400 dark:text-gray-500'}`} />
          <span className={`text-sm font-medium ${hardwareInfo?.npu.has_npu ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            {hardwareInfo?.npu.has_npu
              ? `NPU: ${hardwareInfo.npu.vendor} ${hardwareInfo.npu.model} (${hardwareInfo.npu.tops} TOPS)`
              : 'NPU: 未检测到'
            }
          </span>
        </div>

        {/* CPU status */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{hardwareInfo?.cpu.name || 'CPU'}</span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className={tempColor(cpuTemp)}>{cpuTempDisplay}</span>
        </div>

        {/* Memory status */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MemoryStick className="w-4 h-4" />
          <span>{hardwareInfo?.memory.used} / {hardwareInfo?.memory.total}</span>
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${hardwareInfo?.memory.usage || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={fetchHardwareInfo}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="刷新硬件信息"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  )
}