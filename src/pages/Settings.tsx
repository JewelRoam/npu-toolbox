import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { useAppStore } from '../stores/appStore'
import { Globe, Palette, Trash2, Info, FolderOpen, Save, RefreshCw, Sun, Moon, Monitor } from 'lucide-react'
import type { AppSettings } from '../types'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0)} ${units[i]}`
}

const themeOptions = [
  { value: 'light' as const, label: '浅色', icon: Sun },
  { value: 'dark' as const, label: '深色', icon: Moon },
  { value: 'system' as const, label: '跟随系统', icon: Monitor },
]

const sectionClass = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'

export function Settings() {
  const { settings, updateSettings } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cacheSize, setCacheSize] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Load settings from backend and calculate cache size
  useEffect(() => {
    const init = async () => {
      try {
        const json = await invoke<string>('load_settings')
        const loaded = JSON.parse(json) as AppSettings
        updateSettings(loaded)

        try {
          const bytes = await invoke<number>('get_cache_size', { cachePath: loaded.cachePath })
          setCacheSize(formatBytes(bytes))
        } catch {
          setCacheSize('无法计算')
        }
      } catch {
        setCacheSize('无法计算')
      }

      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh cache size when path changes
  const refreshCacheSize = useCallback(async (path: string) => {
    try {
      const bytes = await invoke<number>('get_cache_size', { cachePath: path })
      setCacheSize(formatBytes(bytes))
    } catch {
      setCacheSize('无法计算')
    }
  }, [])

  const handleThemeChange = (theme: AppSettings['theme']) => {
    updateSettings({ theme })
  }

  const handlePickFolder = async (key: 'downloadPath' | 'cachePath') => {
    const selected = await open({ directory: true, multiple: false })
    if (selected && typeof selected === 'string') {
      updateSettings({ [key]: selected })
      if (key === 'cachePath') refreshCacheSize(selected)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await invoke('save_settings', { settingsJson: JSON.stringify(settings) })
      showToast('success', '设置已保存')
    } catch {
      showToast('error', '保存设置失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleCleanupCache = async () => {
    try {
      const cleaned = await invoke<number>('cleanup_cache', { cachePath: settings.cachePath })
      showToast('success', `已清理 ${formatBytes(cleaned)} 缓存`)
      refreshCacheSize(settings.cachePath)
    } catch {
      showToast('error', '清理缓存失败')
    }
  }

  const handleToggle = (key: 'autoCheckUpdates') => {
    updateSettings({ [key]: !settings[key] })
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">自定义您的 NPU 工具箱</p>
        </div>
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">自定义您的 NPU 工具箱</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-lg border transition-all ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Theme */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">主题</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((t) => {
            const Icon = t.icon
            const active = settings.theme === t.value
            return (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Language */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">语言</h3>
        </div>
        <select
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value as AppSettings['language'] })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      {/* Paths */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-4">
          <FolderOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">路径设置</h3>
        </div>
        <div className="space-y-4">
          {([
            { key: 'downloadPath' as const, label: '下载路径' },
            { key: 'cachePath' as const, label: '缓存路径' },
          ]).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings[key]}
                  onChange={(e) => {
                    updateSettings({ [key]: e.target.value })
                    if (key === 'cachePath') refreshCacheSize(e.target.value)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  onClick={() => handlePickFolder(key)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors whitespace-nowrap"
                >
                  浏览
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto update */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">自动检查更新</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">启动时自动检查新版本</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('autoCheckUpdates')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoCheckUpdates ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.autoCheckUpdates ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Storage */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">存储管理</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">缓存文件</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {cacheSize ?? '计算中...'}
            </p>
          </div>
          <button
            onClick={handleCleanupCache}
            className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            清理缓存
          </button>
        </div>
      </div>

      {/* About */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">关于</h3>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500 dark:text-gray-400">版本：</span><span className="text-gray-900 dark:text-white">1.0.0</span></p>
          <p><span className="text-gray-500 dark:text-gray-400">构建时间：</span><span className="text-gray-900 dark:text-white">2026-03-04</span></p>
          <p><span className="text-gray-500 dark:text-gray-400">GitHub：</span><a className="text-primary-500 hover:underline" href="https://github.com/JewelRoam/npu-toolbox" target="_blank" rel="noreferrer">JewelRoam/npu-toolbox</a></p>
        </div>
      </div>
    </div>
  )
}