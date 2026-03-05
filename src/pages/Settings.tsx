import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Globe, Palette, Trash2, Info, FolderOpen, Save, RefreshCw } from 'lucide-react'

// 设置接口
interface AppSettings {
  theme: string
  language: string
  autoCheckUpdates: boolean
  downloadPath: string
  cachePath: string
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'zh-CN',
    autoCheckUpdates: true,
    downloadPath: './downloads',
    cachePath: './cache'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cacheSize, setCacheSize] = useState<string>('计算中...')

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const settingsJson = await invoke<string>('load_settings')
        const loaded = JSON.parse(settingsJson)
        setSettings({
          theme: loaded.theme || 'light',
          language: loaded.language || 'zh-CN',
          autoCheckUpdates: loaded.autoCheckUpdates ?? true,
          downloadPath: loaded.downloadPath || './downloads',
          cachePath: loaded.cachePath || './cache'
        })
      } catch (err) {
        console.error('加载设置失败:', err)
        // 使用默认设置
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  // 保存设置
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      await invoke('save_settings', { 
        settingsJson: JSON.stringify(settings) 
      })
      
      setSuccess('设置已保存')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('保存设置失败:', err)
      setError('保存设置失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 清理缓存
  const handleCleanupCache = async () => {
    try {
      const cleaned = await invoke<number>('cleanup_cache', { 
        cachePath: settings.cachePath 
      })
      
      const sizeMB = (cleaned / (1024 * 1024)).toFixed(2)
      setCacheSize(`${sizeMB} MB 已清理`)
      
      setSuccess(`已清理 ${sizeMB} MB 缓存`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('清理缓存失败:', err)
      setError('清理缓存失败')
    }
  }

  const handleSettingChange = (key: keyof AppSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-500 mt-1">自定义您的 NPU 工具箱</p>
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
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-500 mt-1">自定义您的 NPU 工具箱</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {/* 成功/错误提示 */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 语言设置 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">语言</h3>
        </div>
        <select 
          value={settings.language} 
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      {/* 主题设置 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">主题</h3>
        </div>
        <div className="flex gap-3">
          {[
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
            { value: 'system', label: '跟随系统' }
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => handleSettingChange('theme', t.value)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                settings.theme === t.value 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 下载路径 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FolderOpen className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">下载路径</h3>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={settings.downloadPath}
            onChange={(e) => handleSettingChange('downloadPath', e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 自动检查更新 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900">自动检查更新</h3>
              <p className="text-sm text-gray-500">启动时自动检查新版本</p>
            </div>
          </div>
          <button 
            onClick={() => handleSettingChange('autoCheckUpdates', !settings.autoCheckUpdates)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoCheckUpdates ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.autoCheckUpdates ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* 清理缓存 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">存储管理</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">缓存文件</p>
            <p className="text-sm text-gray-500">{cacheSize}</p>
          </div>
          <button 
            onClick={handleCleanupCache}
            className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            清理缓存
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">关于</h3>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">版本：</span>1.0.0</p>
          <p><span className="text-gray-500">构建时间：</span>2026-03-04</p>
          <p><span className="text-gray-500">GitHub：</span>JewelRoam/npu-toolbox</p>
        </div>
      </div>
    </div>
  )
}
