import { Palette, Image, Wand2, ZoomIn } from 'lucide-react'
import { ToolGrid } from '../components/ToolGrid'

export function CreativeTools() {
  return (
    <ToolGrid
      title="创意工具"
      subtitle="AI 驱动的创意设计工具"
      color="pink"
      tools={[
        { id: 'stable-diffusion', name: '图片生成', description: '文生图、图生图', status: 'coming', icon: Wand2, size: '~2 GB' },
        { id: 'image-edit', name: '图片编辑', description: 'AI 智能图片编辑', status: 'coming', icon: Image, size: '~1.5 GB' },
        { id: 'image-upscale', name: '图片放大', description: 'AI 超分辨率放大', status: 'coming', icon: ZoomIn, size: '~500 MB' },
        { id: 'style-transfer', name: '风格迁移', description: '艺术风格迁移', status: 'coming', icon: Palette },
      ]}
    />
  )
}