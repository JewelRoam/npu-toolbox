import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../stores/appStore'
import { HardDrive, Battery, Monitor, Trash2, CheckCircle } from 'lucide-react'
import { ToolGrid } from '../components/ToolGrid'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

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
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
          {formatSize(cacheSize)}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">清理工具</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        缓存路径: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{settings.cachePath}</code>
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
          <CheckCircle className="w-3.5 h-3.5" />
          {cleanResult}
        </div>
      )}
    </div>
  )
}

export function SystemTools() {
  return (
    <div className="space-y-6">
      <ToolGrid
        title="系统工具"
        subtitle="系统维护和检测工具"
        color="orange"
        tools={[
          { id: 'disk-check', name: '磁盘检测', description: 'SMART 状态检测', status: 'coming', icon: HardDrive },
          { id: 'battery', name: '电池健康', description: '电池详细信息', status: 'coming', icon: Battery },
          { id: 'screen-test', name: '屏幕测试', description: '坏点检测、色彩校准', status: 'coming', icon: Monitor },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CacheCleaner />
      </div>
    </div>
  )
}