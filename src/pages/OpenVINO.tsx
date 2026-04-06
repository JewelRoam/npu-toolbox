import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  CheckCircle, XCircle, Download, Cpu, RefreshCw,
  Terminal, Play, Trash2, Loader2,
} from 'lucide-react'

interface OpenVINOStatus {
  installed: boolean
  version: string | null
  python_available: boolean
  python_version: string | null
  npu_plugin_available: boolean
  gpu_plugin_available: boolean
  available_devices: string[]
  install_path: string | null
}

interface InferenceTestResult {
  success: boolean
  device: string
  message: string
  trials: number[]
  warmup_ms: number
  avg_ms: number
  min_ms: number
  max_ms: number
  p50_ms: number
  p95_ms: number
}

interface PipResult {
  success: boolean
  message: string
}

export function OpenVINOPage() {
  const [status, setStatus] = useState<OpenVINOStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<InferenceTestResult | null>(null)
  const [testDevice, setTestDevice] = useState('CPU')
  const [testing, setTesting] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [uninstalling, setUninstalling] = useState(false)
  const [pipProgress, setPipProgress] = useState<string[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const s = await invoke<OpenVINOStatus>('detect_openvino')
      setStatus(s)
      if (s.available_devices.length > 0) setTestDevice(s.available_devices[0])
    } catch (err) {
      console.error('Failed to fetch OpenVINO info:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInstall = async (variant?: string) => {
    setInstalling(true)
    setPipProgress([])
    try {
      const result = await invoke<PipResult>('install_openvino', { variant: variant ?? null })
      if (!result.success) setPipProgress(prev => [...prev, result.message])
      await fetchAll()
    } catch (err) {
      setPipProgress(prev => [...prev, `错误: ${err}`])
    } finally {
      setInstalling(false)
    }
  }

  const handleUninstall = async () => {
    setUninstalling(true)
    setPipProgress([])
    try {
      const result = await invoke<PipResult>('uninstall_openvino')
      if (!result.success) setPipProgress(prev => [...prev, result.message])
      await fetchAll()
    } catch (err) {
      setPipProgress(prev => [...prev, `错误: ${err}`])
    } finally {
      setUninstalling(false)
    }
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await invoke<InferenceTestResult>('test_openvino_inference', { device: testDevice })
      setTestResult(result)
    } catch (err) {
      setTestResult({ success: false, device: testDevice, message: String(err), trials: [], warmup_ms: 0, avg_ms: 0, min_ms: 0, max_ms: 0, p50_ms: 0, p95_ms: 0 })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    const unlisten = listen<{ line: string }>('pip-progress', (event) => {
      setPipProgress(prev => [...prev, event.payload.line])
    })
    return () => { unlisten.then(fn => fn()) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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

  const busy = installing || uninstalling

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={fetchAll} loading={loading} />

      <StatusCard
        status={status}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        installing={installing}
        uninstalling={uninstalling}
      />

      {(busy || pipProgress.length > 0) && (
        <PipProgressLog lines={pipProgress} active={busy} />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 环境检测
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <EnvItem label="Python" value={status.python_available ? status.python_version ?? '可用' : '未安装'} ok={status.python_available} />
          <EnvItem label="OpenVINO" value={status.installed ? status.version ?? '已安装' : '未安装'} ok={status.installed} />
          <EnvItem label="NPU 插件" value={status.npu_plugin_available ? '可用' : '不可用'} ok={status.npu_plugin_available} />
          <EnvItem label="GPU 插件" value={status.gpu_plugin_available ? '可用' : '不可用'} ok={status.gpu_plugin_available} />
          {status.install_path && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">虚拟环境路径</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white truncate">{status.install_path}</p>
            </div>
          )}
        </div>
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
              </div>
              <p className={`text-sm ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {testResult.message}
              </p>
              {testResult.success && testResult.trials.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                    <StatBox label="Warmup" value={`${testResult.warmup_ms.toFixed(2)}ms`} />
                    <StatBox label="平均" value={`${testResult.avg_ms.toFixed(2)}ms`} highlight />
                    <StatBox label="P50" value={`${testResult.p50_ms.toFixed(2)}ms`} />
                    <StatBox label="P95" value={`${testResult.p95_ms.toFixed(2)}ms`} />
                    <StatBox label="最小" value={`${testResult.min_ms.toFixed(2)}ms`} />
                    <StatBox label="最大" value={`${testResult.max_ms.toFixed(2)}ms`} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!status.python_available && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">未检测到 Python</p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                安装 OpenVINO 需要系统已安装 Python 3.9+。
                请从{' '}
                <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="underline">
                  python.org
                </a>{' '}
                下载安装，安装时请勾选 "Add Python to PATH"。
              </p>
            </div>
          </div>
        </div>
      )}

      {status.npu_plugin_available && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">NPU 加速可用</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                检测到 NPU 设备，OpenVINO 可通过 NPU 插件进行推理加速。使用时指定设备为 "NPU" 即可激活。
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

function StatusCard({
  status, onInstall, onUninstall, installing, uninstalling,
}: {
  status: OpenVINOStatus
  onInstall: (variant?: string) => void
  onUninstall: () => void
  installing: boolean
  uninstalling: boolean
}) {
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
        <div className="flex gap-2">
          {status.installed ? (
            <button
              onClick={onUninstall}
              disabled={installing || uninstalling}
              className="px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {uninstalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {uninstalling ? '卸载中...' : '卸载'}
            </button>
          ) : (
            <button
              onClick={() => onInstall('npu')}
              disabled={installing || uninstalling || !status.python_available}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
              title="安装 OpenVINO + openvino-genai（含 NPU 支持）"
            >
              {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {installing ? '安装中...' : '一键安装 (NPU)'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PipProgressLog({ lines, active }: { lines: string[]; active: boolean }) {
  const refCb = useCallback((el: HTMLPreElement | null) => {
    if (el) el.scrollTop = el.scrollHeight
  }, [lines.length])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        {active && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
        <Terminal className="w-4 h-4 text-gray-500" />
        {active ? (lines.length === 0 ? '正在准备...' : '安装日志') : '安装日志'}
      </h3>
      <pre ref={refCb} className="bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono rounded-lg p-4 max-h-48 overflow-y-auto">
        {lines.length > 0 ? lines.join('\n') : (active ? '等待 pip 输出...\n' : '')}
      </pre>
    </div>
  )
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`px-2 py-1.5 rounded-lg ${highlight ? 'bg-green-100 dark:bg-green-800/50' : 'bg-green-50 dark:bg-green-900/20'}`}>
      <p className="text-xs text-green-600 dark:text-green-400">{label}</p>
      <p className={`text-sm font-mono font-medium ${highlight ? 'text-green-800 dark:text-green-200' : 'text-green-700 dark:text-green-300'}`}>{value}</p>
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