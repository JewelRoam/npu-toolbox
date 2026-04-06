import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, Loader2, ChevronDown, AlertCircle, Plug, Square, Trash2, Copy, Check, Download, CheckCircle, Package } from 'lucide-react'

interface Model {
  name: string
  size?: number
  modified_at?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const quickPrompts = [
  '解释量子计算的基本原理',
  '用 Python 写一个快速排序',
  '写一首关于春天的诗',
  '帮我总结这篇文档的主要内容',
]

let msgIdCounter = 0
const nextId = () => `msg-${++msgIdCounter}`

export function AIChat() {
  const navigate = useNavigate()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: 'assistant', content: '你好！我是本地 AI 助手。请先确保 Ollama 已启动，然后选择一个模型开始对话。' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [ollamaInstalled, setOllamaInstalled] = useState<boolean | null>(null)
  const [installingOllama, setInstallingOllama] = useState(false)
  const [installMessage, setInstallMessage] = useState('')
  const [installPercent, setInstallPercent] = useState<number | null>(null)
  const [installStage, setInstallStage] = useState<'download' | 'install' | 'done' | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close model menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Check Ollama connection and load models
  const refreshConnection = useCallback(async () => {
    try {
      const ok = await invoke<boolean>('ollama_check')
      setConnected(ok)
      if (ok) {
        const list = await invoke<Model[]>('ollama_list_models')
        setModels(list)
        if (list.length > 0 && !selectedModel) {
          setSelectedModel(list[0].name)
        }
      } else {
        setModels([])
      }
    } catch {
      setConnected(false)
      setModels([])
    }
    // Also check if Ollama is installed (not just running)
    try {
      const installed = await invoke<boolean>('ollama_is_installed')
      setOllamaInstalled(installed)
    } catch {
      setOllamaInstalled(null)
    }
  }, [selectedModel])

  useEffect(() => {
    refreshConnection()
    const interval = setInterval(refreshConnection, 15000)
    return () => clearInterval(interval)
  }, [refreshConnection])

  // Listen for install progress events
  useEffect(() => {
    const unlisten = listen<{ stage: string; message: string; percent: number | null }>(
      'ollama-install-progress',
      (event) => {
        setInstallMessage(event.payload.message)
        setInstallStage(event.payload.stage as 'download' | 'install' | 'done')
        setInstallPercent(event.payload.percent)
      },
    )
    return () => { unlisten.then(fn => fn()) }
  }, [])

  // Listen for streaming chunks
  useEffect(() => {
    const unlistenChunk = listen<{ content: string }>('ollama-chat-chunk', (event) => {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: last.content + event.payload.content }]
        }
        return prev
      })
    })

    const unlistenDone = listen('ollama-chat-done', () => {
      setIsLoading(false)
    })

    return () => {
      unlistenChunk.then(fn => fn())
      unlistenDone.then(fn => fn())
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!selectedModel) return

    const userMessage: ChatMessage = { id: nextId(), role: 'user', content: input.trim() }
    const assistantPlaceholder: ChatMessage = { id: nextId(), role: 'assistant', content: '' }
    setInput('')
    setMessages(prev => [...prev, userMessage, assistantPlaceholder])
    setIsLoading(true)

    // Build message history for Ollama (exclude the empty placeholder)
    const history = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      await invoke('ollama_chat', {
        model: selectedModel,
        messages: history,
      })
    } catch (err) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          return [...prev.slice(0, -1), { ...last, content: `错误: ${err}` }]
        }
        return [...prev, { id: nextId(), role: 'assistant', content: `错误: ${err}` }]
      })
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    try {
      await invoke('ollama_stop_generation')
    } catch { /* ignore */ }
    setIsLoading(false)
    // Remove empty trailing assistant message
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.content === '') return prev.slice(0, -1)
      return prev
    })
  }

  const handleClear = () => {
    setIsLoading(false)
    setMessages([{ id: nextId(), role: 'assistant', content: '对话已清空。有什么可以帮你的？' }])
  }

  const handleInstallOllama = async () => {
    setInstallingOllama(true)
    setInstallMessage('正在准备安装...')
    try {
      const result = await invoke<{ success: boolean; message: string }>('ollama_install')
      setInstallMessage(result.message)
      if (result.success) {
        setOllamaInstalled(true)
        // Retry connection after install
        setTimeout(() => refreshConnection(), 3000)
      }
    } catch (err) {
      setInstallMessage(`安装失败: ${err}`)
    } finally {
      setInstallingOllama(false)
    }
  }

  const handleCopy = async (msg: ChatMessage) => {
    await navigator.clipboard.writeText(msg.content)
    setCopiedId(msg.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatModelSize = (bytes?: number) => {
    if (!bytes) return ''
    const gb = bytes / (1024 ** 3)
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="flex flex-col h-full p-6">
      {/* Top bar: connection status + model selector */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        {/* Connection indicator */}
        <button
          onClick={refreshConnection}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer"
          title="点击刷新连接状态"
        >
          <span className={`w-2 h-2 rounded-full ${
            connected === true ? 'bg-green-500' : connected === false ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <span className={connected === true
            ? 'text-green-700 dark:text-green-400'
            : connected === false
              ? 'text-red-700 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }>
            {connected === true ? '已连接' : connected === false ? '未连接' : '检测中...'}
          </span>
        </button>

        {/* Model selector */}
        <div className="relative" ref={modelMenuRef}>
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-200 max-w-[200px] truncate">
              {selectedModel || '选择模型'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showModelMenu && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
              {models.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无可用模型</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">请先下载模型后再使用</p>
                </div>
              )}
              {models.map(model => (
                <button
                  key={model.name}
                  onClick={() => { setSelectedModel(model.name); setShowModelMenu(false) }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                    model.name === selectedModel ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</div>
                  {model.size && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatModelSize(model.size)}
                    </div>
                  )}
                </button>
              ))}
              <button
                onClick={() => { setShowModelMenu(false); navigate('/models') }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400"
              >
                <Package className="w-4 h-4" />
                浏览模型库
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disconnected warning */}
      {connected === false && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">无法连接到 Ollama</p>
            {ollamaInstalled === true && !installingOllama ? (
              <p className="text-xs text-amber-500 dark:text-amber-400 mt-1.5">
                Ollama 已安装，但服务未启动。请检查系统托盘或手动启动 Ollama。
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleInstallOllama}
                    disabled={installingOllama}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {installingOllama
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : ollamaInstalled === true
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : <Download className="w-3.5 h-3.5" />}
                    {installingOllama ? '安装中...' : ollamaInstalled === true ? '已安装' : '一键安装 Ollama'}
                  </button>
                  {installMessage && !installingOllama && (
                    <span className="text-xs text-amber-500 dark:text-amber-400">{installMessage}</span>
                  )}
                </div>
                {installingOllama && installStage === 'download' && (
                  <div className="space-y-1">
                    <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${installPercent ?? 0}%` }}
                      />
                    </div>
                    {installPercent !== null && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">{installPercent}%</p>
                    )}
                  </div>
                )}
                {installingOllama && installStage === 'install' && (
                  <p className="text-xs text-amber-500 dark:text-amber-400">正在安装，请稍候...</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick prompts (only show when no real messages) */}
      {messages.length <= 1 && connected && (
        <div className="mb-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary-500' : 'bg-accent-500'
            }`}>
              {msg.role === 'user'
                ? <User className="w-5 h-5 text-white" />
                : <Bot className="w-5 h-5 text-white" />
              }
            </div>
            <div className="group relative max-w-[70%]">
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}>
                {msg.role === 'assistant' && msg.content === '' && isLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">思考中...</span>
                  </div>
                ) : (
                  <p className={`text-sm whitespace-pre-wrap ${
                    msg.role === 'assistant' ? 'text-gray-800 dark:text-gray-200' : ''
                  }`}>{msg.content}</p>
                )}
              </div>
              {msg.role === 'assistant' && msg.content.length > 0 && (
                <button
                  onClick={() => handleCopy(msg)}
                  className="absolute top-2 right-2 p-1 rounded-md bg-gray-100 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="复制"
                >
                  {copiedId === msg.id
                    ? <Check className="w-3.5 h-3.5 text-green-500" />
                    : <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex gap-2">
          {messages.length > 1 && !isLoading && (
            <button
              onClick={handleClear}
              className="p-3 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="清空对话"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={connected ? '输入消息...' : '请先连接 Ollama...'}
            disabled={!connected || !selectedModel || isLoading}
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isLoading ? (
            <button
              onClick={handleStop}
              className="px-5 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
              title="停止生成"
            >
              <Square className="w-5 h-5" />
              <span className="hidden sm:inline">停止</span>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected || !selectedModel}
              className="px-5 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">发送</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            AI 运行于本地设备，您的对话不会被上传
          </p>
          {connected && selectedModel && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              <Plug className="w-3 h-3 inline mr-1" />
              {selectedModel}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}