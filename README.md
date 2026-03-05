# ⚡ NPU Toolkit

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2B-green.svg)
![Tauri](https://img.shields.io/badge/framework-Tauri%202.0-purple.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)

**Windows 平台最轻便的 NPU AI 工具箱**  
让每个拥有 NPU 的用户都能轻松使用本地 AI 能力

[English](./README.md) · [简体中文](./README_CN.md) · [功能](#-功能) · [安装](#-安装) · [贡献](#-贡献)

</div>

---

## ✨ 特性

### 🎯 核心功能
- **🔍 硬件检测** - 自动检测 NPU/CPU/GPU/内存/存储，实时监控
- **🤖 AI 对话** - 本地大模型推理，隐私安全不联网
- **🎵 音频工具** - 音乐生成、音效合成、TTS 语音合成
- **📹 视频工具** - 背景移除、画质增强、实时特效
- **💻 编程助手** - 代码补全、代码解释、单元测试生成
- **🎨 创意工具** - 文生图、图生图、AI 图片编辑
- **🛠️ 系统工具** - 磁盘检测、电池健康、屏幕测试

### 🏗️ 技术特点
- **轻量化** - 主体程序 < 50MB，按需下载工具
- **插件化** - 主控程序 + 动态加载外部工具
- **无残留** - 卸载时清理所有数据，不留痕迹
- **优雅降级** - 无 NPU 设备时提示并提供 CPU 替代方案
- **隐私优先** - 所有数据本地处理，不上传云端

### 🖥️ 界面预览

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚡ NPU工具箱                                      [刷新] [设置]    │
├─────────────────────────────────────────────────────────────────────┤
│  🟢 NPU: Intel AI Boost (40 TOPS)    CPU: i7-12700K    内存: 51%   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │   🤖 AI 对话     │  │  🎵 音频工具    │  │  📹 视频工具   │    │
│   │  本地大模型     │  │  音乐生成       │  │  背景移除      │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 支持的 NPU

| 厂商 | 型号 | 算力 | 状态 |
|-----|------|------|------|
| **Intel** | Core Ultra (H/V系列) | 40+ TOPS | ✅ 支持 |
| **AMD** | Ryzen AI (XDNA) | 45+ TOPS | ✅ 支持 |
| **Qualcomm** | Hexagon (Windows on ARM) | 45+ TOPS | 🔄 开发中 |

---

## 🚀 安装

### 前置要求
- Windows 10 22H2+ 或 Windows 11
- 8GB+ 内存（推荐 16GB）
- 1GB+ 可用磁盘空间

### 方法一：下载安装包（推荐）
访问 [Releases](https://github.com/JewelRoam/npu-toolbox/releases) 下载最新版本

### 方法二：源码编译

```bash
# 1. 克隆仓库
git clone https://github.com/JewelRoam/npu-toolbox.git
cd npu-toolbox

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run tauri dev

# 4. 构建发布版本
npm run tauri build
```

---

## 📖 使用指南

### 首次启动
1. 启动应用后自动检测硬件
2. 如检测到 NPU，显示绿色可用状态
3. 如未检测到 NPU，显示友好提示

### 下载工具
1. 进入对应功能分类
2. 点击「下载」按钮
3. 等待下载完成
4. 点击「启动」使用

### 卸载
1. 打开设置 → 存储管理
2. 点击「卸载」按钮
3. 确认后自动清理所有数据

---

## 🛠️ 技术栈

| 层级 | 技术 |
|-----|------|
| 前端框架 | React 18 + TypeScript |
| UI 组件 | Tailwind CSS + Lucide Icons |
| 状态管理 | Zustand |
| 桌面框架 | Tauri 2.0 |
| 后端语言 | Rust |
| AI 引擎 | OpenVINO™ + ONNX Runtime |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

---

## 📄 许可证

本项目基于 [MIT](./LICENSE) 许可证开源。

---

## 🙏 致谢

- [Tauri](https://tauri.app/) - 轻量级桌面框架
- [OpenVINO™](https://docs.openvino.ai/) - Intel AI 推理引擎
- [图吧工具箱](https://tubatool.com.cn/) - 设计灵感来源
- 所有开源贡献者

---

<div align="center">

**让 AI 能力触手可及** 🚀

</div>