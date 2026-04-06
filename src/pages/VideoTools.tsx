import { Video, Wand2, Captions, Sparkles } from 'lucide-react'
import { ToolGrid } from '../components/ToolGrid'

export function VideoTools() {
  return (
    <ToolGrid
      title="视频工具"
      subtitle="AI 驱动的视频处理和增强"
      color="blue"
      tools={[
        { id: 'bg-remove', name: '背景移除', description: '实时视频抠像', status: 'coming', icon: Wand2, size: '~500 MB' },
        { id: 'video-enhance', name: '画质增强', description: '视频超分辨率增强', status: 'coming', icon: Video, size: '~300 MB' },
        { id: 'video-fx', name: '视频特效', description: '实时滤镜和特效', status: 'coming', icon: Sparkles },
        { id: 'video-subtitle', name: '字幕生成', description: '自动生成视频字幕', status: 'coming', icon: Captions, size: '~400 MB' },
      ]}
    />
  )
}