import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Cpu, HardDrive, MemoryStick, Monitor, Thermometer, RefreshCw, Pause, Play } from 'lucide-react'
import { tempColor } from '../utils/tempColor'

interface HardwareInfo {
  cpu: { name: string; cores: number; threads: number; frequency: string; temperature: number; usage: number }
  gpu: { name: string; vram_total: string; vram_used: string; driver: string; usage: number }
  memory: { total: string; used: string; usage: number; slots: string }
  npu: { has_npu: boolean; vendor: string; model: string; compute_units: number; tops: number; driver_version: string; status: string; recommendations: string[] }
  storage: Array<{ name: string; size: string; health: number; temp: number; storage_type: string }>
}

const REFRESH_INTERVAL_MS = 5000

export function HardwareInfo() {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchHardwareInfo = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const info = await invoke<HardwareInfo>('get_hardware_info')
      setHardware(info)
    } catch {
      setError('获取硬件信息失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHardwareInfo() }, [fetchHardwareInfo])

  // Auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHardwareInfo, REFRESH_INTERVAL_MS)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchHardwareInfo])

  if (loading && !hardware) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">硬件检测</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">查看系统硬件详细信息</p>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">正在获取硬件信息...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !hardware) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">硬件检测</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">查看系统硬件详细信息</p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
        <button onClick={fetchHardwareInfo} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">硬件检测</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">查看系统硬件详细信息</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              autoRefresh
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={autoRefresh ? '停止自动刷新' : '开启自动刷新 (5s)'}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">{autoRefresh ? '监控中' : '监控'}</span>
          </button>
          <button onClick={fetchHardwareInfo} disabled={loading} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="刷新">
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* NPU */}
      <div className={`p-6 rounded-xl border-2 ${hardware.npu.has_npu
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${hardware.npu.has_npu ? 'bg-green-100 dark:bg-green-800' : 'bg-amber-100 dark:bg-amber-800'}`}>
            <Cpu className={`w-7 h-7 ${hardware.npu.has_npu ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{hardware.npu.has_npu ? hardware.npu.model : '未检测到 NPU'}</h2>
              {hardware.npu.has_npu && <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs">已启用</span>}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {hardware.npu.has_npu
                ? `${hardware.npu.vendor} · ${hardware.npu.compute_units} 计算单元 · ${hardware.npu.tops} TOPS · 驱动 v${hardware.npu.driver_version}`
                : '您的设备不支持 NPU，可使用 CPU 模式运行 AI 功能'}
            </p>
          </div>
        </div>
        {hardware.npu.has_npu && hardware.npu.recommendations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {hardware.npu.recommendations.map((rec, idx) => (
              <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs">{rec}</span>
            ))}
          </div>
        )}
      </div>

      {/* CPU */}
      <Section title="CPU" icon={<Cpu className="w-5 h-5 text-gray-500 dark:text-gray-400" />}>
        <InfoGrid items={[
          { label: '型号', value: hardware.cpu.name },
          { label: '核心/线程', value: `${hardware.cpu.cores} 核心 / ${hardware.cpu.threads} 线程` },
          { label: '频率', value: hardware.cpu.frequency },
          { label: '温度', value: hardware.cpu.temperature > 0 ? `${hardware.cpu.temperature}°C` : undefined, hint: hardware.cpu.temperature <= 0 ? '不可用 (需管理员权限)' : undefined, valueClass: tempColor(hardware.cpu.temperature) },
        ]} />
        <div className="col-span-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">使用率</p>
          <ProgressBar value={hardware.cpu.usage} />
        </div>
      </Section>

      {/* GPU */}
      <Section title="GPU 显卡" icon={<Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />}>
        <InfoGrid items={[
          { label: '型号', value: hardware.gpu.name },
          { label: '显存', value: hardware.gpu.vram_used ? `${hardware.gpu.vram_used} / ${hardware.gpu.vram_total}` : hardware.gpu.vram_total },
          { label: '驱动版本', value: hardware.gpu.driver },
        ]} />
        <div className="col-span-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">使用率</p>
          <ProgressBar value={hardware.gpu.usage} />
        </div>
      </Section>

      {/* Memory */}
      <Section title="内存" icon={<MemoryStick className="w-5 h-5 text-gray-500 dark:text-gray-400" />}>
        <InfoGrid items={[
          { label: '总容量', value: hardware.memory.total },
          { label: '插槽', value: hardware.memory.slots },
        ]} />
        <div className="col-span-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">使用情况 ({hardware.memory.used} / {hardware.memory.total})</p>
          <ProgressBar value={hardware.memory.usage} color="green" />
        </div>
      </Section>

      {/* Storage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 存储
        </h3>
        <div className="space-y-4">
          {hardware.storage.map((disk, idx) => (
            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{disk.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{disk.size} {disk.storage_type}</p>
                </div>
                {disk.health > 0 && disk.health < 100 && (
                  <span className={`px-2 py-1 rounded-full text-xs ${disk.health > 90 ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'}`}>
                    健康度 {disk.health}%
                  </span>
                )}
              </div>
              {disk.temp > 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Thermometer className="w-4 h-4" />
                  <span className={tempColor(disk.temp)}>{disk.temp}°C</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">SMART 数据需要管理员权限读取</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">{icon} {title}</h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function InfoGrid({ items }: { items: Array<{ label: string; value?: string; hint?: string; valueClass?: string }> }) {
  return (
    <>
      {items.map(({ label, value, hint, valueClass }) => (
        <div key={label}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          {value
            ? <p className={`font-medium ${valueClass || 'text-gray-900 dark:text-white'}`}>{value}</p>
            : <p className="text-sm text-gray-400 dark:text-gray-500">{hint}</p>}
        </div>
      ))}
    </>
  )
}

function ProgressBar({ value, color = 'primary' }: { value: number; color?: 'primary' | 'green' }) {
  const bgColor = color === 'green' ? 'bg-green-500' : 'bg-primary-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}%</span>
    </div>
  )
}