import { useState } from 'react'
import { Send, Bot, User } from 'lucide-react'

const quickPrompts = [
  '解释量子计算的基本原理',
  '用 Python 写一个快速排序',
  '写一首关于春天的诗',
  '帮我总结这篇文档的主要内容',
]

export function AIChat() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: '你好！我是本地 AI 助手，基于 NPU 加速运行。你可以问我任何问题，我会尽力帮助你。' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    
    // 模拟 AI 回复（实际需要调用本地模型）
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '这是一个模拟回复。在实际应用中，这里会调用本地 Ollama 或其他本地大模型进行推理。NPU 加速可以让响应更快。' 
      }])
      setIsLoading(false)
    }, 1000)
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 快捷提示词 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(prompt)}
            className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary-500' : 'bg-accent-500'
            }`}>
              {msg.role === 'user' 
                ? <User className="w-5 h-5 text-white" />
                : <Bot className="w-5 h-5 text-white" />
              }
            </div>
            <div className={`max-w-[70%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            发送
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          AI 运行于本地设备，您的对话不会被上传
        </p>
      </div>
    </div>
  )
}