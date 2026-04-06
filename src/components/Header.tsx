import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { RefreshCw, Cpu, MemoryStick } from 'lucide-react'

// 硬件信息接口
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
      // 不使用虚拟数据，保持错误状态
      setHardwareInfo(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHardwareInfo()
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* 硬件状态显示 */}
      <div className="flex items-center gap-6">
      {/* NPU 状态 */}
        <div className="flex items-center gap-2">
          <Cpu className={`w-5 h-5 ${hardwareInfo?.npu.has_npu ? 'text-npu-available' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            {hardwareInfo?.npu.has_npu 
              ? `NPU: ${hardwareInfo.npu.vendor} ${hardwareInfo.npu.model} (${hardwareInfo.npu.tops} TOPS)`
              : 'NPU: 未检测到'
            }
          </span>
        </div>

        {/* CPU 状态 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{hardwareInfo?.cpu.name || 'CPU'}</span>
          <span className="text-gray-400">|</span>
          <span>{hardwareInfo?.cpu.temperature}°C</span>
        </div>

        {/* 内存状态 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MemoryStick className="w-4 h-4" />
          <span>{hardwareInfo?.memory.used} / {hardwareInfo?.memory.total}</span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full" 
              style={{ width: `${hardwareInfo?.memory.usage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={fetchHardwareInfo}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="刷新硬件信息"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  )
}