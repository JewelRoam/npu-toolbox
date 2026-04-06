import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { CheckCircle, XCircle, Download, Cpu, ExternalLink, RefreshCw, Terminal, Package, Play } from 'lucide-react'

interface OpenVINOStatus {
  installed: boolean
  version: string | null
  python_available: boolean
  python_version: string | null
  npu_plugin_available: boolean
  available_devices: string[]
  install_path: string | null
}

interface ModelInfo {
  name: string
  task: string
  framework: string
  description: string
  download_url: string
  size_mb: number
  recommended_device: string
}

interface InferenceTestResult {
  success: boolean
  device: string
  latency_ms: number
  message: string
}

function formatSize(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export function OpenVINOPage() {
  const [status, setStatus] = useState<OpenVINOStatus | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<InferenceTestResult | null>(null)
  const [testDevice, setTestDevice] = useState('CPU')
  const [testing, setTesting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, m, i] = await Promise.all([
        invoke<OpenVINOStatus>('detect_openvino'),
        invoke<ModelInfo[]>('get_recommended_models'),
        invoke<string>('get_install_instructions'),
      ])
      setStatus(s)
      setModels(m)
      setInstructions(i)
      if (s.available_devices.length > 0) {
        setTestDevice(s.available_devices[0])
      }
    } catch (err) {
      console.error('Failed to fetch OpenVINO info:', err)
    } finally {
      setLoading(false)
    }
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await invoke<InferenceTestResult>('test_openvino_inference', { device: testDevice })
      setTestResult(result)
    } catch (err) {
      setTestResult({ success: false, device: testDevice, latency_ms: 0, message: String(err) })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  if (loading || !status) {
    return (
      <div className="space-y-6">
        <PageHeader onRefresh={fetchAll} loading={loading} />
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={fetchAll} loading={loading} />

      {/* Status Card */}
      <StatusCard status={status} />

      {/* Environment Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 环境检测
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <EnvItem label="Python" value={status.python_available ? status.python_version ?? '可用' : '未安装'} ok={status.python_available} />
          <EnvItem label="OpenVINO" value={status.installed ? status.version ?? '已安装' : '未安装'} ok={status.installed} />
          <EnvItem label="NPU 插件" value={status.npu_plugin_available ? '可用' : '不可用'} ok={status.npu_plugin_available} />
          {status.install_path && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">安装路径</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">{status.install_path}</p>
            </div>
          )}
        </div>

        {/* Available Devices */}
        {status.available_devices.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">可用设备</p>
            <div className="flex flex-wrap gap-2">
              {status.available_devices.map((d) => (
                <span
                  key={d}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    d.includes('NPU')
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : d.includes('GPU')
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inference Test */}
      {status.installed && status.available_devices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 推理测试
          </h3>
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">选择设备</label>
              <select
                value={testDevice}
                onChange={(e) => setTestDevice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {status.available_devices.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button
              onClick={runTest}
              disabled={testing}
              className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {testing ? '测试中...' : '运行测试'}
            </button>
          </div>
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {testResult.success
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />}
                <span className={`text-sm font-medium ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {testResult.success ? '测试通过' : '测试失败'}
                </span>
                {testResult.success && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    · {testResult.latency_ms.toFixed(1)}ms
                  </span>
                )}
              </div>
              <p className={`text-sm ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Install Guide */}
      {!status.installed && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 安装指南
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{instructions}</pre>
          </div>
          <a
            href="https://docs.openvino.ai/latest/get_started.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-primary-500 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            OpenVINO 官方文档
          </a>
        </div>
      )}

      {/* Recommended Models */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 推荐模型
        </h3>
        <div className="space-y-3">
          {models.map((model) => (
            <div key={model.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-white">{model.name}</p>
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs">
                    {model.task}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs">
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
      </div>

      {/* NPU Note */}
      {status.npu_plugin_available && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">NPU 加速可用</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                检测到 NPU 设备，OpenVINO 可通过 NPU 插件进行推理加速。
                使用时指定设备为 "NPU" 即可激活。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PageHeader({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OpenVINO 推理引擎</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">管理 OpenVINO 运行时和模型</p>
      </div>
      <button onClick={onRefresh} disabled={loading} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="刷新">
        <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

function StatusCard({ status }: { status: OpenVINOStatus }) {
  return (
    <div className={`p-6 rounded-xl border-2 ${
      status.installed
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          status.installed ? 'bg-green-100 dark:bg-green-800' : 'bg-amber-100 dark:bg-amber-800'
        }`}>
          {status.installed
            ? <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            : <XCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {status.installed ? `OpenVINO ${status.version}` : 'OpenVINO 未安装'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {status.installed
              ? `推理引擎已就绪 · ${status.available_devices.length} 个设备可用`
              : '需要安装 OpenVINO 才能使用 AI 推理功能'}
          </p>
        </div>
      </div>
    </div>
  )
}

function EnvItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium flex items-center gap-1.5">
        {ok
          ? <CheckCircle className="w-4 h-4 text-green-500" />
          : <XCircle className="w-4 h-4 text-gray-400" />}
        <span className={ok ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>{value}</span>
      </p>
    </div>
  )
}