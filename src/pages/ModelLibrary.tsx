import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Package, ExternalLink, RefreshCw, Search, Filter,
} from 'lucide-react'
import { clsx } from 'clsx'

interface ModelInfo {
  name: string
  task: string
  framework: string
  description: string
  download_url: string
  size_mb: number
  recommended_device: string
}

function formatSize(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

const TASK_FILTERS = ['全部', '文本生成', '图像生成', '图像编辑', '语音合成']

export function ModelLibrary() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState('全部')

  const fetchModels = useCallback(async () => {
    setLoading(true)
    try {
      const m = await invoke<ModelInfo[]>('get_recommended_models')
      setModels(m)
    } catch (err) {
      console.error('Failed to fetch models:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchModels() }, [fetchModels])

  const filtered = models.filter((m) => {
    if (taskFilter !== '全部' && m.task !== taskFilter) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">模型库</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">浏览和下载推荐的开源 AI 模型</p>
        </div>
        <button onClick={fetchModels} disabled={loading} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="刷新">
          <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索模型名称或描述..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Filter className="w-4 h-4 text-gray-400 mx-1.5" />
          {TASK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTaskFilter(f)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                taskFilter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Model list */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">没有匹配的模型</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((model) => (
            <div key={model.name} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-white">{model.name}</p>
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs">
                    {model.task}
                  </span>
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs',
                    model.recommended_device.includes('NPU')
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : model.recommended_device.includes('GPU')
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  )}>
                    {model.recommended_device}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{model.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {model.framework} · {formatSize(model.size_mb)}
                </p>
              </div>
              <a
                href={model.download_url}
                target="_blank"
                rel="noreferrer"
                className="ml-4 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                下载
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              模型下载后可通过 OpenVINO 推理引擎加载运行。部分模型需要先安装对应框架支持。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}