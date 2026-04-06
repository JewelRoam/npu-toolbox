import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Home } from '../pages/Home'
import { AIChat } from '../pages/AIChat'
import { AudioTools } from '../pages/AudioTools'
import { VideoTools } from '../pages/VideoTools'
import { ImageTools } from '../pages/ImageTools'
import { HardwareInfo } from '../pages/HardwareInfo'
import { Settings } from '../pages/Settings'
import { OpenVINOPage } from '../pages/OpenVINO'
import { ModelLibrary } from '../pages/ModelLibrary'
import { NotFound } from '../pages/NotFound'

const FULL_HEIGHT_ROUTES = new Set(['/ai-chat'])

const KNOWN_ROUTES = new Set(['/', '/ai-chat', '/audio', '/video', '/creative', '/hardware', '/openvino', '/models', '/settings'])

interface PageSlotProps {
  active: boolean
  isFullHeight: boolean
  children: React.ReactNode
}

/** Render children always-mounted; hide with display:none when inactive. */
function PageSlot({ active, isFullHeight, children }: PageSlotProps) {
  return (
    <div
      className={isFullHeight ? 'h-full' : ''}
      style={{ display: active ? undefined : 'none' }}
    >
      {children}
    </div>
  )
}

export function Layout() {
  const location = useLocation()
  const pathname = location.pathname
  const isFullHeight = FULL_HEIGHT_ROUTES.has(pathname)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 min-h-0 ${isFullHeight ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
          <PageSlot active={pathname === '/'} isFullHeight={false}><Home /></PageSlot>
          <PageSlot active={pathname === '/ai-chat'} isFullHeight><AIChat /></PageSlot>
          <PageSlot active={pathname === '/audio'} isFullHeight={false}><AudioTools /></PageSlot>
          <PageSlot active={pathname === '/video'} isFullHeight={false}><VideoTools /></PageSlot>
          <PageSlot active={pathname === '/creative'} isFullHeight={false}><ImageTools /></PageSlot>
          <PageSlot active={pathname === '/hardware'} isFullHeight={false}><HardwareInfo /></PageSlot>
          <PageSlot active={pathname === '/openvino'} isFullHeight={false}><OpenVINOPage /></PageSlot>
          <PageSlot active={pathname === '/models'} isFullHeight={false}><ModelLibrary /></PageSlot>
          <PageSlot active={pathname === '/settings'} isFullHeight={false}><Settings /></PageSlot>
          {!KNOWN_ROUTES.has(pathname) && <NotFound />}
        </main>
      </div>
    </div>
  )
}