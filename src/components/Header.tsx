import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Cpu, MemoryStick, HardDrive, Thermometer } from 'lucide-react'
import { tempColor } from '../utils/tempColor'

interface HardwareInfo {
  cpu: { name: string; cores: number; threads: number; frequency: string; temperature: number; usage: number }
  gpu: { name: string; vram_total: string; vram_used: string; driver: string; usage: number; temperature: number }
  memory: { total: string; used: string; usage: number; slots: string }
  npu: { has_npu: boolean; vendor: string; model: string; compute_units: number; tops: number; driver_version: string; status: string }
  storage: { name: string; filesystem: string; total: string; used: string; free: string; usage: number }[]
}

function TempBadge({ temp }: { temp: number }) {
  if (temp <= 0) return null
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${tempColor(temp)}`}>
      <Thermometer className="w-3 h-3" />
      {temp}°C
    </span>
  )
}

export function Header() {
  const [info, setInfo] = useState<HardwareInfo | null>(null)
  useEffect(() => {
    invoke<HardwareInfo>('get_hardware_info').then(setInfo).catch(() => setInfo(null))
  }, [])

  // Pick the system drive (C:) for the header badge
  const systemDrive = info?.storage.find(s => s.name === 'C:') ?? info?.storage[0]

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-5">
      <div className="flex items-center gap-5 overflow-hidden">
        {/* NPU */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu className={`w-4 h-4 ${info?.npu.has_npu ? 'text-npu-available' : 'text-gray-400 dark:text-gray-500'}`} />
          <span className={`text-xs font-medium ${info?.npu.has_npu ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            {info?.npu.has_npu
              ? `NPU ${info.npu.tops} TOPS`
              : 'NPU: --'}
          </span>
        </div>

        <Separator />

        {/* CPU */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 shrink-0">
          <span className="truncate max-w-[180px]" title={info?.cpu.name}>
            {info?.cpu.name.replace(/\(R\)|\(TM\)|CPU|@.*/g, '').trim() || 'CPU'}
          </span>
          <TempBadge temp={info?.cpu.temperature ?? 0} />
        </div>

        <Separator />

        {/* GPU */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 shrink-0">
          <span className="truncate max-w-[140px]" title={info?.gpu.name}>
            {info?.gpu.name.replace(/NVIDIA |AMD |Intel(R) |Graphics/g, '').trim() || 'GPU'}
          </span>
          <TempBadge temp={info?.gpu.temperature ?? 0} />
        </div>

        <Separator />

        {/* Memory */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 shrink-0">
          <MemoryStick className="w-3.5 h-3.5" />
          <span>{info?.memory.used}/{info?.memory.total}</span>
          <MiniBar percent={info?.memory.usage ?? 0} />
        </div>

        {/* Storage (system drive) */}
        {systemDrive && (
          <>
            <Separator />
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 shrink-0">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{systemDrive.name} {systemDrive.used}/{systemDrive.total}</span>
              <MiniBar percent={systemDrive.usage} warn />
            </div>
          </>
        )}
      </div>

    </header>
  )
}

function Separator() {
  return <span className="text-gray-200 dark:text-gray-700">|</span>
}

function MiniBar({ percent, warn }: { percent: number; warn?: boolean }) {
  const color = warn
    ? percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-green-500'
    : 'bg-primary-500'
  return (
    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  )
}