import { Music, Mic, Volume2, Copy } from 'lucide-react'
import { ToolGrid } from '../components/ToolGrid'

export function AudioTools() {
  return (
    <ToolGrid
      title="音频工具"
      subtitle="AI 驱动的音频生成和处理"
      color="purple"
      tools={[
        { id: 'musicgen', name: '音乐生成', description: '通过文字描述生成音乐', status: 'coming', icon: Music, size: '~800 MB' },
        { id: 'sound-effect', name: '音效生成', description: '生成游戏、UI 音效', status: 'coming', icon: Volume2 },
        { id: 'tts', name: '语音合成', description: '本地 TTS 文字转语音', status: 'coming', icon: Mic, size: '~200 MB' },
        { id: 'voice-clone', name: '语音克隆', description: '用少量样本克隆声音', status: 'coming', icon: Copy, size: '~1.5 GB' },
      ]}
    />
  )
}