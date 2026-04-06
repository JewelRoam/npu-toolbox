import { Music } from 'lucide-react'

const tools = [
  { id: 'musicgen', name: '音乐生成', description: '通过文字描述生成音乐', status: 'available' as const },
  { id: 'sound-effect', name: '音效生成', description: '生成游戏、UI 音效', status: 'available' as const },
  { id: 'tts', name: '语音合成', description: '本地 TTS 文字转语音', status: 'coming' as const },
  { id: 'voice-clone', name: '语音克隆', description: '用少量样本克隆声音', status: 'coming' as const },
]

export function AudioTools() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">音频工具</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">AI 驱动的音频生成和处理</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              {tool.status === 'available' ? (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">可用</span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">即将推出</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{tool.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tool.description}</p>
            {tool.status === 'available' ? (
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
                  启动
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  设置
                </button>
              </div>
            ) : (
              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed">
                即将推出
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}