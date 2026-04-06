import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const FULL_HEIGHT_ROUTES = ['/ai-chat']

export function Layout() {
  const location = useLocation()
  const isFullHeight = FULL_HEIGHT_ROUTES.includes(location.pathname)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 min-h-0 ${isFullHeight ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
          <div className={isFullHeight ? 'h-full' : ''}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
