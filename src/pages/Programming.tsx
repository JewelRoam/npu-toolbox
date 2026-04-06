import { Code, GitBranch, Terminal, Bot } from 'lucide-react'
import { ToolGrid } from '../components/ToolGrid'

export function Programming() {
  return (
    <ToolGrid
      title="编程助手"
      subtitle="AI 驱动的代码辅助工具"
      color="green"
      tools={[
        { id: 'ollama', name: 'Ollama', description: '本地大模型运行时，支持 100+ 开源模型', status: 'available', icon: Bot, url: 'https://ollama.com', size: '~150 MB' },
        { id: 'tabby', name: 'Tabby', description: '自托管 GitHub Copilot 替代方案', status: 'available', icon: GitBranch, url: 'https://tabbyml.github.io/tabby/', size: '~500 MB' },
        { id: 'code-llama', name: 'CodeLlama', description: 'Meta 代码生成模型 (需 Ollama)', status: 'available', icon: Code, route: '/ai-chat' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', description: '专业代码生成模型 (需 Ollama)', status: 'coming', icon: Terminal },
      ]}
    />
  )
}