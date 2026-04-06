import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { AIChat } from './pages/AIChat'
import { AudioTools } from './pages/AudioTools'
import { VideoTools } from './pages/VideoTools'
import { Programming } from './pages/Programming'
import { CreativeTools } from './pages/CreativeTools'
import { HardwareInfo } from './pages/HardwareInfo'
import { SystemTools } from './pages/SystemTools'
import { Settings } from './pages/Settings'
import { OpenVINOPage } from './pages/OpenVINO'
import { NotFound } from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="audio" element={<AudioTools />} />
          <Route path="video" element={<VideoTools />} />
          <Route path="programming" element={<Programming />} />
          <Route path="creative" element={<CreativeTools />} />
          <Route path="hardware" element={<HardwareInfo />} />
          <Route path="system" element={<SystemTools />} />
          <Route path="openvino" element={<OpenVINOPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App