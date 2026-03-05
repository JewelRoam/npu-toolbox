import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import { 
  Cpu, MessageSquare, Music, Video, Code, Palette, 
  HardDrive, Settings, ArrowRight, Download, RefreshCw
} from 'lucide-react'

// NPU 状态接口（与后端对应）
interface NPUStatus {
  has_npu: boolean
  vendor: string
  model: string
  compute_units: number
  tops: number
  driver_version: string
  status: string
  recommendations: string[]
}

// 硬件信息接口
interface HardwareInfo {
  cpu: {
    name: string
    cores: number
    threads: number
    frequency: string
    temperature: number
    usage: number
  }
  gpu: {
    name: string
    vram: string
    driver: string
    usage: number
  }
  memory: {
    total: string
    used: string
    usage: number
    slots: string
  }
  npu: NPUStatus
  storage: Array<{
    name: string
    size: string
    health: number
    temp: number
    storage_type: string
  }>
}

// 工具分类数据
const toolCategories = [
  {
    title: '🤖 AI对话',
    description: '本地大模型、知识库、文本处理',
    tools: [
      { id: 'ollama', name: 'Ollama', description: '本地大模型运行时', icon: MessageSquare },
      { id: 'rag', name: '知识库', description: 'RAG 问答系统', icon: MessageSquare },
    ]
  },
  {
    title: '🎵 音频工具',
    description: '音乐生成、音效合成、语音合成',
    tools: [
      { id: 'musicgen', name: '音乐生成', description: 'AI 音乐创作', icon: Music },
      { id: 'tts', name: '语音合成', description: '本地 TTS', icon: Music },
    ]
  },
  {
    title: '📹 视频工具',
    description: '背景移除、画质增强、实时特效',
    tools: [
      { id: 'bg-remove', name: '背景移除', description: '实时抠像', icon: Video },
      { id: 'video-enhance', name: '画质增强', description: '视频超分', icon: Video },
    ]
  },
  {
    title: '💻 编程助手',
    description: '代码补全、代码解释、测试生成',
    tools: [
      { id: 'code-llama', name: 'CodeLlama', description: '代码补全', icon: Code },
      { id: 'tabby', name: 'Tabby', description: '自托管编码助手', icon: Code },
    ]
  },
  {
    title: '🎨 创意工具',
    description: '文生图、图生图、图片编辑',
    tools: [
      { id: 'stable-diffusion', name: '图片生成', description: '本地扩散模型', icon: Palette },
      { id: 'image-edit', name: '图片编辑', description: 'AI 图片编辑', icon: Palette },
    ]
  },
  {
    title: '🔍 硬件检测',
    description: 'NPU信息、温度监控、烤机测试',
    tools: [
      { id: 'npu-info', name: 'NPU信息', description: 'NPU 详细状态', icon: Cpu },
      { id: 'hardware-monitor', name: '硬件监控', description: '实时监控', icon: HardDrive },
    ]
  },
  {
    title: '🛠️ 系统工具',
    description: '磁盘检测、电池健康、屏幕测试',
    tools: [
      { id: 'disk-check', name: '磁盘检测', description: 'SMART 状态', icon: HardDrive },
      { id: 'battery', name: '电池健康', description: '电池检测', icon: HardDrive },
    ]
  },
]

