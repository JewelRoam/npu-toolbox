import { Code, FileCode, GitBranch } from 'lucide-react'

export function Programming() {
  const tools = [
    { id: 'ollama', name: 'Ollama', description: '本地大模型运行时', status: 'available', icon: Code },
    { id: 'tabby', name: 'Tabby', description: '自托管 GitHub Copilot 替代', status: 'available', icon: GitBranch },
    { id: 'code-llama', name: 'CodeLlama', description: 'Meta 代码模型', status: 'available', icon: FileCode },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', description: '专业代码生成模型', status: 'coming', icon: Code },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">编程助手</h1>
        <p className="text-gray-500 mt-1">AI 驱动的代码辅助工具</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} className="p-6 bg-white rounded-xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <tool.icon className="w-6 h-6 text-green-600" />
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
                <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
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