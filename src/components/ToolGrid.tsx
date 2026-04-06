import { type LucideIcon, Settings, Download, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface ToolItem {
  id: string
  name: string
  description: string
  status: 'available' | 'coming' | 'requires-npu' | 'requires-install'
  icon: LucideIcon
  /** Navigate to this route on launch (instead of generic handler) */
  route?: string
  /** External URL to open */
  url?: string
  /** Estimated download size */
  size?: string
}

interface ToolGridProps {
  title: string
  subtitle: string
  tools: ToolItem[]
  /** Accent color token: purple, blue, green, pink, orange */
  color?: 'purple' | 'blue' | 'green' | 'pink' | 'orange'
}

const colorMap = {
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
    btn: 'bg-purple-500 hover:bg-purple-600',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    btn: 'bg-blue-500 hover:bg-blue-600',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    btn: 'bg-green-500 hover:bg-green-600',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    icon: 'text-pink-600 dark:text-pink-400',
    btn: 'bg-pink-500 hover:bg-pink-600',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
    btn: 'bg-orange-500 hover:bg-orange-600',
  },
}

const statusLabel: Record<ToolItem['status'], string> = {
  available: '可用',
  coming: '即将推出',
  'requires-npu': '需要 NPU',
  'requires-install': '需要安装',
}

const statusClass: Record<ToolItem['status'], string> = {
  available: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  coming: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  'requires-npu': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'requires-install': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
}

export function ToolGrid({ title, subtitle, tools, color = 'purple' }: ToolGridProps) {
  const navigate = useNavigate()
  const c = colorMap[color]

  const handleLaunch = (tool: ToolItem) => {
    if (tool.route) return navigate(tool.route)
    if (tool.url) return window.open(tool.url, '_blank', 'noopener')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const canLaunch = tool.status === 'available' && (tool.route || tool.url)
          return (
            <div
              key={tool.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
                         hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <tool.icon className={`w-6 h-6 ${c.icon}`} />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusClass[tool.status]}`}>
                  {statusLabel[tool.status]}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{tool.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tool.description}</p>

              {tool.size && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  <Download className="w-3 h-3 inline mr-1" />
                  {tool.size}
                </p>
              )}

              {canLaunch ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLaunch(tool)}
                    className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${c.btn} flex items-center justify-center gap-1.5`}
                  >
                    {tool.url ? <ExternalLink className="w-4 h-4" /> : null}
                    启动
                  </button>
                  <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                >
                  {tool.status === 'coming' && '即将推出'}
                  {tool.status === 'requires-npu' && '需要 NPU 设备'}
                  {tool.status === 'requires-install' && '请先安装'}
                  {tool.status === 'available' && '开发中'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}