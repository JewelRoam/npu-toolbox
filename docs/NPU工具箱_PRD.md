# NPU工具箱 产品需求文档（PRD）

> 版本：v1.0  
> 日期：2026-03-04  
> 作者：产品团队  
> 状态：待评审

---

## 目录

1. [项目概述](#1-项目概述)
2. [竞品分析](#2-竞品分析)
3. [产品定位与目标](#3-产品定位与目标)
4. [功能规划](#4-功能规划)
5. [技术架构](#5-技术架构)
6. [UI/UX设计规范](#6-uiux设计规范)
7. [非功能需求](#7-非功能需求)
8. [开发路线图](#8-开发路线图)
9. [风险评估](#9-风险评估)

---

## 1. 项目概述

### 1.1 项目背景

随着 Intel Ultra、AMD XDNA 等 NPU 芯片在消费级 PC 上的普及，越来越多的用户拥有了本地 AI 加速能力。然而：

- **现状问题**：
  - NPU 利用率普遍低于 10%，大量算力闲置
  - 现有 AI 工具分散，学习成本高
  - 普通用户难以享受 NPU 带来的便利
  - 图吧工具箱等成熟工具箱尚未集成 AI 功能

- **市场机会**：
  - 2025 年 AI PC 出货量预计达 1 亿台（占 PC 总量 40%）
  - Windows 12 将强制要求 40 TOPS+ NPU 算力
  - 本地 AI 隐私保护需求日益增长

### 1.2 项目愿景

**"让每个拥有 NPU 的用户都能轻松使用本地 AI 能力"**

做一个轻量化、易用性强的 Windows 平台工具箱，在一个入口进去之后便可下载启动各种 NPU 加速功能。

### 1.3 核心价值主张

| 维度 | 价值 |
|-----|------|
| **轻量化** | 主体程序 < 50MB，按需下载工具 |
| **易用性** | 一键启动，无需复杂配置 |
| **兼容性** | 智能检测 NPU，无 NPU 时优雅提示 |
| **无残留** | 卸载时清理所有数据，不留痕迹 |
| **隐私性** | 所有数据本地处理，不上传云端 |

---

## 2. 竞品分析

### 2.1 图吧工具箱（核心参考）

| 维度 | 分析 |
|-----|------|
| **定位** | 专业硬件检测工具合集 |
| **特点** | 绿色免安装、插件化架构、100+ 工具 |
| **用户群** | DIY 爱好者、电脑维护人员、硬件玩家 |
| **成功要素** | 纯净无广告、免费开源、持续更新 8+ 年 |

**图吧工具箱架构核心特点**：

```
┌─────────────────────────────────────────────────────────────┐
│                     主控程序 (Launcher)                      │
│  - 统一入口、界面框架                                        │
│  - 插件管理、版本检测                                        │
│  - 工具下载、执行调度                                        │
├─────────────────────────────────────────────────────────────┤
│                      插件化工具层                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ 硬件信息    │ │ 性能测试    │ │ 系统工具            │   │
│  │ CPU-Z       │ │ 烤机工具    │ │ 磁盘检测            │   │
│  │ GPU-Z       │ │ 屏幕测试    │ │ 电池检测            │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     数据目录结构                             │
│  ./data/           ← 工具配置                               │
│  ./tools/          ← 插件可执行文件（按需下载）              │
│  ./downloads/      ← 用户下载的模型/文件                    │
│  ./cache/          ← 临时缓存                               │
└─────────────────────────────────────────────────────────────┘
```

**技术亮点借鉴**：
- ✅ 主控程序 + 动态加载外部工具的架构
- ✅ 不修改注册表、不写入系统目录
- ✅ 插件独立运行，互不干扰
- ✅ 配置文件集中管理

### 2.2 Ollama / LM Studio

| 维度 | 分析 |
|-----|------|
| **定位** | 本地大模型管理工具 |
| **特点** | 一键部署、界面简洁、模型丰富 |
| **用户群** | AI 爱好者、开发者、创作者 |
| **借鉴点** | 模型管理、下载进度可视化、对话历史 |

### 2.3 其他参考产品

| 产品 | 类型 | 可借鉴点 |
|-----|------|---------|
| **Geek Uninstaller** | 卸载工具 | 深度扫描、残留清理、便携版设计 |
| **Uninstall Tool** | 卸载工具 | 安装监控、启动项管理、强制删除 |
| **Glary Utilities** | 系统工具箱 | 一站式工具管理、快捷功能入口 |
| **Everything** | 文件搜索 | 轻量、快速、实时搜索 |

### 2.4 竞品总结

| 维度 | 图吧工具箱 | Ollama | LM Studio | **NPU工具箱(目标)** |
|-----|-----------|--------|-----------|-------------------|
| 硬件检测 | ★★★★★ | - | - | ★★★★☆ |
| AI 模型 | - | ★★★★★ | ★★★★★ | ★★★★★ |
| 音视频处理 | - | - | ★★★☆☆ | ★★★★☆ |
| 轻量化 | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| 易用性 | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| 便携性 | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★★★★ |
| 绿色无残留 | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★★★★ |

---

## 3. 产品定位与目标

### 3.1 产品定位

**"Windows 平台最轻便的 NPU AI 工具箱"**

- **核心用户**：拥有 Intel Ultra / AMD XDNA NPU 的普通用户
- **次要用户**：想尝试本地 AI 但不想折腾技术细节的用户
- **延伸用户**：硬件检测、系统维护需求的用户

### 3.2 核心功能矩阵

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            NPU工具箱功能架构                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       启动台 (Launcher)                          │    │
│  │   - 一键启动各功能入口                                            │    │
│  │   - 硬件检测/NPU状态显示                                         │    │
│  │   - 工具下载管理                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────┐  │
│  │  🤖 AI对话      │  🎵 音频工具    │  📹 视频工具    │  💻 编程    │  │
│  │  本地大模型     │  音乐生成       │  背景移除       │  代码助手   │  │
│  │  知识库 RAG     │  音效生成       │  画质增强       │  代码补全   │  │
│  │  文本处理       │  语音克隆       │  实时特效       │  代码解释   │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────┘  │
│                                                                          │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────┐  │
│  │  🎨 创意工具    │  🔍 检测工具    │  🛠️ 系统工具   │  ⚙️ 设置   │  │
│  │  文生图         │  NPU信息        │  硬件检测       │  存储管理   │  │
│  │  图生图         │  温度监控       │  屏幕测试       │  卸载清理   │  │
│  │  图片编辑       │  烤机测试       │  电池健康       │  语言设置   │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 目标用户画像

| 用户类型 | 特征 | 需求 | 痛点 |
|---------|------|------|------|
| **普通白领** | 有 AI PC，日常办公 | 快速生成文案、翻译、摘要 | 不想装多个软件 |
| **创意工作者** | 设计师、视频创作者 | 图片生成、视频处理、音效 | 工具分散、学习成本高 |
| **程序员** | 开发者、技术人员 | 代码补全、代码解释 | 云端 API 费用高、隐私顾虑 |
| **学生群体** | 学习、研究 | 知识问答、论文辅助 | 预算有限、需要免费工具 |
| **DIY 爱好者** | 电脑玩家 | 硬件检测、性能测试 | 现有工具箱缺少 AI 功能 |

### 3.4 成功指标

| 指标 | 目标值 | 测量方式 |
|-----|-------|---------|
| **月活跃用户** | V1.0 发布后 6 个月内达到 10,000 | 匿名统计 |
| **工具使用率** | 人均使用 3+ 个功能 | 埋点统计 |
| **卸载率** | < 5%（因不满意卸载） | 用户反馈 |
| **NPU 检测准确率** | > 98% | 自动化测试 |
| **启动速度** | < 2 秒 | 性能测试 |

---

## 4. 功能规划

### 4.1 MVP 功能（V1.0）

#### 4.1.1 启动台（必备）

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| **硬件检测** | 自动检测 CPU、GPU、NPU、内存、硬盘 | P0 |
| **NPU 状态显示** | 显示 NPU 是否可用、驱动版本、算力 | P0 |
| **优雅降级** | 无 NPU 设备显示友好提示，引导替代方案 | P0 |
| **工具下载** | 按需下载 AI 模型和工具组件 | P0 |
| **启动器界面** | 清晰的分类导航、一键启动 | P0 |

#### 4.1.2 AI 对话（必备）

| 功能 | 描述 | 优先级 | NPU 依赖 |
|-----|------|-------|---------|
| **本地大模型** | 支持 Qwen3-1.5B/3B、DeepSeek 等 | P0 | 建议 |
| **流式输出** | 实时显示生成内容 | P0 | 建议 |
| **对话历史** | 保存本地、不上传云端 | P1 | 可选 |
| **快捷提示词** | 内置常用提示词模板 | P2 | 可选 |

#### 4.1.3 硬件信息（必备）

| 功能 | 描述 | 优先级 | 参考工具 |
|-----|------|-------|---------|
| **CPU 信息** | 型号、核心、频率、温度 | P0 | CPU-Z |
| **GPU/显卡** | 型号、显存、驱动版本 | P0 | GPU-Z |
| **内存信息** | 容量、频率、使用率 | P0 | HWiNFO |
| **硬盘健康** | SMART 状态、通电次数、健康度 | P0 | CrystalDiskInfo |
| **屏幕信息** | 分辨率、色域、坏点检测 | P1 | DisplayX |
| **电池健康** | 设计容量、循环次数、健康度 | P1 | BatteryInfoView |

#### 4.1.4 设置中心（必备）

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| **存储管理** | 查看占用、清理缓存 | P0 |
| **卸载清理** | 一键卸载、清理残留 | P0 |
| **语言切换** | 简体中文、English | P1 |
| **主题切换** | 浅色/深色/跟随系统 | P1 |
| **下载路径** | 自定义模型存储位置 | P1 |

### 4.2 V1.5 功能

| 功能 | 描述 | NPU 依赖 |
|-----|------|---------|
| **本地知识库** | RAG 问答、个人文档管理 | 建议 |
| **图片生成** | 文生图、图生图（轻量版） | 必须 |
| **视频背景移除** | 实时抠像、视频处理 | 必须 |
| **代码助手** | 代码补全、解释、测试生成 | 建议 |
| **音乐生成** | 文字描述生成背景音乐 | 必须 |
| **语音合成** | 本地 TTS、语音克隆 | 必须 |

### 4.3 V2.0 功能

| 功能 | 描述 | NPU 依赖 |
|-----|------|---------|
| **音频实时处理** | 直播降噪、变声 | 必须 |
| **视频实时特效** | 虚拟背景、人像美颜 | 必须 |
| **游戏伴侣** | 游戏辅助、AI 教练 | 建议 |
| **健康监测** | 心率、压力、情绪检测 | 可选 |
| **手势控制** | 摄像头手势识别 | 可选 |

### 4.4 功能详情

#### 4.4.1 NPU 检测与优雅降级

```
流程：
1. 应用启动
2. 检测硬件（CPUID + WMI 查询）
3. 识别 NPU 类型：
   - Intel NPU (Intel AI Boost)
   - AMD XDNA (Ryzen AI)
   - Qualcomm Hexagon (Windows on ARM)
4. 根据结果展示：
   ┌─────────────────────────────────────┐
   │     ✅ NPU 已检测到                  │
   │     Intel AI Boost (40 TOPS)        │
   │     ─────────────────────           │
   │     [开始使用 AI 功能]               │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │     ⚠️ 未检测到 NPU                  │
   │     ─────────────────────           │
   │     您的设备不支持 NPU               │
   │     可使用 CPU 模式运行（速度较慢）  │
   │                                     │
   │     [继续使用 CPU 模式]    [了解详情] │
   └─────────────────────────────────────┘
```

**检测代码示例**：

```python
import wmi
import subprocess

class NPUDetector:
    """NPU 检测器"""
    
    def __init__(self):
        self.c = wmi.WMI()
    
    def detect(self) -> dict:
        """检测 NPU"""
        result = {
            "has_npu": False,
            "vendor": None,
            "model": None,
            "compute_units": None,
            "driver_version": None,
            "tops": None,
            "recommendations": []
        }
        
        # 方法1: 查询 WMI
        try:
            for npu in self.c.Win32_PnPEntity(Name="Intel(R) AI Boost"):
                result["has_npu"] = True
                result["vendor"] = "Intel"
                result["model"] = npu.Name
                result["driver_version"] = self._get_npu_driver()
                break
            
            for npu in self.c.Win32_PnPEntity(Name="AMD AI"):
                result["has_npu"] = True
                result["vendor"] = "AMD"
                result["model"] = "Ryzen AI"
                break
        except Exception as e:
            print(f"WMI查询失败: {e}")
        
        # 方法2: PowerShell fallback
        if not result["has_npu"]:
            ps_result = subprocess.run(
                ["powershell", "Get-WmiObject -Class Win32_PnPEntity | Where-Object {$_.Name -like '*NPU*' -or $_.Name -like '*AI*'}"],
                capture_output=True, text=True
            )
            result["has_npu"] = "NPU" in ps_result.stdout or "AI" in ps_result.stdout
        
        # 计算推荐配置
        if result["has_npu"]:
            if result["vendor"] == "Intel":
                result["tops"] = 40  # Intel Ultra
                result["recommendations"] = [
                    "可流畅运行 1-3B 本地模型",
                    "支持实时视频处理",
                    "建议使用 INT8 量化模型"
                ]
        else:
            result["recommendations"] = [
                "CPU 模式可运行较小模型 (1B 以下)",
                "视频处理速度较慢",
                "建议使用轻量化模型"
            ]
        
        return result
    
    def _get_npu_driver(self) -> str:
        """获取 NPU 驱动版本"""
        try:
            for driver in self.c.Win32_PnPSignedDriver(DeviceName="Intel(R) AI Boost"):
                return driver.DriverVersion
        except:
            pass
        return "Unknown"
```

#### 4.4.2 工具下载与版本管理

```
目录结构：
├── NPUToolbox/
│   ├── Launcher.exe          ← 主程序
│   ├── data/
│   │   ├── config.json       ← 用户配置
│   │   ├── history.json      ← 使用记录
│   │   └── cache/            ← 临时缓存
│   ├── tools/                ← 已下载的工具
│   │   ├── ollama/
│   │   ├── cpu-z/
│   │   └── ...
│   ├── downloads/            ← 下载的模型
│   │   ├── models/
│   │   └── assets/
│   └── logs/                 ← 日志文件
```

**下载流程**：

```
用户点击 "下载模型"
        ↓
┌─────────────────────┐
│ 显示可用模型列表    │ ← Qwen3-1.5B (★ 轻量快速)
                     │   DeepSeek-R1-Distill (★ 智能)
                     │   Phi-4-mini (★ 均衡)
└─────────────────────┘
        ↓
用户选择 → 显示下载进度
        ↓
┌─────────────────────┐
│ [████████░░░░] 60%  │
│ 正在下载 Qwen3-3B   │
│ 预计剩余 2分钟       │
└─────────────────────┘
        ↓
下载完成 → 自动校验 → 添加到菜单
```

**版本管理策略**：

| 工具类型 | 更新方式 | 回退机制 |
|---------|---------|---------|
| 主体程序 | 应用内更新 | 自动备份 |
| AI 模型 | 按需更新 | 支持旧版本 |
| 工具插件 | 手动更新 | 保留历史版本 |
| 配置文件 | 自动同步 | 本地保留 |

#### 4.4.3 卸载与无残留

**设计原则**：
1. 所有数据存储在安装目录内
2. 不写入注册表（除必要的产品注册）
3. 不创建系统服务
4. 卸载时完整清理

**卸载流程**：

```
用户点击 "卸载"
        ↓
┌─────────────────────────┐
│     卸载确认             │
│                         │
│  将删除以下内容：        │
│  • 所有已下载的工具      │
│  • 模型文件 (X GB)       │
│  • 使用记录和缓存        │
│                         │
│  [取消]    [确认卸载]    │
└─────────────────────────┘
        ↓
执行卸载：
1. 停止所有后台进程
2. 清理安装目录
3. 清理注册表项（如有）
4. 清理快捷方式
5. 验证清理结果
        ↓
┌─────────────────────────┐
│     ✅ 卸载完成          │
│                         │
│  已彻底清理所有数据      │
│                         │
│  [关闭]                  │
└─────────────────────────┘
```

**清理代码示例**：

```python
import os
import shutil
import winreg
from pathlib import Path

class Uninstaller:
    """卸载管理器"""
    
    def __init__(self, install_dir: str):
        self.install_dir = Path(install_dir)
        self.backup_dir = Path(os.environ.get('TEMP')) / 'npu_toolbox_backup'
    
    def prepare_uninstall(self) -> dict:
        """准备卸载，统计待删除内容"""
        stats = {
            "total_size": 0,
            "file_count": 0,
            "dir_count": 0,
            "items": []
        }
        
        for item in self.install_dir.rglob("*"):
            size = item.stat().st_size if item.is_file() else 0
            stats["total_size"] += size
            stats["file_count"] += item.is_file()
            stats["dir_count"] += item.is_dir()
            stats["items"].append(item)
        
        return stats
    
    def uninstall(self, backup: bool = False) -> dict:
        """执行卸载"""
        result = {
            "success": True,
            "deleted_size": 0,
            "deleted_files": 0,
            "deleted_dirs": 0,
            "errors": []
        }
        
        # 备份（可选）
        if backup:
            self._backup()
        
        # 删除文件和目录
        for item in sorted(self.install_dir.rglob("*"), 
                          key=lambda x: x.is_file(), reverse=True):
            try:
                if item.is_file():
                    size = item.stat().st_size
                    item.unlink()
                    result["deleted_size"] += size
                    result["deleted_files"] += 1
                elif item.is_dir() and not any(item.iterdir()):
                    item.rmdir()
                    result["deleted_dirs"] += 1
            except Exception as e:
                result["errors"].append({"path": str(item), "error": str(e)})
        
        # 清理快捷方式
        self._clean_shortcuts()
        
        # 清理注册表
        self._clean_registry()
        
        # 删除安装目录
        try:
            if self.install_dir.exists():
                shutil.rmtree(self.install_dir)
        except Exception as e:
            result["errors"].append({"path": str(self.install_dir), "error": str(e)})
        
        return result
    
    def _clean_registry(self):
        """清理注册表"""
        # 清理卸载信息
        reg_paths = [
            r"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\NPUToolbox",
            r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\NPUToolbox",
        ]
        
        for path in reg_paths:
            try:
                key, subkey = path.rsplit("\\", 1)
                winreg.DeleteKey(winreg.HKEY_CURRENT_USER, path)
            except FileNotFoundError:
                pass
            except Exception as e:
                print(f"清理注册表失败: {path} - {e}")
    
    def _clean_shortcuts(self):
        """清理快捷方式"""
        import winshell
        
        shortcuts = [
            winshell.desktop() / "NPU工具箱.lnk",
            winshell.start_menu() / "NPU工具箱.lnk",
        ]
        
        for shortcut in shortcuts:
            if shortcut.exists():
                shortcut.unlink()
```

### 4.5 功能优先级矩阵

| 功能模块 | V1.0 | V1.5 | V2.0 |
|---------|------|------|------|
| 启动台/硬件检测 | ✅ | - | - |
| NPU 检测/优雅降级 | ✅ | - | - |
| AI 对话 | ✅ | ✅ | - |
| RAG 知识库 | - | ✅ | - |
| 图片生成 | - | ✅ | - |
| 视频处理 | - | ✅ | - |
| 代码助手 | - | ✅ | - |
| 音乐/音效 | - | ✅ | - |
| 实时音视频 | - | - | ✅ |
| 游戏伴侣 | - | - | ✅ |
| 健康监测 | - | - | ✅ |

---

## 5. 技术架构

### 5.1 技术选型

#### 5.1.1 桌面框架对比

| 框架 | 优点 | 缺点 | 推荐度 |
|-----|------|------|-------|
| **Electron** | 生态成熟、Web 技术栈、易开发 | 体积大、内存占用高 | ★★★★☆ |
| **Tauri** | 轻量、 Rust + Web、性能好 | 生态较新、需学习 Rust | ★★★★★ |
| **WPF** | 原生体验、性能好 | Windows only、学习曲线陡 | ★★★☆☆ |
| **WinUI 3** | 原生 Fluent Design | Windows 11 only、生态一般 | ★★★☆☆ |
| **Flutter** | 跨平台、渲染好 | Windows 支持不成熟 | ★★☆☆☆ |

**推荐：Tauri**

- **理由**：
  1. 轻量化：主程序 < 10MB（Electron 约 150MB）
  2. 性能好：原生 Rust 后端
  3. Web 前端：React/Vue 生态成熟
  4. 安全性：系统权限最小化
  5. 跨平台：未来可扩展到 macOS/Linux

#### 5.1.2 前端技术栈

| 类别 | 技术 | 备注 |
|-----|------|------|
| 框架 | React 18 + Vite | 开发效率高 |
| 状态管理 | Zustand | 轻量、简单 |
| UI 组件 | Shadcn/UI + Tailwind | 现代化、定制性强 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 图标 | Lucide Icons | 简洁、一致 |

#### 5.1.3 后端技术栈

| 类别 | 技术 | 备注 |
|-----|------|------|
| 语言 | Rust 1.75+ | 内存安全、性能好 |
| Web 框架 | Axum | 异步、高性能 |
| 数据库 | SQLite | 轻量、无服务器 |
| AI 框架 | OpenVINO™ + ONNX Runtime | Intel 官方支持 |
| 进程管理 | tokio | 异步任务 |

#### 5.1.4 技术栈总结

```
┌─────────────────────────────────────────────────────────────────────┐
│                         前端层 (React)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Components│  │ Pages    │  │ Hooks    │  │ Stores (Zustand) │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                         通信层 (Tauri IPC)                           │
│  ┌──────────────────┐  ┌────────────────────────────────────────┐  │
│  │ invoke (JS→Rust) │  │ events (Rust→JS)                      │  │
│  └──────────────────┘  └────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                         后端层 (Rust)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Commands │  │ Services │  │ Models   │  │ AI Engine        │    │
│  │ 入口处理  │  │ 业务逻辑  │  │ 数据模型  │  │ OpenVINO/ONNX   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                         数据层                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ SQLite   │  │ 文件系统  │  │ 外部工具 (CPU-Z, Ollama等)        │  │
│  │ 轻量数据库 │  │ 配置/缓存  │  │ 子进程调用                      │  │
│  └──────────┘  └──────────┘  └──────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                         系统层                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ WMI      │  │ 注册表   │  │ 文件系统  │  │ NPU 驱动         │    │
│  │ 硬件检测  │  │ 可选读写  │  │ 读写     │  │ DirectML         │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 核心模块设计

#### 5.2.1 Launcher（启动器）

```rust
// src-tauri/src/commands/mod.rs

use tauri::State;
use std::sync::Mutex;
use crate::models::{AppConfig, HardwareInfo};
use crate::services::{HardwareService, NPUService, ToolService};

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub hardware_info: Mutex<Option<HardwareInfo>>,
    pub npu_info: Mutex<NPUService>,
    pub tool_service: Mutex<ToolService>,
}

#[tauri::command]
pub async fn initialize_app(state: State<'_, AppState>) -> Result<HardwareInfo, String> {
    let mut hardware = state.hardware_info.lock().unwrap();
    let mut npu = state.npu_info.lock().unwrap();
    
    // 检测硬件
    let info = npu.detect().await?;
    *hardware = Some(info.clone());
    
    // 初始化工具服务
    let mut tools = state.tool_service.lock().unwrap();
    tools.initialize().await?;
    
    Ok(info)
}

#[tauri::command]
pub async fn launch_tool(
    tool_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut tools = state.tool_service.lock().unwrap();
    tools.launch(&tool_id).await
}

#[tauri::command]
pub async fun
```rust
// src-tauri/src/services/npu_service.rs

use std::process::{Command, Stdio};
use regex::Regex;

#[derive(Debug, Clone)]
pub struct NPUInfo {
    pub has_npu: bool,
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub driver_version: Option<String>,
    pub compute_units: Option<u32>,
    pub tops: Option<f32>,
    pub recommendations: Vec<String>,
}

pub struct NPUService {}

impl NPUService {
    pub fn new() -> Self {
        Self {}
    }
    
    pub async fn detect(&self) -> Result<NPUInfo, String> {
        let mut info = NPUInfo {
            has_npu: false,
            vendor: None,
            model: None,
            driver_version: None,
            compute_units: None,
            tops: None,
            recommendations: Vec::new(),
        };
        
        // 方法1: PowerShell 检测
        let output = Command::new("powershell")
            .args(&[
                "Get-WmiObject", 
                "-Class", "Win32_PnPEntity",
                "|", "Where-Object", 
                "{$_.Name", "-like", "'*NPU*'", 
                "-or", "$_.Name", "-like", "'*AI*'}"
            ])
            .output()
            .map_err(|e| e.to_string())?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        if !stdout.trim().is_empty() {
            info.has_npu = true;
            
            // 解析 Intel NPU
            if stdout.contains("Intel") || stdout.contains("AI Boost") {
                info.vendor = Some("Intel".to_string());
                info.model = Some("Intel AI Boost".to_string());
                info.compute_units = Some(13);
                info.tops = Some(40.0); // Intel Ultra NPU
                info.driver_version = self.get_intel_driver_version().await;
                info.recommendations = vec![
                    "可流畅运行 1-3B 本地模型".to_string(),
                    "支持实时视频处理".to_string(),
                    "建议使用 INT8 量化模型".to_string(),
                ];
            }
            // 解析 AMD XDNA
            else if stdout.contains("AMD") {
                info.vendor = Some("AMD".to_string());
                info.model = Some("AMD XDNA (Ryzen AI)".to_string());
                info.compute_units = Some(12);
                info.tops = Some(45.0); // AMD XDNA
                info.recommendations = vec![
                    "AMD Ryzen AI 引擎".to_string(),
                    "支持本地大模型推理".to_string(),
                    "功耗表现优秀".to_string(),
                ];
            }
        }
        
        // 方法2: WMI 检测 (fallback)
        if !info.has_npu {
            let wmi_output = Command::new("powershell")
                .args(&["wmic", "cpu", "get", "Name,NumberOfCores"])
                .output()
                .map_err(|e| e.to_string())?;
            
            // 解析 CPU 信息
            let cpu_info = String::from_utf8_lossy(&wmi_output.stdout);
            if cpu_info.contains("Ultra") || cpu_info.contains("Ryzen 7") {
                // 可能支持 NPU
                info.recommendations = vec![
                    "您的 CPU 可能支持 NPU，请更新驱动程序".to_string(),
                    "下载 Intel NPU 驱动：https://www.intel.com".to_string(),
                ];
            }
        }
        
        // 无 NPU 的推荐
        if !info.has_npu {
            info.recommendations = vec![
                "您的设备不支持 NPU".to_string(),
                "仍可使用 CPU 模式运行（速度较慢）".to_string(),
                "建议使用轻量化模型 (< 2B 参数)".to_string(),
            ];
        }
        
        Ok(info)
    }
    
    async fn get_intel_driver_version(&self) -> Option<String> {
        let output = Command::new("powershell")
            .args(&[
                "Get-WmiObject",
                "-Class", "Win32_PnPSignedDriver",
                "-Filter", "DeviceName LIKE '%Intel(R) AI Boost%'",
                "|", "Select-Object", "DriverVersion",
                "-ExpandProperty", "DriverVersion"
            ])
            .output()
            .ok()?;
        
        let version = String::from_utf8_lossy(&output.stdout);
        let version = version.trim();
        if version.is_empty() {
            None
        } else {
            Some(version.to_string())
        }
    }
}
```

#### 5.2.2 工具管理器

```rust
// src-tauri/src/services/tool_service.rs

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tokio::process::Command;
use futures::stream::FuturesUnordered;
use async_stream::stream;

pub struct Tool {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub executable: Option<PathBuf>,
    pub download_url: Option<String>,
    pub version: Option<String>,
    pub is_downloaded: bool,
    pub requires_npu: bool,
    pub size_mb: f64,
}

pub struct ToolService {
    tools_dir: PathBuf,
    download_dir: PathBuf,
    tools: Mutex<HashMap<String, Tool>>,
}

impl ToolService {
    pub fn new(base_dir: PathBuf) -> Self {
        let tools_dir = base_dir.join("tools");
        let download_dir = base_dir.join("downloads");
        
        std::fs::create_dir_all(&tools_dir).ok();
        std::fs::create_dir_all(&download_dir).ok();
        
        Self {
            tools_dir,
            download_dir,
            tools: Mutex::new(HashMap::new()),
        }
    }
    
    pub async fn initialize(&self) -> Result<(), String> {
        // 扫描已下载的工具
        self.scan_local_tools().await;
        // 注册所有可用工具
        self.register_all_tools();
        Ok(())
    }
    
    fn register_all_tools(&self) {
        let mut tools = self.tools.lock().unwrap();
        
        // AI 对话工具
        tools.insert("ollama".to_string(), Tool {
            id: "ollama".to_string(),
            name: "Ollama".to_string(),
            description: "本地大模型运行时，支持 100+ 开源模型",
            category: "ai".to_string(),
            executable: None,
            download_url: Some("https://ollama.com/download/ollama-windows-amd64.zip".to_string()),
            version: None,
            is_downloaded: false,
            requires_npu: false,
            size_mb: 150.0,
        });
        
        // 硬件检测工具
        tools.insert("cpu-z".to_string(), Tool {
            id: "cpu-z".to_string(),
            name: "CPU-Z".to_string(),
            description: "专业 CPU 检测工具",
            category: "hardware".to_string(),
            executable: None,
            download_url: Some("https://download.cpuid.com/cpu-z/cpu-z_2.10-cn.zip".to_string()),
            version: None,
            is_downloaded: false,
            requires_npu: false,
            size_mb: 2.0,
        });
        
        // 更多工具...
    }
    
    async fn scan_local_tools(&self) {
        let mut tools = self.tools.lock().unwrap();
        
        for tool in tools.values_mut() {
            let exec_path = self.tools_dir.join(&tool.id);
            if exec_path.exists() {
                tool.is_downloaded = true;
                tool.executable = Some(exec_path);
            }
        }
    }
    
    pub async fn download_tool(&self, tool_id: &str) -> Result<(), String> {
        let mut tools = self.tools.lock().unwrap();
        let tool = tools.get(tool_id).ok_or("工具不存在")?;
        
        let download_url = tool.download_url.as_ref().ok_or("无下载链接")?;
        let save_path = self.download_dir.join(format!("{}.zip", tool_id));
        
        // 下载文件
        let response = reqwest::get(download_url).await
            .map_err(|e| e.to_string())?;
        
        let mut file = std::fs::File::create(&save_path)
            .map_err(|e| e.to_string())?;
        
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            file.write_all(&chunk).map_err(|e| e.to_string())?;
        }
        
        // 解压
        let unzip_dir = self.tools_dir.join(tool_id);
        std::fs::create_dir_all(&unzip_dir).ok();
        self.unzip_file(&save_path, &unzip_dir)?;
        
        // 更新状态
        tools.get_mut(tool_id).unwrap().is_downloaded = true;
        tools.get_mut(tool_id).unwrap().executable = Some(unzip_dir.join("ollama.exe"));
        
        Ok(())
    }
    
    pub async fn launch_tool(&self, tool_id: &str) -> Result<(), String> {
        let tools = self.tools.lock().unwrap();
        let tool = tools.get(tool_id).ok_or("工具不存在")?;
        
        if !tool.is_downloaded {
            return Err("请先下载该工具".to_string());
        }
        
        if let Some(exec) = &tool.executable {
            Command::new(exec)
                .spawn()
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("无可执行文件".to_string())
        }
    }
    
    pub fn get_tools_by_category(&self, category: &str) -> Vec<Tool> {
        let tools = self.tools.lock().unwrap();
        tools.values()
            .filter(|t| t.category == category)
            .cloned()
            .collect()
    }
    
    fn unzip_file(&self, zip_path: &Path, dest_dir: &Path) -> Result<(), String> {
        // 使用 zip crate 解压
        let file = std::fs::File::open(zip_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        
        for i in 0..archive.len() {
            let mut reader = archive.by_index(i)?;
            let out_path = dest_dir.join(reader.name());
            
            if reader.is_dir() {
                std::fs::create_dir_all(&out_path).ok();
            } else {
                if let Some(parent) = out_path.parent() {
                    std::fs::create_dir_all(parent).ok();
                }
                let mut out_file = std::fs::File::create(&out_path)
                    .map_err(|e| e.to_string())?;
                std::io::copy(&mut reader, &mut out_file)
                    .map_err(|e| e.to_string())?;
            }
        }
        
        Ok(())
    }
}
```

#### 5.2.3 数据库设计

```sql
-- schema.sql

-- 用户配置
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 工具状态
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    version TEXT,
    is_downloaded INTEGER DEFAULT 0,
    last_used DATETIME,
    use_count INTEGER DEFAULT 0
);

-- 下载记录
CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    error TEXT
);

-- 对话历史（可选加密）
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- 使用统计（匿名）
CREATE TABLE IF NOT EXISTS usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_stats_event ON usage_stats(event_type);
CREATE INDEX IF NOT EXISTS idx_stats_time ON usage_stats(created_at);
```

### 5.3 插件架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         插件接口                                      │
├─────────────────────────────────────────────────────────────────────┤
│  trait Plugin {                                                      │
│      fn id(&self) -> &str;                                           │
│      fn name(&self) -> &str;                                         │
│      fn version(&self) -> &str;                                      │
│      fn initialize(&mut self, ctx: &PluginContext) -> Result<()>;   │
│      fn execute(&self, action: &str) -> Result<PluginResult>;       │
│      fn shutdown(&self);                                             │
│  }                                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  内置插件 (Built-in)          │  远程插件 (Remote)                   │
│  ├── 硬件检测插件            │  ├── Ollama 管理器                   │
│  ├── 设置插件                │  ├── 模型下载器                      │
│  └── 更新检查插件            │  ├── 云端功能                        │
├─────────────────────────────────────────────────────────────────────┤
│  插件注册流程:                                                         │
│  1. 发现插件 (扫描 plugins/ 目录)                                     │
│  2. 验证签名 (可选)                                                    │
│  3. 加载配置 (plugin.json)                                           │
│  4. 初始化 (调用 initialize)                                         │
│  5. 注册命令 (Taury Commands)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. UI/UX 设计规范

### 6.1 设计原则

1. **轻量化感知**
   - 界面简洁，不堆砌功能
   - 减少视觉噪音，突出核心功能
   - 动效流畅但不花哨

2. **一致性**
   - 统一的配色方案
   - 一致的交互模式
   - 统一的图标风格

3. **可发现性**
   - 功能入口清晰可见
   - 新功能引导自然
   - 帮助信息容易获取

4. **容错性**
   - 操作可逆
   - 错误提示友好
   - 进度可见

### 6.2 视觉设计

#### 6.2.1 配色方案

```javascript
// tailwind.config.js 颜色配置

const colors = {
  // 主色
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // 主色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // 辅助色（科技感）
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',  // AI 紫色
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  
  // 语义色
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // NPU 状态色
  npu: {
    available: '#22c55e',
    unavailable: '#ef4444',
    working: '#3b82f9',
  }
}
```

#### 6.2.2 字体规范

| 用途 | 字体 | 大小 | 字重 | 行高 |
|-----|------|------|------|------|
| 标题 | 系统 UI 字体 | 20px | Semibold | 1.3 |
| 副标题 | 系统 UI 字体 | 16px | Medium | 1.5 |
| 正文 | 系统 UI 字体 | 14px | Regular | 1.5 |
| 辅助文字 | 系统 UI 字体 | 12px | Regular | 1.4 |
| 代码 | Consolas / Fira Code | 13px | Regular | 1.6 |
| 数字 | 系统等宽字体 | 14px | Medium | 1.4 |

#### 6.2.3 图标规范

- **图标库**: Lucide Icons
- **尺寸**: 16px / 20px / 24px / 32px
- **颜色**: 主色 / 次要色 / 禁用色

```
标准图标尺寸：
- 功能图标：24px
- 状态图标：20px
- 操作图标：16px
- 大图标：32px
```

#### 6.2.4 间距规范

| 层级 | 内边距 | 外边距 | 圆角 |
|-----|-------|-------|------|
| 页面 | - | 24px / 32px | - |
| 卡片 | 16px | 12px | 8px |
| 按钮 | 12px 24px | - | 6px |
| 输入框 | 8px 12px | - | 6px |
| 列表项 | 12px 16px | 4px | - |

### 6.3 界面布局

#### 6.3.1 主界面布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [≡] NPU工具箱 v1.0                         🔔  ⚙️   [?]           ─ □ × │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🖥️ 硬件状态                                        [刷新]       │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │                                                                  │   │
│  │  🟢 NPU: Intel AI Boost (40 TOPS)           CPU: Intel Ultra 7  │   │
│  │  💾 内存: 32GB DDR5                          GPU: Intel Arc     │   │
│  │  💿 SSD: 1TB NVMe                           驱动: 101.3792      │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────┬─────────────────────────────┐        │
│  │    🤖 AI 对话               │    🎨 创意工具              │        │
│  │  ─────────────────────────  │  ─────────────────────────  │        │
│  │                             │                             │        │
│  │  [📥 Ollama]  本地模型      │  [🎨 文生图]  图片生成      │        │
│  │  [💬 对话]    智能助理      │  [🎭 风格化]  照片处理      │        │
│  │  [📚 知识库]  RAG 问答      │  [🎬 视频]    背景移除      │        │
│  │                             │                             │        │
│  └─────────────────────────────┴─────────────────────────────┘        │
│                                                                         │
│  ┌─────────────────────────────┬─────────────────────────────┐        │
│  │    🔧 系统工具              │    📦 已下载 (5)            │        │
│  │  ─────────────────────────  │  ─────────────────────────  │        │
│  │                             │                             │        │
│  │  [🔍 检测]    硬件信息      │  [✓ Ollama]     1.0.42     │        │
│  │  [🌡️ 温度]    实时监控      │  [✓ CPU-Z]      2.10       │        │
│  │  [🔋 电池]    健康检测      │  [✓ GPU-Z]      2.55       │        │
│  │  [💾 存储]    空间管理      │                             │        │
│  │                             │                             │        │
│  └─────────────────────────────┴─────────────────────────────┘        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [🏠]    [🔧 工具]    [📥 下载]    [📖 帮助]             v1.0.0      │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.2 工具详情页

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← 返回                            Ollama 本地模型运行时        [设置]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐   │
│  │             │  │                                                 │   │
│  │   🖼️       │  │  📝 描述                                        │   │
│  │  工具图标   │  │  Ollama 允许你在本地运行各种大语言模型，        │   │
│  │             │  │  支持 100+ 开源模型，界面简洁，易于使用。       │   │
│  │             │  │                                                 │   │
│  │  状态：     │  │  ─────────────────────────────────────────────  │   │
│  │  ✅ 已安装  │  │                                                 │   │
│  │  v1.0.42    │  │  📦 版本信息                                    │   │
│  │             │  │  • 大小：150 MB                                 │   │
│  └─────────────┘  │  • 依赖：Windows 10+                            │   │
│                   │  • NPU：可选（加速推理）                         │   │
│                   │  ─────────────────────────────────────────────  │   │
│                   │                                                 │   │
│                   │  [🚀 启动]   [⚙️ 设置]   [🗑️ 卸载]             │   │
│                   │                                                 │   │
│                   │  ─────────────────────────────────────────────  │   │
│                   │                                                 │   │
│                   │  📥 可用模型 (42)                                │   │
│                   │  ─────────────────────────────────────────────  │   │
│                   │  [🟢 Qwen3-1.5B]   轻量快速，适合日常对话       │   │
│                   │  [🟢 DeepSeek-R1]  智能推理，代码能力强         │   │
│                   │  [🟢 Phi-4-mini]   微软官方，平衡性能           │   │
│                   │  ...                                                  │
│                   │                                                 │   │
│                   └─────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [🏠]    [🔧 工具]    [📥 下载]    [📖 帮助]             v1.0.0      │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.3 无 NPU 提示页

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [≡] NPU工具箱 v1.0                         🔔  ⚙️   [?]           ─ □ × │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │                     ⚠️ 未检测到 NPU                              │   │
│  │              ─────────────────────────────────────              │   │
│  │                                                                  │   │
│  │     您的电脑没有配备 NPU (神经处理单元)，                        │   │
│  │     但仍可使用以下功能：                                         │   │
│  │                                                                  │   │
│  │     ┌─────────────────────┐  ┌─────────────────────┐            │   │
│  │     │  🤖 CPU 模式运行    │  │ 💡 了解 AI PC       │            │   │
│  │     │  大模型速度较慢     │  │ 了解 NPU 优势       │            │   │
│  │     │  [继续使用]         │  │ [查看详情]          │            │   │
│  │     └─────────────────────┘  └─────────────────────┘            │   │
│  │                                                                  │   │
│  │     ─────────────────────────────────────────────────────────    │   │
│  │                                                                  │   │
│  │     📊 已检测硬件：                                              │   │
│  │     • CPU: Intel Core i7-12700K                                 │   │
│  │     • 内存: 32GB DDR5                                           │   │
│  │     • 显卡: NVIDIA RTX 3070                                     │   │
│  │                                                                  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [🏠]    [🔧 工具]    [📥 下载]    [📖 帮助]             v1.0.0      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 交互规范

#### 6.4.1 按钮样式

| 类型 | 样式 | 用途 |
|-----|------|------|
| **主要按钮** | 深蓝背景 + 白色文字 | 核心操作：启动、下载、安装 |
| **次要按钮** | 浅灰边框 + 深灰文字 | 辅助操作：设置、取消 |
| **文本按钮** | 无背景 + 主色文字 | 低频操作：帮助、详情 |
| **危险按钮** | 红色背景 + 白色文字 | 删除、卸载等危险操作 |

#### 6.4.2 动效规范

| 动效 | 时长 | 用途 |
|-----|------|------|
| **淡入** | 150ms | 页面加载 |
| **淡出** | 150ms | 页面退出 |
| **缩放** | 200ms | 按钮点击反馈 |
| **滑动** | 300ms | 列表滚动 |
| **进度** | - | 下载、加载 |
| **脉冲** | - | NPU 工作状态指示 |

#### 6.4.3 加载状态

```
下载中：
┌─────────────────────────────────────┐
│ [████████░░░░░░░░░░] 45%           │
│ 正在下载 Qwen3-3B 模型...           │
│ 120MB / 267MB │ 预计剩余 1分23秒     │
│                                     │
│              [取消下载]              │
└─────────────────────────────────────┘

启动中：
┌─────────────────────────────────────┐
│                                     │
│          ⏳ 正在启动 Ollama          │
│                                     │
│         模型加载中，请稍候...         │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. 非功能需求

### 7.1 性能需求

| 指标 | 要求 | 测试方法 |
|-----|------|---------|
| **启动时间** | < 2 秒 | 冷启动计时 |
| **内存占用** | < 100MB（空闲） | 任务管理器监控 |
| **CPU 占用** | < 5%（空闲） | 任务管理器监控 |
| **安装包大小** | < 50MB | 文件大小统计 |
| **工具下载速度** | 与网络带宽一致 | 下载测速 |
| **硬件检测** | < 500ms | 自动化测试 |

### 7.2 兼容性需求

| 维度 | 要求 |
|-----|------|
| **Windows 版本** | Windows 10 22H2+ / Windows 11 22H2+ |
| **系统架构** | x64 (ARM64 via Rosetta 可选) |
| **内存要求** | 8GB 最低，16GB 推荐 |
| **磁盘空间** | 500MB 最低（不含模型） |
| **NPU 驱动** | Intel NPU Driver 100.0.0+ |
| **分辨率** | 1280x720 最低，推荐 1920x1080 |

### 7.3 安全需求

| 维度 | 要求 |
|-----|------|
| **代码签名** | 使用代码签名证书签名 |
| **下载验证** | SHA256 校验 |
| **权限最小化** | 只请求必要权限 |
| **数据本地化** | 所有数据不离开用户设备 |
| **隐私保护** | 不收集可识别用户信息 |
| **沙盒运行** | 工具进程隔离 |

### 7.4 可用性需求

| 维度 | 要求 |
|-----|------|
| **安装** | 单文件 / 无需管理员权限 |
| **卸载** | 一键卸载，无残留 |
| **语言** | 简体中文、English |
| **辅助功能** | 符合 WCAG 2.1 AA |
| **无障碍** | 支持键盘操作、高对比度 |

### 7.5 可维护性需求

| 维度 | 要求 |
|-----|------|
| **自动更新** | 支持热更新 |
| **日志记录** | 结构化日志、诊断导出 |
| **错误报告** | 匿名错误报告 |
| **配置迁移** | 支持配置备份/恢复 |
| **插件扩展** | 支持第三方插件 |

---

## 8. 开发路线图

### 8.1 版本规划

#### 8.1.1 V1.0 - 核心版本（目标：2个月）

| 阶段 | 时间 | 内容 |
|-----|------|------|
| **M1: 基础框架** | 第1-3周 | 搭建 Tauri 项目、实现启动器 UI |
| **M2: 硬件检测** | 第4-5周 | NPU 检测、硬件信息展示 |
| **M3: 工具管理** | 第6-7周 | 下载系统、版本管理 |
| **M4: 测试优化** | 第8周 | Bug 修复、性能优化、文档 |

**交付物**：
- ✅ 可运行的 Tauri 应用
- ✅ NPU 检测功能
- ✅ 硬件信息展示
- ✅ 工具下载管理
- ✅ 卸载清理功能

#### 8.1.2 V1.5 - AI 功能（目标：+2个月）

| 阶段 | 时间 | 内容 |
|-----|------|------|
| **M1: AI 对话** | 第1-2周 | Ollama 集成、本地模型对话 |
| **M2: RAG 知识库** | 第3-4周 | 文档导入、向量化、问答 |
| **M3: 创意工具** | 第5-6周 | 图片生成、视频背景移除 |
| **M4: 编程助手** | 第7周 | 代码补全、解释 |

**交付物**：
- ✅ 本地大模型对话
- ✅ RAG 知识库
- ✅ 图片生成
- ✅ 视频处理
- ✅ 代码助手

#### 8.1.3 V2.0 - 生态完善（目标：+3个月）

| 阶段 | 时间 | 内容 |
|-----|------|------|
| **M1: 实时音视频** | 第1-4周 | 直播降噪、虚拟背景 |
| **M2: 游戏伴侣** | 第5周 | 游戏辅助、AI 教练 |
| **M3: 健康监测** | 第6周 | 心率、压力检测 |
| **M4: 插件生态** | 第7周 | 开放插件 API |

### 8.2 里程碑

| 里程碑 | 时间 | 目标 |
|-------|------|------|
| **M0: 设计完成** | 第 0 周 | PRD 通过评审 |
| **M1: MVP 演示** | 第 4 周 | 可演示的核心功能 |
| **M2: 内部测试** | 第 6 周 | 功能完整、内部测试 |
| **M3: Beta 发布** | 第 7 周 | 公测版本 |
| **M4: 正式发布** | 第 8 周 | V1.0 正式发布 |

### 8.3 资源需求

| 角色 | 人数 | 职责 |
|-----|------|------|
| 产品经理 | 1 | 需求管理、进度把控 |
| UI/UX 设计师 | 1 | 界面设计、交互设计 |
| 前端工程师 | 1 | React/Tauri 前端 |
| 后端工程师 | 1 | Rust 后端、AI 集成 |
| 测试工程师 | 0.5 | 测试用例、自动化测试 |

---

## 9. 风险评估

### 9.1 风险列表

| 风险 | 可能性 | 影响 | 应对措施 |
|-----|-------|------|---------|
| **NPU 驱动不稳定** | 中 | 中 | 提供 CPU fallback，延迟功能发布 |
| **模型下载过大** | 高 | 中 | 支持断点续传，清理旧模型 |
| **用户隐私担忧** | 中 | 高 | 本地处理，清晰隐私政策 |
| **竞品追赶** | 中 | 中 | 快速迭代，建立生态壁垒 |
| **技术栈风险** | 低 | 高 | Tauri 已有成功案例，团队可快速学习 |
| **法律合规** | 低 | 高 | 使用开源模型，遵守 EULA |

### 9.2 风险管理

#### 9.2.1 NPU 兼容性风险

**预防措施**：
1. 建立 NPU 检测白名单
2. 提供详细的兼容性文档
3. 设置保守的硬件要求
4. 完善的 CPU fallback 方案

**应急方案**：
1. 暂停需要 NPU 的功能
2. 优先发布硬件检测功能
3. 与 Intel/AMD 合作解决问题

#### 9.2.2 模型下载体验风险

**预防措施**：
1. 实现智能下载队列
2. 支持后台下载
3. 提供下载进度提示
4. 支持暂停/恢复/取消

**应急方案**：
1. 提供国内镜像源
2. 支持 P2P 下载
3. 提供离线模型包

---

## 附录

### A. 图吧工具箱功能清单（参考）

| 分类 | 工具数 | 代表工具 |
|-----|-------|---------|
| **硬件信息** | 15+ | CPU-Z, GPU-Z, HWiNFO |
| **CPU 工具** | 10+ | Prime95, AIDA64 |
| **内存工具** | 5+ | MemTest, RAMMon |
| **显卡工具** | 10+ | GPU-Z, FurMark |
| **硬盘工具** | 15+ | CrystalDiskInfo, HD Tune |
| **屏幕工具** | 10+ | DisplayX, MonitorTest |
| **外设工具** | 10+ | KeyboardTest, BatteryInfoView |
| **系统工具** | 20+ | Win10 激活、DISM++ |
| **网络工具** | 10+ | Ping, Tracert |
| **其他工具** | 20+ | 文件校验、压缩工具 |

### B. 参考资料

| 资源 | 链接 |
|-----|------|
| 图吧工具箱官网 | https://tubatool.com.cn/ |
| Tauri 官方文档 | https://tauri.app/ |
| OpenVINO 官方文档 | https://docs.openvino.ai/ |
| Intel NPU 驱动 | https://github.com/intel/linux-npu-driver |
| Ollama 官网 | https://ollama.com/ |

### C. 术语表

| 术语 | 解释 |
|-----|------|
| **NPU** | Neural Processing Unit，神经处理单元 |
| **TOPS** | Tera Operations Per Second，每秒万亿次运算 |
| **INT8/INT4** | 8位/4位整数量化，减小模型体积 |
| **RAG** | Retrieval-Augmented Generation，检索增强生成 |
| **Tauri** | Rust + Web 的跨平台桌面框架 |
| **IPC** | Inter-Process Communication，进程间通信 |

---

*文档版本：1.0*  
*最后更新：2026-03-04*  
*评审状态：待评审*

---

## 评审检查清单

- [ ] 产品定位清晰，目标用户明确
- [ ] 竞品分析充分，借鉴点明确
- [ ] 功能规划合理，优先级明确
- [ ] 技术架构可行，技术选型合理
- [ ] UI/UX 设计规范完整
- [ ] 非功能需求覆盖全面
- [ ] 开发路线图可行
- [ ] 风险评估充分，应对措施明确
- [ ] 附录资料完整

---

**下一步**：等待产品评审，评审通过后开始 V1.0 Demo 开发。