export function Home() {
  const navigate = useNavigate()
  const [npuStatus, setNpuStatus] = useState<NPUStatus | null>(null)
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 从后端获取硬件信息
  useEffect(() => {
    const fetchHardwareInfo = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 调用后端 API 获取硬件信息
        const info = await invoke<HardwareInfo>('get_hardware_info')
        setHardwareInfo(info)
        setNpuStatus(info.npu)
      } catch (err) {
        console.error('获取硬件信息失败:', err)
        setError('获取硬件信息失败')
        
        // 使用默认状态
        setNpuStatus({
          has_npu: false,
          vendor: '',
          model: '',
          compute_units: 0,
          tops: 0,
          driver_version: '',
          status: 'unavailable',
          recommendations: ['您的设备不支持 NPU', '仍可使用 CPU 模式运行（速度较慢）']
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchHardwareInfo()
  }, [])

  // 刷新硬件信息
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const info = await invoke<HardwareInfo>('get_hardware_info')
      setHardwareInfo(info)
      setNpuStatus(info.npu)
    } catch (err) {
      console.error('刷新失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">欢迎使用 NPU工具箱</h1>
          <p className="text-gray-500 mt-1">让每个用户都能轻松使用本地 AI 能力</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="刷新硬件信息"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 加载状态 */}
      {loading && !npuStatus && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">正在检测硬件信息...</p>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* NPU 状态卡片 */}
      {npuStatus && (
        <div className={`p-6 rounded-xl border-2 ${
          npuStatus.has_npu 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                npuStatus.has_npu ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <Cpu className={`w-6 h-6 ${npuStatus.has_npu ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {npuStatus.has_npu ? '✅ NPU 已检测到' : '⚠️ 未检测到 NPU'}
                </h2>
                {npuStatus.has_npu && (
                  <p className="text-sm text-gray-600">
                    {npuStatus.vendor} {npuStatus.model} · {npuStatus.tops} TOPS · 驱动 v{npuStatus.driver_version}
                  </p>
                )}
              </div>
            </div>
            
            {!npuStatus.has_npu && (
              <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                了解详情
              </button>
            )}
          </div>

          {npuStatus.has_npu && npuStatus.recommendations.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {npuStatus.recommendations.map((rec, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {rec}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 硬件信息摘要 */}
      {hardwareInfo && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">CPU</p>
            <p className="font-medium text-gray-900 truncate">{hardwareInfo.cpu.name}</p>
            <p className="text-xs text-gray-500">{hardwareInfo.cpu.cores} 核心 / {hardwareInfo.cpu.threads} 线程</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">GPU</p>
            <p className="font-medium text-gray-900 truncate">{hardwareInfo.gpu.name}</p>
            <p className="text-xs text-gray-500">{hardwareInfo.gpu.vram}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">内存</p>
            <p className="font-medium text-gray-900">{hardwareInfo.memory.total}</p>
            <p className="text-xs text-gray-500">使用率: {hardwareInfo.memory.usage}%</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">存储</p>
            <p className="font-medium text-gray-900">{hardwareInfo.storage.length} 个磁盘</p>
            <p className="text-xs text-gray-500">{hardwareInfo.storage[0]?.size || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* 快速操作 */}
      <div className="grid grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/ai-chat')}
          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <MessageSquare className="w-8 h-8 text-primary-500 mb-2" />
          <p className="font-medium text-gray-900">AI 对话</p>
          <p className="text-xs text-gray-500 group-hover:text-primary-600">开始智能对话</p>
        </button>
        
        <button className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group">
          <Download className="w-8 h-8 text-primary-500 mb-2" />
          <p className="font-medium text-gray-900">下载工具</p>
          <p className="text-xs text-gray-500 group-hover:text-primary-600">按需下载 AI 模型</p>
        </button>
        
        <button 
          onClick={() => navigate('/hardware')}
          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <HardDrive className="w-8 h-8 text-primary-500 mb-2" />
          <p className="font-medium text-gray-900">硬件检测</p>
          <p className="text-xs text-gray-500 group-hover:text-primary-600">查看系统信息</p>
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <Settings className="w-8 h-8 text-primary-500 mb-2" />
          <p className="font-medium text-gray-900">设置中心</p>
          <p className="text-xs text-gray-500 group-hover:text-primary-600">自定义配置</p>
        </button>
      </div>

      {/* 工具分类网格 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">工具分类</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {toolCategories.map((category, idx) => (
            <div 
              key={idx}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <h3 className="font-medium text-gray-900 mb-1">{category.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{category.description}</p>
              <div className="space-y-2">
                {category.tools.map((tool) => (
                  <div 
                    key={tool.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <tool.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{tool.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}