import { Video, Wand2 } from 'lucide-react'

export function VideoTools() {
  const tools = [
    { id: 'bg-remove', name: '背景移除', description: '实时视频抠像', status: 'available', icon: Wand2 },
    { id: 'video-enhance', name: '画质增强', description: '视频超分辨率增强', status: 'available', icon: Video },
    { id: 'video-fx', name: '视频特效', description: '实时滤镜和特效', status: 'coming', icon: Wand2 },
    { id: 'video-subtitle', name: '字幕生成', description: '自动生成视频字幕', status: 'coming', icon: Video },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">视频工具</h1>
        <p className="text-gray-500 mt-1">AI 驱动的视频处理和增强</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} className="p-6 bg-white rounded-xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <tool.icon className="w-6 h-6 text-blue-600" />
              </div>
              {tool.status === 'available' ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">可用</span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">即将推出</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
            {tool.status === 'available' ? (
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
                  启动
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  设置
                </button>
              </div>
            ) : (
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                即将推出
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}