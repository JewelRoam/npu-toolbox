import { NavLink } from 'react-router-dom'
import { 
  Home, 
  MessageSquare, 
  Music, 
  Video, 
  Palette, 
  HardDrive, 
  Settings,
  Cpu,
  Zap,
  Package
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/ai-chat', icon: MessageSquare, label: 'AI对话' },
  { path: '/audio', icon: Music, label: '音频工具' },
  { path: '/video', icon: Video, label: '视频工具' },
  { path: '/creative', icon: Palette, label: '图片工具' },
  { path: '/hardware', icon: HardDrive, label: '硬件检测' },
  { path: '/openvino', icon: Zap, label: 'OpenVINO' },
  { path: '/models', icon: Package, label: '模型库' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">NPU工具箱</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          让每个用户都能轻松使用 NPU
        </p>
      </div>
    </aside>
  )
}