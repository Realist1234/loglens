# LogLens — 智能日志透视仪 · 完整开发规格说明书

> **给 Claude Code 的阅读说明**：本文档是唯一的需求来源，请严格按照此文档实现，
> 不要自行添加未描述的功能，遇到歧义时以本文档为准。
> 实现顺序请遵循 §9 阶段计划，每个阶段完成后停下来等待确认。
> **当前版本：v1.1**（已修正 Tauri 2.0 拖拽 API、依赖列表、类型定义等 7 处问题）

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈与版本锁定](#2-技术栈与版本锁定)
3. [目录结构](#3-目录结构)
4. [Rust 后端规格（Commands）](#4-rust-后端规格commands)
5. [前端功能规格](#5-前端功能规格)
6. [UI 设计规格](#6-ui-设计规格)
7. [数据结构定义](#7-数据结构定义)
8. [已知陷阱与约束](#8-已知陷阱与约束)
9. [分阶段实现计划](#9-分阶段实现计划)
10. [验收标准 Checklist](#10-验收标准-checklist)

---

## 1. 项目概览

| 属性 | 值 |
|------|----|
| 项目名称 | LogLens |
| 定位 | 本地桌面端日志查看与 AI 辅助分析工具 |
| 目标平台 | Windows / macOS / Linux（Tauri 跨平台） |
| 目标用户 | 后端 / Java 开发者，运维工程师 |
| 核心卖点 | 极速打开 500MB+ 大文件、AI 一键排错、堆栈折叠、实时 tail 跟踪 |

---

## 2. 技术栈与版本锁定

### 2.1 前端

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tanstack/react-virtual": "^3.10.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "lucide-react": "^0.462.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "react-markdown": "^9.0.0",
    "rehype-highlight": "^7.0.0",
    "highlight.js": "^11.10.0",
    "zustand": "^5.0.0",
    "@tauri-apps/plugin-store": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "typescript": "^5.5.0"
  }
}
```

### 2.2 Rust 后端

```toml
# src-tauri/Cargo.toml 关键依赖
[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-dialog = "2.0"
tauri-plugin-fs = "2.0"
tauri-plugin-shell = "2.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
notify = "6.1"          # 文件变化监听（tail -f 功能）
reqwest = { version = "0.12", features = ["stream", "json"] }  # AI 代理请求
encoding_rs = "0.8"     # GBK / 非 UTF-8 日志编码处理
```

### 2.3 包管理器

优先使用 `pnpm`，fallback 到 `npm`。

---

## 3. 目录结构

```
loglens/
├── src/                          # React 前端
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── LogViewer/
│   │   │   ├── index.tsx         # 主日志列表（虚拟滚动容器）
│   │   │   ├── LogLine.tsx       # 单行渲染组件
│   │   │   └── StackTrace.tsx    # 堆栈折叠组件
│   │   ├── Toolbar/
│   │   │   ├── index.tsx         # 顶部工具栏
│   │   │   └── FilterBar.tsx     # 搜索 + 级别过滤
│   │   ├── AiSidebar/
│   │   │   ├── index.tsx         # AI 分析侧边栏
│   │   │   └── StreamingText.tsx # SSE 流式文字渲染
│   │   ├── Settings/
│   │   │   └── index.tsx         # 设置页面（API Key 等）
│   │   └── DropZone.tsx          # 拖拽上传区
│   ├── hooks/
│   │   ├── useLogFile.ts         # 文件加载状态管理
│   │   ├── useFilter.ts          # 过滤逻辑
│   │   ├── useAiAnalysis.ts      # AI 请求逻辑
│   │   └── useTailWatch.ts       # 文件尾部跟踪
│   ├── store/
│   │   └── index.ts              # Zustand 全局状态（如需引入）
│   ├── types/
│   │   └── index.ts              # 共享类型定义
│   └── styles/
│       └── globals.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── file_reader.rs    # 流式读取、分块加载
│   │   │   ├── tail_watcher.rs   # notify crate 文件监听
│   │   │   └── ai_proxy.rs       # 转发 AI 请求（含代理配置）
│   │   └── models.rs             # Rust 侧数据结构
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── README.md
└── SPEC.md                       # 本文档
```

---

## 4. Rust 后端规格（Commands）

### 4.1 `read_log_chunk` — 分块读取日志

```rust
// 功能：从指定文件的 offset 位置读取 512KB 数据，返回解析后的行数组
// 调用时机：初始加载 + 滚动到底部时按需加载
// chunk_size 在 Rust 侧定义为常量，不作为参数暴露

const CHUNK_SIZE: u64 = 524_288; // 512KB

#[tauri::command]
async fn read_log_chunk(
    path: String,
    offset: u64,      // 字节偏移量，首次传 0
) -> Result<ChunkResult, String>

// 返回值结构（见 §7 数据结构）
struct ChunkResult {
    lines: Vec<LogLine>,
    next_offset: u64,   // 下次请求传入的 offset
    is_eof: bool,       // 是否已读到文件末尾
    total_bytes: u64,   // 文件总字节数（用于进度条）
}
```

**实现要点：**
- 使用 `tokio::fs::File` + `BufReader` 流式读取，不将整个文件载入内存
- 从 offset 定位后逐行读取，确保不截断 UTF-8 字符边界
- 每行在 Rust 侧完成日志级别解析（避免 JS 侧大量 regex）
- 编码处理：优先 UTF-8，失败时尝试 GBK（中文日志常见）

---

### 4.2 `watch_file_tail` — 实时尾部跟踪（tail -f）

```rust
// 功能：监听文件变化，新增内容通过 Tauri Event 推送给前端
// 使用 notify crate 的 RecommendedWatcher

#[tauri::command]
async fn watch_file_tail(
    app: tauri::AppHandle,
    path: String,
    from_offset: u64,   // 从文件当前末尾开始监听
) -> Result<(), String>

// 每次文件变化时，向前端 emit 事件：
// event name: "log-tail-update"
// payload: Vec<LogLine>（新增的行）
```

**实现要点：**
- 同一时刻只允许一个文件的 watcher 存在（新建前先 stop 旧的）
- 防抖：文件变化后 50ms 内只触发一次读取，避免频繁 IO

---

### 4.3 `stop_watch` — 停止文件监听

```rust
#[tauri::command]
async fn stop_watch() -> Result<(), String>
```

---

### 4.4 `ai_chat_stream` — AI 请求代理（流式）

```rust
// 功能：代理前端的 AI 请求，支持配置 base_url 和 proxy
// 返回 SSE 流，通过 Tauri Event 逐 token 推送给前端

#[tauri::command]
async fn ai_chat_stream(
    app: tauri::AppHandle,
    config: AiConfig,
    messages: Vec<AiMessage>,
) -> Result<(), String>

struct AiConfig {
    api_key: String,
    base_url: String,       // 默认 "https://api.anthropic.com" 或 OpenAI 兼容地址
    model: String,          // 默认 "claude-3-5-sonnet-20241022"
    proxy_url: Option<String>,  // 如 "http://127.0.0.1:7890"
}

// 推送事件：
// "ai-stream-chunk"  payload: { token: String }
// "ai-stream-done"   payload: null
// "ai-stream-error"  payload: { message: String }
```

**实现要点：**
- 使用 `reqwest` 发起 HTTP 请求，若 `proxy_url` 有值则配置代理
- 支持 OpenAI 兼容格式（`/v1/chat/completions`）和 Anthropic 格式（`/v1/messages`）
- 通过 `base_url` 路径末尾自动判断 API 格式类型
- 使用 `tokio::sync::CancellationToken` 管理流的生命周期，供 `cancel_ai_stream` 调用

---

### 4.5 `cancel_ai_stream` — 取消 AI 流式请求

```rust
// 功能：中止正在进行的 ai_chat_stream 请求
// 调用时机：用户关闭 AI 侧边栏、切换文件、或手动点击"停止"

#[tauri::command]
async fn cancel_ai_stream(
    state: tauri::State<'_, AppState>,
) -> Result<(), String>

// 实现方式：
// 1. AppState 中持有一个 Option<CancellationToken>
// 2. ai_chat_stream 启动时存入新 token
// 3. cancel_ai_stream 调用 token.cancel()，reqwest stream 循环检测后退出
```

---

### 4.6 `get_file_info` — 获取文件基本信息

```rust
#[tauri::command]
async fn get_file_info(path: String) -> Result<FileInfo, String>

struct FileInfo {
    name: String,
    size_bytes: u64,
    modified_at: String,   // ISO 8601
}
```

---

## 5. 前端功能规格

### 5.1 拖拽打开文件（DropZone）

- 应用启动后，主界面显示拖拽区域（全屏或中央卡片）
- **⚠️ 必须使用 Tauri 2.0 的专用 API，禁止使用浏览器原生 `dragover`/`drop` 事件**（原生事件无法获取真实文件路径）
- 拖拽监听实现方式：

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

// 在 DropZone 组件 mount 时注册，unmount 时取消
useEffect(() => {
  let unlisten: (() => void) | undefined;

  getCurrentWindow().onDragDropEvent((event) => {
    if (event.payload.type === 'over') {
      // 显示高亮边框，提示可释放
      setIsDragOver(true);
    } else if (event.payload.type === 'drop') {
      setIsDragOver(false);
      const paths = event.payload.paths; // string[]
      if (paths.length > 0) openFile(paths[0]);
    } else {
      setIsDragOver(false);
    }
  }).then((fn) => { unlisten = fn; });

  return () => unlisten?.();
}, []);
```

- 仅接受 `.log`、`.txt`、`.out` 后缀文件，其他类型在 `drop` 回调中过滤并 toast 提示
- 同时提供"点击选择文件"按钮（调用 `@tauri-apps/plugin-dialog` 的 `open()`）
- 文件加载中显示进度条（根据 `total_bytes` 和已加载 bytes 计算）

---

### 5.2 虚拟滚动日志列表（LogViewer）

**核心要求：使用 `@tanstack/react-virtual` 的 `useVirtualizer`**

```tsx
// 关键配置示例
const rowVirtualizer = useVirtualizer({
  count: filteredLines.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 22,        // 每行预估高度 px（等宽字体）
  overscan: 20,                  // 视口外额外渲染行数（保证滚动流畅）
});
```

- 不使用 `windowing`、`react-window`、`react-virtuoso` 等其他方案
- 初始加载前 512KB 内容，滚动到底部 80% 时触发加载下一块
- 提供"跳转到底部"浮动按钮（tail 模式自动钉住底部）

---

### 5.3 日志行渲染规则（LogLine）

每行解析为以下结构后渲染（解析在 Rust 侧完成）：

| 日志级别 | 匹配规则 | 文字颜色 | 行背景色（深色主题） |
|---------|---------|---------|----------------|
| ERROR / FATAL | 行内含 `ERROR` 或 `FATAL`（大写） | `#FF6B6B` | `rgba(255,107,107,0.08)` |
| WARN / WARNING | 行内含 `WARN` | `#FFD93D` | `rgba(255,217,61,0.06)` |
| INFO | 行内含 `INFO` | `#6BCB77` | transparent |
| DEBUG / TRACE | 行内含 `DEBUG` 或 `TRACE` | `#888888` | transparent |
| 未识别 | 无匹配 | `#CCCCCC` | transparent |

- 行号显示在左侧，宽度固定，等宽字体
- 时间戳部分（若符合 `yyyy-MM-dd HH:mm:ss` 格式）用稍暗色渲染，与正文区分

---

### 5.4 堆栈折叠（StackTrace）

**识别规则（Rust 侧完成）：**

```
1. 检测到某行以 \t at 或以 \tat 开头 → 标记为 stack_frame = true
2. 连续的 stack_frame 行组成一个 StackGroup
3. 每个 StackGroup 第一行自动折叠，其余行默认隐藏
4. 折叠显示格式：`▶ at com.example.Service.method(...) [+23 frames]`
5. 点击展开：`▼ at com.example.Service.method(...) [收起]`
```

- 折叠/展开状态存储在 React state（`Map<groupId, boolean>`），不持久化
- 展开时以缩进块形式显示，每帧一行

---

### 5.5 过滤与搜索（FilterBar）

| 控件 | 行为 |
|------|------|
| 关键字输入框 | 实时过滤（防抖 150ms），高亮匹配文字（黄色背景） |
| 级别复选（ALL/INFO/WARN/ERROR/DEBUG） | 多选，默认 ALL，快速切换 |
| 正则模式开关 | 开启后关键字作为正则表达式处理，解析出错时输入框变红边框 |
| 清空按钮 | 一键清空搜索内容 |

- 过滤在前端内存中进行（已加载的行），不重新调用 Rust
- 过滤结果计数：`已显示 1,234 / 共 56,789 行`

---

### 5.6 Ask AI 按钮与侧边栏（AiSidebar）

**触发方式：**
- 鼠标 hover 到 ERROR 级别的行时，行右侧出现 `✨ Ask AI` 按钮（300ms 延迟显示，避免滚动闪烁）
- 点击后打开右侧 AI 分析面板（宽 420px，从右侧滑入动画）

**上下文提取：**
- 当前 ERROR 行的前 25 行 + 后 25 行 = 共 51 行
- 若包含堆栈折叠块，自动展开完整堆栈（不受折叠状态影响）

**发送给 AI 的 prompt 模板（硬编码，不可由用户修改）：**

```
你是一位 Java/Spring Boot 后端专家。以下是从生产日志中截取的错误片段，请：
1. 用一句话说明根本原因
2. 给出 2-3 个可能的修复方案（代码级别）
3. 如有需要，指出需要检查的配置项或依赖版本

日志内容：
\`\`\`
{CONTEXT_LINES}
\`\`\`
```

**流式渲染（StreamingText）：**
- 监听 Tauri 事件 `ai-stream-chunk`，收到 token 后追加到渲染区域
- 支持 Markdown 渲染（代码块高亮）：使用 `react-markdown` + `rehype-highlight`
- 底部显示"重新分析"和"复制结果"按钮

---

### 5.7 设置页面（Settings）

使用 `@tauri-apps/plugin-store` 持久化配置（**禁止使用 `localStorage`**，webview 缓存清除会导致数据丢失）。

Store 文件名：`settings.json`，存储路径：Tauri 默认 `appData` 目录（由插件自动管理）。

```typescript
import { load } from '@tauri-apps/plugin-store';

const store = await load('settings.json', { autoSave: true });
// 读取：await store.get<string>('apiKey')
// 写入：await store.set('apiKey', value)
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `apiKey` | string | `""` | AI API Key，输入框显示为密码 |
| `baseUrl` | string | `"https://api.anthropic.com"` | API 地址，支持自建代理 |
| `model` | string | `"claude-3-5-sonnet-20241022"` | 模型名称 |
| `proxyUrl` | string | `""` | HTTP 代理地址，如 `http://127.0.0.1:7890` |
| `fontSize` | number | `13` | 日志字体大小（px），范围 10-20 |
| `theme` | `"dark"` \| `"light"` | `"dark"` | 主题（MVP 只做暗色，预留字段） |

---

### 5.8 键盘快捷键

| 快捷键 | 行为 |
|--------|------|
| `Ctrl/Cmd + O` | 打开文件选择对话框 |
| `Ctrl/Cmd + F` | 聚焦搜索框 |
| `Ctrl/Cmd + 滚轮` | 放大/缩小字体（步进 1px） |
| `Ctrl/Cmd + ,` | 打开设置页面 |
| `Escape` | 关闭 AI 侧边栏 / 设置页面 |
| `End` | 跳转到最后一行 |
| `Home` | 跳转到第一行 |
| `T` | 切换 Tail 跟踪模式（已打开文件时） |

---

## 6. UI 设计规格

### 6.1 颜色系统（CSS Variables）

```css
:root[data-theme="dark"] {
  --bg-base:      #0E0E10;   /* 主背景 */
  --bg-surface:   #1A1A1F;   /* 面板/侧边栏背景 */
  --bg-hover:     #252530;   /* hover 行背景 */
  --border:       #2A2A35;   /* 分割线 */
  --text-primary: #E8E8EE;   /* 主文字 */
  --text-muted:   #606070;   /* 次要文字（行号、时间戳） */
  --accent:       #7B68EE;   /* 强调色（按钮、选中态） */
  --accent-hover: #9B8FFF;

  /* 日志级别色 */
  --level-error: #FF6B6B;
  --level-warn:  #FFD93D;
  --level-info:  #6BCB77;
  --level-debug: #888888;
}
```

### 6.2 字体

```css
/* 日志内容区：等宽字体 */
font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

/* UI 文字：系统无衬线 */
font-family: -apple-system, 'SF Pro Text', 'Segoe UI', sans-serif;
```

### 6.3 布局结构

```
┌─────────────────────────────────────────────┐
│  Titlebar（macOS 原生拖拽区）                  │
├─────────────────────────────────────────────┤
│  Toolbar: [文件名] [大小] [行数] ... [设置⚙]   │
├─────────────────────────────────────────────┤
│  FilterBar: [🔍 搜索框] [INFO][WARN][ERROR]   │
├────────────────────────────────┬────────────┤
│                                │            │
│  LogViewer（虚拟滚动区）         │ AiSidebar  │
│  行号 │ 时间戳 │ 级别 │ 内容     │ （420px）  │
│                                │            │
│                                │            │
├────────────────────────────────┴────────────┤
│  StatusBar: [行数统计] [文件路径] [Tail●]     │
└─────────────────────────────────────────────┘
```

### 6.4 Tauri 窗口配置

```json
// tauri.conf.json
{
  "app": {
    "windows": [{
      "title": "LogLens",
      "width": 1280,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "decorations": true,
      "transparent": false,
      "dragDropEnabled": true
    }]
  }
}
```

---

## 7. 数据结构定义

### 7.1 TypeScript 类型

```typescript
// src/types/index.ts

export type LogLevel = 'ERROR' | 'FATAL' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'UNKNOWN';

export interface LogLine {
  id: number;           // 行号（从 1 开始）
  raw: string;          // 原始文本
  level: LogLevel;
  timestamp?: string;   // 解析出的时间戳（若有）
  isStackFrame: boolean;  // 是否为 stack trace 行
  stackGroupId?: number;  // 所属折叠组 ID
}

export interface ChunkResult {
  lines: LogLine[];
  nextOffset: number;
  isEof: boolean;
  totalBytes: number;
}

export interface FileInfo {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  proxyUrl?: string;
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FilterState {
  keyword: string;
  isRegex: boolean;
  levels: Set<LogLevel>;
}
```

### 7.2 Rust 侧结构（与上方 §4 对应）

所有 Command 的返回值需用 `#[derive(serde::Serialize, serde::Deserialize)]` 标注。

`AiMessage` 对应 Rust 结构：

```rust
#[derive(serde::Serialize, serde::Deserialize)]
struct AiMessage {
    role: String,     // "user" | "assistant" | "system"
    content: String,
}
```

`AppState` 需在 `lib.rs` 中定义并通过 `manage()` 注册，用于跨 Command 共享取消令牌：

```rust
use tokio_util::sync::CancellationToken;
use std::sync::Mutex;

pub struct AppState {
    pub ai_cancel_token: Mutex<Option<CancellationToken>>,
}
```

Cargo.toml 对应补充：
```toml
tokio-util = { version = "0.7", features = ["sync"] }
```

---

## 8. 已知陷阱与约束

### ⚠️ Tauri 2.0 Breaking Changes

1. **插件须显式注册**：所有插件（dialog、fs、shell）需在 `lib.rs` 的 `Builder` 中调用 `.plugin(tauri_plugin_xxx::init())`，且需在 `tauri.conf.json` 的 `permissions` 中声明权限。
2. **invoke 方式变化**：前端调用从 `@tauri-apps/api/tauri` 改为 `@tauri-apps/api/core` 的 `invoke`。
3. **文件系统权限**：`plugin-fs` 需要在 `capabilities` 中配置 `allow-read-file` 等权限。

示例 `capabilities/default.json`：
```json
{
  "identifier": "default",
  "description": "Default permissions",
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "core:default",
    "core:event:allow-listen",
    "core:event:allow-emit",
    "dialog:allow-open",
    "fs:allow-read-file",
    "fs:allow-read-dir",
    "fs:allow-watch",
    "shell:allow-open",
    "store:allow-load",
    "store:allow-get",
    "store:allow-set",
    "store:allow-save"
  ]
}
```

### ⚠️ 虚拟滚动注意事项

- 父容器必须有**确定的高度**（如 `height: calc(100vh - 120px)`），否则虚拟列表无法计算
- 不可对父容器使用 `overflow: hidden`，必须是 `overflow-y: auto`

### ⚠️ 大文件内存管理

- 已加载的所有行存储在 React state 中，500MB 文件约 500 万行，需评估内存
- 建议：仅在内存中保存前 **20 万行**，更早的行卸载但保留行号占位（显示 `...已折叠 xxx 行...`），此为进阶功能，MVP 可暂不实现

### ⚠️ GBK 编码处理

- 部分 Windows/Java 日志为 GBK 编码，Rust 侧需用 `encoding_rs` crate 处理
- 若检测到非 UTF-8 内容，尝试 GBK 解码，解码失败的字符替换为 `<0xXX>`

### ⚠️ Windows 路径分隔符

- 路径传递统一使用正斜杠，或在 Rust 侧用 `Path::new()` 规范化

---

## 9. 分阶段实现计划

> **Claude Code 请按此顺序执行，每个阶段结束时停下来汇报完成情况。**

### Phase 1：项目脚手架（~30 min）

- [ ] 使用 `pnpm create tauri-app@latest` 初始化项目（选 React + TypeScript）
- [ ] 安装所有依赖（见 §2）
- [ ] 配置 Tailwind CSS
- [ ] 配置 Tauri capabilities（见 §8）
- [ ] 确认 `pnpm tauri dev` 可正常启动空白窗口

**Phase 1 完成标志：** 运行 `pnpm tauri dev` 无报错，显示空白深色窗口。

---

### Phase 2：Rust 核心文件读取（~1 hr）

- [ ] 实现 `read_log_chunk` command（流式读取 + 日志级别解析）
- [ ] 实现 `get_file_info` command
- [ ] 实现 `watch_file_tail` command（基于 notify crate）
- [ ] 实现 `stop_watch` command
- [ ] 实现 `ai_chat_stream` + `cancel_ai_stream` command 骨架（可先 mock 返回假数据）
- [ ] 在 `App.tsx` 写临时验证代码（Phase 3 前删除）：

```typescript
// 临时验证代码，硬编码一个本机存在的 .log 文件绝对路径
import { invoke } from '@tauri-apps/api/core';
invoke('read_log_chunk', { path: '/tmp/test.log', offset: 0 })
  .then((result) => console.log('✅ Chunk result:', result))
  .catch((err) => console.error('❌ Error:', err));
```

**Phase 2 完成标志：** 修改路径为本机真实 `.log` 文件，`pnpm tauri dev` 后 DevTools console 中能看到解析后的 `LogLine` 数组，确认后删除临时代码，进入 Phase 3。

---

### Phase 3：前端日志展示核心（~2 hr）

- [ ] 实现 `DropZone` 组件（拖拽 + 点击选择）
- [ ] 实现 `LogViewer` + `LogLine`（含虚拟滚动、级别着色）
- [ ] 实现分块加载逻辑（`useLogFile` hook）
- [ ] 实现 `FilterBar`（关键字 + 级别过滤）
- [ ] 实现堆栈折叠（`StackTrace` 组件）
- [ ] 键盘快捷键（`Ctrl+F`、`Ctrl+O`、`Home`、`End`）

**Phase 3 完成标志：** 可打开 50MB+ 日志文件，无卡顿，ERROR 行红色高亮，堆栈可折叠，搜索可过滤。

---

### Phase 4：AI 侧边栏（~1 hr）

- [ ] 实现 `ai_chat_stream` Rust command
- [ ] 实现 `AiSidebar` + `StreamingText` 组件
- [ ] 实现 hover ERROR 行显示 Ask AI 按钮
- [ ] 实现 `useAiAnalysis` hook（管理 SSE 事件监听）

**Phase 4 完成标志：** 填入 API Key 后，点击 ERROR 行的 Ask AI，侧边栏流式显示 AI 回复。

---

### Phase 5：设置页面 + 收尾（~30 min）

- [ ] 实现 `Settings` 页面（API Key、代理、字体大小）
- [ ] 实现 Tail 跟踪模式（`T` 键切换，底部状态栏指示）
- [ ] 完善 StatusBar
- [ ] 全局错误边界（文件读取失败友好提示）
- [ ] 完善 README（含截图位置、Release 说明）

**Phase 5 完成标志：** 所有功能完整可用，准备打包。

---

### Phase 6：打包与 Release（可选，人工操作）

```bash
# 生产打包
pnpm tauri build

# 产物位置
src-tauri/target/release/bundle/
```

- 配置 GitHub Actions 自动构建三平台 Release（`.yml` 模板见 tauri-action）

---

## 10. 验收标准 Checklist

### 功能验收

- [ ] 拖拽 `.log` 文件可打开
- [ ] 打开 500MB 文件，内存占用 < 500MB，UI 无卡顿
- [ ] ERROR 行红色高亮，WARN 黄色，INFO 绿色
- [ ] Java 堆栈可折叠展开
- [ ] 关键字搜索实时过滤，匹配词高亮
- [ ] 级别过滤按钮正常工作
- [ ] Tail 模式实时追加新日志
- [ ] 填入 API Key 后 Ask AI 按钮可用，流式显示回复
- [ ] 代理配置生效（可通过 AI 请求验证）
- [ ] `Ctrl+F`、`Ctrl+O` 快捷键正常工作
- [ ] 字体大小可通过 `Ctrl+滚轮` 调整

### 工程验收

- [ ] `pnpm tauri build` 无报错，产物可在目标平台运行
- [ ] 打包体积 < 20MB（Windows installer）
- [ ] 无 `console.error` 未处理异常
- [ ] 所有 Tauri Command 的错误均返回 `Result<_, String>` 并在前端 toast 提示

---

---

## 修订记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.1 | 2026-05-25 | 补充 4 个缺失依赖；新增 AiMessage / AppState 类型定义；修复拖拽 API 为 Tauri 2.0 专用方式；Settings 持久化改为 plugin-store；read_log_chunk 去除冗余参数；新增 cancel_ai_stream command；修复 Phase 2 验证步骤 |
| v1.0 | 2026-05-09 | 初始版本 |

*文档版本：v1.1 | 最后更新：2026-05-25*
