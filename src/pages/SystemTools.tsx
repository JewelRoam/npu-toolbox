import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../stores/appStore'
import { HardDrive, Battery, Monitor, Trash2, CheckCircle, RefreshCw, X, Info } from 'lucide-react'

// ============ Helpers ============

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const STATUS_LABEL: Record<string, string> = {
  Charging: '⚡ 充电中',
  Discharging: '🔋 放电中',
  'AC Power': '🔌 接通电源',
  'Fully Charged': '✅ 已充满',
  Low: '⚠️ 电量低',
  Critical: '🔴 电量严重不足',
  Unknown: '❓ 未知',
}

function healthColor(health: number): string {
  if (health >= 80) return 'text-green-500'
  if (health >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function chargeColor(charge: number): string {
  if (charge >= 50) return 'bg-green-500'
  if (charge >= 20) return 'bg-amber-500'
  return 'bg-red-500'
}

// ============ Screen Test Colors ============

const SCREEN_COLORS = [
  { name: '白色', bg: 'bg-white', text: 'text-gray-500' },
  { name: '黑色', bg: 'bg-black', text: 'text-gray-400' },
  { name: '红色', bg: 'bg-red-500', text: 'text-white' },
  { name: '绿色', bg: 'bg-green-500', text: 'text-white' },
  { name: '蓝色', bg: 'bg-blue-500', text: 'text-white' },
  { name: '渐变', bg: 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500', text: 'text-white' },
] as const

// ============ Cache Cleaner ============

function CacheCleaner() {
  const settings = useAppStore(s => s.settings)
  const [cacheSize, setCacheSize] = useState<number>(0)
  const [cleaning, setCleaning] = useState(false)
  const [cleanResult, setCleanResult] = useState<string | null>(null)

  const refreshCache = useCallback(async () => {
    try {
      const size = await invoke<number>('get_cache_size', { cachePath: settings.cachePath })
      setCacheSize(size)
    } catch { /* ignore */ }
  }, [settings.cachePath])

  useEffect(() => { refreshCache() }, [refreshCache])

  const handleClean = async () => {
    setCleaning(true)
    setCleanResult(null)
    try {
      const bytes = await invoke<number>('cleanup_cache', { cachePath: settings.cachePath })
      setCleanResult(bytes > 0 ? `已清理 ${formatSize(bytes)}` : '缓存已经是空的')
      setCacheSize(0)
    } catch {
      setCleanResult('清理失败')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
          {formatSize(cacheSize)}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">缓存清理</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate" title={settings.cachePath}>
        {settings.cachePath}
      </p>
      <button
        onClick={handleClean}
        disabled={cleaning || cacheSize === 0}
        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {cleaning ? '清理中...' : cacheSize > 0 ? `清理缓存 (${formatSize(cacheSize)})` : '缓存已清空'}
      </button>
      {cleanResult && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="w-3.5 h-3.5" />{cleanResult}
        </div>
      )}
    </div>
  )
}

// ============ Battery Info ============

interface BatteryInfo {
  present: boolean
  name: string
  status: string
  estimated_charge: number
  design_capacity: string
  full_charge_capacity: string
  health_percent: number
  cycle_count: number | null
}

function BatteryCard() {
  const [battery, setBattery] = useState<BatteryInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBattery = useCallback(async () => {
    setLoading(true)
    try {
      const info = await invoke<BatteryInfo>('get_battery_info')
      setBattery(info)
    } catch {
      setBattery({ present: false, name: '', status: '', estimated_charge: 0, design_capacity: '', full_charge_capacity: '', health_percent: 0, cycle_count: null })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBattery() }, [fetchBattery])

  if (loading) return <CardSkeleton />

  if (!battery?.present) {
    return (
      <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Battery className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">电池信息</h3>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Info className="w-4 h-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500 dark:text-gray-400">未检测到电池（台式机或电池未连接）</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Battery className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">电池信息</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{battery.name}</p>
          </div>
        </div>
        <button onClick={fetchBattery} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="刷新">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Charge level */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{battery.estimated_charge}%</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{STATUS_LABEL[battery.status] || battery.status}</span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${chargeColor(battery.estimated_charge)}`} style={{ width: `${battery.estimated_charge}%` }} />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailItem label="设计容量" value={battery.design_capacity} />
        <DetailItem label="满充容量" value={battery.full_charge_capacity} />
        <DetailItem label="电池健康" value={battery.health_percent > 0 ? `${battery.health_percent}%` : 'N/A'} valueClass={healthColor(battery.health_percent)} />
        <DetailItem label="循环次数" value={battery.cycle_count != null ? `${battery.cycle_count} 次` : 'N/A'} />
      </div>
    </div>
  )
}

function DetailItem({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-medium ${valueClass || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  )
}

// ============ Screen Test ============

function ScreenTest() {
  const [active, setActive] = useState(false)
  const [colorIdx, setColorIdx] = useState(0)

  const handleOpen = () => { setActive(true); setColorIdx(0) }

  if (active) {
    const c = SCREEN_COLORS[colorIdx]
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${c.bg} cursor-pointer`} onClick={() => setColorIdx(i => i + 1)}>
        {colorIdx >= SCREEN_COLORS.length ? (
          <p className={`${c.text} text-lg`}>测试完成，点击任意位置关闭</p>
        ) : (
          <div className="text-center">
            <p className={`${c.text} text-4xl font-bold mb-2`}>{c.name}</p>
            <p className={`${c.text} text-sm opacity-70`}>点击切换下一颜色 ({colorIdx + 1}/{SCREEN_COLORS.length})</p>
          </div>
        )}
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); setActive(false) }}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">屏幕测试</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">坏点检测、色彩校准</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">全屏显示纯色，用于检测坏点和色彩表现。按 Esc 或点击 × 退出。</p>
      <button
        onClick={handleOpen}
        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
      >
        开始测试
      </button>
    </div>
  )
}

// ============ Disk Info ============

interface StorageInfo {
  name: string
  filesystem: string
  total: string
  used: string
  free: string
  usage: number
}

function DiskInfo() {
  const [disks, setDisks] = useState<StorageInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoke<StorageInfo[]>('get_storage_info')
      .then(setDisks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const barColor = (usage: number) =>
    usage > 90 ? 'bg-red-500' : usage > 70 ? 'bg-amber-500' : 'bg-green-500'

  const badgeColor = (usage: number) =>
    usage > 90 ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
      : usage > 70 ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
      : 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'

  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">磁盘信息</h3>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="space-y-3">
          {disks.map((d, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm text-gray-900 dark:text-white">{d.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${badgeColor(d.usage)}`}>{d.usage}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${barColor(d.usage)}`} style={{ width: `${d.usage}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{d.filesystem} · {d.used} / {d.total}</span>
                <span>{d.free} 可用</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ Skeleton ============

function CardSkeleton() {
  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  )
}

// ============ Main Page ============

export function SystemTools() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">系统工具</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">系统维护、检测与校准工具</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <BatteryCard />
        <ScreenTest />
        <CacheCleaner />
      </div>

      <DiskInfo />
    </div>
  )
}