import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Cpu, HardDrive, MemoryStick, Monitor, Thermometer, RefreshCw } from 'lucide-react'

// 硬件信息接口（与后端对应）
interface HardwareInfo {
  cpu: {
    name: string
    cores: number
    threads: number
    frequency: string
    temperature: number
    usage: number
  }
  gpu: {
    name: string
    vram: string
    driver: string
    usage: number
  }
  memory: {
    total: string
    used: string
    usage: number
    slots: string
  }
  npu: {
    has_npu: boolean
    vendor: string
    model: string
    compute_units: number
    tops: number
    driver_version: string
    status: string
    recommendations: string[]
  }
  storage: Array<{
    name: string
    size: string
    health: number
    temp: number
    storage_type: string
  }>
}

export function HardwareInfo() {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 从后端获取硬件信息
  const fetchHardwareInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const info = await invoke<HardwareInfo>('get_hardware_info')
      setHardware(info)
    } catch (err) {
      console.error('获取硬件信息失败:', err)
      setError('获取硬件信息失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHardwareInfo()
  }, [])

  // 刷新硬件信息
  const handleRefresh = () => {
    fetchHardwareInfo()
  }

  // 加载状态
  if (loading && !hardware) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">硬件检测</h1>
          <p className="text-gray-500 mt-1">查看系统硬件详细信息</p>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">正在获取硬件信息...</p>
          </div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error && !hardware) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">硬件检测</h1>
          <p className="text-gray-500 mt-1">查看系统硬件详细信息</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          重试
        </button>
      </div>
    )
  }

  if (!hardware) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">硬件检测</h1>
          <p className="text-gray-500 mt-1">查看系统硬件详细信息</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="刷新硬件信息"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* NPU 状态 */}
      <div className={`p-6 rounded-xl border-2 ${
        hardware.npu.has_npu 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            hardware.npu.has_npu ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            <Cpu className={`w-7 h-7 ${hardware.npu.has_npu ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {hardware.npu.has_npu ? hardware.npu.model : '未检测到 NPU'}
              </h2>
              {hardware.npu.has_npu && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">已启用</span>
              )}
            </div>
            {hardware.npu.has_npu ? (
              <p className="text-sm text-gray-600">
                {hardware.npu.vendor} · {hardware.npu.compute_units} 计算单元 · {hardware.npu.tops} TOPS · 驱动 v{hardware.npu.driver_version}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                您的设备不支持 NPU，可使用 CPU 模式运行 AI 功能
              </p>
            )}
          </div>
        </div>
        
        {/* NPU 建议 */}
        {hardware.npu.has_npu && hardware.npu.recommendations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {hardware.npu.recommendations.map((rec, idx) => (
              <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                {rec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CPU */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-gray-500" /> CPU
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">型号</p>
            <p className="font-medium">{hardware.cpu.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">核心/线程</p>
            <p className="font-medium">{hardware.cpu.cores} 核心 / {hardware.cpu.threads} 线程</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">频率</p>
            <p className="font-medium">{hardware.cpu.frequency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">温度</p>
            <p className="font-medium">
              {hardware.cpu.temperature > 0
                ? `${hardware.cpu.temperature}°C`
                : <span className="text-gray-400">不可用 <span className="text-xs">(需管理员权限)</span></span>
              }
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 mb-1">使用率</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${hardware.cpu.usage}%` }} />
              </div>
              <span className="text-sm font-medium">{hardware.cpu.usage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* GPU */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-gray-500" /> GPU 显卡
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">型号</p>
            <p className="font-medium">{hardware.gpu.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">显存</p>
            <p className="font-medium">{hardware.gpu.vram}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">驱动版本</p>
            <p className="font-medium">{hardware.gpu.driver}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">使用率</p>
            <p className="font-medium">{hardware.gpu.usage}%</p>
          </div>
        </div>
      </div>

      {/* 内存 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MemoryStick className="w-5 h-5 text-gray-500" /> 内存
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">总容量</p>
            <p className="font-medium">{hardware.memory.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">插槽</p>
            <p className="font-medium">{hardware.memory.slots}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 mb-1">使用情况 ({hardware.memory.used} / {hardware.memory.total})</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${hardware.memory.usage}%` }} />
              </div>
              <span className="text-sm font-medium">{hardware.memory.usage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 存储 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-gray-500" /> 存储
        </h3>
        <div className="space-y-4">
          {hardware.storage.map((disk, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{disk.name}</p>
                  <p className="text-sm text-gray-500">{disk.size} {disk.storage_type}</p>
                </div>
                {disk.health > 0 && disk.health < 100 && (
                  <span className={`px-2 py-1 rounded-full text-xs ${disk.health > 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    健康度 {disk.health}%
                  </span>
                )}
              </div>
              {disk.temp > 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Thermometer className="w-4 h-4" />
                  <span>{disk.temp}°C</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">SMART 数据需要管理员权限读取</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
