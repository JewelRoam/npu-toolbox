import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import {
  Cpu, MessageSquare, Music, Video, Code, Palette,
  HardDrive, Settings, ArrowRight, RefreshCw, Zap
} from 'lucide-react'

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

interface HardwareInfo {
  cpu: { name: string; cores: number; threads: number; frequency: string; temperature: number; usage: number }
  gpu: { name: string; vram_total: string; vram_used: string; driver: string; usage: number }
  memory: { total: string; used: string; usage: number; slots: string }
  npu: NPUStatus
  storage: Array<{ name: string; size: string; health: number; temp: number; storage_type: string }>
}

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

  useEffect(() => {
    const fetchHardwareInfo = async () => {
      try {
        setLoading(true)
        setError(null)
        const info = await invoke<HardwareInfo>('get_hardware_info')
        setHardwareInfo(info)
        setNpuStatus(info.npu)
      } catch {
        setError('获取硬件信息失败')
        setNpuStatus({
          has_npu: false, vendor: '', model: '', compute_units: 0, tops: 0,
          driver_version: '', status: 'unavailable',
          recommendations: ['您的设备不支持 NPU', '仍可使用 CPU 模式运行（速度较慢）'],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchHardwareInfo()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const info = await invoke<HardwareInfo>('get_hardware_info')
      setHardwareInfo(info)
      setNpuStatus(info.npu)
      setError(null)
    } catch {
      console.error('刷新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">欢迎使用 NPU工具箱</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">让每个用户都能轻松使用本地 AI 能力</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="刷新硬件信息"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading */}
      {loading && !npuStatus && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">正在检测硬件信息...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* NPU Status */}
      {npuStatus && (
        <div className={`p-6 rounded-xl border-2 ${
          npuStatus.has_npu
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                npuStatus.has_npu ? 'bg-green-100 dark:bg-green-800' : 'bg-amber-100 dark:bg-amber-800'
              }`}>
                <Cpu className={`w-6 h-6 ${npuStatus.has_npu ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {npuStatus.has_npu ? '✅ NPU 已检测到' : '⚠️ 未检测到 NPU'}
                </h2>
                {npuStatus.has_npu && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {npuStatus.vendor} {npuStatus.model} · {npuStatus.tops} TOPS · 驱动 v{npuStatus.driver_version}
                  </p>
                )}
              </div>
            </div>
          </div>
          {npuStatus.has_npu && npuStatus.recommendations.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {npuStatus.recommendations.map((rec, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                  {rec}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hardware Summary */}
      {hardwareInfo && (
        <div className="grid grid-cols-4 gap-4">
          <InfoCard
            label="CPU"
            value={hardwareInfo.cpu.name}
            sub={`${hardwareInfo.cpu.cores}C/${hardwareInfo.cpu.threads}T · ${hardwareInfo.cpu.usage}%`}
            bar={hardwareInfo.cpu.usage}
          />
          <InfoCard
            label="GPU"
            value={hardwareInfo.gpu.name}
            sub={`${hardwareInfo.gpu.vram_used ? hardwareInfo.gpu.vram_used + ' / ' : ''}${hardwareInfo.gpu.vram_total} · ${hardwareInfo.gpu.usage}%`}
            bar={hardwareInfo.gpu.usage}
          />
          <InfoCard
            label="内存"
            value={hardwareInfo.memory.total}
            sub={`${hardwareInfo.memory.used} / ${hardwareInfo.memory.total}`}
            bar={hardwareInfo.memory.usage}
            barColor="green"
          />
          <InfoCard label="存储" value={`${hardwareInfo.storage.length} 个磁盘`} sub={hardwareInfo.storage[0]?.size || 'N/A'} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <ActionCard icon={MessageSquare} label="AI 对话" hint="开始智能对话" onClick={() => navigate('/ai-chat')} />
        <ActionCard icon={Zap} label="OpenVINO" hint="推理引擎管理" onClick={() => navigate('/openvino')} />
        <ActionCard icon={HardDrive} label="硬件检测" hint="查看系统信息" onClick={() => navigate('/hardware')} />
        <ActionCard icon={Settings} label="设置中心" hint="自定义配置" onClick={() => navigate('/settings')} />
      </div>

      {/* Tool Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">工具分类</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {toolCategories.map((category, idx) => (
            <div
              key={idx}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all cursor-pointer group"
            >
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">{category.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{category.description}</p>
              <div className="space-y-2">
                {category.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <tool.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{tool.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500" />
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

function InfoCard({ label, value, sub, bar, barColor = 'primary' }: { label: string; value: string; sub: string; bar?: number; barColor?: 'primary' | 'green' }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white truncate">{value}</p>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor === 'green' ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${bar}%` }} />
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, label, hint, onClick }: { icon: typeof Cpu; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group text-left"
    >
      <Icon className="w-8 h-8 text-primary-500 mb-2" />
      <p className="font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{hint}</p>
    </button>
  )
}