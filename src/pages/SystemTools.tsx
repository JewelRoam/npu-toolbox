import { HardDrive, Battery, Monitor, Trash2 } from 'lucide-react'

export function SystemTools() {
  const tools = [
    { id: 'disk-check', name: '磁盘检测', description: 'SMART 状态检测', icon: HardDrive, status: 'available' },
    { id: 'battery', name: '电池健康', description: '电池详细信息', icon: Battery, status: 'available' },
    { id: 'screen-test', name: '屏幕测试', description: '坏点检测、色彩校准', icon: Monitor, status: 'available' },
    { id: 'cleaner', name: '清理工具', description: '清理缓存和临时文件', icon: Trash2, status: 'available' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统工具</h1>
        <p className="text-gray-500 mt-1">系统维护和检测工具</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} className="p-6 bg-white rounded-xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <tool.icon className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">可用</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                启动
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}