import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">😕</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">页面未找到</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">抱歉，您访问的页面不存在</p>
      <Link 
        to="/"
        className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
      >
        <Home className="w-5 h-5" />
        返回首页
      </Link>
    </div>
  )
}