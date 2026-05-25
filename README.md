# LogLens

> 智能日志透视仪 | Smart Log Viewer with AI Analysis

[English](#english) | [中文](#中文)

---

## English

### Overview

LogLens is a lightweight desktop application for viewing, filtering, and analyzing large log files with AI-powered error diagnosis. Built with Tauri 2.0 + React + TypeScript.

### Features

- **Blazing fast large file support** — Stream-load 500MB+ log files with virtual scrolling, no UI lag
- **Smart log parsing** — Auto-detect log levels (ERROR/WARN/INFO/DEBUG), timestamps, and Java stack traces
- **Stack trace folding** — Collapse/expand Java stack traces with one click
- **Real-time filtering** — Keyword search with regex mode, multi-level log filtering
- **AI-powered analysis** — Hover on ERROR lines to get instant AI diagnosis with streaming Markdown rendering
- **Tail mode** — Real-time file watching, append new log lines as they arrive
- **6 built-in themes** — Darcula, IntelliJ Light, High Contrast, Monokai, Solarized Dark, Nord
- **Keyboard shortcuts** — `Ctrl+O` open, `Ctrl+F` search, `T` toggle tail, `Ctrl+Scroll` zoom

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Virtual Scroll | @tanstack/react-virtual |
| Backend | Rust (Tauri 2.0) |
| File Watching | notify crate |
| AI Integration | OpenAI / Anthropic compatible API |
| Persistence | @tauri-apps/plugin-store |

### Getting Started

#### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.70
- [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

#### Install & Run

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/loglens.git
cd loglens

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### AI Configuration

Open Settings (`Ctrl+,`) and configure:

| Field | Default | Description |
|-------|---------|-------------|
| API Key | *(empty)* | Your API key |
| Base URL | `https://api.anthropic.com` | API endpoint (OpenAI-compatible supported) |
| Model | `claude-3-5-sonnet-20241022` | Model name |
| HTTP Proxy | *(empty)* | Optional proxy, e.g. `http://127.0.0.1:7890` |

> The Ask AI feature currently uses a mock implementation. Real API integration will be available in a future release.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open file |
| `Ctrl+F` | Focus search |
| `Ctrl+,` | Open settings |
| `Escape` | Close AI sidebar / settings |
| `T` | Toggle tail mode |
| `Home` / `End` | Jump to first / last line |
| `Ctrl+Scroll` | Zoom font size |

### License

MIT License

---

## 中文

### 项目简介

LogLens 是一款轻量级桌面日志查看工具，支持大文件极速打开、智能日志解析和 AI 辅助排错。基于 Tauri 2.0 + React + TypeScript 构建。

### 功能特性

- **大文件秒开** — 流式加载 500MB+ 日志文件，虚拟滚动无卡顿
- **智能日志解析** — 自动识别日志级别（ERROR/WARN/INFO/DEBUG）、时间戳、Java 堆栈
- **堆栈折叠** — 一键折叠/展开 Java 异常堆栈
- **实时过滤** — 关键字搜索支持正则模式，多级别日志过滤
- **AI 一键排错** — Hover 到 ERROR 行即可触发 AI 分析，流式 Markdown 渲染
- **Tail 跟踪** — 实时监听文件变化，自动追加新增日志
- **6 款内置主题** — Darcula、IntelliJ Light、高对比度、Monokai、Solarized Dark、Nord
- **快捷键支持** — `Ctrl+O` 打开文件、`Ctrl+F` 搜索、`T` 切换 Tail、`Ctrl+滚轮` 缩放字体

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Tailwind CSS |
| 虚拟滚动 | @tanstack/react-virtual |
| 后端 | Rust (Tauri 2.0) |
| 文件监听 | notify crate |
| AI 集成 | OpenAI / Anthropic 兼容 API |
| 持久化 | @tauri-apps/plugin-store |

### 快速开始

#### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.70
- [Tauri 环境依赖](https://tauri.app/start/prerequisites/)

#### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/loglens.git
cd loglens

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 生产构建
npm run tauri build
```

### AI 配置

打开设置页面（`Ctrl+,`）进行配置：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| API Key | *（空）* | 你的 API Key |
| API 地址 | `https://api.anthropic.com` | 接口地址，支持 OpenAI 兼容格式 |
| 模型 | `claude-3-5-sonnet-20241022` | 模型名称 |
| HTTP 代理 | *（空）* | 可选代理，如 `http://127.0.0.1:7890` |

> 当前 Ask AI 功能为模拟实现，真实 API 对接将在后续版本中完成。

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+F` | 聚焦搜索框 |
| `Ctrl+,` | 打开设置 |
| `Escape` | 关闭 AI 侧边栏 / 设置 |
| `T` | 切换 Tail 模式 |
| `Home` / `End` | 跳转到首行 / 末行 |
| `Ctrl+滚轮` | 缩放字体 |

### 开源协议

MIT License
